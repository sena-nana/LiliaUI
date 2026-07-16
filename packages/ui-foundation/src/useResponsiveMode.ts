import { onBeforeUnmount, ref, type Ref } from "vue";

export function useResponsiveMode(query = "(max-width: 860px)"): Ref<boolean> {
  const narrow = ref(false);
  if (typeof window === "undefined" || !window.matchMedia) return narrow;
  const media = window.matchMedia(query);
  const update = () => {
    narrow.value = media.matches;
  };
  update();
  media.addEventListener("change", update);
  onBeforeUnmount(() => media.removeEventListener("change", update));
  return narrow;
}
