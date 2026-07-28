import { reactive } from "vue";

export const APP_METADATA = reactive({
  appName: "lilia-app",
  productTitle: "Lilia App",
  version: "0.1.0",
  storageKeyPrefix: "lilia-app",
});

export function syncAppMetadata(config: {
  appName: string;
  productTitle: string;
  version: string;
  storageKeyPrefix: string;
}) {
  APP_METADATA.appName = config.appName;
  APP_METADATA.productTitle = config.productTitle;
  APP_METADATA.version = config.version;
  APP_METADATA.storageKeyPrefix = config.storageKeyPrefix;
}
