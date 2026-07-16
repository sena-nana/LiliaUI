<script setup lang="ts">
import { Button, Card, StatusBadge } from "@lilia/nana-ui";
import { NanaHomeLayout, PrimaryActionArea } from "@lilia/nana-ui/patterns";
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <NanaHomeLayout
    title="开始今天的任务"
    description="从最近项目继续，或创建一个新的工作空间。"
    agent-id="example.page.home"
  >
    <template #status><StatusBadge label="设备就绪" tone="success" /></template>
    <template #primary-action>
      <PrimaryActionArea>
        <Button variant="primary" @click="router.push('/editor')">创建项目</Button>
      </PrimaryActionArea>
    </template>
    <template #recent><Card><h2>最近项目</h2><p>还没有最近项目。</p></Card></template>
    <template #device><Card><h2>当前设备</h2><p>默认输入设备连接正常。</p></Card></template>
    <template #next-step><Card><h2>推荐下一步</h2><p>完成首次启动检查。</p></Card></template>
    <template #history><Card><h2>最近记录</h2><p>操作记录会显示在这里。</p></Card></template>
  </NanaHomeLayout>
</template>
