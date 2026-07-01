import "@lilia/ui/styles.css";
import { runComponentPerformanceSuite } from "./componentPerformanceRunner";

declare global {
  interface Window {
    __liliaComponentPerfRun: () => Promise<unknown>;
  }
}

window.__liliaComponentPerfRun = () => runComponentPerformanceSuite({
  iterations: 7,
  runner: "browser",
});
