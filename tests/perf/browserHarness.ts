import "@lilia/ui/styles.css";
import { runComponentPerformanceSuite } from "./componentPerformanceRunner";
import type { ComponentPerfReport } from "./componentPerformanceTypes.ts";

declare global {
  interface Window {
    __liliaComponentPerfRun: () => Promise<ComponentPerfReport>;
  }
}

window.__liliaComponentPerfRun = () => runComponentPerformanceSuite({
  iterations: 7,
  runner: "browser",
});
