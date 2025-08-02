import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, overlayStorage, recordingStorage } from '@extension/storage';
import {
  cn,
  ErrorDisplay,
  LoadingSpinner,
  Button,
  CirclePlay,
  Play,
  Pause,
  EyeOffIcon,
  Trash,
  Check,
} from '@extension/ui';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const { isRecording, isPaused, steps } = useStorage(recordingStorage);
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';

  const handleStartCapture = async () => {
    try {
      // 获取当前活动标签页
      // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // if (tab?.id) {
      //   // 注入录制脚本到当前页面
      //   await chrome.scripting.executeScript({
      //     target: { tabId: tab.id },
      //     files: ['content-ui/recording.iife.js'],
      //   });
      // }

      await overlayStorage.showThenHide(1000);
      await recordingStorage.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleResume = async () => {
    await recordingStorage.resumeRecording();
  };

  const handlePause = async () => {
    await recordingStorage.pauseRecording();
  };

  const handleDelete = async () => {
    await recordingStorage.clearSteps();
    await recordingStorage.stopRecording();
  };

  const handleCompleteCapture = async () => {
    const recordedSteps = await recordingStorage.completeRecording();
    console.log('录制完成，步骤数据：', recordedSteps);
    // 这里可以添加保存或导出录制数据的逻辑
  };

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      {!isRecording ? (
        <div className="p-6">
          <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
            <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />

            {/* <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton> */}
          </header>
          <Button variant="default" className="btn-capture w-full" size="lg" onClick={handleStartCapture}>
            <CirclePlay className="icon-animate" />
            <span>{t('startCapture')}</span>
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-2">
          <div className="flex-1 p-6">
            {/* 显示录制状态 */}
            <div className="rounded-lg bg-gray-100 p-3 text-center dark:bg-gray-700">
              <div className="mb-2 flex items-center justify-center gap-2">
                {isPaused ? (
                  <Pause className="text-orange-500" />
                ) : (
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                )}
                <span className="font-medium">{isPaused ? 'Capture Paused' : 'Recording...'}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{steps.length} steps recorded</div>
            </div>
          </div>

          {/* 操作区域 */}
          <div className="mt-2 border-t-2 border-gray-200 px-6 py-3">
            <div className="grid grid-cols-3 gap-2">
              {isPaused ? (
                <Button variant="outline" onClick={handleResume}>
                  <Play />
                  Resume
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePause}>
                  <Pause />
                  Pause
                </Button>
              )}

              <Button variant="outline">
                <EyeOffIcon />
                Blur
              </Button>

              <Button variant="outline" className="flex-1" size="lg" onClick={handleDelete}>
                <Trash />
                Delete
              </Button>
            </div>

            <Button variant="default" className="mt-1 w-full" size="lg" onClick={handleCompleteCapture}>
              <Check />
              Complete Capture
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
