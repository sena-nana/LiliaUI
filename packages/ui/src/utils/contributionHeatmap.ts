export interface ContributionHeatmapDay {
  date: string;
  count: number;
}

export interface ContributionHeatmapCell {
  date: string;
  count: number;
  level: number;
  weekStart: string;
  title: string;
  x: number;
  y: number;
}

export type ContributionHeatmapActiveCell = Pick<
  ContributionHeatmapCell,
  "date" | "count" | "level" | "title" | "x" | "y"
>;

export interface ContributionHeatmapMonthLabel {
  key: string;
  label: string;
  x: number;
}

export interface ContributionHeatmapLevelPath {
  level: number;
  d: string;
}

export interface ContributionHeatmapDayLabel {
  label: string;
  x: number;
  y: number;
}

export interface ContributionHeatmapModel {
  cells: ContributionHeatmapCell[];
  monthLabels: ContributionHeatmapMonthLabel[];
  dayLabels: ContributionHeatmapDayLabel[];
  levelPaths: ContributionHeatmapLevelPath[];
  width: number;
  height: number;
  viewBox: string;
  cellSize: number;
  cellGap: number;
  labelWidth: number;
  monthLabelHeight: number;
}

export interface ContributionHeatmapBuildOptions {
  formatTitle?: (day: ContributionHeatmapDay) => string;
  monthLabelFormatter?: (month: string) => string;
  weekdayLabels?: readonly ContributionHeatmapWeekdayLabel[];
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;
}

export interface ContributionHeatmapWeekdayLabel {
  label: string;
  dayIndex: number;
}

export interface ContributionHeatmapPoint {
  x: number;
  y: number;
}

const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_RADIUS = 2;
const LABEL_WIDTH = 42;
const MONTH_LABEL_HEIGHT = 14;
const PAINT_PADDING = 2;
const DEFAULT_WEEKDAY_LABELS: readonly ContributionHeatmapWeekdayLabel[] = [
  { label: "Mon", dayIndex: 1 },
  { label: "Wed", dayIndex: 3 },
  { label: "Fri", dayIndex: 5 },
];

interface ContributionHeatmapLayout {
  cellSize: number;
  cellGap: number;
  cellRadius: number;
}

export function buildContributionHeatmapModel(
  days: readonly ContributionHeatmapDay[],
  options: ContributionHeatmapBuildOptions = {},
): ContributionHeatmapModel {
  const layout = contributionHeatmapLayout(options);
  const cells = buildContributionCells(days, options, layout);
  const weekCount = Math.ceil(cells.length / 7);
  const width = chartWidth(weekCount, layout);
  const height = chartHeight(layout);
  return {
    cells,
    monthLabels: buildContributionMonthLabels(cells, days, options, layout),
    dayLabels: buildDayLabels(options.weekdayLabels ?? DEFAULT_WEEKDAY_LABELS, layout),
    levelPaths: buildContributionLevelPaths(cells, layout),
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    cellSize: layout.cellSize,
    cellGap: layout.cellGap,
    labelWidth: LABEL_WIDTH,
    monthLabelHeight: MONTH_LABEL_HEIGHT,
  };
}

export function contributionHeatmapCellAtPoint(
  model: ContributionHeatmapModel,
  point: ContributionHeatmapPoint,
): ContributionHeatmapActiveCell | null {
  const relativeX = point.x - model.labelWidth;
  const relativeY = point.y - model.monthLabelHeight;
  if (relativeX < 0 || relativeY < 0) return null;

  const step = model.cellSize + model.cellGap;
  const weekIndex = Math.floor(relativeX / step);
  const dayIndex = Math.floor(relativeY / step);
  if (dayIndex < 0 || dayIndex > 6) return null;

  const cellLocalX = relativeX - weekIndex * step;
  const cellLocalY = relativeY - dayIndex * step;
  if (cellLocalX > model.cellSize || cellLocalY > model.cellSize) return null;

  const cell = model.cells[weekIndex * 7 + dayIndex];
  if (!cell) return null;
  return toActiveCell(cell);
}

function buildContributionCells(
  days: readonly ContributionHeatmapDay[],
  options: ContributionHeatmapBuildOptions,
  layout: ContributionHeatmapLayout,
) {
  if (!days.length) return [];
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const maxCount = Math.max(1, ...sorted.map((day) => day.count));
  const start = parseDateOnly(sorted[0].date);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = parseDateOnly(sorted[sorted.length - 1].date);
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));
  const byDate = new Map(sorted.map((day) => [day.date, day]));
  const cells: ContributionHeatmapCell[] = [];
  let weekIndex = 0;
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(cursor);
      date.setUTCDate(cursor.getUTCDate() + offset);
      const key = date.toISOString().slice(0, 10);
      const day = byDate.get(key) ?? { date: key, count: 0 };
      cells.push({
        date: day.date,
        count: day.count,
        level: contributionLevel(day.count, maxCount),
        weekStart: cursor.toISOString().slice(0, 10),
        title: contributionTitle(day, options),
        x: contributionCellX(weekIndex, layout),
        y: contributionCellY(offset, layout),
      });
    }
    weekIndex += 1;
  }
  return cells;
}

function buildContributionMonthLabels(
  cells: readonly ContributionHeatmapCell[],
  days: readonly ContributionHeatmapDay[],
  options: ContributionHeatmapBuildOptions,
  layout: ContributionHeatmapLayout,
): ContributionHeatmapMonthLabel[] {
  let lastMonth = "";
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const start = sortedDays[0]?.date ?? "";
  const end = sortedDays[sortedDays.length - 1]?.date ?? "";
  const isInRange = (date: string) => start !== "" && date >= start && date <= end;
  const labels: ContributionHeatmapMonthLabel[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    const week = cells.slice(index, index + 7);
    const weekIndex = index / 7;
    const weekStart = week[0]?.weekStart ?? String(weekIndex);
    const month = week
      .filter((day) => isInRange(day.date))
      .map((day) => day.date.slice(0, 7))
      .find((value) => value && value !== lastMonth) ?? "";
    const label = month && month !== lastMonth ? formatContributionMonth(month, options) : "";
    if (month) lastMonth = month;
    if (!label) continue;
    labels.push({
      key: weekStart,
      label,
      x: contributionCellX(weekIndex, layout) + layout.cellSize / 2,
    });
  }
  return labels;
}

function buildDayLabels(
  labels: readonly ContributionHeatmapWeekdayLabel[],
  layout: ContributionHeatmapLayout,
): ContributionHeatmapDayLabel[] {
  return labels.map(({ label, dayIndex }) => ({
    label,
    x: 0,
    y: contributionCellY(dayIndex, layout) + layout.cellSize - 1,
  }));
}

function buildContributionLevelPaths(
  cells: readonly ContributionHeatmapCell[],
  layout: ContributionHeatmapLayout,
): ContributionHeatmapLevelPath[] {
  const pathsByLevel = new Map<number, string[]>();
  for (const cell of cells) {
    const level = Math.min(4, Math.max(0, Math.floor(cell.level)));
    const paths = pathsByLevel.get(level) ?? [];
    paths.push(roundedRectPath(cell.x, cell.y, layout.cellSize, layout.cellSize, layout.cellRadius));
    pathsByLevel.set(level, paths);
  }
  return [...pathsByLevel.entries()]
    .sort(([left], [right]) => left - right)
    .map(([level, paths]) => ({ level, d: paths.join("") }));
}

function toActiveCell(cell: ContributionHeatmapCell): ContributionHeatmapActiveCell {
  return {
    date: cell.date,
    count: cell.count,
    level: cell.level,
    title: cell.title,
    x: cell.x,
    y: cell.y,
  };
}

function contributionCellX(weekIndex: number, layout: ContributionHeatmapLayout) {
  return LABEL_WIDTH + weekIndex * (layout.cellSize + layout.cellGap);
}

function contributionCellY(dayIndex: number, layout: ContributionHeatmapLayout) {
  return MONTH_LABEL_HEIGHT + dayIndex * (layout.cellSize + layout.cellGap);
}

function chartWidth(weekCount: number, layout: ContributionHeatmapLayout) {
  return LABEL_WIDTH + Math.max(0, weekCount * (layout.cellSize + layout.cellGap) - layout.cellGap) + PAINT_PADDING;
}

function chartHeight(layout: ContributionHeatmapLayout) {
  return MONTH_LABEL_HEIGHT + 7 * layout.cellSize + 6 * layout.cellGap + PAINT_PADDING;
}

function contributionHeatmapLayout(options: ContributionHeatmapBuildOptions): ContributionHeatmapLayout {
  const cellSize = positiveNumber(options.cellSize, CELL_SIZE);
  const cellGap = nonNegativeNumber(options.cellGap, CELL_GAP);
  return {
    cellSize,
    cellGap,
    cellRadius: Math.min(nonNegativeNumber(options.cellRadius, CELL_RADIUS), cellSize / 2),
  };
}

function positiveNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function roundedRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const right = x + width;
  const bottom = y + height;
  return [
    `M${x + radius} ${y}`,
    `H${right - radius}`,
    `Q${right} ${y} ${right} ${y + radius}`,
    `V${bottom - radius}`,
    `Q${right} ${bottom} ${right - radius} ${bottom}`,
    `H${x + radius}`,
    `Q${x} ${bottom} ${x} ${bottom - radius}`,
    `V${y + radius}`,
    `Q${x} ${y} ${x + radius} ${y}`,
    "Z",
  ].join("");
}

function formatContributionMonth(month: string, options: ContributionHeatmapBuildOptions) {
  if (options.monthLabelFormatter) return options.monthLabelFormatter(month);
  const [, rawMonth] = month.split("-");
  return rawMonth ? `${Number(rawMonth)}月` : month;
}

function parseDateOnly(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function contributionLevel(count: number, maxCount: number) {
  if (count <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
}

function contributionTitle(day: ContributionHeatmapDay, options: ContributionHeatmapBuildOptions) {
  return options.formatTitle ? options.formatTitle(day) : `${day.date}: ${day.count}`;
}
