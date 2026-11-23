import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Plus, ShoppingBag } from 'lucide-react';
import {
  LAYER_PARALLAX_FACTORS,
  OLD_SLIDE_DRIFT_FACTOR,
  WIPE_DURATION_MS,
  computeViewportScale,
  coverAt,
  detectSwipeDirection,
  incomingProgress,
  tabDirection,
  wrapFlavourIndex,
} from '../blendyMath';
import { HERO_SHADOWS, SCENTS } from '../data/products';
import { useStore } from '../context/StoreContext';
import { CandleVisual } from './CandleVisual';

const LAYER_NAMES = ['word', 'shadow', 'bottle', 'fruit', 'corner'] as const;
type LayerName = (typeof LAYER_NAMES)[number];

interface WordMetrics {
  fontSize: number;
  letterSpacing: string;
  top: number;
}

function measureInkWidthAt100(ctx: CanvasRenderingContext2D | null, word: string, letterSpacingEm: number): number {
  if (!ctx) return word.length * 60;
  ctx.font = '700 100px "Poppins", system-ui, sans-serif';
  const trackingPx = letterSpacingEm * 100;
  const ctxAny = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const hasLetterSpacing = 'letterSpacing' in ctxAny;
  if (hasLetterSpacing) {
    ctxAny.letterSpacing = `${trackingPx}px`;
  }
  const metrics = ctx.measureText(word);
  let w = (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0);
  if (!w) w = metrics.width;
  if (!hasLetterSpacing && word.length > 1) {
    w += (word.length - 1) * trackingPx;
  }
  return w;
}

export function HeroSlider() {
  const { navigate, heroIndex, setHeroIndex, cartSummary, openCart, addToCart, isCartOpen, user } = useStore();

  const [currentIndex, setCurrentIndex] = useState(heroIndex);
  const initialIndexRef = useRef(heroIndex);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [noRevealAnim, setNoRevealAnim] = useState(false);
  const [wordLayouts, setWordLayouts] = useState<WordMetrics[]>(() =>
    SCENTS.map(() => ({ fontSize: 445, letterSpacing: '0.005em', top: 180.555 }))
  );

  const stageRef = useRef<HTMLElement | null>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const layerRefs = useRef<Record<number, Record<LayerName, HTMLDivElement | null>>>(
    Object.fromEntries(
      SCENTS.map((_, i) => [i, { word: null, shadow: null, bottle: null, fruit: null, corner: null }])
    )
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const isTransitioningRef = useRef(false);
  const isOpeningRef = useRef(false);
  const openingTimerRef = useRef<number | null>(null);
  const failsafeTimerRef = useRef<number | null>(null);
  const quickAddedTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(-Infinity);
  const isCartOpenRef = useRef(isCartOpen);
  isCartOpenRef.current = isCartOpen;
  const scaleRef = useRef(computeViewportScale(1440, 900));

  // Stable bob durations/delays per floating botanical piece
  const bobTimings = useMemo(
    () =>
      SCENTS.map((s) =>
        s.pieces.map((_, pIdx) => ({
          dur: (3.2 + ((pIdx * 0.43) % 1.8)).toFixed(3),
          delay: (-((pIdx * 0.85) % 4.0)).toFixed(3),
        }))
      ),
    []
  );

  const updateUnderline = useCallback((index: number, instant: boolean) => {
    const tabEl = tabRefs.current[index];
    const ul = underlineRef.current;
    if (!tabEl || !ul) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (instant || reduced) {
      ul.classList.add('no-transition');
    } else {
      ul.classList.remove('no-transition');
    }
    ul.style.width = `${tabEl.offsetWidth}px`;
    ul.style.transform = `translateX(${tabEl.offsetLeft}px)`;
    if (instant) {
      void ul.offsetWidth;
      ul.classList.remove('no-transition');
    }
  }, []);

  const layoutAllWords = useCallback((isMobile: boolean, visibleFrameWidth: number) => {
    if (!measureCtxRef.current) {
      const canvas = document.createElement('canvas');
      measureCtxRef.current = canvas.getContext('2d');
    }
    const ctx = measureCtxRef.current;
    const defaultLimit = isMobile ? visibleFrameWidth * 0.92 : 1330;
    const fitTarget = isMobile ? visibleFrameWidth * 0.92 : 1400;

    const next = SCENTS.map((scent) => {
      const wDefault100 = measureInkWidthAt100(ctx, scent.name, 0.005);
      let fontSize = 445;
      let letterSpacing = '0.005em';
      if (wDefault100 * (445 / 100) > defaultLimit) {
        letterSpacing = '-0.035em';
        const wTight100 = measureInkWidthAt100(ctx, scent.name, -0.035);
        if (wTight100 > 0) {
          fontSize = Math.min(445, (fitTarget / wTight100) * 100);
        }
      }
      const baseline = 403.5 + (0.698 * fontSize) / 2;
      const top = baseline - 0.85 * fontSize;
      return { fontSize, letterSpacing, top };
    });
    setWordLayouts(next);
  }, []);

  const updateScale = useCallback(
    (instantUnderline: boolean) => {
      const scale = computeViewportScale(window.innerWidth, window.innerHeight);
      scaleRef.current = scale;
      const root = document.documentElement;
      root.classList.toggle('is-mobile', scale.isMobile);
      root.style.setProperty('--u', `${scale.u}px`);
      root.style.setProperty('--n', `${scale.n}px`);
      root.style.setProperty('--fy', `${scale.fy}px`);
      layoutAllWords(scale.isMobile, scale.visibleFrameWidth);
      updateUnderline(currentIndexRef.current, instantUnderline);
    },
    [layoutAllWords, updateUnderline]
  );

  const clearSlideLayers = useCallback((idx: number) => {
    const section = slideRefs.current[idx];
    if (section) section.style.clipPath = '';
    const map = layerRefs.current[idx];
    if (!map) return;
    LAYER_NAMES.forEach((name) => {
      const el = map[name];
      if (el) {
        el.style.transition = '';
        el.style.transform = '';
      }
    });
  }, []);

  const finishOpeningNow = useCallback(() => {
    if (openingTimerRef.current !== null) {
      window.clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }
    if (failsafeTimerRef.current !== null) {
      window.clearTimeout(failsafeTimerRef.current);
      failsafeTimerRef.current = null;
    }
    isOpeningRef.current = false;
    setNoRevealAnim(true);
    setIsEntering(false);
    clearSlideLayers(currentIndexRef.current);
    window.requestAnimationFrame(() => setNoRevealAnim(false));
  }, [clearSlideLayers]);

  // Initial layout, fonts.ready opening sequence, resize listener, and autoplay
  useEffect(() => {
    updateScale(true);

    const onResize = () => updateScale(true);
    window.addEventListener('resize', onResize);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoplayId: number | null = null;

    const startAutoplay = () => {
      if (autoplayId !== null) return;
      autoplayId = window.setInterval(() => {
        if (document.hidden || isTransitioningRef.current || isOpeningRef.current || isCartOpenRef.current) {
          return;
        }
        if (performance.now() - lastInteractionRef.current < 6000) return;
        const nextIdx = wrapFlavourIndex(currentIndexRef.current, 1, SCENTS.length);
        triggerTransitionRef.current(nextIdx, 1);
      }, 2600);
    };

    const runOpening = () => {
      updateScale(true);
      if (reducedMotion) {
        setIsEntering(false);
        startAutoplay();
        return;
      }

      isOpeningRef.current = true;
      const activeIdx = currentIndexRef.current;
      const fw = scaleRef.current.frameWidth;
      const map = layerRefs.current[activeIdx];
      if (map) {
        LAYER_NAMES.forEach((name) => {
          const el = map[name];
          if (el) {
            el.style.transition = 'none';
            el.style.transform = `translateX(${LAYER_PARALLAX_FACTORS[name] * fw}px)`;
          }
        });
      }

      const sec = slideRefs.current[activeIdx];
      if (sec) void sec.offsetWidth;

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!isOpeningRef.current) return;
          if (map) {
            LAYER_NAMES.forEach((name) => {
              const el = map[name];
              if (el) {
                el.style.transition = 'transform 900ms cubic-bezier(0.22, 0.8, 0.3, 1)';
                el.style.transform = 'translateX(0px)';
              }
            });
          }
          setIsEntering(false);
          openingTimerRef.current = window.setTimeout(() => {
            isOpeningRef.current = false;
            clearSlideLayers(activeIdx);
          }, 950);
          startAutoplay();
        });
      });
    };

    failsafeTimerRef.current = window.setTimeout(() => {
      finishOpeningNow();
      startAutoplay();
    }, 3000);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(runOpening);
    } else {
      runOpening();
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (autoplayId !== null) window.clearInterval(autoplayId);
      if (openingTimerRef.current !== null) window.clearTimeout(openingTimerRef.current);
      if (failsafeTimerRef.current !== null) window.clearTimeout(failsafeTimerRef.current);
      if (quickAddedTimerRef.current !== null) window.clearTimeout(quickAddedTimerRef.current);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      document.documentElement.classList.remove('is-mobile');
    };
  }, [clearSlideLayers, finishOpeningNow, updateScale]);

  const snapTransitionNow = useCallback(() => {
    if (!isTransitioningRef.current) return;
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const settledIdx = currentIndexRef.current;
    slideRefs.current.forEach((sec, i) => {
      if (!sec) return;
      const active = i === settledIdx;
      sec.classList.remove('is-incoming', 'is-outgoing');
      sec.classList.toggle('is-active', active);
      sec.setAttribute('aria-hidden', active ? 'false' : 'true');
      clearSlideLayers(i);
    });
    isTransitioningRef.current = false;
  }, [clearSlideLayers]);

  const goToScent = useCallback(
    (targetIdx: number, dir: 1 | -1, fromUser = false) => {
      if (fromUser && isTransitioningRef.current) {
        snapTransitionNow();
      }
      const fromIdx = currentIndexRef.current;
      if (isTransitioningRef.current || targetIdx === fromIdx) return;

      if (isOpeningRef.current || isEntering) {
        finishOpeningNow();
      }

      const slideA = slideRefs.current[fromIdx];
      const slideB = slideRefs.current[targetIdx];
      if (!slideA || !slideB) return;

      currentIndexRef.current = targetIdx;
      setCurrentIndex(targetIdx);
      setHeroIndex(targetIdx);
      document.body.style.backgroundColor = SCENTS[targetIdx].bg;
      updateUnderline(targetIdx, false);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        slideRefs.current.forEach((sec, i) => {
          if (!sec) return;
          const active = i === targetIdx;
          sec.classList.remove('is-incoming', 'is-outgoing');
          sec.classList.toggle('is-active', active);
          sec.setAttribute('aria-hidden', active ? 'false' : 'true');
          clearSlideLayers(i);
        });
        return;
      }

      isTransitioningRef.current = true;
      const fw = scaleRef.current.frameWidth;
      const layersA = layerRefs.current[fromIdx];
      const layersB = layerRefs.current[targetIdx];

      LAYER_NAMES.forEach((name) => {
        const elB = layersB?.[name];
        if (elB) {
          elB.style.transform = `translateX(${dir * LAYER_PARALLAX_FACTORS[name] * fw}px)`;
        }
      });

      slideB.classList.remove('is-active', 'is-outgoing');
      slideB.classList.add('is-incoming');
      slideB.setAttribute('aria-hidden', 'false');

      slideA.classList.remove('is-active', 'is-incoming');
      slideA.classList.add('is-outgoing');
      slideA.setAttribute('aria-hidden', 'true');

      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = elapsed / WIPE_DURATION_MS;
        const c = coverAt(Math.min(t, 1));
        const k = incomingProgress(t);
        const liveFw = scaleRef.current.frameWidth;

        if (dir === 1) {
          slideA.style.clipPath = `inset(0 ${(c * 100).toFixed(4)}% 0 0)`;
        } else {
          slideA.style.clipPath = `inset(0 0 0 ${(c * 100).toFixed(4)}%)`;
        }

        const driftX = -dir * c * OLD_SLIDE_DRIFT_FACTOR * liveFw;
        LAYER_NAMES.forEach((name) => {
          const elA = layersA?.[name];
          if (elA) elA.style.transform = `translateX(${driftX}px)`;
          const elB = layersB?.[name];
          if (elB) {
            const inX = dir * (1 - k) * LAYER_PARALLAX_FACTORS[name] * liveFw;
            elB.style.transform = `translateX(${inX}px)`;
          }
        });

        if (t >= 1 && k >= 1) {
          slideRefs.current.forEach((sec, i) => {
            if (!sec) return;
            const active = i === targetIdx;
            sec.classList.remove('is-incoming', 'is-outgoing');
            sec.classList.toggle('is-active', active);
            sec.setAttribute('aria-hidden', active ? 'false' : 'true');
            clearSlideLayers(i);
          });
          isTransitioningRef.current = false;
          rafRef.current = null;
          return;
        }

        rafRef.current = window.requestAnimationFrame(step);
      };

      rafRef.current = window.requestAnimationFrame(step);
    },
    [clearSlideLayers, finishOpeningNow, isEntering, setHeroIndex, snapTransitionNow, updateUnderline]
  );

  const triggerTransitionRef = useRef(goToScent);
  triggerTransitionRef.current = goToScent;

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = performance.now();
  }, []);

  const stepScent = useCallback(
    (dir: 1 | -1, fromUser: boolean) => {
      if (fromUser) markInteraction();
      const nextIdx = wrapFlavourIndex(currentIndexRef.current, dir, SCENTS.length);
      goToScent(nextIdx, dir, fromUser);
    },
    [goToScent, markInteraction]
  );

  // Keyboard & pointer swipe controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isCartOpenRef.current) return;
      if (e.key === 'ArrowLeft') {
        stepScent(-1, true);
      } else if (e.key === 'ArrowRight') {
        stepScent(1, true);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    let pointerActive = false;
    let startX = 0;
    let startY = 0;

    const stage = stageRef.current;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerActive = true;
      startX = e.clientX;
      startY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!pointerActive) return;
      pointerActive = false;
      const swipeDir = detectSwipeDirection(e.clientX - startX, e.clientY - startY);
      if (swipeDir !== 0) {
        stepScent(swipeDir, true);
      }
    };
    const onPointerCancel = () => {
      pointerActive = false;
    };

    stage?.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      stage?.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [stepScent]);

  // Keep underline aligned after word layout updates
  useEffect(() => {
    updateUnderline(currentIndex, true);
  }, [currentIndex, updateUnderline]);

  const activeScent = SCENTS[currentIndex];
  const riseClass = `ui-rise${isEntering ? ' is-entering-item' : ''}${noRevealAnim ? ' no-reveal-anim' : ''}`;
  const isJustAdded = quickAddedId === activeScent.id;

  const handleQuickAdd = () => {
    markInteraction();
    addToCart(activeScent.id, 1, 1, false);
    setQuickAddedId(activeScent.id);
    if (quickAddedTimerRef.current !== null) {
      window.clearTimeout(quickAddedTimerRef.current);
    }
    quickAddedTimerRef.current = window.setTimeout(() => {
      setQuickAddedId(null);
    }, 1500);
  };

  return (
    <div
      className="hero-root"
      style={{ '--hero-accent-ink': activeScent.accentInk } as React.CSSProperties}
    >
      <main className="stage" ref={stageRef} aria-label="Luma candle scent showcase">
        {SCENTS.map((scent, idx) => {
          const isActive = idx === currentIndex;
          const wordMetric = wordLayouts[idx];

          return (
            <section
              key={scent.id}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className={`slide${idx === initialIndexRef.current ? ' is-active' : ''}`}
              style={{ backgroundColor: scent.bg }}
              aria-label={`${scent.name} botanical soy candle`}
              aria-hidden={isActive ? 'false' : 'true'}
              data-scent={scent.id}
            >
              <div className="frame">
                {/* 1. Giant white word layer */}
                <div
                  className="layer layer-word"
                  ref={(el) => {
                    layerRefs.current[idx].word = el;
                  }}
                >
                  <h1
                    className="word"
                    style={{
                      fontSize: `calc(${wordMetric.fontSize} * var(--u))`,
                      letterSpacing: wordMetric.letterSpacing,
                      top: `calc(${wordMetric.top} * var(--u))`,
                    }}
                  >
                    {scent.name}
                  </h1>
                </div>

                {/* 2. Floor shadow layer */}
                <div
                  className="layer layer-shadow"
                  ref={(el) => {
                    layerRefs.current[idx].shadow = el;
                  }}
                >
                  {HERO_SHADOWS.map(([cx, cy, w, h], sIdx) => (
                    <div
                      key={sIdx}
                      className="floor-shadow"
                      style={{
                        left: `calc(${cx - w / 2} * var(--u))`,
                        top: `calc(${cy - h / 2} * var(--u))`,
                        width: `calc(${w} * var(--u))`,
                        height: `calc(${h} * var(--u))`,
                      }}
                    />
                  ))}
                </div>

                {/* 3. Centered matte ceramic candle layer */}
                <div
                  className="layer layer-bottle"
                  ref={(el) => {
                    layerRefs.current[idx].bottle = el;
                  }}
                >
                  <button
                    type="button"
                    className="bottle"
                    aria-label={`View ${scent.name} candle details`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => {
                      markInteraction();
                      navigate({ page: 'scent', scentId: scent.id });
                    }}
                    style={{
                      left: `calc(${scent.heroCandle.x} * var(--u))`,
                      top: `calc(${scent.heroCandle.y} * var(--u))`,
                      width: `calc(${scent.heroCandle.w} * var(--u))`,
                      height: `calc(${scent.heroCandle.h} * var(--u))`,
                    }}
                  >
                    <CandleVisual
                      scent={scent}
                      variant="candle"
                      className="h-full w-full"
                    />
                  </button>
                </div>

                {/* 4. Floating botanicals layer */}
                <div
                  className="layer layer-fruit"
                  ref={(el) => {
                    layerRefs.current[idx].fruit = el;
                  }}
                >
                  {scent.pieces.map((piece, pIdx) => {
                    if (piece.layer !== 'fruit') return null;
                    const bob = bobTimings[idx][pIdx];
                    return (
                      <div
                        key={pIdx}
                        className={`piece${piece.mirror ? ' is-mirrored' : ''}`}
                        style={{
                          left: `calc(${piece.x} * var(--u))`,
                          top: `calc(${piece.y} * var(--u))`,
                          width: `calc(${piece.w} * var(--u))`,
                          height: `calc(${piece.w} * var(--u))`,
                        }}
                      >
                        <div
                          className="piece-inner"
                          style={
                            {
                              '--rot': `${piece.rot}deg`,
                              '--dur': `${bob.dur}s`,
                              '--delay': `${bob.delay}s`,
                            } as React.CSSProperties
                          }
                        >
                          <CandleVisual scent={scent} variant="botanical" className="h-full w-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 5. Foreground corner-blurred botanicals layer */}
                <div
                  className="layer layer-corner"
                  ref={(el) => {
                    layerRefs.current[idx].corner = el;
                  }}
                >
                  {scent.pieces.map((piece, pIdx) => {
                    if (piece.layer !== 'corner') return null;
                    const bob = bobTimings[idx][pIdx];
                    return (
                      <div
                        key={pIdx}
                        className={`piece is-corner${piece.mirror ? ' is-mirrored' : ''}`}
                        style={{
                          left: `calc(${piece.x} * var(--u))`,
                          top: `calc(${piece.y} * var(--u))`,
                          width: `calc(${piece.w} * var(--u))`,
                          height: `calc(${piece.w} * var(--u))`,
                        }}
                      >
                        <div
                          className="piece-inner"
                          style={
                            {
                              '--rot': `${piece.rot}deg`,
                              '--dur': `${bob.dur}s`,
                              '--delay': `${bob.delay}s`,
                            } as React.CSSProperties
                          }
                        >
                          <CandleVisual scent={scent} variant="botanical" className="h-full w-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <div className="hero-ui">
        <header className="hero-header">
          <a
            href="#hero"
            className={`hero-logo ${riseClass}`}
            data-delay="250"
            onClick={(e) => {
              e.preventDefault();
              markInteraction();
              if (currentIndexRef.current !== 0) {
                goToScent(0, -1, true);
              } else {
                navigate({ page: 'hero' });
              }
            }}
          >
            Luma
          </a>

          <nav className={`hero-tabs ${riseClass}`} data-delay="330" aria-label="Candle scents">
            {SCENTS.map((scent, i) => (
              <button
                key={scent.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                className="hero-tab"
                aria-current={i === currentIndex ? 'true' : undefined}
                onClick={() => {
                  markInteraction();
                  if (i === currentIndexRef.current) return;
                  goToScent(i, tabDirection(currentIndexRef.current, i), true);
                }}
              >
                {scent.name}
              </button>
            ))}
            <span className="hero-tab-underline" ref={underlineRef} aria-hidden="true" />
          </nav>

          <div className={`hero-account ${riseClass}`} data-delay="410">
            <button
              type="button"
              className="hero-account-link"
              onClick={() => {
                markInteraction();
                openCart();
              }}
            >
              {cartSummary.totalItems > 0 ? `Cart (${cartSummary.totalItems})` : 'Cart'}
            </button>
            <span className="hero-account-sep" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              className="hero-account-link"
              onClick={() => {
                markInteraction();
                navigate({ page: 'register' });
              }}
            >
              {user ? user.firstName : 'Register'}
            </button>
          </div>
        </header>

        <button
          type="button"
          className={`hero-arrow-btn hero-arrow-prev ${riseClass}`}
          data-delay="490"
          aria-label="Previous scent"
          onClick={() => stepScent(-1, true)}
        >
          <svg
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M24 14H4 M12 6l-8 8 8 8" />
          </svg>
        </button>

        {/* Editorial Showcase Bottom Action Bar: Shop | Design | Active Scent | Quick Add */}
        <div className={`hero-bottom-actions ${riseClass}`} data-delay="570">
          <a
            href="#shop"
            data-testid="hero-shop-cta"
            className="hero-editorial-link"
            onClick={(e) => {
              e.preventDefault();
              markInteraction();
              navigate({ page: 'shop' });
            }}
          >
            SHOP
          </a>

          <span className="hero-action-sep" aria-hidden="true" />

          <a
            href="#design"
            data-testid="hero-design-cta"
            className="hero-editorial-link"
            onClick={(e) => {
              e.preventDefault();
              markInteraction();
              navigate({ page: 'design' });
            }}
          >
            DESIGN
          </a>

          <span className="hero-action-sep hero-action-sep-scent" aria-hidden="true" />

          <a
            href={`#scent/${activeScent.id}`}
            className="hero-view-scent"
            onClick={(e) => {
              e.preventDefault();
              markInteraction();
              navigate({ page: 'scent', scentId: activeScent.id });
            }}
          >
            {activeScent.name.toUpperCase()}
          </a>

          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Quick add ${activeScent.name} single candle to cart`}
            title={`Quick Add ${activeScent.name} ($36.00)`}
            data-testid="hero-quick-add"
            className={`hero-quick-add${isJustAdded ? ' is-added' : ''}`}
          >
            {isJustAdded ? (
              <Check className="h-[18px] w-[18px]" strokeWidth={2.3} aria-hidden="true" />
            ) : (
              <span className="relative inline-flex items-center justify-center">
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                <Plus
                  className="absolute -right-2 -top-1.5 h-3 w-3 rounded-full bg-white text-[#2B2233] p-[1px]"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          className={`hero-arrow-btn hero-arrow-next ${riseClass}`}
          data-delay="650"
          aria-label="Next scent"
          onClick={() => stepScent(1, true)}
        >
          <svg
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 14h20 M16 6l8 8-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
