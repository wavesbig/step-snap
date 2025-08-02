import { recordingStorage } from './recording-storage.js';
// import type { RecordingStep } from './recording-storage.js';

/**
 * 录制工具函数，用于在内容脚本中记录用户操作
 */
export class RecordingUtils {
  private static isInitialized = false;
  private static observers: MutationObserver[] = [];

  /**
   * 初始化录制监听器
   */
  static async initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private static setupEventListeners() {
    // 监听点击事件
    document.addEventListener('click', this.handleClick.bind(this), true);

    // 监听输入事件
    document.addEventListener('input', this.handleInput.bind(this), true);

    // 监听导航事件
    this.setupNavigationListener();

    // 监听滚动事件
    document.addEventListener('scroll', this.handleScroll.bind(this), true);
  }

  /**
   * 处理点击事件
   */
  private static async handleClick(event: MouseEvent) {
    const status = await recordingStorage.getRecordingStatus();
    if (!status.isRecording || status.isPaused) return;

    const target = event.target as Element;
    const selector = this.generateSelector(target);

    await recordingStorage.addStep({
      type: 'click',
      data: {
        selector,
        coordinates: { x: event.clientX, y: event.clientY },
        description: `Click on ${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ').join('.') : ''}`,
      },
    });
  }

  /**
   * 处理输入事件
   */
  private static async handleInput(event: Event) {
    const status = await recordingStorage.getRecordingStatus();
    if (!status.isRecording || status.isPaused) return;

    const target = event.target as HTMLInputElement;
    const selector = this.generateSelector(target);

    await recordingStorage.addStep({
      type: 'input',
      data: {
        selector,
        value: target.value,
        description: `Input "${target.value}" into ${target.type || 'text'} field`,
      },
    });
  }

  /**
   * 处理滚动事件
   */
  private static async handleScroll(event: Event) {
    const status = await recordingStorage.getRecordingStatus();
    if (!status.isRecording || status.isPaused) return;

    const target = event.target as Document | HTMLElement;
    const scrollTop = target === document ? window.pageYOffset : (target as HTMLElement).scrollTop;
    const scrollLeft = target === document ? window.pageXOffset : (target as HTMLElement).scrollLeft;

    // 防抖处理，避免过多的滚动事件
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(async () => {
      await recordingStorage.addStep({
        type: 'scroll',
        data: {
          selector: target === document ? 'window' : this.generateSelector(target as HTMLElement),
          coordinates: { x: scrollLeft, y: scrollTop },
          description: `Scroll to position (${scrollLeft}, ${scrollTop})`,
        },
      });
    }, 300);
  }

  private static scrollTimeout: NodeJS.Timeout;

  /**
   * 设置导航监听器
   */
  private static setupNavigationListener() {
    // 监听页面加载
    window.addEventListener('load', this.handleNavigation.bind(this));

    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      RecordingUtils.handleNavigation();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      RecordingUtils.handleNavigation();
    };

    // 监听 popstate
    window.addEventListener('popstate', this.handleNavigation.bind(this));
  }

  /**
   * 处理导航事件
   */
  private static async handleNavigation() {
    const status = await recordingStorage.getRecordingStatus();
    if (!status.isRecording || status.isPaused) return;

    await recordingStorage.addStep({
      type: 'navigate',
      data: {
        url: window.location.href,
        description: `Navigate to ${window.location.href}`,
      },
    });
  }

  /**
   * 生成元素选择器
   */
  private static generateSelector(element: Element): string {
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
  }

  /**
   * 添加等待步骤
   */
  static async addWaitStep(duration: number, description?: string) {
    const status = await recordingStorage.getRecordingStatus();
    if (!status.isRecording || status.isPaused) return;

    await recordingStorage.addStep({
      type: 'wait',
      data: {
        value: duration.toString(),
        description: description || `Wait for ${duration}ms`,
      },
    });
  }

  /**
   * 清理监听器
   */
  static cleanup() {
    if (!this.isInitialized) return;

    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('input', this.handleInput.bind(this), true);
    document.removeEventListener('scroll', this.handleScroll.bind(this), true);
    window.removeEventListener('load', this.handleNavigation.bind(this));
    window.removeEventListener('popstate', this.handleNavigation.bind(this));

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}
