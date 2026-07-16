<script setup lang="ts">
import { useFieldPrimitive } from "@lilia/ui-foundation/field";
import type { FormFieldProps } from "@lilia/ui-contract";
const props = defineProps<FormFieldProps>();
const field = useFieldPrimitive(props);
</script>

<template>
  <div class="nana-field" :data-agent-id="agentId">
    <label class="nana-field__label" :for="field.controlId.value">
      {{ label }} <span v-if="required" aria-hidden="true">*</span>
    </label>
    <slot
      :control-id="field.controlId.value"
      :described-by="field.describedBy.value"
      :invalid="Boolean(error)"
    />
    <p v-if="hint" :id="field.descriptionId.value" class="nana-field__hint">{{ hint }}</p>
    <p v-if="error" :id="field.errorId.value" class="nana-field__error" role="alert">{{ error }}</p>
  </div>
</template>
