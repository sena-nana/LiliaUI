import { defineAsyncComponent, type Component } from "vue";

function lazyWithStyles(styles: () => Promise<unknown>, component: () => Promise<{ default: Component }>) {
  return defineAsyncComponent(async () => {
    await styles();
    return component();
  });
}

const patternStyles = () => import("./styles/patterns.css");
const consumerStyles = () => import("./styles/consumer.css");

export const LazyNanaHomeLayout = lazyWithStyles(patternStyles, () => import("./patterns/NanaHomeLayout.vue"));
export const LazyNanaEditorLayout = lazyWithStyles(patternStyles, () => import("./patterns/NanaEditorLayout.vue"));
export const LazyNanaSettingsLayout = lazyWithStyles(patternStyles, () => import("./patterns/NanaSettingsLayout.vue"));
export const LazyNanaOnboardingLayout = lazyWithStyles(patternStyles, () => import("./patterns/NanaOnboardingLayout.vue"));
export const LazyRecoveryError = lazyWithStyles(consumerStyles, () => import("./consumer/RecoveryError.vue"));
export const LazyCompletionFeedback = lazyWithStyles(consumerStyles, () => import("./consumer/CompletionFeedback.vue"));
export const LazyExpressiveFeatureCard = lazyWithStyles(consumerStyles, () => import("./consumer/ExpressiveFeatureCard.vue"));
