import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

const storage = createStorage<OverlayStateType>(
  'overlay-storage-key',
  {
    isVisible: false,
  },
  {
    storageEnum: StorageEnum.Session,
    liveUpdate: true,
    sessionAccessForContentScripts: true,
  },
);

export interface OverlayStateType {
  isVisible: boolean;
}

export const overlayStorage: BaseStorageType<OverlayStateType> & {
  show: () => Promise<void>;
  hide: () => Promise<void>;
  showThenHide: (delayMs: number) => Promise<void>;
} = {
  ...storage,
  show: async () => {
    await storage.set({ isVisible: true });
  },
  hide: async () => {
    await storage.set({ isVisible: false });
  },
  showThenHide: async (delayMs: number = 1000) => {
    await storage.set({ isVisible: true });
    setTimeout(async () => {
      await storage.set({ isVisible: false });
    }, delayMs);
  },
};
