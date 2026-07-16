import { fireEvent, render, screen } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vitest";
import {
  Checkbox,
  FormField,
  UiCheckbox,
  UiFormField,
  UiValidationMessage,
  ValidationMessage,
} from "@lilia/ui";

describe("contract form components", () => {
  it("keeps prefixed and contract exports aligned", () => {
    expect(Checkbox).toBe(UiCheckbox);
    expect(FormField).toBe(UiFormField);
    expect(ValidationMessage).toBe(UiValidationMessage);
  });

  it("updates checkbox state and exposes mixed, invalid, and disabled semantics", async () => {
    const view = render(defineComponent({
      components: { UiCheckbox },
      setup() {
        const accepted = ref(false);
        return { accepted };
      },
      template: `
        <UiCheckbox v-model="accepted" label="Accept" agent-id="terms.accept" />
        <UiCheckbox model-value indeterminate invalid label="Partial" />
        <UiCheckbox :model-value="false" loading label="Loading" />
        <output data-testid="accepted">{{ String(accepted) }}</output>
      `,
    }));

    await fireEvent.click(screen.getByRole("checkbox", { name: "Accept" }));
    expect(view.getByTestId("accepted")).toHaveTextContent("true");
    expect(screen.getByRole("checkbox", { name: "Partial" })).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByRole("checkbox", { name: "Partial" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("checkbox", { name: "Loading" })).toBeDisabled();
  });

  it("connects a field label, hint, and validation message through slot props", () => {
    render(defineComponent({
      components: { UiFormField },
      template: `
        <UiFormField label="Name" hint="Public name" error="Name is required" required>
          <template #default="field">
            <input :id="field.controlId" :aria-describedby="field.describedBy" :aria-invalid="field.invalid" />
          </template>
        </UiFormField>
      `,
    }));

    const input = screen.getByRole("textbox", { name: /Name/ });
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toHaveLength(2);
    expect(describedBy.every((id) => document.getElementById(id))).toBe(true);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });
});
