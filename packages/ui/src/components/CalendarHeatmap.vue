<script setup lang="ts" generic="T = unknown">
import { computed, ref, useId } from "vue";
import {
  calendarHeatmapCellAtPoint,
  type CalendarHeatmapActiveCell,
  type CalendarHeatmapModel,
} from "../utils/calendarHeatmap";
import Tooltip from "./Tooltip.vue";

const props = withDefaults(defineProps<{
  model: CalendarHeatmapModel<T>;
  ariaLabel?: string;
  activeCell?: CalendarHeatmapActiveCell<T> | null;
}>(), { ariaLabel: "Calendar heatmap" });

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "cell-enter": [cell: CalendarHeatmapActiveCell<T>, event: PointerEvent];
  "cell-move": [cell: CalendarHeatmapActiveCell<T>, event: PointerEvent];
  "cell-leave": [event: PointerEvent];
}>();

const internalActiveCell = ref<CalendarHeatmapActiveCell<T> | null>(null);
const tooltipId = useId();
const displayActiveCell = computed(() =>
  props.activeCell === undefined ? internalActiveCell.value : props.activeCell
);
const tooltipStyle = computed(() => {
  const cell = displayActiveCell.value;
  if (!cell) return undefined;
  const alignRight = cell.x > props.model.width / 2;
  return {
    [alignRight ? "right" : "left"]: `${alignRight
      ? props.model.width - cell.x - props.model.cellSize
      : cell.x}px`,
    top: `${cell.y < props.model.height / 2
      ? cell.y + props.model.cellSize + 6
      : cell.y - 30}px`,
  };
});

function onPointerMove(event: PointerEvent) {
  const cell = calendarHeatmapCellAtPoint(props.model, {
    x: event.offsetX,
    y: event.offsetY,
  });
  const previous = internalActiveCell.value;
  if (!cell) {
    if (previous) {
      internalActiveCell.value = null;
      emit("cell-leave", event);
    }
    return;
  }
  internalActiveCell.value = cell;
  if (previous?.date !== cell.date) {
    emit("cell-enter", cell, event);
    return;
  }
  emit("cell-move", cell, event);
}

function onPointerLeave(event: PointerEvent) {
  if (!internalActiveCell.value) return;
  internalActiveCell.value = null;
  emit("cell-leave", event);
}
</script>

<template>
  <div class="calendar-heatmap-wrap" :style="{ width: `${model.width}px` }">
    <svg
      class="calendar-heatmap"
      role="img"
      :aria-label="ariaLabel"
      :aria-describedby="displayActiveCell ? tooltipId : undefined"
      :viewBox="model.viewBox"
      :width="model.width"
      :height="model.height"
      v-bind="$attrs"
      @pointerenter="onPointerMove"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    >
      <text
        v-for="label in model.dayLabels"
        :key="`${label.label}-${label.y}`"
        class="calendar-heatmap__day-label"
        :x="label.x"
        :y="label.y"
      >
        {{ label.label }}
      </text>
      <text
        v-for="month in model.monthLabels"
        :key="month.key"
        class="calendar-heatmap__month"
        :x="month.x"
        y="10"
        text-anchor="middle"
      >
        {{ month.label }}
      </text>
      <path
        v-for="path in model.levelPaths"
        :key="path.level"
        class="calendar-heatmap__level"
        :style="{ fill: `var(--calendar-heatmap-level-${path.level}, var(--calendar-heatmap-level-default))` }"
        :d="path.d"
      />
      <rect
        v-if="displayActiveCell"
        class="calendar-heatmap__active-cell"
        :x="displayActiveCell.x - 1"
        :y="displayActiveCell.y - 1"
        :width="model.cellSize + 2"
        :height="model.cellSize + 2"
        :rx="model.cellRadius + 1"
        :ry="model.cellRadius + 1"
      />
    </svg>
    <Tooltip v-if="displayActiveCell" :id="tooltipId" :style="tooltipStyle">
      {{ displayActiveCell.title }}
    </Tooltip>
  </div>
</template>

<style scoped>
.calendar-heatmap-wrap {
  position: relative;
  display: block;
  flex: 0 0 auto;
  contain: layout paint style;
}

.calendar-heatmap {
  display: block;
}

.calendar-heatmap__month,
.calendar-heatmap__day-label {
  color: var(--text-muted);
  fill: currentColor;
  font-family: inherit;
  pointer-events: none;
}

.calendar-heatmap__month { font-size: 10px; }
.calendar-heatmap__day-label { font-size: 11px; }

.calendar-heatmap__level {
  pointer-events: none;
  stroke: color-mix(in srgb, var(--bg) 20%, transparent);
  stroke-width: 1;
}

.calendar-heatmap__active-cell {
  fill: transparent;
  stroke: var(--text);
  stroke-width: 1.5;
  pointer-events: none;
}
</style>
