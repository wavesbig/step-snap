import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, overlayStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, Button, CirclePlay } from '@extension/ui';

const SidePanel = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const logo = isLight ? 'side-panel/logo_vertical.svg' : 'side-panel/logo_vertical_dark.svg';

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800', 'p-8')}>
      <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
        <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />

        {/* <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton> */}
      </header>

      <Button variant="default" className="w-full" size="lg" onClick={() => overlayStorage.showThenHide(1000)}>
        <CirclePlay />
        {t('startCapture')}
      </Button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
