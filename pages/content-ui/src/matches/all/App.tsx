// import { t } from '@extension/i18n';
import { Button } from '@extension/ui';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('[CEB] Content ui all loaded');
  }, []);

  return (
    <div>
      {/* <div className="fixed inset-0 bottom-0 left-0 right-0 top-0 z-50 bg-black/50"></div> */}

      <Button variant="default" className="w-full" size="lg">
        1231
      </Button>
    </div>
  );
}
