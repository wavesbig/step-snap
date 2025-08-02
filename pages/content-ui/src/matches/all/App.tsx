import { t } from '@extension/i18n';
import { useRecording, useStorage } from '@extension/shared';
import { overlayStorage } from '@extension/storage';
import { useEffect } from 'react';

export default function App() {
  const { isVisible } = useStorage(overlayStorage);

  useEffect(() => {
    console.log('[CEB] Content ui all loaded 111');
  }, []);

  const { isRecording, isPaused, steps } = useRecording();

  useEffect(() => {
    console.log('[Recording] Content UI loaded');
  }, []);

  // 监听录制状态变化
  useEffect(() => {
    if (isRecording) {
      console.log('[Recording] Started recording');
    } else {
      console.log('[Recording] Stopped recording');
    }
  }, [isRecording]);

  // 监听暂停状态变化
  useEffect(() => {
    if (isRecording) {
      console.log(`[Recording] ${isPaused ? 'Paused' : 'Resumed'} recording`);
    }
  }, [isPaused, isRecording]);

  // 监听步骤变化
  useEffect(() => {
    if (steps.length > 0) {
      console.log(`[Recording] Total steps: ${steps.length}`);
      console.log('[Recording] Latest step:', steps[steps.length - 1]);
    }
  }, [steps]);

  return (
    <div>
      {isVisible && (
        <div className="fixed inset-0 bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/50 text-3xl text-white">
          {t('nowCapturingYourBrowser')}
        </div>
      )}
    </div>
  );
}
