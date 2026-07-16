import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";
import {
  CalendarHeatmap,
  buildCalendarHeatmapModel,
  calendarHeatmapCellAtPoint,
  type CalendarHeatmapActiveCell,
  type CalendarHeatmapDatum,
} from "@lilia/ui";

describe("CalendarHeatmap", () => {
  it("builds pure heatmap data from date values", () => {
    const days: (CalendarHeatmapDatum & { html?: string })[] = [
      { date: "2026-06-01", value: 2, html: "<unsafe>" },
      { date: "2026-06-03", value: 8 },
    ];
    const model = buildCalendarHeatmapModel(days, {
      titleFormatter: (day) => `${day.date} has ${day.value} changes`,
      locale: "en-US",
      monthFormatter: (month) => `M${String(month.getUTCMonth() + 1).padStart(2, "0")}`,
    });

    expect(model.viewBox).toBe(`0 0 ${model.width} ${model.height}`);
    expect(model.dayLabels.map((label) => label.label)).toEqual(["Mon", "Wed", "Fri"]);
    expect(model.monthLabels.find((label) => label.label === "M06")).toMatchObject({
      key: "2026-05-31",
      x: model.labelWidth + model.cellSize / 2,
    });
    expectActiveHighlightToFit(model);
    expect(model.levelPaths.map((path) => path.level)).toEqual([0, 1, 4]);
    expect(model.levelPaths.every((path) => path.d.length > 0)).toBe(true);
    expect(model.cells.filter((cell) => cell.value > 0).map((cell) => cell.title)).toEqual([
      "2026-06-01 has 2 changes",
      "2026-06-03 has 8 changes",
    ]);
    expect(JSON.stringify(model)).not.toContain("<unsafe>");
  });

  it("supports threshold, custom, and week-start policies", () => {
    const data = [
      { date: "2026-06-01", value: 2 },
      { date: "2026-06-02", value: 8 },
    ];
    const thresholdModel = buildCalendarHeatmapModel(data, {
      levelStrategy: { type: "thresholds", thresholds: [1, 4, 8] },
      weekStartsOn: 1,
      weekdayLabels: [{ day: 1, label: "First" }],
    });
    expect(thresholdModel.cells.find((cell) => cell.date === "2026-06-01")?.level).toBe(1);
    expect(thresholdModel.cells.find((cell) => cell.date === "2026-06-02")?.level).toBe(3);
    expect(thresholdModel.cells[0]?.date).toBe("2026-06-01");
    expect(thresholdModel.dayLabels[0]?.label).toBe("First");

    const customModel = buildCalendarHeatmapModel(data, {
      levelStrategy: {
        type: "custom",
        levels: 3,
        resolveLevel: (datum) => datum.value === 8 ? 2 : 0,
      },
    });
    expect(customModel.cells.find((cell) => cell.date === "2026-06-02")?.level).toBe(2);
  });

  it("resolves cells through coordinate hit testing without per-cell nodes", () => {
    const model = buildCalendarHeatmapModel([
      { date: "2026-06-01", value: 1 },
    ]);
    const cell = model.cells.find((item) => item.date === "2026-06-01");
    expect(cell).toBeDefined();

    const hit = calendarHeatmapCellAtPoint(model, {
      x: cell!.x + 1,
      y: cell!.y + 1,
    });
    expect(hit).toMatchObject({
      date: "2026-06-01",
      value: 1,
      level: 4,
    });
    expect(calendarHeatmapCellAtPoint(model, { x: cell!.x - 1, y: cell!.y + 1 })).toBeNull();
    expect(calendarHeatmapCellAtPoint(model, {
      x: cell!.x + model.cellSize + 1,
      y: cell!.y + 1,
    })).toBeNull();
  });

  it("applies custom cell metrics to geometry and hit testing", () => {
    const model = buildCalendarHeatmapModel([{ date: "2026-06-01", value: 1 }], {
      cellSize: 13,
      cellGap: 4,
      cellRadius: 3,
    });
    const cell = model.cells.find((item) => item.date === "2026-06-01");
    expect(cell).toBeDefined();

    expect(model.cellSize).toBe(13);
    expect(model.cellGap).toBe(4);
    expect(cell).toMatchObject({ x: 42, y: 31 });
    expectActiveHighlightToFit(model);

    const pathNumbers = model.levelPaths
      .flatMap((path) => path.d.match(/-?\d+(?:\.\d+)?/g) ?? [])
      .map(Number);
    expect(Math.max(...pathNumbers)).toBe(129);
    expect(calendarHeatmapCellAtPoint(model, { x: cell!.x + 12, y: cell!.y + 12 })).toMatchObject({
      date: "2026-06-01",
    });
    expect(calendarHeatmapCellAtPoint(model, { x: cell!.x + 13.5, y: cell!.y + 1 })).toBeNull();
  });

  it("shows a tooltip immediately and emits pointer cell transitions", async () => {
    const entered = vi.fn();
    const moved = vi.fn();
    const left = vi.fn();
    const model = buildCalendarHeatmapModel([{ date: "2026-06-01", value: 1 }]);
    const firstCell = model.cells.find((cell) => cell.date === "2026-06-01")!;

    const view = render(defineComponent({
      components: { CalendarHeatmap },
      setup() {
        return { entered, left, model, moved };
      },
      template: `
        <CalendarHeatmap
          :model="model"
          aria-label="Activity"
          @cell-enter="entered"
          @cell-move="moved"
          @cell-leave="left"
        />
      `,
    }));

    const svg = screen.getByRole("img", { name: "Activity" });
    await pointerMove(svg, firstCell.x + 1, firstCell.y + 1);
    expect(view.container.querySelectorAll(".calendar-heatmap__active-cell")).toHaveLength(1);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent(firstCell.title);
    expect(tooltip).toHaveClass("lilia-tooltip");
    expect(svg).toHaveAttribute("aria-describedby", tooltip.id);
    await pointerMove(svg, firstCell.x + 2, firstCell.y + 2);
    expect(view.container.querySelectorAll(".calendar-heatmap__active-cell")).toHaveLength(1);
    await fireEvent.pointerLeave(svg);

    expect(entered).toHaveBeenCalledTimes(1);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(left).toHaveBeenCalledTimes(1);
    expect((entered.mock.calls[0][0] as CalendarHeatmapActiveCell).date).toBe("2026-06-01");
    expect(view.container.querySelector(".calendar-heatmap__month")?.getAttribute("text-anchor")).toBe("middle");
    expect(view.container.querySelectorAll(".calendar-heatmap__level").length).toBeLessThanOrEqual(5);
    expect(view.container.querySelectorAll(".calendar-heatmap__active-cell")).toHaveLength(0);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

async function pointerMove(element: Element, offsetX: number, offsetY: number) {
  const event = new Event("pointermove", { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    offsetX: { value: offsetX },
    offsetY: { value: offsetY },
  });
  await fireEvent(element, event);
}

function expectActiveHighlightToFit(model: ReturnType<typeof buildCalendarHeatmapModel>) {
  const lastCell = model.cells[model.cells.length - 1];
  expect(lastCell).toBeDefined();
  expect(lastCell!.x + model.cellSize + 1).toBeLessThanOrEqual(model.width);
  expect(lastCell!.y + model.cellSize + 1).toBeLessThanOrEqual(model.height);
}
