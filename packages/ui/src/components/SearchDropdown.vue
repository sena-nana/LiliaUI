<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, type ComponentPublicInstance } from "vue";
import { useAnchoredOverlay } from "../composables/useAnchoredOverlay";
import { useDismissableOverlay } from "../composables/useDismissableOverlay";
import {
  highlightQuerySegments as createQuerySegments,
  highlightRangeSegments,
} from "../utils/textSegments";
import "./search-dropdown.css";

const props = withDefaults(defineProps<{
  modelValue: string;
  open?: boolean;
  placeholder?: string;
  closeOnOutside?: boolean;
  closeOnEscape?: boolean;
  spellcheck?: boolean;
  inputAgentId?: string;
}>(), {
  open: true,
  placeholder: "",
  closeOnOutside: false,
  closeOnEscape: false,
  spellcheck: false,
  inputAgentId: "search-dropdown.input",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:open": [value: boolean];
  "open-request": [];
  input: [event: Event];
  keydown: [event: KeyboardEvent];
}>();

const root = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const suppressNextFocusOpen = ref(false);
let disposed = false;
const openState = computed(() => props.open);
const preferredPlacement = computed(() => "bottom-start" as const);
const {
  overlayEl: menuEl,
  overlayStyle,
  resolvedPlacement,
  containsTarget,
} = useAnchoredOverlay({
  open: openState,
  anchorEl: root,
  preferredPlacement,
  offset: 0,
  matchAnchorWidth: true,
});
const menuPlacementClass = computed(() =>
  resolvedPlacement.value.startsWith("top")
    ? "search-dropdown__menu--top"
    : "search-dropdown__menu--bottom",
);

function requestOpen(event?: Event) {
  if (event?.type === "focus" && suppressNextFocusOpen.value) {
    suppressNextFocusOpen.value = false;
    return;
  }
  emit("update:open", true);
  emit("open-request");
}

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
  emit("input", event);
}

function setMenuEl(el: Element | ComponentPublicInstance | null) {
  menuEl.value = el instanceof HTMLElement ? el : null;
}

function highlightQuerySegments(text: string, query = props.modelValue) {
  return createQuerySegments(text, query);
}

useDismissableOverlay({
  open: openState,
  closeOnOutside: computed(() => props.closeOnOutside),
  closeOnEscape: computed(() => props.closeOnEscape),
  containsTarget,
  onDismiss: () => {
    emit("update:open", false);
  },
});

onBeforeUnmount(() => {
  disposed = true;
});

defineExpose({
  focus: (options?: FocusOptions & { open?: boolean }) => {
    if (disposed) return;
    if (options?.open === false) {
      suppressNextFocusOpen.value = true;
    }
    inputRef.value?.focus(options);
    void nextTick(() => {
      if (disposed) return;
      suppressNextFocusOpen.value = false;
    });
  },
});
</script>

<template>
  <div
    ref="root"
    class="search-dropdown"
    :class="{
      'is-open': open,
      'is-open-top': open && resolvedPlacement.startsWith('top'),
      'is-open-bottom': open && !resolvedPlacement.startsWith('top'),
    }"
  >
    <div class="search-dropdown__field">
      <slot name="leading" />
      <input
        ref="inputRef"
        :value="modelValue"
        type="text"
        class="search-dropdown__input"
        :data-agent-id="inputAgentId"
        :placeholder="placeholder"
        :spellcheck="spellcheck"
        @pointerdown="requestOpen"
        @focus="requestOpen"
        @input="onInput"
        @keydown="emit('keydown', $event)"
      />
      <slot name="trailing" />
    </div>
    <Teleport to="body">
      <div
        v-if="open"
        :ref="setMenuEl"
        class="search-dropdown__menu"
        :class="menuPlacementClass"
        role="listbox"
        :style="overlayStyle"
      >
        <slot
          :query="modelValue"
          :highlight-query-segments="highlightQuerySegments"
          :highlight-range-segments="highlightRangeSegments"
        />
      </div>
    </Teleport>
  </div>
</template>
