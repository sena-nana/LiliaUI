import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import UiImageViewer from "../../packages/ui/src/components/UiImageViewer.vue";

describe("UiImageViewer", () => {
  it("shows image metadata and exposes stable agent targets", async () => {
    const view = render(UiImageViewer, {
      props: {
        source: {
          src: "asset://image.png",
          alt: "建模截图",
          name: "image.png",
          metadata: "PNG · 12 KB",
        },
        agentId: "viewer",
      },
    });

    expect(screen.getByRole("dialog", { name: "建模截图" })).toHaveAttribute("data-agent-id", "viewer");
    expect(screen.getByRole("img", { name: "建模截图" })).toHaveAttribute("data-agent-id", "viewer.image");
    expect(screen.getByText("PNG · 12 KB")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "关闭图片" }));
    expect(view.emitted().close).toHaveLength(1);
  });

  it("zooms within bounds, resets on source change, and closes on Escape", async () => {
    const view = render(UiImageViewer, {
      props: { source: { src: "asset://first.png", alt: "第一张" } },
    });
    const dialog = screen.getByRole("dialog");
    const image = screen.getByRole("img") as HTMLImageElement;
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: 1200 },
      naturalHeight: { configurable: true, value: 800 },
    });
    await fireEvent.load(image);
    await fireEvent.wheel(dialog, { deltaY: -10000 });
    expect(image.style.transform).toContain("scale(6)");
    await fireEvent.wheel(dialog, { deltaY: 10000 });
    expect(image.style.transform).toContain("scale(1)");

    await fireEvent.wheel(dialog, { deltaY: -300 });
    expect(image.style.transform).not.toContain("scale(1)");
    await fireEvent.pointerDown(image, { button: 0, clientX: 10, clientY: 10, pointerId: 3 });
    expect(image).toHaveClass("is-dragging");
    await fireEvent.pointerMove(image, { clientX: 40, clientY: 30, pointerId: 3 });
    expect(image).toHaveClass("is-dragging");
    await fireEvent.pointerUp(image, { pointerId: 3 });
    expect(image).not.toHaveClass("is-dragging");

    await view.rerender({ source: { src: "asset://second.png", alt: "第二张" } });
    expect(image.style.transform).toContain("scale(1)");

    await fireEvent.keyDown(dialog, { key: "Escape" });
    expect(view.emitted().close).toHaveLength(1);
  });
});
