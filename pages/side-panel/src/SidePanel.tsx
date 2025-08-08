import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { useStorage, useRecording, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, overlayStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, Button, CirclePlay, RecordingSteps } from '@extension/ui';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const { isRecording, startRecording } = useRecording({ disableEventListeners: true });

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
        <RecordingSteps onBlur={() => console.log('模糊功能待实现')} />
      )}
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
