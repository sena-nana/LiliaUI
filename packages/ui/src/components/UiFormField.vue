<script setup lang="ts">
import type { FormFieldProps } from "@lilia/ui-contract";
import { useFieldPrimitive } from "@lilia/ui-foundation/field";
import UiValidationMessage from "./UiValidationMessage.vue";

const props = withDefaults(defineProps<FormFieldProps>(), {
  hint: undefined,
  error: undefined,
  required: false,
  controlId: undefined,
  agentId: undefined,
});
const field = useFieldPrimitive(props);
</script>

<template>
  <div class="ui-form-field" :data-agent-id="agentId">
    <label class="ui-form-field__label" :for="field.controlId.value">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <div class="ui-form-field__control">
      <slot
        :control-id="field.controlId.value"
        :described-by="field.describedBy.value"
        :invalid="Boolean(error)"
      />
    </div>
    <p v-if="hint" :id="field.descriptionId.value" class="ui-form-field__hint">{{ hint }}</p>
    <UiValidationMessage
      v-if="error"
      :id="field.errorId.value"
      :message="error"
      :agent-id="agentId ? `${agentId}.error` : undefined"
    />
  </div>
</template>

<style scoped>
.ui-form-field { display: grid; min-width: 0; gap: 5px; }
.ui-form-field__label { color: var(--text); font-size: 13px; font-weight: 600; }
.ui-form-field__control { min-width: 0; }
.ui-form-field__hint { margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
</style>
