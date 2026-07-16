import { computed, useId, type ComputedRef } from "vue";
import type { FormFieldProps } from "@lilia/ui-contract";

export interface FieldPrimitive {
  controlId: ComputedRef<string>;
  descriptionId: ComputedRef<string | undefined>;
  errorId: ComputedRef<string | undefined>;
  describedBy: ComputedRef<string | undefined>;
}

export function useFieldPrimitive(props: FormFieldProps): FieldPrimitive {
  const generatedId = `ui-field-${useId()}`;
  const controlId = computed(() => props.controlId || generatedId);
  const descriptionId = computed(() => props.hint ? `${controlId.value}-hint` : undefined);
  const errorId = computed(() => props.error ? `${controlId.value}-error` : undefined);
  const describedBy = computed(() => [descriptionId.value, errorId.value].filter(Boolean).join(" ") || undefined);
  return { controlId, descriptionId, errorId, describedBy };
}
