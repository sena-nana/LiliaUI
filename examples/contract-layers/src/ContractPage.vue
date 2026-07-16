<script setup lang="ts">
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  FormField,
  Input,
  StatusBadge,
} from "#ui-layer";
import { ref } from "vue";

const dialogOpen = ref(false);
const enabled = ref(true);
const name = ref("Contract fixture");
</script>

<template>
  <main>
    <Card variant="outlined" agent-id="contract.card">
      <StatusBadge label="Contract ready" tone="success" />
      <FormField label="名称" hint="两层使用相同的字段调用方式。">
        <Input v-model="name" />
      </FormField>
      <Checkbox v-model="enabled" label="启用共享能力" />
      <Button variant="primary" @click="dialogOpen = true">继续</Button>
    </Card>
    <Dialog
      :open="dialogOpen"
      title="共享 Contract"
      description="同一页面可以由 LiliaUI 或 NanaUI 编译。"
      @close="dialogOpen = false"
    >
      <p>{{ name }}：{{ enabled ? "已启用" : "未启用" }}</p>
    </Dialog>
  </main>
</template>
