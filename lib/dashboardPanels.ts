'use client';

// 할 일 패널, 바로가기 다이얼처럼 화면 위에 뜨는 패널은 한 번에 하나만 연다.
// 단축키(숫자 등)가 겹치므로 하나가 열리면 나머지는 닫히게 알린다.
export type DashboardPanel = 'todo' | 'quicklaunch';

const PANEL_OPEN = 'dashboard:panel-open';

export function announcePanelOpen(panel: DashboardPanel) {
  window.dispatchEvent(new CustomEvent<DashboardPanel>(PANEL_OPEN, { detail: panel }));
}

/** 입력칸에 타이핑 중이면 패널 단축키를 무시한다. */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function onOtherPanelOpen(panel: DashboardPanel, close: () => void) {
  const listener = (e: Event) => {
    if ((e as CustomEvent<DashboardPanel>).detail !== panel) close();
  };
  window.addEventListener(PANEL_OPEN, listener);
  return () => window.removeEventListener(PANEL_OPEN, listener);
}
