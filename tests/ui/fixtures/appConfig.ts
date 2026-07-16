import type { LiliaUiConfig } from "@lilia/ui/shell";

export const testAppConfig = {
  appName: "lilia-ui-test",
  productTitle: "Lilia UI Test",
  version: "0.1.0",
  storageKeyPrefix: "lilia-ui-test",
  sidebar: {
    navTitle: "导航",
    nav: [
      {
        key: "overview",
        to: "/",
        label: "首页",
        icon: "home",
      },
      {
        key: "components",
        to: "/components",
        label: "组件",
        icon: "puzzle",
      },
    ],
    footerLinks: [{ key: "settings", to: "/settings", label: "设置", icon: "settings" }],
    footerStatuses: [{
      key: "ready",
      to: "/settings",
      label: "Ready",
      title: "测试状态正常。点击进入设置。",
      tone: "ok",
      icon: "sparkles",
    }],
  },
} satisfies LiliaUiConfig;
