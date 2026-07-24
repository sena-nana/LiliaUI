import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { launchChromium } from "../browser/chromium.ts";

const sidebarCss = readFileSync(resolve("packages/theme/src/styles/sidebar.css"), "utf8");
const tokens = `
  :root {
    --bg: rgb(17, 18, 19);
    --bg-elev: rgb(34, 35, 36);
    --lilia-backdrop-surface: rgba(51, 52, 53, 0.64);
    --lilia-state-layer-selected: rgb(64, 65, 66);
    --lilia-state-foreground-selected: rgb(245, 246, 247);
    --lilia-state-indicator-selected: rgb(82, 142, 242);
    --radius-md: 6px;
  }
`;

const browser = await launchChromium();
try {
  const page = await browser.newPage();

  await assertStandaloneSidebarFrames(page);

  console.log("Shell appearance browser checks passed.");
} finally {
  await browser.close();
}

async function assertStandaloneSidebarFrames(page) {
  await page.setViewportSize({ width: 900, height: 480 });
  await page.setContent(`
    <!doctype html>
    <html>
      <head><style>${tokens}\n${sidebarCss}</style></head>
      <body style="display: grid; grid-template-columns: 240px 240px; height: 420px; margin: 0;">
        <aside class="secondary-panel" data-sidebar="frame">
          <div class="secondary-panel__top">资源</div>
          <div class="secondary-panel__body">
            <button class="sb-tree__row is-active">
              <span class="sb-tree__name">一个足够长且需要被截断的资源名称</span>
            </button>
          </div>
          <div class="secondary-panel__footer">状态</div>
        </aside>
        <aside class="secondary-panel settings-sidebar" data-sidebar="settings">
          <div class="secondary-panel__top">返回</div>
          <div class="secondary-panel__body">设置分类</div>
        </aside>
      </body>
    </html>
  `);

  const styles = await page.evaluate(() => {
    const frame = document.querySelector('[data-sidebar="frame"]');
    const settings = document.querySelector('[data-sidebar="settings"]');
    const body = frame?.querySelector(".secondary-panel__body");
    const row = frame?.querySelector(".sb-tree__row");
    const name = frame?.querySelector(".sb-tree__name");
    if (!frame || !settings || !body || !row || !name) throw new Error("sidebar fixture incomplete");
    return {
      frameDisplay: getComputedStyle(frame).display,
      frameDirection: getComputedStyle(frame).flexDirection,
      settingsDisplay: getComputedStyle(settings).display,
      bodyGrow: getComputedStyle(body).flexGrow,
      bodyOverflow: getComputedStyle(body).overflowY,
      rowDisplay: getComputedStyle(row).display,
      rowHeight: getComputedStyle(row).height,
      rowBackground: getComputedStyle(row).backgroundColor,
      nameOverflow: getComputedStyle(name).overflow,
      nameTextOverflow: getComputedStyle(name).textOverflow,
    };
  });

  assert.deepEqual(styles, {
    frameDisplay: "flex",
    frameDirection: "column",
    settingsDisplay: "flex",
    bodyGrow: "1",
    bodyOverflow: "auto",
    rowDisplay: "flex",
    rowHeight: "28px",
    rowBackground: "rgb(64, 65, 66)",
    nameOverflow: "hidden",
    nameTextOverflow: "ellipsis",
  }, "shared sidebar frames remain complete without legacy shell.css");
}
