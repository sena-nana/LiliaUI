import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("./pages/HomePage.vue"),
  },
  {
    path: "/editor",
    name: "editor",
    component: () => import("./pages/EditorPage.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("./pages/SettingsPage.vue"),
  },
  {
    path: "/onboarding",
    name: "onboarding",
    component: () => import("./pages/OnboardingPage.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
