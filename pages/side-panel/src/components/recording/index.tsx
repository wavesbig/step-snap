import { useStorage } from '@extension/shared';
import { recordingStorage } from '@extension/storage';
import { useEffect } from 'react';

export default function RecordingApp() {
  const { isRecording, isPaused, steps } = useStorage(recordingStorage);

  // 监听录制状态变化
  useEffect(() => {
    if (isRecording) {
      console.log('[Recording] Started recording');
      // 记录页面导航步骤
      recordingStorage.addStep({
        type: 'navigate',
        data: {
          url: window.location.href,
        },
      });
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

  if (!isRecording) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        {/* 录制状态指示器 */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <div className="h-3 w-3 rounded-full bg-orange-500" />
          ) : (
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isPaused ? 'Paused' : 'Recording'}
          </span>
        </div>

        {/* 步骤计数 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">{steps.length} steps</div>
      </div>

      {/* 最新步骤预览 */}
      {steps.length > 0 && (
        <div className="mt-2 max-w-xs truncate text-xs text-gray-600 dark:text-gray-400">
          Latest: {steps[steps.length - 1].data.description}
        </div>
      )}
    </div>
  );
}
