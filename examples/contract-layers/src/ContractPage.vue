<script setup lang="ts">
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Drawer,
  FormField,
  IconButton,
  Input,
  InteractiveCard,
  ListItem,
  Popover,
  Progress,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  StatusBadge,
  Switch,
  Tabs,
  Textarea,
  Toast,
  Tooltip,
  ValidationMessage,
} from "#ui-layer";
import { defineComponent, h, ref } from "vue";

const dialogOpen = ref(false);
const drawerOpen = ref(false);
const popoverOpen = ref(false);
const enabled = ref(true);
const name = ref("Contract fixture");
const notes = ref("两层共享相同的 textarea Contract。");
const mode = ref<string | number>(1);
const volume = ref(40);
const activeView = ref<string | number>("editor");
const SimpleIcon = defineComponent(() => () => h("span", { "aria-hidden": "true" }, "◆"));
const options = [
  { value: 1, label: "标准" },
  { value: "advanced", label: "高级" },
] as const;
const views = [
  { value: "editor", label: "编辑" },
  { value: 2, label: "预览" },
] as const;
</script>

<template>
  <main>
    <Card variant="outlined" agent-id="contract.card">
      <StatusBadge label="Contract ready" tone="success" />
      <FormField label="名称" hint="两层使用相同的字段调用方式。">
        <template #default="field">
          <Input
            v-model="name"
            :aria-describedby="field.describedBy"
            :invalid="field.invalid"
            :name="field.controlId"
          />
        </template>
      </FormField>
      <Textarea v-model="notes" aria-label="备注" />
      <Select v-model="mode" :options="options" aria-label="模式" />
      <Checkbox v-model="enabled" label="启用共享能力" />
      <Switch v-model="enabled" label="实时同步" />
      <Slider v-model="volume" aria-label="音量" />
      <ValidationMessage message="共享校验语义" intent="warning" />
      <Tabs v-model="activeView" :options="views" aria-label="工作视图" />
      <SegmentedControl v-model="activeView" :options="views" aria-label="视图模式" />
      <Progress label="共享进度" :value="60" cancellable />
      <Skeleton label="正在载入共享内容" width="9rem" />
      <Toast title="Contract 已同步" tone="success" dismissible />
      <InteractiveCard selected>可选择的共享卡片</InteractiveCard>
      <ListItem selected>共享列表项</ListItem>
      <Tooltip text="共享提示">
        <template #trigger="{ describedBy }">
          <button type="button" :aria-describedby="describedBy">查看提示</button>
        </template>
      </Tooltip>
      <Popover v-model:open="popoverOpen" aria-label="共享弹出层">
        <template #trigger><button type="button">打开弹出层</button></template>
        <p>共享弹出内容</p>
      </Popover>
      <IconButton :icon="SimpleIcon" label="共享图标按钮" />
      <Button variant="primary" @click="dialogOpen = true">继续</Button>
      <Button variant="secondary" @click="drawerOpen = true">打开抽屉</Button>
    </Card>
    <Dialog
      :open="dialogOpen"
      title="共享 Contract"
      description="同一页面可以由 LiliaUI 或 NanaUI 编译。"
      @close="dialogOpen = false"
    >
      <p>{{ name }}：{{ enabled ? "已启用" : "未启用" }}</p>
    </Dialog>
    <Drawer
      :open="drawerOpen"
      title="共享 Drawer"
      @close="drawerOpen = false"
      @update:open="drawerOpen = $event"
    >
      <p>{{ notes }}</p>
    </Drawer>
  </main>
</template>
