'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QuickLinkFormModal from '@/app/components/QuickLinkFormModal';
import { announcePanelOpen, isTypingTarget, onOtherPanelOpen } from '@/lib/dashboardPanels';
import {
  deleteQuickLink,
  getQuickLinks,
  onQuickLinksChanged,
  QUICK_LINK_CATEGORIES,
  QuickLink,
  QuickLinkCategory,
  recordQuickLinkClick,
  toFaviconUrl,
} from '@/lib/quickLinks';

type Status = 'loading' | 'ready' | 'error';

// 바깥 링(다이얼)은 [+, 링크1, 링크2, ...]를 원형 연결 리스트처럼 이어서 끝없이 돈다.
const STEP = 30; // 링크 사이 각도(°)
const FADE_START = 62; // 이 각도를 넘으면 흐려지기 시작
const FADE_END = 82; // 이 각도에서 완전히 사라짐
const HOME_ROT = 2 * STEP; // + 가 맨 위(−60°)에 오는 회전값
const MIN_INFINITE = 6; // 노드가 이보다 적으면 이음매가 보이므로 돌리지 않고 고정 배치
const SNAP_DELAY_MS = 140;
const ARM_TIMEOUT_MS = 2500;
const ENTER_MS = 800;
const LINK_BOX = { w: 64, h: 70 };
const CAT_BOX = 66;
const CATEGORY_KEYS: Record<string, QuickLinkCategory> = { KeyA: 'AI', KeyD: 'Dev', KeyW: 'Web', KeyE: '기타' };
const CATEGORY_ANGLES = [-54, -18, 18, 54];
const EASE = 'cubic-bezier(.16,1,.3,1)';

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
  const [spinning, setSpinning] = useState(false);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => onOtherPanelOpen('quicklaunch', () => setOpen(false)), []);

  useEffect(() => {
    if (open) {
      announcePanelOpen('quicklaunch');
      setEntering(true);
      const id = setTimeout(() => setEntering(false), ENTER_MS);
      return () => clearTimeout(id);
    }
    setArmedId(null);
    setMenuId(null);
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

  const spin = useCallback(
    (delta: number, snap = true) => {
      if (!infinite) return;
      setRot((prev) => prev + delta);
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
    setRot((prev) => Math.round(prev / STEP) * STEP + dir * STEP);
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

  // 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (formOpen) return;
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !handleRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, formOpen]);

  // 휠: 바깥 링 위에서는 다이얼 회전, 안쪽 링 위에서는 카테고리 넘기기
  useEffect(() => {
    const disc = discRef.current;
    if (!disc || !open) return;
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
    disc.addEventListener('wheel', onWheel, { passive: false });
    return () => disc.removeEventListener('wheel', onWheel);
  }, [open, cy, R1, spin, shiftCategory]);

  // 키보드: 최신 상태를 쓰도록 매 렌더마다 핸들러를 갈아 끼운다.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    if (formOpen) return;
    if (e.key === 'Escape' && open) {
      setOpen(false);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
    if (e.code === 'KeyQ') {
      e.preventDefault();
      setOpen((prev) => !prev);
      return;
    }
    if (!open) return;

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
  const slots = nodeIds.map((_, i) => slotOf(i, nodeCount, rot));
  useEffect(() => {
    prevSlots.current = new Map(nodeIds.map((id, i) => [id, slots[i]]));
  });

  const transitionFor = (jumped: boolean, delayMs: number) => {
    if (reducedMotion || jumped) return 'none';
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
    if (!categoryLinks.length) return '비어 있어요 · + 로 추가하세요';
    return infinite ? `${categoryLinks.length}개 · 스크롤하면 계속 돌아요 ↻` : `${categoryLinks.length}개`;
  })();
  const hintAngle = rad(80);

  if (!mounted) return null;

  return (
    <>
      <button
        ref={handleRef}
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
          id="quicklaunch-fan"
          role="dialog"
          aria-label="바로가기 다이얼"
          aria-hidden={!open}
          inert={!open}
          className="pointer-events-none fixed inset-0 z-[65] text-white"
        >
          <div
            ref={discRef}
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

          {[R1, R2].map((r) => (
            <div
              key={r}
              aria-hidden="true"
              className={`absolute rounded-full border border-dashed border-white/20 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
              style={{ left: -r, top: cy - r, width: r * 2, height: r * 2 }}
            />
          ))}

          {/* 안쪽 링: 카테고리 */}
          {QUICK_LINK_CATEGORIES.map((cat, i) => {
            const a = rad(CATEGORY_ANGLES[i]);
            const active = cat === category;
            const count = links.filter((l) => (l.category ?? '기타') === cat).length;
            return (
              <button
                key={cat}
                type="button"
                tabIndex={open ? 0 : -1}
                aria-pressed={active}
                onClick={() => changeCategory(cat)}
                onMouseEnter={() => changeCategory(cat)}
                className={`absolute left-0 top-0 grid place-items-center rounded-full border text-[11px] uppercase tracking-[0.14em] backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3d9a8] ${
                  active ? 'border-white bg-white text-[#2a241c]' : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                } ${open ? 'pointer-events-auto' : ''}`}
                style={{
                  width: CAT_BOX,
                  height: CAT_BOX,
                  transform: open
                    ? `translate(${R1 * Math.cos(a) - CAT_BOX / 2}px, ${cy + R1 * Math.sin(a) - CAT_BOX / 2}px) scale(${active ? 1.08 : 1})`
                    : `translate(${-CAT_BOX / 2}px, ${cy - CAT_BOX / 2}px) scale(.3)`,
                  opacity: open ? 1 : 0,
                  transition: reducedMotion ? 'none' : `transform 500ms ${EASE} ${entering ? i * 30 : 0}ms, opacity 300ms, background-color 200ms`,
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
            const { visible, style } = nodeStyle(id, i, LINK_BOX, R2, deg, from);

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
            const favicon = link.symbol?.startsWith('http') ? link.symbol : toFaviconUrl(link.href);
            const armed = armedId === link.id;
            return (
              <div
                key={id}
                data-link-id={link.id}
                className="group absolute left-0 top-0"
                style={{ ...style, width: LINK_BOX.w }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuId(link.id);
                }}
              >
                <a
                  href={link.href}
                  tabIndex={visible ? 0 : -1}
                  onClick={() => recordQuickLinkClick(link.id, link.click_count + 1).catch(() => {})}
                  className="flex w-full flex-col items-center gap-1.5 outline-none"
                >
                  <span className="relative grid h-[46px] w-[46px] place-items-center rounded-[15px] bg-white/90 text-lg text-[#2a241c] shadow-[0_8px_20px_rgba(0,0,0,.3)] transition group-hover:scale-110 group-has-[a:focus-visible]:ring-2 group-has-[a:focus-visible]:ring-[#f3d9a8]">
                    {favicon ? (
                      <img src={favicon} alt="" className="h-6 w-6" referrerPolicy="no-referrer" />
                    ) : (
                      link.label[0]
                    )}
                    {i <= 9 && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-[#f3d9a8] text-[10px] font-bold text-[#2a241c] tabular-nums">
                        {i}
                      </span>
                    )}
                  </span>
                  <span className="w-[80px] truncate text-center text-[11px] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
                    {link.label}
                  </span>
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
