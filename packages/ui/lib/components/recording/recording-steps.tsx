import { cn } from '../../utils';
import { Button } from '../ui/button';
import { t } from '@extension/i18n';
import { Pause, Play, Trash, EyeOff, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface RecordingStep {
  id: string;
  type: 'navigate' | 'click' | 'input' | 'wait';
  timestamp: number;
  data: {
    url?: string;
    selector?: string;
    value?: string;
    coordinates?: { x: number; y: number };
    screenshotId?: string | null;
    styleInfo?: {
      backgroundColor?: string;
      color?: string;
      fontSize?: string;
      border?: string;
      padding?: string;
      width?: string;
      height?: string;
    };
    htmlContent?: string;
  };
}

export interface RecordingStepsProps {
  steps: RecordingStep[];
  isRecording: boolean;
  isPaused: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onBlur?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * 录制步骤组件
 * 用于展示录制的步骤列表和控制按钮
 */
export const RecordingSteps = ({
  steps,
  // isRecording,
  isPaused,
  onPause,
  onResume,
  onBlur,
  onDelete,
  onComplete,
  className,
}: RecordingStepsProps) => {
  // 用于存储从localStorage加载的截图
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});

  // 从Chrome扩展存储中加载截图
  useEffect(() => {
    console.log(steps, 'steps');
    const loadScreenshots = async () => {
      const loadedScreenshots: Record<string, string> = {};
      const screenshotIds = steps.filter(step => step.data.screenshotId).map(step => step.data.screenshotId as string);

      if (screenshotIds.length > 0) {
        try {
          // 使用Chrome扩展存储API获取所有截图
          const result = await chrome.storage.local.get(screenshotIds);

          // 将获取的截图添加到状态中
          Object.keys(result).forEach(id => {
            loadedScreenshots[id] = result[id];
          });

          setScreenshots(loadedScreenshots);
        } catch (e) {
          console.error('Failed to load screenshots from extension storage:', e);
        }
      }
    };

    loadScreenshots();
  }, [steps]);

  // 格式化时间戳为可读格式
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  // 获取步骤类型的中文描述
  const getStepTypeText = (type: RecordingStep['type']): string => {
    const typeMap: Record<RecordingStep['type'], string> = {
      navigate: '导航',
      click: '点击',
      input: '输入',
      wait: '等待',
    };
    return typeMap[type] || type;
  };

  // 获取步骤图标
  // const getStepIcon = (step: RecordingStep): React.ReactNode => {
  //   // 这里可以根据步骤类型返回不同的图标
  //   // 简单实现，实际项目中可以使用更丰富的图标
  //   return <div className="h-2 w-2 rounded-full bg-blue-500"></div>;
  // };

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* 录制记录显示 */}
      <div className="flex-1 overflow-y-auto p-6">
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

        {/* 步骤列表 - 参考图片中的UI设计 */}
        <div className="mt-4 max-h-[calc(100%-80px)]">
          {steps.map((step, index) => (
            <div key={step.id} className="relative mb-4">
              {/* 步骤编号 */}
              <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <span className="text-sm font-medium">{index + 1}</span>
              </div>

              {/* 步骤内容 */}
              <div className="ml-12 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium">{getStepTypeText(step.type)}</span>
                    {step.type === 'click' && step.data.htmlContent && (
                      <span className="ml-2 text-sm text-gray-500">"{step.data.htmlContent}"</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <button className="mr-2 text-gray-400 hover:text-gray-600">
                      <EyeOff className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-500">
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 显示点击区域截图 */}
                {step.type === 'click' && step.data.screenshotId && screenshots[step.data.screenshotId] && (
                  <div className="mt-3 rounded border border-gray-200 p-2">
                    <div className="mb-1 text-xs font-medium text-gray-500">点击区域截图：</div>
                    <div className="relative">
                      <img
                        src={screenshots[step.data.screenshotId]}
                        alt="点击区域截图"
                        className="max-h-40 w-auto rounded border border-gray-200"
                      />
                      {step.data.coordinates && (
                        <div
                          className="absolute h-6 w-6 animate-pulse rounded-full border-2 border-red-500"
                          style={{
                            left: `calc(${step.data.coordinates.x}px - 12px)`,
                            top: `calc(${step.data.coordinates.y}px - 12px)`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 如果是表格类型的步骤，显示表格 */}
                {step.type === 'click' && step.data.url && (
                  <div className="mt-2 overflow-x-auto rounded border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">URL</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm">{step.data.url}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 时间戳 */}
                <div className="mt-2 text-right">
                  <span className="text-xs text-gray-500">{formatTimestamp(step.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* 如果没有步骤，显示空状态 */}
          {steps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-gray-100 p-3">
                <Play className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mt-2 text-sm text-gray-500">开始录制后，您的操作步骤将显示在这里</p>
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮区域  */}
      <div className="mt-2 border-t border-gray-200 px-6 py-3">
        <div className="grid grid-cols-3 gap-2">
          {isPaused ? (
            <Button variant="outline" onClick={onResume} className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              <span>{t('resumeCapture')}</span>
            </Button>
          ) : (
            <Button variant="outline" onClick={onPause} className="flex items-center justify-center gap-2">
              <Pause className="h-4 w-4" />
              <span>{t('pauseCapture')}</span>
            </Button>
          )}

          <Button variant="outline" onClick={onBlur} className="flex items-center justify-center gap-2">
            <EyeOff className="h-4 w-4" />
            <span>{t('blur')}</span>
            {/* 图片中显示了PRO标签 */}
            <span className="ml-1 rounded bg-purple-500 px-1 text-xs text-white">PRO</span>
          </Button>

          <Button variant="outline" onClick={onDelete} className="flex items-center justify-center gap-2">
            <Trash className="h-4 w-4" />
            <span>{t('delete')}</span>
          </Button>
        </div>

        <Button variant="default" className="mt-2 w-full" size="lg" onClick={onComplete}>
          <Check className="mr-2 h-4 w-4" />
          <span>{t('completeCapture')}</span>
        </Button>
      </div>
    </div>
  );
};
