<script setup lang="ts">
import { Button, Card } from "@lilia/nana-ui";
import {
  ContextPanel,
  NanaEditorLayout,
  PersistentStatusBar,
} from "@lilia/nana-ui/patterns";
import { ref } from "vue";

const selected = ref(false);
</script>

<template>
  <NanaEditorLayout
    :context-visible="selected"
    status-visible
    agent-id="example.page.editor"
  >
    <template #top>
      <strong>示例项目</strong>
      <Button variant="secondary" @click="selected = !selected">
        {{ selected ? "取消选择" : "选择对象" }}
      </Button>
    </template>
    <template #objects><Card><h2>场景对象</h2><p>主对象</p></Card></template>
    <template #preview><div class="example-preview">主要预览区域</div></template>
    <template #context>
      <ContextPanel title="对象属性"><p>这里只在选择对象后出现。</p></ContextPanel>
    </template>
    <template #status>
      <PersistentStatusBar label="运行状态">预览待机，可以继续编辑。</PersistentStatusBar>
    </template>
  </NanaEditorLayout>
</template>
