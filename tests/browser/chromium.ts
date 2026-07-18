import { existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

export function resolveChromiumExecutable(): string | undefined {
  const bundled = chromium.executablePath();
  if (existsSync(bundled)) return undefined;

  const candidates = [
    process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, "Google/Chrome/Application/chrome.exe") : "",
    process.env["PROGRAMFILES(X86)"] ? join(process.env["PROGRAMFILES(X86)"], "Microsoft/Edge/Application/msedge.exe") : "",
    process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, "Microsoft/Edge/Application/msedge.exe") : "",
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe") : "",
  ];
  const executable = candidates.find((candidate) => candidate && existsSync(candidate));
  if (executable) return executable;

  throw new Error(
    "No Chromium browser is available. Install Playwright Chromium, Google Chrome, or Microsoft Edge.",
  );
}

export function launchChromium() {
  const executablePath = resolveChromiumExecutable();
  return chromium.launch(executablePath ? { executablePath } : undefined);
}
