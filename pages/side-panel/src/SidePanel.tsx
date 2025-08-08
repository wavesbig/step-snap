import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { useStorage, useRecording, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, overlayStorage, recordingStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, Button, CirclePlay, RecordingSteps } from '@extension/ui';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const {
    isRecording,
    isPaused,
    steps,
    startRecording,
    pauseRecording,
    resumeRecording,
    clearSteps,
    stopRecording,
    completeRecording,
  } = useRecording({ disableEventListeners: true });
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
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleResume = async () => {
    await resumeRecording();
  };

  const handlePause = async () => {
    await pauseRecording();
  };

  const handleDelete = async () => {
    await clearSteps();
    await stopRecording();
  };

  const handleDeleteStep = async (stepId: string) => {
    await recordingStorage.deleteStep(stepId);
  };

  const handleCompleteCapture = async () => {
    const recordedSteps = await completeRecording();
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
        <RecordingSteps
          steps={steps}
          isRecording={isRecording}
          isPaused={isPaused}
          onPause={handlePause}
          onResume={handleResume}
          onBlur={() => console.log('模糊功能待实现')}
          onDelete={handleDelete}
          onDeleteStep={handleDeleteStep}
          onComplete={handleCompleteCapture}
        />
      )}
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
