<script setup lang="ts">
import { NanaOnboardingLayout } from "@lilia/nana-ui/patterns";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const STORAGE_KEY = "lilia.example.nana.onboarding-step";
const steps = ["选择使用方式", "检查设备", "选择资源", "测试主要能力", "完成"];
const savedStep = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "1", 10);
const currentStep = ref(Number.isInteger(savedStep) && savedStep > 0 ? Math.min(savedStep, steps.length) : 1);
const title = computed(() => steps[currentStep.value - 1]);
const router = useRouter();

function continueSetup() {
  if (currentStep.value < steps.length) {
    currentStep.value += 1;
    localStorage.setItem(STORAGE_KEY, String(currentStep.value));
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  void router.push("/");
}

function skipSetup() {
  localStorage.setItem(STORAGE_KEY, String(currentStep.value));
  void router.push("/");
}
</script>

<template>
  <NanaOnboardingLayout
    :title="title"
    :current-step="currentStep"
    :total-steps="steps.length"
    agent-id="example.page.onboarding"
    @back="currentStep = Math.max(1, currentStep - 1)"
    @continue="continueSetup"
    @skip="skipSetup"
  >
    <p>第 {{ currentStep }} 步可以中断，稍后会从保存的位置继续。</p>
  </NanaOnboardingLayout>
</template>
