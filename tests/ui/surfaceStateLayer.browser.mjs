import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const layerStyles = [
  ["lilia", "packages/ui/src/styles/tokens.css", "packages/ui/src/styles/state-layer.css"],
  ["nana", "packages/nana-ui/src/styles/tokens.css", "packages/nana-ui/src/styles/state-layer.css"],
];

const browser = await chromium.launch();
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
    assert.notEqual(initial.selectedShadow, "none", `${layer}: selection has an independent indicator`);
    assert.notEqual(initial.solidShadow, "none", `${layer}: solid selection has an independent indicator`);

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

  console.log("Surface state-layer browser checks passed.");
} finally {
  await browser.close();
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
