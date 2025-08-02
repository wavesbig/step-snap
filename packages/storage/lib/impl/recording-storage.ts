import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

const storage = createStorage<RecordingStateType>(
  'recording-storage-key',
  {
    isRecording: false,
    isPaused: false,
    steps: [],
    startTime: null,
    currentStepId: null,
    sessionId: null,
  },
  {
    storageEnum: StorageEnum.Session,
    liveUpdate: true,
    sessionAccessForContentScripts: true,
  },
);

export const recordingStorage: BaseStorageType<RecordingStateType> & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  addStep: (step: Omit<RecordingStep, 'id' | 'timestamp'>) => Promise<void>;
  deleteStep: (stepId: string) => Promise<void>;
  clearSteps: () => Promise<void>;
  completeRecording: () => Promise<RecordingStep[]>;
  getRecordingStatus: () => Promise<{ isRecording: boolean; isPaused: boolean; stepCount: number }>;
} = {
  ...storage,

  startRecording: async () => {
    const sessionId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await storage.set({
      isRecording: true,
      isPaused: false,
      steps: [],
      startTime: Date.now(),
      currentStepId: null,
      sessionId,
    });
  },

  stopRecording: async () => {
    await storage.set({
      isRecording: false,
      isPaused: false,
      startTime: null,
      currentStepId: null,
      sessionId: null,
      steps: [],
    });
  },

  pauseRecording: async () => {
    const currentState = await storage.get();
    if (currentState.isRecording) {
      await storage.set({ ...currentState, isPaused: true });
    }
  },

  resumeRecording: async () => {
    const currentState = await storage.get();
    if (currentState.isRecording) {
      await storage.set({ ...currentState, isPaused: false });
    }
  },

  addStep: async stepData => {
    const currentState = await storage.get();
    if (currentState.isRecording && !currentState.isPaused) {
      const newStep: RecordingStep = {
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...stepData,
      };

      await storage.set({
        ...currentState,
        steps: [...currentState.steps, newStep],
        currentStepId: newStep.id,
      });
    }
  },

  deleteStep: async stepId => {
    const currentState = await storage.get();
    const updatedSteps = currentState.steps.filter(step => step.id !== stepId);
    await storage.set({
      ...currentState,
      steps: updatedSteps,
    });
  },

  clearSteps: async () => {
    const currentState = await storage.get();
    await storage.set({
      ...currentState,
      steps: [],
      currentStepId: null,
    });
  },

  completeRecording: async () => {
    const currentState = await storage.get();
    const steps = currentState.steps;

    // 停止录制并清理状态
    await storage.set({
      isRecording: false,
      isPaused: false,
      steps: [],
      startTime: null,
      currentStepId: null,
      sessionId: null,
    });

    return steps;
  },

  getRecordingStatus: async () => {
    const currentState = await storage.get();
    return {
      isRecording: currentState.isRecording,
      isPaused: currentState.isPaused,
      stepCount: currentState.steps.length,
    };
  },
};

export interface RecordingStep {
  id: string;
  type: 'navigate' | 'click' | 'input' | 'scroll' | 'wait';
  timestamp: number;
  data: {
    url?: string;
    selector?: string;
    value?: string;
    coordinates?: { x: number; y: number };
    description?: string;
  };
}

export interface RecordingStateType {
  isRecording: boolean;
  isPaused: boolean;
  steps: RecordingStep[];
  startTime: number | null;
  currentStepId: string | null;
  sessionId: string | null;
}
