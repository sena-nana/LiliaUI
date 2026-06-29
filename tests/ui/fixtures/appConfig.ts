import type { LiliaAppConfig } from "@lilia/ui";

export const testAppConfig = {
  appName: "lilia-ui-test",
  productTitle: "Lilia UI Test",
  version: "0.1.0",
  storageKeyPrefix: "lilia-ui-test",
  shell: {
    homeTitle: "测试首页",
    homeDescription: "UI 测试应用已准备就绪。",
    workspaceSectionTitle: "导航",
    statusLabel: "Ready",
    statusTitle: "测试状态正常。点击进入设置。",
    settingsDescription: "偏好设置会保存到本地。",
  },
  sidebar: {
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
    footerStatus: {
      to: "/settings",
      label: "Ready",
      title: "测试状态正常。点击进入设置。",
      tone: "ok",
      icon: "sparkles",
    },
  },
} satisfies LiliaAppConfig;
