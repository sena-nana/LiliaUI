import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const shellCss = readFileSync(resolve("packages/ui/src/styles/shell.css"), "utf8");
const tokens = `
  :root {
    --bg: rgb(17, 18, 19);
    --bg-elev: rgb(34, 35, 36);
    --lilia-backdrop-surface: rgba(51, 52, 53, 0.64);
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
