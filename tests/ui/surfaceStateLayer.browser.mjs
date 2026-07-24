import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { launchChromium } from "../browser/chromium.ts";

const layerStyles = [
  ["lilia", "packages/theme/src/styles/tokens.css", "packages/theme/src/styles/state-layer.css"],
];
const workspaceStyles = [
  "packages/theme/src/styles/tokens.css",
  "packages/theme/src/styles/state-layer.css",
  "packages/theme/src/styles/app-shell.css",
  "packages/theme/src/styles/workspace.css",
].map((path) => readFileSync(resolve(path), "utf8")).join("\n");

const browser = await launchChromium();
try {
  for (const [layer, tokensPath, statePath] of layerStyles) {
    const page = await browser.newPage();
    const css = [tokensPath, statePath]
      .map((path) => readFileSync(resolve(path), "utf8"))
      .join("\n");
    await page.setContent(fixture(layer, css));

    const idle = page.locator("[data-agent-id='surface.translucent.idle']");
    const selected = page.locator("[data-agent-id='surface.translucent.selected']");
    const solid = page.locator("[data-agent-id='surface.solid.selected']");
    const longIdleBackground = await page.locator("[data-agent-id='surface.long.0']").evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    assert.equal(longIdleBackground, "rgba(0, 0, 0, 0)", `${layer}: long-list items are transparent by default`);
    await idle.hover();

    const initial = await page.evaluate(() => {
      const style = (id) => getComputedStyle(document.querySelector(`[data-agent-id='${id}']`));
      const idleStyle = style("surface.translucent.idle");
      const selectedStyle = style("surface.translucent.selected");
      const solidStyle = style("surface.solid.selected");
      const blurStyle = style("surface.css-blur");
      return {
        blur: blurStyle.backdropFilter,
        blurOwners: document.querySelectorAll("[data-lilia-backdrop='css-blur']").length,
        idleBackdrop: idleStyle.backdropFilter,
        idleBackground: idleStyle.backgroundColor,
        idleFilter: idleStyle.filter,
        idleWillChange: idleStyle.willChange,
        selectedBackground: selectedStyle.backgroundColor,
        selectedShadow: selectedStyle.boxShadow,
        solidBackground: solidStyle.backgroundColor,
        solidShadow: solidStyle.boxShadow,
      };
    });

    assert.match(initial.blur, /blur\(/, `${layer}: CSS blur belongs to the Surface`);
    assert.equal(initial.blurOwners, 1, `${layer}: a fixture owns exactly one CSS backdrop effect`);
    assert.equal(initial.idleBackdrop, "none", `${layer}: items do not own backdrop blur`);
    assert.equal(initial.idleFilter, "none", `${layer}: items do not use filter blur`);
    assert.equal(initial.idleWillChange, "auto", `${layer}: items do not reserve compositor layers`);
    assert.notEqual(initial.idleBackground, "rgba(0, 0, 0, 0)", `${layer}: hovered item has a local state layer`);
    assert.match(initial.selectedBackground, /\/\s*0\.(?:15|19|23)\b|rgba\([^)]*,\s*0\.(?:15|19|23)\)/, `${layer}: translucent selection uses local alpha`);
    assert.doesNotMatch(initial.solidBackground, /\/|rgba\([^)]*,\s*0\./, `${layer}: solid selection is opaque`);
    assert.equal(initial.selectedShadow, "none", `${layer}: ordinary translucent selection has no side indicator`);
    assert.equal(initial.solidShadow, "none", `${layer}: ordinary solid selection has no side indicator`);

    const before = await selected.boundingBox();
    await page.locator("html").evaluate((node) => { node.dataset.liliaReducedTransparency = "true"; });
    await page.waitForTimeout(160);
    const reduced = await selected.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      box: node.getBoundingClientRect().toJSON(),
    }));
    assert.doesNotMatch(reduced.background, /\/|rgba\([^)]*,\s*0\./, `${layer}: reduced transparency resolves to an opaque state`);
    assert.deepEqual(
      { width: reduced.box.width, height: reduced.box.height },
      { width: before?.width, height: before?.height },
      `${layer}: fallback does not alter layout`,
    );

    await page.locator("html").evaluate((node) => { delete node.dataset.liliaReducedTransparency; });
    await page.emulateMedia({ forcedColors: "active" });
    await page.waitForTimeout(160);
    const highContrastBackground = await selected.evaluate((node) => getComputedStyle(node).backgroundColor);
    assert.doesNotMatch(highContrastBackground, /\/|rgba\([^)]*,\s*0\./, `${layer}: high contrast resolves to an opaque state`);
    await page.emulateMedia({ forcedColors: "none" });

    await selected.focus();
    const focus = await selected.evaluate((node) => getComputedStyle(node).outlineStyle);
    assert.notEqual(focus, "none", `${layer}: focus is independent from state fill`);

    const client = await page.context().newCDPSession(page);
    await client.send("LayerTree.enable");
    const layersPromise = new Promise((resolveLayers) => {
      client.once("LayerTree.layerTreeDidChange", ({ layers }) => resolveLayers(layers));
    });
    await solid.hover();
    await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(resolveFrame)));
    const { root } = await client.send("DOM.getDocument");
    const { nodeId } = await client.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "[data-agent-id='surface.solid.selected']",
    });
    const { node } = await client.send("DOM.describeNode", { nodeId });
    const layers = await Promise.race([
      layersPromise,
      new Promise((resolveLayers) => setTimeout(() => resolveLayers([]), 1000)),
    ]);
    assert.equal(
      layers.some((candidate) => candidate.backendNodeId === node.backendNodeId),
      false,
      `${layer}: solid state item does not create an independent compositing layer`,
    );
    await client.send("LayerTree.disable");
    await page.close();
  }

  await assertWorkspaceSurfaceFallback(browser);
  await assertMainBackdropOwnsRoundedTint(browser);

  console.log("Surface state-layer browser checks passed.");
} finally {
  await browser.close();
}

async function assertWorkspaceSurfaceFallback(browser) {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html>
    <html>
      <head><style>${workspaceStyles}</style></head>
      <body>
        <div class="lilia-workspace" data-lilia-surface-mode="translucent" data-lilia-backdrop="native" data-lilia-surface-boundary>
          <section class="lilia-workspace-region" data-lilia-surface-mode="translucent" data-lilia-backdrop="none" data-lilia-surface-boundary></section>
        </div>
      </body>
    </html>`);

  const backgrounds = async () => page.evaluate(() => ({
    region: getComputedStyle(document.querySelector(".lilia-workspace-region")).backgroundColor,
    workspace: getComputedStyle(document.querySelector(".lilia-workspace")).backgroundColor,
  }));
  assert.deepEqual(await backgrounds(), {
    region: "rgba(0, 0, 0, 0)",
    workspace: "rgba(0, 0, 0, 0)",
  }, "translucent Workspace surfaces remain transparent and share the outer native backdrop");

  await page.locator("html").evaluate((node) => { node.dataset.liliaReducedTransparency = "true"; });
  const reduced = await backgrounds();
  assert.notEqual(reduced.workspace, "rgba(0, 0, 0, 0)", "reduced transparency restores the Workspace fill");
  assert.notEqual(reduced.region, "rgba(0, 0, 0, 0)", "reduced transparency restores the Region fill");
  await page.close();
}

async function assertMainBackdropOwnsRoundedTint(browser) {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  await page.setContent(`<!doctype html>
    <html>
      <head><style>${workspaceStyles}
        body { width: 900px; height: 600px; margin: 0; }
        .lilia-app-shell { width: 900px; height: 600px; }
        .lilia-workspace { grid-template-columns: 240px minmax(0, 1fr); }
      </style></head>
      <body>
        <div class="lilia-app-shell" data-lilia-surface-mode="translucent"
          data-lilia-backdrop="native" data-lilia-backdrop-target="main">
          <div class="lilia-app-shell__content">
            <div class="lilia-workspace" data-lilia-surface-mode="translucent" data-lilia-backdrop="none">
              <aside class="lilia-workspace-region lilia-workspace-region--section-navigation"
                data-lilia-surface-mode="solid" data-lilia-backdrop="none"></aside>
              <main class="lilia-workspace-region lilia-workspace-region--primary"
                data-lilia-surface-mode="translucent" data-lilia-backdrop="none">
                <div class="lilia-workspace-region__content">
                  Primary
                  <div class="lilia-workspace" data-lilia-surface-mode="translucent" data-lilia-backdrop="none">
                    <section class="lilia-workspace-region lilia-workspace-region--primary nested-primary"
                      data-lilia-surface-mode="translucent" data-lilia-backdrop="none"></section>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>`);

  const surfaceState = async () => page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D context unavailable");
    const alpha = (node) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = getComputedStyle(node).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3] / 255;
    };
    const shell = document.querySelector(".lilia-app-shell");
    const workspace = document.querySelector(".lilia-workspace");
    const primary = document.querySelector(".lilia-workspace-region--primary");
    const nestedPrimary = document.querySelector(".nested-primary");
    if (!shell || !workspace || !primary || !nestedPrimary) throw new Error("Main backdrop fixture incomplete");
    const primaryStyle = getComputedStyle(primary);
    const rect = primary.getBoundingClientRect();
    return {
      shellAlpha: alpha(shell),
      workspaceAlpha: alpha(workspace),
      primaryAlpha: alpha(primary),
      nestedPrimaryAlpha: alpha(nestedPrimary),
      radii: [
        primaryStyle.borderTopLeftRadius,
        primaryStyle.borderTopRightRadius,
        primaryStyle.borderBottomRightRadius,
        primaryStyle.borderBottomLeftRadius,
      ].map(Number.parseFloat),
      box: { width: rect.width, height: rect.height },
    };
  });

  const primary = page.locator(".lilia-workspace-region--primary").first();
  await primary.evaluate((node) => { node.dataset.liliaSurfaceMode = "solid"; });
  const unowned = await surfaceState();
  assert(unowned.shellAlpha > 0, "AppShell keeps its tint until the top-level Primary accepts ownership");

  await primary.evaluate((node) => { node.dataset.liliaSurfaceMode = "translucent"; });
  const normal = await surfaceState();
  assert.equal(normal.shellAlpha, 0, "main target leaves the AppShell tint transparent");
  assert.equal(normal.workspaceAlpha, 0, "Workspace does not duplicate the native tint");
  assert(normal.primaryAlpha > 0 && normal.primaryAlpha < 1, "rounded Primary owns one translucent tint");
  assert.equal(normal.nestedPrimaryAlpha, 0, "nested Primary does not duplicate the window tint");
  assert(normal.radii.every((radius) => radius > 0), "desktop Primary keeps all four rounded corners");

  await page.locator("html").evaluate((node) => { node.dataset.liliaReducedTransparency = "true"; });
  const reduced = await surfaceState();
  assert.equal(reduced.primaryAlpha, 1, "reduced transparency restores an opaque Primary fill");
  assert.deepEqual(reduced.radii, normal.radii, "reduced transparency preserves Primary corners");
  assert.deepEqual(reduced.box, normal.box, "reduced transparency preserves Primary geometry");

  await page.locator("html").evaluate((node) => { delete node.dataset.liliaReducedTransparency; });
  await page.emulateMedia({ forcedColors: "active" });
  const forcedColors = await surfaceState();
  assert.equal(forcedColors.primaryAlpha, 1, "forced colors restores an opaque Primary fill");
  assert.equal(forcedColors.workspaceAlpha, 1, "forced colors restores an opaque Workspace fill");
  await page.emulateMedia({ forcedColors: "none" });

  await page.setViewportSize({ width: 760, height: 600 });
  const compact = await surfaceState();
  assert(compact.radii.every((radius) => radius === 0), "compact Primary intentionally removes its corners");
  await page.close();
}

function fixture(layer, css) {
  const items = Array.from({ length: 320 }, (_, index) =>
    `<button class="lilia-interactive-item" data-lilia-interactive data-lilia-selected="${index === 319}" data-agent-id="surface.long.${index}">Item ${index}</button>`,
  ).join("");
  return `<!doctype html>
    <html data-ui-preset="${layer}">
      <head><style>${css}
        body { margin: 0; color: var(--text); background: var(--bg); }
        section { padding: 8px; }
        button { width: 180px; height: 32px; border: 0; color: var(--text); }
        .long-list { max-height: 160px; overflow: auto; }
      </style></head>
      <body>
        <section data-lilia-surface-mode="solid" data-lilia-backdrop="none" data-lilia-surface-boundary>
          <button class="lilia-interactive-item" data-lilia-selected="true" data-agent-id="surface.solid.selected">Solid selected</button>
        </section>
        <section data-lilia-surface-mode="translucent" data-lilia-backdrop="native" data-lilia-surface-boundary>
          <button class="lilia-interactive-item" data-agent-id="surface.translucent.idle">Translucent idle</button>
          <button class="lilia-interactive-item" data-lilia-selected="true" data-agent-id="surface.translucent.selected">Translucent selected</button>
          <div class="long-list">${items}</div>
        </section>
        <section data-lilia-surface-mode="translucent" data-lilia-backdrop="css-blur" data-lilia-surface-boundary data-agent-id="surface.css-blur">
          <div data-lilia-surface-mode="solid" data-lilia-backdrop="none" data-lilia-surface-boundary>Nested boundary</div>
        </section>
      </body>
    </html>`;
}
