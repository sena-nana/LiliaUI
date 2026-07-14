import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/vue";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
  if (typeof document !== "undefined") {
    document.documentElement.removeAttribute("data-corners");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-backdrop");
    document.documentElement.removeAttribute("data-platform");
    document.documentElement.style.removeProperty("--app-corner-radius");
    document.documentElement.style.removeProperty("--lilia-backdrop-opacity");
  }
  if (typeof window !== "undefined") {
    delete window.__liliaAgentDebug;
    delete window.__LILIA_NATIVE_PLATFORM__;
  }
});
