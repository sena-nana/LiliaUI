<script setup lang="ts">
import { SegmentedControl, Switch } from "@lilia/nana-ui";
import { AdvancedSettingsDisclosure, ProgressiveSection } from "@lilia/nana-ui/consumer";
import { NanaSettingsLayout } from "@lilia/nana-ui/patterns";
import { ref } from "vue";

const density = ref<"comfortable" | "compact">("comfortable");
const notifications = ref(true);
</script>

<template>
  <NanaSettingsLayout
    title="设置"
    description="按使用目的调整常用选项，高级参数默认收起。"
    agent-id="example.page.settings"
  >
    <ProgressiveSection title="外观" level="essential">
      <SegmentedControl
        v-model="density"
        :options="[
          { value: 'comfortable', label: '舒适' },
          { value: 'compact', label: '紧凑' },
        ]"
      />
    </ProgressiveSection>
    <ProgressiveSection title="通知" level="optional">
      <Switch v-model="notifications" label="任务完成时提醒" />
    </ProgressiveSection>
    <AdvancedSettingsDisclosure>
      <p>高级参数只在用户主动展开后显示。</p>
    </AdvancedSettingsDisclosure>
  </NanaSettingsLayout>
</template>
