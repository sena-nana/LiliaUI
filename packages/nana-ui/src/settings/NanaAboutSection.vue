<script setup lang="ts">
import NanaCard from "../components/NanaCard.vue";
import { useNanaUI } from "../provider/context";
const ui = useNanaUI();
</script>

<template>
  <NanaCard agent-id="settings.page.about">
    <div class="nana-settings-card__header"><h2>关于</h2></div>
    <dl class="nana-about-list">
      <div><dt>名称</dt><dd>{{ ui.metadata.productTitle }}</dd></div>
      <div><dt>版本</dt><dd>{{ ui.metadata.version }}</dd></div>
    </dl>
  </NanaCard>
</template>
