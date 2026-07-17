import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const sidebarCss = readFileSync(resolve("packages/ui/src/styles/sidebar.css"), "utf8");
const shellCss = [
  sidebarCss,
  readFileSync(resolve("packages/ui/src/styles/shell.css"), "utf8"),
].join("\n");
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
  .titlebar {
    background: var(--lilia-titlebar-surface, transparent);
  }
`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  await assertSurfaces(page, "mica", "sidebar", true, {
    titlebar: "rgba(0, 0, 0, 0)",
    sidebar: "rgba(0, 0, 0, 0)",
    main: "rgb(17, 18, 19)",
  });
  await assertSurfaces(page, "mica", "sidebar", false, {
    titlebar: "rgb(34, 35, 36)",
    sidebar: "rgba(0, 0, 0, 0)",
    main: "rgb(17, 18, 19)",
  });
  await assertSurfaces(page, "acrylic", "main", true, {
    titlebar: "rgb(34, 35, 36)",
    sidebar: "rgb(34, 35, 36)",
    main: "rgba(0, 0, 0, 0)",
  });
  await assertSurfaces(page, "solid", "sidebar", true, {
    titlebar: "rgb(34, 35, 36)",
    sidebar: "rgb(34, 35, 36)",
    main: "rgb(17, 18, 19)",
  });
  await assertStandaloneSidebarFrames(page);
  await assertNarrowSidebarScope(page);

  console.log("Shell appearance browser checks passed.");
} finally {
  await browser.close();
}

async function assertSurfaces(page, backdrop, target, followsSidebar, expected) {
  await page.setContent(`
    <!doctype html>
    <html
      data-backdrop="${backdrop}"
      data-backdrop-target="${target}"
      data-titlebar-follows-sidebar="${followsSidebar}"
    >
      <head><style>${tokens}\n${shellCss}</style></head>
      <body>
        <div class="shell">
          <header class="titlebar"></header>
          <aside class="secondary-panel"></aside>
          <main class="shell__main"></main>
        </div>
      </body>
    </html>
  `);

  const surfaces = await page.evaluate(() => ({
    titlebar: getComputedStyle(document.querySelector(".titlebar")).backgroundColor,
    sidebar: getComputedStyle(document.querySelector(".secondary-panel")).backgroundColor,
    main: getComputedStyle(document.querySelector(".shell__main")).backgroundColor,
  }));

  assert.equal(surfaces.titlebar, expected.titlebar);
  assert.equal(surfaces.sidebar, expected.sidebar);
  assert.equal(surfaces.main, expected.main);
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

async function assertNarrowSidebarScope(page) {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.setContent(`
    <!doctype html>
    <html>
      <head><style>${tokens}\n${shellCss}</style></head>
      <body>
        <div class="shell">
          <header class="titlebar"></header>
          <aside class="secondary-panel" data-sidebar="legacy"></aside>
          <main class="shell__main">
            <div class="lilia-workspace-region">
              <aside class="secondary-panel" data-sidebar="workspace"></aside>
            </div>
          </main>
        </div>
      </body>
    </html>
  `);

  const displays = await page.evaluate(() => ({
    legacy: getComputedStyle(document.querySelector('[data-sidebar="legacy"]')).display,
    workspace: getComputedStyle(document.querySelector('[data-sidebar="workspace"]')).display,
  }));

  assert.equal(displays.legacy, "none", "legacy shell sidebar remains hidden on narrow viewports");
  assert.equal(displays.workspace, "flex", "Workspace Region sidebar remains visible as overlay content");
}
