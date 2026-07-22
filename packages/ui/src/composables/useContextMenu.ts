import { reactive, type Component } from "vue";
import { createAnchoredMenuPosition } from "./menuMotion";

export interface ContextMenuItem {
  id?: string;
  label: string;
  icon?: Component;
  disabled?: boolean;
  danger?: boolean;
  confirmLabel?: string;
  children?: ContextMenuItem[];
  /** Extra tokens included when filtering searchable menus (e.g. ids, aliases). */
  keywords?: string[];
  onSelect?: () => void | Promise<void>;
}

export interface ContextMenuOptions {
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}

export interface ContextMenuContent extends ContextMenuOptions {
  items: ContextMenuItem[];
}

export type ContextMenuProvider = (
  event: MouseEvent,
) => ContextMenuContent | ContextMenuItem[] | null | undefined;

interface MenuState {
  open: boolean;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  items: ContextMenuItem[];
  pendingConfirmId: string | null;
  openSeq: number;
  searchable: boolean;
  searchPlaceholder: string;
  emptyText: string;
}

type ContextMenuStore = {
  state: MenuState;
  providers: WeakMap<Element, ContextMenuProvider>;
  installed: boolean;
  removeGlobalListeners: (() => void) | null;
  removeOpenListeners: (() => void) | null;
};

declare global {
  var __liliaUiContextMenuStore: ContextMenuStore | undefined;
}

const DEFAULT_SEARCH_PLACEHOLDER = "搜索";
const DEFAULT_EMPTY_TEXT = "没有匹配项";

const store = globalThis.__liliaUiContextMenuStore ??= {
  state: reactive<MenuState>({
    open: false,
    x: 0,
    y: 0,
    anchorX: 0,
    anchorY: 0,
    items: [],
    pendingConfirmId: null,
    openSeq: 0,
    searchable: false,
    searchPlaceholder: DEFAULT_SEARCH_PLACEHOLDER,
    emptyText: DEFAULT_EMPTY_TEXT,
  }),
  providers: new WeakMap<Element, ContextMenuProvider>(),
  installed: false,
  removeGlobalListeners: null,
  removeOpenListeners: null,
} satisfies ContextMenuStore;
const { state, providers } = store;

export function registerContextMenu(
  element: Element,
  provider: ContextMenuProvider,
) {
  providers.set(element, provider);
  return () => providers.delete(element);
}

function itemKey(item: ContextMenuItem): string {
  return item.id ?? item.label;
}

function normalizeContent(
  content: ContextMenuContent | ContextMenuItem[] | null | undefined,
): ContextMenuContent | null {
  if (!content) return null;
  if (Array.isArray(content)) {
    return content.length ? { items: content } : null;
  }
  return content.items.length ? content : null;
}

function collectContentFor(event: MouseEvent): ContextMenuContent | null {
  let node = event.target as Element | null;
  while (node) {
    const provider = providers.get(node);
    const content = normalizeContent(provider?.(event));
    if (content) return content;
    node = node.parentElement;
  }
  return null;
}

function openMenu(x: number, y: number, content: ContextMenuContent) {
  const position = createAnchoredMenuPosition(x, y);
  state.items = content.items;
  state.x = position.x;
  state.y = position.y;
  state.anchorX = position.anchorX;
  state.anchorY = position.anchorY;
  state.open = content.items.length > 0;
  state.pendingConfirmId = null;
  state.searchable = Boolean(content.searchable);
  state.searchPlaceholder = content.searchPlaceholder ?? DEFAULT_SEARCH_PLACEHOLDER;
  state.emptyText = content.emptyText ?? DEFAULT_EMPTY_TEXT;
  state.openSeq += 1;
  if (state.open) attachOpenListeners();
}

export function openContextMenuAt(
  x: number,
  y: number,
  items: ContextMenuItem[],
  options?: ContextMenuOptions,
) {
  const content = normalizeContent({ items, ...options });
  if (!content) return;
  openMenu(x, y, content);
}

export function closeContextMenu() {
  if (!state.open) return;
  state.open = false;
  detachOpenListeners();
}

export function finalizeClosedContextMenu() {
  if (state.open) return;
  state.items = [];
  state.pendingConfirmId = null;
  state.searchable = false;
}

export function isContextMenuItemPending(item: ContextMenuItem): boolean {
  if (!item.confirmLabel) return false;
  return state.pendingConfirmId === itemKey(item);
}

export async function selectContextMenuItem(item: ContextMenuItem) {
  if (item.disabled) return;
  if (item.children?.length) {
    state.items = item.children;
    state.pendingConfirmId = null;
    state.openSeq += 1;
    return;
  }
  const key = itemKey(item);
  if (item.confirmLabel && state.pendingConfirmId !== key) {
    state.pendingConfirmId = key;
    return;
  }
  closeContextMenu();
  await item.onSelect?.();
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as Element | null;
  if (target?.closest?.(".ctx-menu")) return;
  closeContextMenu();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  closeContextMenu();
  event.stopPropagation();
}

function onScroll() {
  closeContextMenu();
}

function detachOpenListeners() {
  store.removeOpenListeners?.();
  store.removeOpenListeners = null;
}

function attachOpenListeners() {
  if (store.removeOpenListeners || typeof window === "undefined") return;
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("blur", closeContextMenu);
  store.removeOpenListeners = () => {
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("keydown", onKeydown);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", closeContextMenu);
    window.removeEventListener("blur", closeContextMenu);
  };
}

export function installContextMenu() {
  if (store.installed || typeof window === "undefined" || typeof document === "undefined") return uninstallContextMenu;
  store.installed = true;

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    const content = collectContentFor(event);
    if (content) openMenu(event.clientX, event.clientY, content);
    else closeContextMenu();
  };

  document.addEventListener("contextmenu", onContextMenu);
  store.removeGlobalListeners = () => {
    document.removeEventListener("contextmenu", onContextMenu);
  };

  return uninstallContextMenu;
}

export function uninstallContextMenu() {
  if (!store.installed || typeof window === "undefined") return;
  store.installed = false;
  store.removeGlobalListeners?.();
  store.removeGlobalListeners = null;
  detachOpenListeners();
  closeContextMenu();
  finalizeClosedContextMenu();
}

export function useContextMenu() {
  return {
    state,
    close: closeContextMenu,
    finalizeClose: finalizeClosedContextMenu,
    select: selectContextMenuItem,
  };
}
