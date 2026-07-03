<script setup lang="ts">
import { computed, ref } from "vue";
import {
  contributionHeatmapCellAtPoint,
  type ContributionHeatmapActiveCell,
  type ContributionHeatmapModel,
} from "../utils/contributionHeatmap";

const props = withDefaults(defineProps<{
  model: ContributionHeatmapModel;
  ariaLabel?: string;
  activeCell?: ContributionHeatmapActiveCell | null;
}>(), {
  ariaLabel: "Contribution heatmap",
});

const emit = defineEmits<{
  "cell-enter": [cell: ContributionHeatmapActiveCell, event: PointerEvent];
  "cell-move": [cell: ContributionHeatmapActiveCell, event: PointerEvent];
  "cell-leave": [event: PointerEvent];
}>();

const internalActiveCell = ref<ContributionHeatmapActiveCell | null>(null);
const displayActiveCell = computed(() =>
  props.activeCell === undefined ? internalActiveCell.value : props.activeCell
);

function onPointerMove(event: PointerEvent) {
  const cell = contributionHeatmapCellAtPoint(props.model, {
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
  <svg
    class="contribution-heatmap"
    role="img"
    :aria-label="ariaLabel"
    :viewBox="model.viewBox"
    :width="model.width"
    :height="model.height"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <text
      v-for="label in model.dayLabels"
      :key="label.label"
      class="contribution-heatmap__day-label"
      :x="label.x"
      :y="label.y"
    >
      {{ label.label }}
    </text>
    <text
      v-for="month in model.monthLabels"
      :key="month.key"
      class="contribution-heatmap__month"
      :x="month.x"
      y="10"
    >
      {{ month.label }}
    </text>
    <path
      v-for="path in model.levelPaths"
      :key="path.level"
      class="contribution-heatmap__level"
      :class="`contribution-heatmap__level--${path.level}`"
      :d="path.d"
    />
    <rect
      v-if="displayActiveCell"
      class="contribution-heatmap__active-cell"
      :x="displayActiveCell.x - 1"
      :y="displayActiveCell.y - 1"
      :width="model.cellSize + 2"
      :height="model.cellSize + 2"
      rx="3"
      ry="3"
    >
      <title>{{ displayActiveCell.title }}</title>
    </rect>
  </svg>
</template>

<style scoped>
.contribution-heatmap {
  display: block;
  flex: 0 0 auto;
  min-width: max-content;
  contain: layout paint style;
}

.contribution-heatmap__month,
.contribution-heatmap__day-label {
  color: var(--text-muted);
  fill: currentColor;
  font-family: inherit;
  pointer-events: none;
}

.contribution-heatmap__month {
  font-size: 10px;
}

.contribution-heatmap__day-label {
  font-size: 11px;
}

.contribution-heatmap__level {
  pointer-events: none;
  stroke: color-mix(in srgb, var(--bg) 20%, transparent);
  stroke-width: 1;
}

.contribution-heatmap__level--0 {
  fill: var(--bg-subtle);
}

.contribution-heatmap__level--1 {
  fill: color-mix(in srgb, var(--ok) 30%, var(--bg-subtle));
}

.contribution-heatmap__level--2 {
  fill: color-mix(in srgb, var(--ok) 55%, var(--bg-subtle));
}

.contribution-heatmap__level--3 {
  fill: color-mix(in srgb, var(--ok) 78%, var(--bg-subtle));
}

.contribution-heatmap__level--4 {
  fill: #3fb950;
}

.contribution-heatmap__active-cell {
  fill: transparent;
  stroke: var(--text);
  stroke-width: 1.5;
  pointer-events: none;
}
</style>
