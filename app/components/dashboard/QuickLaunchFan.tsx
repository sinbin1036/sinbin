'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import QuickLinkFormModal from '@/app/components/QuickLinkFormModal';
import {
  activatePanel,
  isActivePanel,
  isInsideDashboardPanel,
  isTypingTarget,
  releasePanel,
} from '@/lib/dashboardPanels';
import {
  deleteQuickLink,
  getQuickLinks,
  onQuickLinksChanged,
  QUICK_LINK_CATEGORIES,
  QuickLink,
  QuickLinkCategory,
  recordQuickLinkClick,
  toFaviconUrl,
  updateQuickLink,
  updateQuickLinkOrder,
} from '@/lib/quickLinks';

type Status = 'loading' | 'ready' | 'error';

// 꾹 눌러 집은 아이콘. 화면을 따라다니는 복제본 위치는 상자 왼쪽 위 기준이다.
type Drag = {
  link: QuickLink;
  left: number;
  top: number;
  originLeft: number;
  originTop: number;
  grabX: number;
  grabY: number;
  tilt: number;
  phase: 'lift' | 'held' | 'drop' | 'return';
  /** 놓으면 옮겨 갈 카테고리 */
  target: QuickLinkCategory | null;
  /** 놓으면 이 링크 자리로 순서를 옮긴다 */
  slotTarget: string | null;
  /** drop 단계에서 복제본이 날아갈 위치 */
  dropAt: { left: number; top: number } | null;
};

// 바깥 링(다이얼)은 [+, 링크1, 링크2, ...]를 원형 연결 리스트처럼 이어서 끝없이 돈다.
const STEP = 30; // 링크 사이 각도(°)
const FADE_START = 62; // 이 각도를 넘으면 흐려지기 시작
const FADE_END = 82; // 이 각도에서 완전히 사라짐
const HOME_ROT = 2 * STEP; // + 가 맨 위(−60°)에 오는 회전값
const MIN_INFINITE = 6; // 노드가 이보다 적으면 이음매가 보이므로 돌리지 않고 고정 배치
const SNAP_DELAY_MS = 140;
const ROT_TAU_MS = 90; // 회전이 목표 각도를 따라가는 빠르기(작을수록 빠름)
const MAX_AHEAD = 2 * STEP; // 목표 각도가 화면보다 앞설 수 있는 최대치
const ARM_TIMEOUT_MS = 2500;
const ENTER_MS = 800;
const LINK_BOX = { w: 64, h: 70 };
const CAT_BOX = 66;
const CATEGORY_KEYS: Record<string, QuickLinkCategory> = { KeyA: 'AI', KeyD: 'Dev', KeyW: 'Web', KeyE: '기타' };
const CATEGORY_ANGLES = [-54, -18, 18, 54];
const EASE = 'cubic-bezier(.16,1,.3,1)';
const HOLD_MS = 300; // 이만큼 누르고 있으면 집는다
const HOLD_SLOP = 8; // 집기 전에 이보다 많이 움직이면 집기를 취소
const SETTLE_MS = 260; // 내려놓을 때 복제본이 자리로 가는 시간
const RING_SPEED = { inner: -52, outer: 34 }; // 집고 있는 동안 점선 고리 회전 속도(°/s)
const RING_DASH = '6 9';
const RING_IDLE = { width: 1, alpha: 0.22 };
const RING_ACTIVE = { width: 2.5, alpha: 0.6 };

const rad = (deg: number) => (deg * Math.PI) / 180;

function slotOf(index: number, count: number, rot: number) {
  if (count < MIN_INFINITE) return index - (count - 1) / 2; // + 를 맨 위에 두고 가운데 정렬
  let k = (((index - rot / STEP) % count) + count) % count;
  if (k >= count / 2) k -= count;
  return k;
}

export default function QuickLaunchFan() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [category, setCategory] = useState<QuickLinkCategory>(QUICK_LINK_CATEGORIES[0]);
  const [rot, setRot] = useState(HOME_ROT);
  const [shownRot, setShownRot] = useState(HOME_ROT);
  const shownRotRef = useRef(HOME_ROT);
  const [spinning, setSpinning] = useState(false);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(SVGSVGElement | null)[]>([]);
  const ringMotion = useRef({ inner: 0, outer: 0, v: 0 });
  const suppressClick = useRef(false);
  const cancelPending = useRef<() => void>(() => {});
  const handleRef = useRef<HTMLButtonElement>(null);
  const prevSlots = useRef(new Map<string, number>());
  const snapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const categoryLock = useRef(0);

  const load = useCallback(() => {
    getQuickLinks()
      .then((rows) => {
        setLinks(rows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    setMounted(true);
    load();
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener('resize', measure);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motion.matches);
    return () => window.removeEventListener('resize', measure);
  }, [load]);

  useEffect(() => onQuickLinksChanged(load), [load]);
  useEffect(() => {
    if (open) {
      activatePanel('quicklaunch');
      setEntering(true);
      const id = setTimeout(() => setEntering(false), ENTER_MS);
      return () => clearTimeout(id);
    }
    releasePanel('quicklaunch');
    setArmedId(null);
    setMenuId(null);
    setDrag(null);
    cancelPending.current();
  }, [open]);

  useEffect(() => {
    if (!armedId) return;
    const id = setTimeout(() => setArmedId(null), ARM_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [armedId]);

  const categoryLinks = links.filter((l) => (l.category ?? '기타') === category);
  const nodeCount = categoryLinks.length + 1; // + 버튼 포함
  const infinite = nodeCount >= MIN_INFINITE;

  // 기하: 왼쪽 가장자리 가운데가 부채의 중심
  const scale = Math.min(1, Math.max(0.78, viewport.w / 900));
  const R1 = 105 * Math.max(scale, 0.8);
  const R2 = 255 * scale;
  const cy = viewport.h / 2;
  const discR = R2 + 70;

  const changeCategory = useCallback(
    (next: QuickLinkCategory) => {
      if (next === category) return; // 같은 카테고리에 다시 마우스를 올려도 회전을 초기화하지 않는다.
      setCategory(next);
      setRot(HOME_ROT);
      shownRotRef.current = HOME_ROT; // 다른 카테고리는 새 노드라서 돌아가는 모습 없이 바로 맞춘다
      setShownRot(HOME_ROT);
      setArmedId(null);
      setMenuId(null);
    },
    [category],
  );

  const shiftCategory = useCallback(
    (delta: number) => {
      const i = QUICK_LINK_CATEGORIES.indexOf(category);
      const n = QUICK_LINK_CATEGORIES.length;
      changeCategory(QUICK_LINK_CATEGORIES[(i + delta + n) % n]);
    },
    [category, changeCategory],
  );

  // 화면에 보이는 회전값(shownRot)은 목표값(rot)을 매 프레임 조금씩 따라간다.
  // CSS transition으로 위치를 옮기면 두 점 사이를 직선으로 가로질러 고리 밖으로 벗어나므로,
  // 각도 자체를 보간해서 노드가 항상 고리 위를 지나가게 한다.
  useEffect(() => {
    if (reducedMotion) {
      shownRotRef.current = rot;
      setShownRot(rot);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const cur = shownRotRef.current;
      const diff = rot - cur;
      const next = Math.abs(diff) < 0.05 ? rot : cur + diff * (1 - Math.exp(-dt / ROT_TAU_MS));
      shownRotRef.current = next;
      setShownRot(next);
      if (next !== rot) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rot, reducedMotion]);

  // 키를 꾹 누르거나 휠을 세게 굴려도 화면보다 MAX_AHEAD 넘게 앞서 돌지 않게 한다.
  const clampAhead = (next: number) => {
    const shown = shownRotRef.current;
    return Math.max(shown - MAX_AHEAD, Math.min(shown + MAX_AHEAD, next));
  };

  const spin = useCallback(
    (delta: number, snap = true) => {
      if (!infinite) return;
      setRot((prev) => clampAhead(prev + delta));
      setSpinning(true);
      clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => {
        setSpinning(false);
        if (snap) setRot((prev) => Math.round(prev / STEP) * STEP);
      }, SNAP_DELAY_MS);
    },
    [infinite],
  );

  const stepSpin = (dir: 1 | -1) => {
    if (!infinite) return;
    setRot((prev) => clampAhead(Math.round(prev / STEP) * STEP + dir * STEP));
  };

  // 숫자로 고른 링크가 보이는 범위 밖이면 가까운 쪽으로 돌려서 보여 준다.
  const reveal = (nodeIndex: number) => {
    if (!infinite) return;
    const deg = slotOf(nodeIndex, nodeCount, rot) * STEP;
    if (deg > 60) setRot((prev) => prev + (deg - 60));
    if (deg < -60) setRot((prev) => prev + (deg + 60));
  };

  const launch = (link: QuickLink, newTab: boolean) => {
    recordQuickLinkClick(link.id, link.click_count + 1).catch(() => {});
    if (newTab) window.open(link.href, '_blank', 'noopener,noreferrer');
    else window.location.assign(link.href);
  };

  const openForm = (link: QuickLink | null) => {
    setEditingLink(link);
    setFormOpen(true);
    setMenuId(null);
  };

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingLink(null);
  }, []);

  // × 는 한 번 누르면 "삭제?"로 바뀌고, 한 번 더 눌러야 지운다.
  const requestDelete = async (link: QuickLink) => {
    if (armedId !== link.id) {
      setArmedId(link.id);
      return;
    }
    setArmedId(null);
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    try {
      await deleteQuickLink(link.id);
    } catch {
      load();
    }
  };

  const moveToCategory = async (link: QuickLink, next: QuickLinkCategory) => {
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, category: next } : l)));
    try {
      const { label, href, description, symbol } = link;
      await updateQuickLink(link.id, { label, href, description, symbol, category: next });
    } catch {
      load();
    }
  };

  // 같은 카테고리 안에서 dragId를 targetId 자리로 옮기고, 그 순서를 저장한다.
  const reorderInCategory = async (dragId: string, targetId: string) => {
    const ids = categoryLinks.map((l) => l.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    const byId = new Map(links.map((l) => [l.id, l]));
    let k = 0;
    setLinks(links.map((l) => ((l.category ?? '기타') === category ? byId.get(ids[k++])! : l)));
    try {
      await updateQuickLinkOrder(ids);
    } catch {
      load();
    }
  };

  // 꾹 눌러 집기: HOLD_MS 동안 누르고 있으면 아이콘을 들어 올린다.
  // 다른 카테고리 위에 놓으면 그 카테고리로, 다른 링크 위에 놓으면 그 자리로 순서를 옮긴다.
  const linkCenter = (nodeIndex: number) => {
    const deg = slotOf(nodeIndex, nodeCount, shownRot) * STEP;
    return { deg, x: R2 * Math.cos(rad(deg)), y: cy + R2 * Math.sin(rad(deg)) };
  };
  const dropTargetAt = (x: number, y: number, dragId: string) => {
    const target =
      QUICK_LINK_CATEGORIES.find((cat, i) => {
        if (cat === category) return false;
        const a = rad(CATEGORY_ANGLES[i]);
        return Math.hypot(x - R1 * Math.cos(a), y - (cy + R1 * Math.sin(a))) < CAT_BOX / 2 + 12;
      }) ?? null;
    const slotLink = target
      ? undefined
      : categoryLinks.find((l, j) => {
          if (l.id === dragId) return false;
          const c = linkCenter(j + 1);
          return Math.abs(c.deg) < FADE_START && Math.hypot(x - c.x, y - c.y) < 34;
        });
    return { target, slotTarget: slotLink?.id ?? null };
  };
  // 놓을 때 복제본이 날아갈 곳(상자 왼쪽 위 기준)
  const dropPointFor = (d: Drag) => {
    if (d.target) {
      const a = rad(CATEGORY_ANGLES[QUICK_LINK_CATEGORIES.indexOf(d.target)]);
      return { left: R1 * Math.cos(a) - LINK_BOX.w / 2, top: cy + R1 * Math.sin(a) - 23 };
    }
    const j = categoryLinks.findIndex((l) => l.id === d.slotTarget);
    if (j < 0) return null;
    const c = linkCenter(j + 1);
    return { left: c.x - LINK_BOX.w / 2, top: c.y - LINK_BOX.h / 2 };
  };
  const dropTargetAtRef = useRef(dropTargetAt);
  dropTargetAtRef.current = dropTargetAt;
  const dropPointForRef = useRef(dropPointFor);
  dropPointForRef.current = dropPointFor;
  const reorderRef = useRef(reorderInCategory);
  reorderRef.current = reorderInCategory;
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const moveToCategoryRef = useRef(moveToCategory);
  moveToCategoryRef.current = moveToCategory;

  const startPress = (e: ReactPointerEvent<HTMLDivElement>, link: QuickLink) => {
    if (e.button !== 0 || drag || (e.target as HTMLElement).closest('button')) return; // ✎ × 버튼은 제외
    suppressClick.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cleanup);
      window.removeEventListener('pointercancel', cleanup);
      cancelPending.current = () => {};
    };
    const onMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > HOLD_SLOP) cleanup();
    };
    const timer = setTimeout(() => {
      cleanup();
      suppressClick.current = true; // 집었다 놓을 때 링크가 열리지 않게
      setMenuId(null);
      setArmedId(null);
      setDrag({
        link,
        left: rect.left,
        top: rect.top,
        originLeft: rect.left,
        originTop: rect.top,
        grabX: startX - rect.left,
        grabY: startY - rect.top,
        tilt: 0,
        phase: 'lift',
        target: null,
        slotTarget: null,
        dropAt: null,
      });
    }, HOLD_MS);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cleanup);
    window.addEventListener('pointercancel', cleanup);
    cancelPending.current = cleanup;
  };

  const holding = drag?.phase === 'lift' || drag?.phase === 'held';

  // 들어 올리는 전환이 보이도록 한 프레임 뒤에 held로 바꾼다.
  useEffect(() => {
    if (drag?.phase !== 'lift') return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setDrag((d) => (d?.phase === 'lift' ? { ...d, phase: 'held' } : d)));
    });
    return () => cancelAnimationFrame(id);
  }, [drag?.phase]);

  useEffect(() => {
    if (!holding) return;
    let idle: ReturnType<typeof setTimeout>;
    const onMove = (e: PointerEvent) => {
      setDrag((d) => {
        if (!d) return d;
        const left = e.clientX - d.grabX;
        const tilt = Math.max(-12, Math.min(12, d.tilt * 0.5 + (left - d.left) * 0.8));
        return { ...d, left, top: e.clientY - d.grabY, tilt, ...dropTargetAtRef.current(e.clientX, e.clientY, d.link.id) };
      });
      clearTimeout(idle);
      idle = setTimeout(() => setDrag((d) => (d ? { ...d, tilt: 0 } : d)), 90);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      const dropAt = dropPointForRef.current(d);
      if (!dropAt) {
        setDrag({ ...d, tilt: 0, target: null, slotTarget: null, phase: 'return' });
        return;
      }
      if (d.target) moveToCategoryRef.current(d.link, d.target);
      else if (d.slotTarget) reorderRef.current(d.link.id, d.slotTarget);
      setDrag({ ...d, tilt: 0, dropAt, phase: 'drop' });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.body.style.userSelect = 'none'; // 끄는 동안 페이지 글자가 선택되지 않게
    return () => {
      document.body.style.userSelect = '';
      clearTimeout(idle);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [holding]);

  useEffect(() => {
    if (drag?.phase !== 'drop' && drag?.phase !== 'return') return;
    const id = setTimeout(() => {
      setDrag(null);
      suppressClick.current = false;
    }, SETTLE_MS);
    return () => clearTimeout(id);
  }, [drag?.phase]);

  // 집고 있는 동안 점선 고리가 서서히 돌기 시작하고, 내려놓으면 서서히 멈춘다.
  // 매 프레임 리렌더하지 않도록 고리 요소의 style을 직접 바꾼다.
  useEffect(() => {
    if (reducedMotion || (!holding && ringMotion.current.v === 0)) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const m = ringMotion.current;
      m.v += ((holding ? 1 : 0) - m.v) * (holding ? 0.06 : 0.03);
      if (!holding && m.v < 0.003) m.v = 0;
      m.inner += RING_SPEED.inner * m.v * dt;
      m.outer += RING_SPEED.outer * m.v * dt;
      const width = RING_IDLE.width + (RING_ACTIVE.width - RING_IDLE.width) * m.v;
      const alpha = RING_IDLE.alpha + (RING_ACTIVE.alpha - RING_IDLE.alpha) * m.v;
      ringRefs.current.forEach((el, i) => {
        const circle = el?.firstElementChild as SVGCircleElement | null;
        if (!el || !circle) return;
        el.style.transform = `rotate(${i === 0 ? m.inner : m.outer}deg)`;
        circle.style.strokeWidth = String(width);
        circle.style.stroke = `rgba(255,255,255,${alpha})`;
      });
      if (m.v) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holding, reducedMotion]);

  // 다이얼을 누르면 활성 패널이 되고, 대시보드 패널 바깥을 누르면 닫는다.
  // 할 일 패널 안을 누를 때는 닫지 않아서 두 패널을 같이 열어 둘 수 있다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (formOpen) return;
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || handleRef.current?.contains(target)) activatePanel('quicklaunch');
      else if (!isInsideDashboardPanel(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, formOpen]);

  // 휠: 바깥 링 위에서는 다이얼 회전, 안쪽 링 위에서는 카테고리 넘기기
  // 아이콘·카테고리 버튼은 배경 원의 형제 요소라서, 다이얼 전체를 감싸는 루트에서 받아야
  // 어디서 굴려도 페이지 대신 다이얼만 움직인다. 루트 자체는 pointer-events-none이라
  // 다이얼 영역(배경 원과 버튼들) 밖에서는 평소처럼 페이지가 스크롤된다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      if (Math.hypot(e.clientX, e.clientY - cy) < R1 + 45) {
        const now = Date.now();
        if (now - categoryLock.current > 280 && delta !== 0) {
          categoryLock.current = now;
          shiftCategory(Math.sign(delta));
        }
        return;
      }
      spin(delta * 0.12);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [open, cy, R1, spin, shiftCategory]);

  // 키보드: 최신 상태를 쓰도록 매 렌더마다 핸들러를 갈아 끼운다.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    if (formOpen) return;
    if (e.key === 'Escape' && drag && holding) {
      setDrag({ ...drag, tilt: 0, target: null, slotTarget: null, phase: 'return' });
      return;
    }
    // Q 말고는 할 일 패널과 겹칠 수 있는 키라서, 다이얼이 활성 패널일 때만 처리한다.
    const active = isActivePanel('quicklaunch');
    if (e.key === 'Escape' && open && active) {
      setOpen(false);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
    if (e.code === 'KeyQ') {
      e.preventDefault();
      setOpen((prev) => !prev);
      return;
    }
    if (!open || !active) return;

    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1];
    if (digit) {
      const index = Number(digit);
      const link = categoryLinks[index - 1];
      if (link) {
        e.preventDefault();
        reveal(index);
        launch(link, e.shiftKey);
      }
      return;
    }
    if (e.shiftKey && e.code === 'Delete') {
      const id = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-link-id]')?.dataset.linkId;
      const link = links.find((l) => l.id === id);
      if (link) requestDelete(link);
      return;
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
      shiftCategory(e.code === 'ArrowUp' ? -1 : 1);
      return;
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      stepSpin(e.code === 'ArrowRight' ? 1 : -1);
      return;
    }
    if (e.code === 'KeyN') {
      e.preventDefault();
      openForm(null);
      return;
    }
    const jump = CATEGORY_KEYS[e.code];
    if (jump) changeCategory(jump);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keyHandler.current(e);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // 이음매를 넘어 반대편으로 건너가는 노드는 애니메이션 없이 순간 이동시킨다.
  const nodeIds = ['__add__', ...categoryLinks.map((l) => l.id)];
  const slots = nodeIds.map((_, i) => slotOf(i, nodeCount, shownRot));
  useEffect(() => {
    prevSlots.current = new Map(nodeIds.map((id, i) => [id, slots[i]]));
  });

  const transitionFor = (jumped: boolean, delayMs: number) => {
    if (reducedMotion || jumped) return 'none';
    if (shownRot !== rot) return 'none'; // 회전 중에는 매 프레임 각도로 직접 배치한다
    if (spinning) return `transform 180ms ${EASE}, opacity 180ms`;
    return `transform 500ms ${EASE} ${delayMs}ms, opacity 300ms ${delayMs}ms`;
  };

  const nodeStyle = (id: string, i: number, box: { w: number; h: number }, radius: number, deg: number, from: { x: number; y: number }) => {
    const a = rad(deg);
    const opacity = Math.min(1, Math.max(0, 1 - (Math.abs(deg) - FADE_START) / (FADE_END - FADE_START)));
    const prev = prevSlots.current.get(id);
    const jumped = prev !== undefined && Math.abs(slots[i] - prev) > nodeCount / 2;
    const x = radius * Math.cos(a) - box.w / 2;
    const y = cy + radius * Math.sin(a) - box.h / 2;
    const visible = open && opacity > 0.5;
    return {
      visible,
      style: {
        transform: open
          ? `translate(${x}px, ${y}px) scale(${0.75 + 0.25 * opacity})`
          : `translate(${from.x - box.w / 2}px, ${from.y - box.h / 2}px) scale(.3)`,
        opacity: open ? opacity : 0,
        transition: transitionFor(jumped, entering ? 120 + i * 28 : 0),
        pointerEvents: visible ? ('auto' as const) : ('none' as const),
      },
    };
  };

  const hint = (() => {
    if (status === 'loading') return '불러오는 중…';
    if (status === 'error') return null;
    if (!categoryLinks.length) return '비어 있어요';
    return '';
  })();
  const hintAngle = rad(80);

  if (!mounted) return null;

  return (
    <>
      <button
        ref={handleRef}
        data-dashboard-panel
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="quicklaunch-fan"
        className={`fixed left-0 top-1/2 z-[64] -translate-y-1/2 rounded-r-2xl border border-l-0 border-white/25 bg-[rgba(34,28,21,.35)] px-2 py-4 text-[10px] uppercase tracking-[0.3em] text-white backdrop-blur-xl transition [writing-mode:vertical-rl] hover:bg-[rgba(34,28,21,.5)] ${
          open ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        바로가기 · Q
      </button>

      {createPortal(
        <div
          ref={rootRef}
          data-dashboard-panel
          id="quicklaunch-fan"
          role="dialog"
          aria-label="바로가기 다이얼"
          aria-hidden={!open}
          inert={!open}
          className="pointer-events-none fixed inset-0 z-[65] text-white"
        >
          <div
            className={`absolute rounded-full transition-[transform,opacity] duration-500 ${
              open ? 'pointer-events-auto scale-100 opacity-100' : 'scale-[.2] opacity-0'
            }`}
            style={{
              left: -discR,
              top: cy - discR,
              width: discR * 2,
              height: discR * 2,
              background: 'radial-gradient(closest-side, rgba(28,22,16,.62), rgba(28,22,16,.45) 70%, rgba(28,22,16,0))',
              transitionTimingFunction: EASE,
            }}
          />

          {/* 점선 고리: 집고 있는 동안 굵어지고 밝아지며 돈다(아래 회전 효과에서 style을 직접 바꾼다) */}
          {[R1, R2].map((r, i) => (
            <svg
              key={r}
              ref={(el) => {
                ringRefs.current[i] = el;
              }}
              aria-hidden="true"
              width={r * 2}
              height={r * 2}
              className={`absolute overflow-visible transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
              style={{ left: -r, top: cy - r }}
            >
              <circle
                cx={r}
                cy={r}
                r={r}
                fill="none"
                stroke={`rgba(255,255,255,${RING_IDLE.alpha})`}
                strokeWidth={RING_IDLE.width}
                strokeDasharray={RING_DASH}
                strokeLinecap="round"
              />
            </svg>
          ))}

          {/* 안쪽 링: 카테고리 */}
          {QUICK_LINK_CATEGORIES.map((cat, i) => {
            const a = rad(CATEGORY_ANGLES[i]);
            const active = cat === category;
            const dropTarget = holding && drag?.target === cat;
            const count = links.filter((l) => (l.category ?? '기타') === cat).length;
            return (
              <button
                key={cat}
                type="button"
                tabIndex={open ? 0 : -1}
                aria-pressed={active}
                onClick={() => changeCategory(cat)}
                // 아이콘을 들고 지나갈 때는 카테고리를 바꾸지 않는다(놓을 곳으로만 쓴다).
                onMouseEnter={() => !holding && changeCategory(cat)}
                className={`absolute left-0 top-0 grid place-items-center rounded-full border text-[11px] uppercase tracking-[0.14em] backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3d9a8] ${
                  active ? 'border-white bg-white text-[#2a241c]' : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                } ${open ? 'pointer-events-auto' : ''}`}
                style={{
                  width: CAT_BOX,
                  height: CAT_BOX,
                  transform: open
                    ? `translate(${R1 * Math.cos(a) - CAT_BOX / 2}px, ${cy + R1 * Math.sin(a) - CAT_BOX / 2}px) scale(${dropTarget ? 1.16 : active ? 1.08 : 1})`
                    : `translate(${-CAT_BOX / 2}px, ${cy - CAT_BOX / 2}px) scale(.3)`,
                  opacity: open ? 1 : 0,
                  boxShadow: dropTarget ? '0 0 0 2px rgba(255,255,255,.9), 0 0 0 8px rgba(255,255,255,.12)' : undefined,
                  transition: reducedMotion
                    ? 'none'
                    : `transform ${dropTarget ? 220 : 500}ms ${EASE} ${entering ? i * 30 : 0}ms, opacity 300ms, background-color 200ms, box-shadow 200ms`,
                }}
              >
                <span className="leading-tight">
                  {cat}
                  <span className="block text-[9px] tracking-normal opacity-70">{count}</span>
                </span>
              </button>
            );
          })}

          {/* 바깥 링: + 와 링크 */}
          {nodeIds.map((id, i) => {
            const deg = slots[i] * STEP;
            const a = rad(deg);
            const from = { x: R1 * Math.cos(a), y: cy + R1 * Math.sin(a) };
            const { visible, style: baseStyle } = nodeStyle(id, i, LINK_BOX, R2, deg, from);
            // 들고 있는 동안: 집은 아이콘 자리는 흐린 자국만 남기고, 나머지는 한 단계 흐리게
            const style = drag
              ? {
                  ...baseStyle,
                  opacity:
                    baseStyle.opacity * (drag.link.id === id ? 0.2 : holding && drag.slotTarget !== id ? 0.45 : 1),
                }
              : baseStyle;

            if (id === '__add__') {
              return (
                <div key={id} className="absolute left-0 top-0" style={{ ...style, width: LINK_BOX.w }}>
                  <button
                    type="button"
                    tabIndex={visible ? 0 : -1}
                    onClick={() => openForm(null)}
                    aria-label={`${category}에 바로가기 추가`}
                    className="group flex w-full flex-col items-center gap-1.5 outline-none"
                  >
                    <span className="grid h-[46px] w-[46px] place-items-center rounded-[15px] border-[1.5px] border-dashed border-white/65 bg-white/10 text-2xl font-light transition group-hover:bg-white/25 group-focus-visible:ring-2 group-focus-visible:ring-[#f3d9a8]">
                      +
                    </span>
                    <span className="text-[11px] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">추가</span>
                  </button>
                </div>
              );
            }

            const link = categoryLinks[i - 1];
            const armed = armedId === link.id;
            return (
              <div
                key={id}
                data-link-id={link.id}
                className="group absolute left-0 top-0 select-none"
                style={{ ...style, width: LINK_BOX.w, touchAction: 'none' }}
                onPointerDown={(e) => startPress(e, link)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!drag) setMenuId(link.id);
                }}
              >
                <a
                  href={link.href}
                  draggable={false}
                  tabIndex={visible ? 0 : -1}
                  onClick={(e) => {
                    if (suppressClick.current) {
                      e.preventDefault();
                      suppressClick.current = false;
                      return;
                    }
                    recordQuickLinkClick(link.id, link.click_count + 1).catch(() => {});
                  }}
                  className="flex w-full flex-col items-center gap-1.5 outline-none"
                >
                  <LinkFace link={link} highlighted={holding && drag?.slotTarget === link.id} />
                </a>
                <span
                  className={`absolute -left-2.5 -top-2.5 flex gap-1 transition ${
                    menuId === link.id || armed
                      ? 'scale-100 opacity-100'
                      : 'scale-90 opacity-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:scale-100 group-hover:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    tabIndex={visible ? 0 : -1}
                    onClick={() => openForm(link)}
                    aria-label={`${link.label} 수정`}
                    className="grid h-5 w-5 place-items-center rounded-full bg-[rgba(20,16,12,.88)] text-[11px] hover:bg-[#2a241c] focus-visible:outline-2 focus-visible:outline-[#f3d9a8]"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    tabIndex={visible ? 0 : -1}
                    onClick={() => requestDelete(link)}
                    aria-label={armed ? `${link.label} 삭제 확인` : `${link.label} 삭제`}
                    className={`grid h-5 place-items-center rounded-full text-[11px] focus-visible:outline-2 focus-visible:outline-[#f3d9a8] ${
                      armed ? 'bg-[#c2412d] px-2 text-[10px]' : 'w-5 bg-[rgba(20,16,12,.88)] hover:bg-[#2a241c]'
                    }`}
                  >
                    {armed ? '삭제?' : '×'}
                  </button>
                </span>
              </div>
            );
          })}

          {drag && <LiftedLink drag={drag} reducedMotion={reducedMotion} />}

          <div
            className={`absolute whitespace-nowrap text-[10px] tracking-[0.16em] text-white/75 transition-opacity duration-300 [text-shadow:0_1px_6px_rgba(0,0,0,.5)] ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ left: R2 * Math.cos(hintAngle) + 18, top: cy + R2 * Math.sin(hintAngle) + 6 }}
          >
            {hint ?? (
              <span className="pointer-events-auto">
                불러오지 못했어요 ·{' '}
                <button type="button" onClick={load} className="underline underline-offset-2">
                  다시 시도
                </button>
              </span>
            )}
          </div>

          <div
            className={`absolute bottom-4 left-4 flex flex-wrap gap-3 text-[11px] text-white/85 transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {[
              ['Q', '닫기'],
              ['1–9', '열기'],
              ['휠 · ←→', '돌리기'],
              ['↑↓', '카테고리'],
              ['N', '추가'],
            ].map(([key, label]) => (
              <span key={key} className="inline-flex items-center gap-1.5 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
                <kbd className="rounded border border-white/45 px-1.5 font-sans text-[10px]">{key}</kbd>
                {label}
              </span>
            ))}
          </div>
        </div>,
        document.body,
      )}

      <QuickLinkFormModal open={formOpen} link={editingLink} defaultCategory={category} onClose={closeForm} />
    </>
  );
}

// lifted: 손에 들린 복제본, highlighted: 들고 있는 아이콘을 놓으면 이 자리로 옮겨 감
function LinkFace({ link, lifted = false, highlighted = false }: { link: QuickLink; lifted?: boolean; highlighted?: boolean }) {
  const favicon = link.symbol?.startsWith('http') ? link.symbol : toFaviconUrl(link.href);
  return (
    <>
      <span
        className={`grid h-[46px] w-[46px] place-items-center rounded-[15px] bg-white/90 text-lg text-[#2a241c] transition ${
          lifted
            ? 'shadow-[0_18px_36px_rgba(0,0,0,.45)] ring-2 ring-white/85'
            : highlighted
              ? 'scale-90 shadow-[0_0_0_2px_rgba(255,255,255,.9),0_0_0_8px_rgba(255,255,255,.12)]'
              : 'shadow-[0_8px_20px_rgba(0,0,0,.3)] group-hover:scale-110 group-has-[a:focus-visible]:ring-2 group-has-[a:focus-visible]:ring-[#f3d9a8]'
        }`}
      >
        {favicon ? (
          <img src={favicon} alt="" draggable={false} className="h-6 w-6" referrerPolicy="no-referrer" />
        ) : (
          link.label[0]
        )}
      </span>
      <span className="w-[80px] truncate text-center text-[11px] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
        {link.label}
      </span>
    </>
  );
}

// 손에 들린 아이콘. 집을 때 떠오르고, 놓으면 카테고리 속으로 줄어들거나 새 자리·제자리로 내려앉는다.
function LiftedLink({ drag, reducedMotion }: { drag: Drag; reducedMotion: boolean }) {
  let { left, top } = drag;
  let transform = `rotate(${drag.tilt}deg) scale(1.12)`;
  let opacity = 1;
  if (drag.phase === 'lift') transform = 'scale(1)';
  if (drag.phase === 'return') {
    left = drag.originLeft;
    top = drag.originTop;
    transform = 'scale(1)';
  }
  if (drag.phase === 'drop' && drag.dropAt) {
    ({ left, top } = drag.dropAt);
    transform = drag.target ? 'scale(.3)' : 'scale(1)';
    if (drag.target) opacity = 0;
  }
  const settling = drag.phase === 'drop' || drag.phase === 'return';
  const transition = reducedMotion
    ? 'none'
    : [
        `transform 240ms ${EASE}`,
        `opacity ${SETTLE_MS}ms`,
        ...(settling ? [`left ${SETTLE_MS}ms ${EASE}`, `top ${SETTLE_MS}ms ${EASE}`] : []),
      ].join(', ');

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute flex flex-col items-center gap-1.5"
      style={{ left, top, width: LINK_BOX.w, transform, opacity, transition, transformOrigin: '50% 23px', zIndex: 1 }}
    >
      <LinkFace link={drag.link} lifted />
    </div>
  );
}
