import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

const themes = ["light", "dark"] as const;

test("lilia layer visual matrix", async ({ page }) => {
  await resetDeviceMetrics(page);
  await page.goto("/tests/visual/matrix.html");
  await waitForMatrix(page);
  const frameMetrics = await page.locator("iframe").evaluateAll((frames) => frames.map((frame) => ({
    devicePixelRatio: (frame as HTMLIFrameElement).contentWindow?.devicePixelRatio,
    width: (frame as HTMLIFrameElement).contentWindow?.innerWidth,
  })));
  expect(frameMetrics).toEqual(Array.from({ length: 4 }, () => ({ devicePixelRatio: 1, width: 418 })));
  const stateFrame = page.frames().find((candidate) =>
    candidate.url().includes("theme=dark&density=compact"),
  );
  await stateFrame?.locator('[data-agent-id="visual.hover"]').hover();
  const pressed = stateFrame?.locator('[data-agent-id="visual.surface.translucent.selected"]');
  const pressedBox = await pressed?.boundingBox();
  if (pressedBox) {
    await page.mouse.move(pressedBox.x + pressedBox.width / 2, pressedBox.y + pressedBox.height / 2);
    await page.mouse.down();
  }
  try {
    await expect(page).toHaveScreenshot("lilia-layer.png", {
      animations: "disabled",
      fullPage: true,
      scale: "css",
    });
  } finally {
    if (pressedBox) await page.mouse.up();
  }
});

for (const theme of themes) {
  test(`lilia ${theme} has browser-computed color contrast`, async ({ page }) => {
    await openFixture(page, { theme });
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => {
      const axeRuntime = (window as typeof window & {
        axe: { run: (root: Document, options: unknown) => Promise<{
          passes: { id: string }[];
          violations: { id: string; nodes: { target: string[]; failureSummary?: string }[] }[];
        }> };
      }).axe;
      return axeRuntime.run(document, { runOnly: { type: "rule", values: ["color-contrast"] } });
    });
    const evaluated = [...result.passes, ...result.violations]
      .some((entry) => entry.id === "color-contrast");
    const failures = result.violations.flatMap((violation) => violation.nodes.map((node) =>
      `${node.target.join(" ")}: ${node.failureSummary ?? violation.id}`,
    ));
    expect(evaluated, "axe did not evaluate the color-contrast rule").toBe(true);
    expect(failures, failures.join("\n")).toEqual([]);
  });
}

test("lilia keeps critical content inside a 200% rendering viewport", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 720,
      deviceScaleFactor: 2,
      mobile: false,
      screenWidth: 720,
      screenHeight: 1440,
    });
    await openFixture(page, { longText: true });
    await expect(page.evaluate(() => devicePixelRatio)).resolves.toBe(2);
    const overflow = await page.locator("[data-visual-critical]").evaluateAll((elements) =>
      elements.flatMap((element) => {
        const node = element as HTMLElement;
        const rect = node.getBoundingClientRect();
        const exceedsSelf = node.scrollWidth > node.clientWidth + 1;
        const exceedsViewport = rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
        return exceedsSelf || exceedsViewport
          ? [`${node.dataset.visualCritical}: scroll ${node.scrollWidth}/${node.clientWidth}, rect ${rect.left}/${rect.right}`]
          : [];
      }),
    );
    expect(overflow, overflow.join("\n")).toEqual([]);
  } finally {
    await client.send("Emulation.clearDeviceMetricsOverride");
  }
});

test("lilia disables loading motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openFixture(page);
  const motion = page.locator('[data-agent-id="visual.motion"]');
  expect(await motion.evaluate((node) => getComputedStyle(node).animationName)).not.toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => motion.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
});

async function resetDeviceMetrics(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 880,
    height: 780,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 880,
    screenHeight: 780,
  });
}

async function openFixture(
  page: Page,
  options: { theme?: "light" | "dark"; longText?: boolean } = {},
) {
  const query = new URLSearchParams({
    theme: options.theme ?? "light",
    density: "comfortable",
    long: options.longText ? "1" : "0",
  });
  await page.goto(`/tests/visual/harness.html?${query}`);
  await page.locator("html[data-visual-ready='true']").waitFor();
}

async function waitForMatrix(page: Page) {
  await page.waitForFunction(() => {
    const frames = [...document.querySelectorAll("iframe")];
    return frames.length === 4 && frames.every((frame) =>
      frame.contentDocument?.documentElement.dataset.visualReady === "true",
    );
  });
}
