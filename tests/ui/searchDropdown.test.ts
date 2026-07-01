import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import { defineComponent, ref } from "vue";
import { describe, expect, it } from "vitest";
import SearchDropdown from "@lilia/ui/components/SearchDropdown";

function renderSearchDropdown() {
  return render(defineComponent({
    components: { SearchDropdown },
    setup() {
      const value = ref("alp");
      const open = ref(false);
      return { open, value };
    },
    template: `
      <SearchDropdown
        v-model="value"
        v-model:open="open"
        placeholder="搜索"
        :close-on-outside="true"
        :close-on-escape="true"
      >
        <template #default="{ highlightQuerySegments, highlightRangeSegments }">
          <button type="button" class="search-dropdown__item" role="option">
            <template v-for="segment in highlightQuerySegments('Alpha')" :key="segment.text">
              <mark v-if="segment.mark">{{ segment.text }}</mark>
              <span v-else>{{ segment.text }}</span>
            </template>
            <span data-testid="range-segments">
              <template v-for="(segment, index) in highlightRangeSegments('abcdef', [[1, 3], [2, 5]])" :key="index">
                <mark v-if="segment.mark">{{ segment.text }}</mark>
                <span v-else>{{ segment.text }}</span>
              </template>
            </span>
          </button>
        </template>
      </SearchDropdown>
    `,
  }));
}

describe("SearchDropdown", () => {
  it("teleports menu to body, exposes highlighting, and closes on outside click", async () => {
    const view = renderSearchDropdown();
    const input = view.getByPlaceholderText("搜索");

    await fireEvent.focus(input);

    const listbox = await screen.findByRole("listbox");
    expect(document.body.contains(listbox)).toBe(true);
    expect(view.container.contains(listbox)).toBe(false);
    expect(listbox.querySelector("mark")).toHaveTextContent("Alp");
    expect(screen.getByTestId("range-segments").querySelector("mark")).toHaveTextContent("bcde");

    await fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("closes on Escape", async () => {
    const view = renderSearchDropdown();
    const input = view.getByPlaceholderText("搜索");

    await fireEvent.focus(input);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });
});
