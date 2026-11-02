'use client';

// 할 일 패널과 바로가기 다이얼은 동시에 열 수 있다.
// 숫자·Esc처럼 두 패널이 같이 쓰는 키는 "활성 패널"(마지막으로 열었거나 누른 패널)만 처리한다.
export type DashboardPanel = 'todo' | 'quicklaunch';

/** 패널(과 그 여닫기 버튼)에 붙여 두면, 다른 패널이 바깥 클릭으로 닫히지 않는다. */
export const PANEL_ATTR = 'data-dashboard-panel';

let activePanel: DashboardPanel | null = null;

export function activatePanel(panel: DashboardPanel) {
  activePanel = panel;
}

/** 패널이 닫힐 때 호출한다. 남은 패널이 공용 키를 이어받는다. */
export function releasePanel(panel: DashboardPanel) {
  if (activePanel === panel) activePanel = null;
}

export function isActivePanel(panel: DashboardPanel) {
  return activePanel === null || activePanel === panel;
}

/** 대시보드 패널 안을 누른 것인지. 바깥 클릭으로 패널을 닫을 때 다른 패널 안의 클릭은 제외한다. */
export function isInsideDashboardPanel(target: EventTarget | null) {
  return target instanceof Element && target.closest(`[${PANEL_ATTR}]`) !== null;
}

/** 입력칸에 타이핑 중이면 패널 단축키를 무시한다. */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
