import { useStorage } from './use-storage.js';
import { recordingStorage } from '@extension/storage';
import { snapdom } from '@zumer/snapdom';
import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// 添加 ImageCapture 接口定义
interface ImageCapture {
  grabFrame(): Promise<ImageBitmap>;
  takePhoto(): Promise<Blob>;
}

declare global {
  interface Window {
    ImageCapture?: {
      prototype: ImageCapture;
      new (track: MediaStreamTrack): ImageCapture;
    };
  }
}

/**
 * 录制工具 Hook，用于在 React 组件中管理用户操作录制
 */
export const useRecording = () => {
  const { isRecording, isPaused, steps } = useStorage(recordingStorage);
  const isInitializedRef = useRef(false);
  const observersRef = useRef<MutationObserver[]>([]);

  /**
   * 生成元素选择器
   */
  const generateSelector = useCallback((element: Element): string => {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className
        .split(' ')
        .filter(c => c.trim())
        .join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }

    // 生成基于路径的选择器
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }

      if (current.className) {
        const classes = current.className
          .split(' ')
          .filter(c => c.trim())
          .join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }

      // 添加 nth-child 以确保唯一性
      const siblings = Array.from(current.parentElement?.children || []);
      const index = siblings.indexOf(current) + 1;
      if (siblings.length > 1) {
        selector += `:nth-child(${index})`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }, []);

  /**
   * 捕获元素截图
   */
  const captureElementScreenshot = useCallback(async (element: Element): Promise<string | null> => {
    try {
      // 使用 @zumer/snapdom 库捕获元素截图
      const result = await snapdom(element as HTMLElement, {
        // 配置选项
        backgroundColor: 'transparent', // 透明背景
        scale: window.devicePixelRatio || 1, // 使用设备像素比
        format: 'png', // 输出格式为PNG
      });

      // 返回截图的 data URL
      return result.url;
    } catch (error) {
      console.error('Error capturing element screenshot with snapdom:', error);

      // 备用方法：使用 Canvas API 尝试截图
      try {
        // 简单的 Canvas 截图方法
        const rect = element.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;

        // 设置 canvas 大小
        canvas.width = rect.width;
        canvas.height = rect.height;

        // 尝试绘制元素（仅适用于某些元素类型）
        if (
          element instanceof HTMLImageElement ||
          element instanceof HTMLVideoElement ||
          element instanceof HTMLCanvasElement
        ) {
          context.drawImage(element, 0, 0, rect.width, rect.height);
          return canvas.toDataURL('image/png');
        }
      } catch (e) {
        console.error('Canvas capture not supported:', e);
      }

      // 如果以上方法都失败，返回null
      return null;
    }
  }, []);

  /**
   * 处理点击事件
   */
  const handleClick = useCallback(
    async (event: MouseEvent) => {
      if (!isRecording || isPaused) return;

      const target = event.target as Element;
      const selector = generateSelector(target);

      // 捕获点击区域的截图
      const screenshot = await captureElementScreenshot(target);
      console.log('screenshot', screenshot);

      // 获取元素的样式信息
      const computedStyle = window.getComputedStyle(target);
      const styleInfo = {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontSize: computedStyle.fontSize,
        border: computedStyle.border,
        padding: computedStyle.padding,
        width: computedStyle.width,
        height: computedStyle.height,
      };

      // 获取元素的HTML内容
      const htmlContent = target.outerHTML;
      console.log(htmlContent, 'htmlContent');

      // 生成唯一ID用于缓存
      const screenshotId = screenshot ? `screenshot_${uuidv4()}` : null;

      // 如果有截图，将其存储到扩展存储中
      if (screenshot && screenshotId) {
        try {
          // 使用 Chrome 扩展存储 API 而不是 localStorage
          await chrome.storage.local.set({ [screenshotId]: screenshot });
        } catch (e) {
          console.error('Failed to store screenshot in extension storage:', e);
        }
      }

      await recordingStorage.addStep({
        type: 'click',
        data: {
          // timestamp: Date.now(),
          selector,
          coordinates: { x: event.clientX, y: event.clientY },
          description: `Click on ${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ').join('.') : ''}`,
          screenshotId,
          styleInfo,
          htmlContent,
        },
      });
    },
    [isRecording, isPaused, generateSelector, captureElementScreenshot],
  );

  /**
   * 处理输入事件
   */
  const handleInput = useCallback(
    async (event: Event) => {
      if (!isRecording || isPaused) return;

      const target = event.target as HTMLInputElement;
      const selector = generateSelector(target);

      await recordingStorage.addStep({
        type: 'input',
        data: {
          selector,
          value: target.value,
          description: `Input "${target.value}" into ${target.type || 'text'} field`,
        },
      });
    },
    [isRecording, isPaused, generateSelector],
  );

  /**
   * 处理导航事件
   */
  const handleNavigation = useCallback(async () => {
    if (!isRecording || isPaused) return;

    await recordingStorage.addStep({
      type: 'navigate',
      data: {
        url: window.location.href,
        description: `Navigate to ${window.location.href}`,
      },
    });
  }, [isRecording, isPaused]);

  /**
   * 设置导航监听器
   */
  const setupNavigationListener = useCallback(() => {
    // 监听页面加载
    window.addEventListener('load', handleNavigation);

    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };

    // 监听 popstate
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('load', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      // 恢复原始方法
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [handleNavigation]);

  /**
   * 设置事件监听器
   */
  const setupEventListeners = useCallback(() => {
    // 监听点击事件
    document.addEventListener('click', handleClick, true);

    // 监听输入事件
    document.addEventListener('input', handleInput, true);

    // 设置导航监听器
    const cleanupNavigation = setupNavigationListener();

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleInput, true);

      cleanupNavigation();
    };
  }, [handleClick, handleInput, setupNavigationListener]);

  /**
   * 初始化录制监听器
   */
  const initialize = useCallback(() => {
    if (isInitializedRef.current) return;

    console.log('事件监听');
    isInitializedRef.current = true;
    const cleanup = setupEventListeners();

    return cleanup;
  }, [setupEventListeners]);

  /**
   * 清理监听器
   */
  const cleanup = useCallback(() => {
    if (!isInitializedRef.current) return;

    // 清理观察者
    observersRef.current.forEach(observer => observer.disconnect());
    observersRef.current = [];

    isInitializedRef.current = false;
  }, []);

  /**
   * 添加等待步骤
   */
  const addWaitStep = useCallback(
    async (duration: number, description?: string) => {
      if (!isRecording || isPaused) return;

      await recordingStorage.addStep({
        type: 'wait',
        data: {
          value: duration.toString(),
          description: description || `Wait for ${duration}ms`,
        },
      });
    },
    [isRecording, isPaused],
  );

  /**
   * 录制控制方法
   */
  const startRecording = useCallback(async () => {
    await recordingStorage.startRecording();
  }, []);

  const stopRecording = useCallback(async () => {
    await recordingStorage.stopRecording();
  }, []);

  const pauseRecording = useCallback(async () => {
    await recordingStorage.pauseRecording();
  }, []);

  const resumeRecording = useCallback(async () => {
    await recordingStorage.resumeRecording();
  }, []);

  const clearSteps = useCallback(async () => {
    await recordingStorage.clearSteps();
  }, []);

  const completeRecording = useCallback(async () => await recordingStorage.completeRecording(), []);

  // 当录制状态改变时，自动初始化或清理
  useEffect(() => {
    if (isRecording && !isInitializedRef.current) {
      const cleanupFn = initialize();
      return cleanupFn;
    } else if (!isRecording && isInitializedRef.current) {
      return cleanup();
    }
  }, [isRecording, initialize, cleanup]);

  // 组件卸载时清理
  useEffect(
    () => () => {
      cleanup();
    },
    [cleanup],
  );

  return {
    // 状态
    isRecording,
    isPaused,
    steps,

    // 控制方法
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearSteps,
    completeRecording,

    // 工具方法
    addWaitStep,
    initialize,
    cleanup,
  };
};
