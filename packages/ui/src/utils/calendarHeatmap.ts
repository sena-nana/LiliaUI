export interface CalendarHeatmapDatum<T = unknown> {
  date: string;
  value: number;
  data?: T;
}

export interface CalendarHeatmapCell<T = unknown> extends CalendarHeatmapDatum<T> {
  level: number;
  weekStart: string;
  title: string;
  x: number;
  y: number;
}

export type CalendarHeatmapActiveCell<T = unknown> = Pick<
  CalendarHeatmapCell<T>,
  "date" | "value" | "data" | "level" | "title" | "x" | "y"
>;

export interface CalendarHeatmapMonthLabel {
  key: string;
  label: string;
  x: number;
}

export interface CalendarHeatmapLevelPath {
  level: number;
  d: string;
}

export interface CalendarHeatmapDayLabel {
  label: string;
  x: number;
  y: number;
}

export interface CalendarHeatmapModel<T = unknown> {
  cells: CalendarHeatmapCell<T>[];
  monthLabels: CalendarHeatmapMonthLabel[];
  dayLabels: CalendarHeatmapDayLabel[];
  levelPaths: CalendarHeatmapLevelPath[];
  width: number;
  height: number;
  viewBox: string;
  cellSize: number;
  cellGap: number;
  cellRadius: number;
  labelWidth: number;
  monthLabelHeight: number;
}

export interface CalendarHeatmapWeekdayLabel {
  day: number;
  label: string;
}

export type CalendarHeatmapLevelStrategy<T = unknown> =
  | { type?: "relative"; levels?: number }
  | { type: "thresholds"; thresholds: readonly number[] }
  | {
      type: "custom";
      levels?: number;
      resolveLevel: (
        datum: CalendarHeatmapDatum<T>,
        range: { min: number; max: number },
      ) => number;
    };

export interface CalendarHeatmapBuildOptions<T = unknown> {
  cellGap?: number;
  cellRadius?: number;
  cellSize?: number;
  labelWidth?: number;
  levelStrategy?: CalendarHeatmapLevelStrategy<T>;
  locale?: string | string[];
  monthFormatter?: (date: Date, locale?: string | string[]) => string;
  monthLabelHeight?: number;
  titleFormatter?: (datum: CalendarHeatmapDatum<T>) => string;
  weekdayLabels?: readonly CalendarHeatmapWeekdayLabel[];
  weekStartsOn?: number;
}

export interface CalendarHeatmapPoint {
  x: number;
  y: number;
}

interface CalendarHeatmapLayout {
  cellSize: number;
  cellGap: number;
  cellRadius: number;
  labelWidth: number;
  monthLabelHeight: number;
}

const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_RADIUS = 2;
const LABEL_WIDTH = 42;
const MONTH_LABEL_HEIGHT = 14;
const PAINT_PADDING = 2;
const DAYS_PER_WEEK = 7;

export function buildCalendarHeatmapModel<T = unknown>(
  data: readonly CalendarHeatmapDatum<T>[],
  options: CalendarHeatmapBuildOptions<T> = {},
): CalendarHeatmapModel<T> {
  const layout = calendarHeatmapLayout(options);
  const weekStartsOn = normalizeWeekStartsOn(options.weekStartsOn);
  const cells = buildCalendarCells(data, options, layout, weekStartsOn);
  const weekCount = Math.ceil(cells.length / DAYS_PER_WEEK);
  const width = chartWidth(weekCount, layout);
  const height = chartHeight(layout);
  return {
    cells,
    monthLabels: buildCalendarMonthLabels(cells, data, options, layout),
    dayLabels: buildDayLabels(resolveWeekdayLabels(options), layout, weekStartsOn),
    levelPaths: buildCalendarLevelPaths(cells, layout),
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    cellSize: layout.cellSize,
    cellGap: layout.cellGap,
    cellRadius: layout.cellRadius,
    labelWidth: layout.labelWidth,
    monthLabelHeight: layout.monthLabelHeight,
  };
}

export function calendarHeatmapCellAtPoint<T = unknown>(
  model: CalendarHeatmapModel<T>,
  point: CalendarHeatmapPoint,
): CalendarHeatmapActiveCell<T> | null {
  const relativeX = point.x - model.labelWidth;
  const relativeY = point.y - model.monthLabelHeight;
  if (relativeX < 0 || relativeY < 0) return null;

  const step = model.cellSize + model.cellGap;
  const weekIndex = Math.floor(relativeX / step);
  const dayIndex = Math.floor(relativeY / step);
  if (dayIndex < 0 || dayIndex >= DAYS_PER_WEEK) return null;

  const cellLocalX = relativeX - weekIndex * step;
  const cellLocalY = relativeY - dayIndex * step;
  if (cellLocalX > model.cellSize || cellLocalY > model.cellSize) return null;

  const cell = model.cells[weekIndex * DAYS_PER_WEEK + dayIndex];
  return cell ? toActiveCell(cell) : null;
}

function buildCalendarCells<T>(
  data: readonly CalendarHeatmapDatum<T>[],
  options: CalendarHeatmapBuildOptions<T>,
  layout: CalendarHeatmapLayout,
  weekStartsOn: number,
): CalendarHeatmapCell<T>[] {
  if (!data.length) return [];
  const sorted = [...data].sort((left, right) => left.date.localeCompare(right.date));
  const values = sorted.map((datum) => datum.value).filter(Number.isFinite);
  const range = {
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
  const start = startOfWeek(parseDateOnly(sorted[0].date), weekStartsOn);
  const end = endOfWeek(parseDateOnly(sorted[sorted.length - 1].date), weekStartsOn);
  const byDate = new Map(sorted.map((datum) => [datum.date, datum]));
  const cells: CalendarHeatmapCell<T>[] = [];
  let weekIndex = 0;
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + DAYS_PER_WEEK)) {
    for (let offset = 0; offset < DAYS_PER_WEEK; offset += 1) {
      const date = new Date(cursor);
      date.setUTCDate(cursor.getUTCDate() + offset);
      const key = toDateKey(date);
      const datum = byDate.get(key) ?? { date: key, value: 0 };
      cells.push({
        date: datum.date,
        value: datum.value,
        ...(datum.data === undefined ? {} : { data: datum.data }),
        level: resolveLevel(datum, options.levelStrategy, range),
        weekStart: toDateKey(cursor),
        title: formatTitle(datum, options),
        x: calendarCellX(weekIndex, layout),
        y: calendarCellY(offset, layout),
      });
    }
    weekIndex += 1;
  }
  return cells;
}

function buildCalendarMonthLabels<T>(
  cells: readonly CalendarHeatmapCell<T>[],
  data: readonly CalendarHeatmapDatum<T>[],
  options: CalendarHeatmapBuildOptions<T>,
  layout: CalendarHeatmapLayout,
): CalendarHeatmapMonthLabel[] {
  let lastMonth = "";
  const sorted = [...data].sort((left, right) => left.date.localeCompare(right.date));
  const start = sorted[0]?.date ?? "";
  const end = sorted[sorted.length - 1]?.date ?? "";
  const labels: CalendarHeatmapMonthLabel[] = [];
  for (let index = 0; index < cells.length; index += DAYS_PER_WEEK) {
    const week = cells.slice(index, index + DAYS_PER_WEEK);
    const month = week
      .filter((datum) => datum.date >= start && datum.date <= end)
      .map((datum) => datum.date.slice(0, 7))
      .find((value) => value !== lastMonth) ?? "";
    if (!month || month === lastMonth) continue;
    lastMonth = month;
    labels.push({
      key: week[0]?.weekStart ?? String(index / DAYS_PER_WEEK),
      label: formatMonth(month, options),
      x: calendarCellX(index / DAYS_PER_WEEK, layout) + layout.cellSize / 2,
    });
  }
  return labels;
}

function buildDayLabels(
  labels: readonly CalendarHeatmapWeekdayLabel[],
  layout: CalendarHeatmapLayout,
  weekStartsOn: number,
): CalendarHeatmapDayLabel[] {
  return labels.map(({ day, label }) => ({
    label,
    x: 0,
    y: calendarCellY((day - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK, layout)
      + layout.cellSize - 1,
  }));
}

function buildCalendarLevelPaths<T>(
  cells: readonly CalendarHeatmapCell<T>[],
  layout: CalendarHeatmapLayout,
): CalendarHeatmapLevelPath[] {
  const pathsByLevel = new Map<number, string[]>();
  for (const cell of cells) {
    const level = normalizeLevel(cell.level);
    const paths = pathsByLevel.get(level) ?? [];
    paths.push(roundedRectPath(cell.x, cell.y, layout.cellSize, layout.cellSize, layout.cellRadius));
    pathsByLevel.set(level, paths);
  }
  return [...pathsByLevel.entries()]
    .sort(([left], [right]) => left - right)
    .map(([level, paths]) => ({ level, d: paths.join("") }));
}

function resolveLevel<T>(
  datum: CalendarHeatmapDatum<T>,
  strategy: CalendarHeatmapLevelStrategy<T> | undefined,
  range: { min: number; max: number },
): number {
  if (strategy?.type === "thresholds") {
    return strategy.thresholds.reduce(
      (level, threshold) => level + (datum.value >= threshold ? 1 : 0),
      0,
    );
  }
  if (strategy?.type === "custom") {
    const upper = normalizeLevelCount(strategy.levels) - 1;
    return Math.min(upper, normalizeLevel(strategy.resolveLevel(datum, range)));
  }
  const upper = normalizeLevelCount(strategy?.levels) - 1;
  if (datum.value <= 0 || range.max <= 0) return 0;
  return Math.min(upper, Math.max(1, Math.ceil((datum.value / range.max) * upper)));
}

function resolveWeekdayLabels<T>(
  options: CalendarHeatmapBuildOptions<T>,
): readonly CalendarHeatmapWeekdayLabel[] {
  if (options.weekdayLabels) return options.weekdayLabels;
  const formatter = new Intl.DateTimeFormat(options.locale, { weekday: "short", timeZone: "UTC" });
  return [1, 3, 5].map((day) => ({
    day,
    label: formatter.format(new Date(Date.UTC(2024, 0, 7 + day))),
  }));
}

function formatMonth<T>(month: string, options: CalendarHeatmapBuildOptions<T>) {
  const date = parseDateOnly(`${month}-01`);
  if (options.monthFormatter) return options.monthFormatter(date, options.locale);
  return new Intl.DateTimeFormat(options.locale, { month: "short", timeZone: "UTC" }).format(date);
}

function formatTitle<T>(datum: CalendarHeatmapDatum<T>, options: CalendarHeatmapBuildOptions<T>) {
  if (options.titleFormatter) return options.titleFormatter(datum);
  const date = new Intl.DateTimeFormat(options.locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parseDateOnly(datum.date));
  return `${date}: ${datum.value}`;
}

function toActiveCell<T>(cell: CalendarHeatmapCell<T>): CalendarHeatmapActiveCell<T> {
  const { date, value, data, level, title, x, y } = cell;
  return { date, value, data, level, title, x, y };
}

function calendarCellX(weekIndex: number, layout: CalendarHeatmapLayout) {
  return layout.labelWidth + weekIndex * (layout.cellSize + layout.cellGap);
}

function calendarCellY(dayIndex: number, layout: CalendarHeatmapLayout) {
  return layout.monthLabelHeight + dayIndex * (layout.cellSize + layout.cellGap);
}

function chartWidth(weekCount: number, layout: CalendarHeatmapLayout) {
  return layout.labelWidth
    + Math.max(0, weekCount * (layout.cellSize + layout.cellGap) - layout.cellGap)
    + PAINT_PADDING;
}

function chartHeight(layout: CalendarHeatmapLayout) {
  return layout.monthLabelHeight
    + DAYS_PER_WEEK * layout.cellSize
    + (DAYS_PER_WEEK - 1) * layout.cellGap
    + PAINT_PADDING;
}

function calendarHeatmapLayout<T>(options: CalendarHeatmapBuildOptions<T>): CalendarHeatmapLayout {
  const cellSize = positiveNumber(options.cellSize, CELL_SIZE);
  return {
    cellSize,
    cellGap: nonNegativeNumber(options.cellGap, CELL_GAP),
    cellRadius: Math.min(nonNegativeNumber(options.cellRadius, CELL_RADIUS), cellSize / 2),
    labelWidth: nonNegativeNumber(options.labelWidth, LABEL_WIDTH),
    monthLabelHeight: nonNegativeNumber(options.monthLabelHeight, MONTH_LABEL_HEIGHT),
  };
}

function startOfWeek(date: Date, weekStartsOn: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - ((result.getUTCDay() - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK));
  return result;
}

function endOfWeek(date: Date, weekStartsOn: number) {
  const result = startOfWeek(date, weekStartsOn);
  result.setUTCDate(result.getUTCDate() + DAYS_PER_WEEK - 1);
  return result;
}

function normalizeWeekStartsOn(value: number | undefined) {
  return Number.isInteger(value) ? ((value! % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK : 0;
}

function normalizeLevelCount(value: number | undefined) {
  return Number.isInteger(value) && value! >= 2 ? value! : 5;
}

function normalizeLevel(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
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

function parseDateOnly(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
