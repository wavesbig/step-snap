import { t } from '@extension/i18n';
import { useStorage } from '@extension/shared';
import { overlayStorage } from '@extension/storage';
import { useEffect } from 'react';

export default function App() {
  const { isVisible } = useStorage(overlayStorage);

  console.log('🚀 ~ App ~ isVisible:', isVisible);

  useEffect(() => {
    console.log('[CEB] Content ui all loaded 111');
  }, []);

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
