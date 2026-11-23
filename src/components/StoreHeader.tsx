import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SCENTS, getScentById } from '../data/products';
import { useStore } from '../context/StoreContext';
import type { AppRoute } from '../utils/commerce';

export function StoreHeader() {
  const { route, navigate, cartSummary, openCart, user, activeScentId, setActiveScentId } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeScent = route.page === 'scent' ? getScentById(route.scentId) : getScentById(activeScentId);

  const navItems: Array<{ label: string; target: AppRoute; active: boolean }> = [
    { label: 'Showcase', target: { page: 'hero' }, active: route.page === 'hero' },
    { label: 'Shop', target: { page: 'shop' }, active: route.page === 'shop' || route.page === 'scent' },
    { label: 'Design', target: { page: 'design' }, active: route.page === 'design' },
  ];

  const activeTabIndex = Math.max(
    0,
    navItems.findIndex((item) => item.active)
  );

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const underlineRef = useRef<HTMLSpanElement | null>(null);

  const positionUnderline = useCallback((idx: number, instant: boolean) => {
    const el = tabRefs.current[idx];
    const ul = underlineRef.current;
    if (!el || !ul) return;
    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ul.classList.add('no-transition');
    } else {
      ul.classList.remove('no-transition');
    }
    ul.style.width = `${el.offsetWidth}px`;
    ul.style.transform = `translateX(${el.offsetLeft}px)`;
    if (instant) {
      void ul.offsetWidth;
      ul.classList.remove('no-transition');
    }
  }, []);

  useEffect(() => {
    positionUnderline(activeTabIndex, false);
    const onResize = () => positionUnderline(activeTabIndex, true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeTabIndex, positionUnderline]);

  const handleNav = (target: AppRoute) => {
    setMobileMenuOpen(false);
    navigate(target);
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/25 backdrop-blur-md transition-colors duration-700"
      style={{
        backgroundColor: `${activeScent.bg}EB`,
        textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:h-20 sm:px-10">
        {/* Left: Baloo 2 white display wordmark matching Hero */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            handleNav({ page: 'hero' });
          }}
          className="font-display text-4xl font-extrabold tracking-[-0.02em] leading-none text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded"
        >
          Luma
        </a>

        {/* Center: Poppins 500 tabs with exact 2px white gliding underline */}
        <nav
          className="relative hidden md:flex items-center gap-10 lg:gap-12 text-[17px] font-medium text-white"
          aria-label="Main navigation"
        >
          {navItems.map((item, idx) => (
            <button
              key={item.label}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => handleNav(item.target)}
              aria-current={item.active ? 'page' : undefined}
              className={`relative py-1.5 whitespace-nowrap shrink-0 transition-opacity cursor-pointer ${
                item.active ? 'opacity-100' : 'opacity-85 hover:opacity-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span
            ref={underlineRef}
            aria-hidden="true"
            className="hero-tab-underline"
            style={{ top: 'calc(100% + 1px)' }}
          />
        </nav>

        {/* Right: Mood Swatches + Cart | Register matching Hero typography */}
        <div className="flex items-center gap-4 text-[16px] font-medium text-white shrink-0">
          {route.page !== 'scent' && (
            <div className="hidden lg:flex items-center gap-1.5 mr-1" role="group" aria-label="Backdrop scent hue">
              {SCENTS.map((s) => {
                const selected = s.id === activeScent.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveScentId(s.id)}
                    aria-label={`Set studio backdrop to ${s.name}`}
                    aria-pressed={selected}
                    className={`h-4 w-4 rounded-full border-2 transition-transform cursor-pointer ${
                      selected ? 'scale-115 border-white shadow-sm' : 'border-white/55 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: s.bg }}
                  />
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={openCart}
            aria-label={`Open shopping cart with ${cartSummary.totalItems} items`}
            className="hover:opacity-85 transition-opacity whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
          >
            {cartSummary.totalItems > 0 ? `Cart (${cartSummary.totalItems})` : 'Cart'}
          </button>

          <span className="hidden sm:inline opacity-85 select-none" aria-hidden="true">
            |
          </span>

          <button
            type="button"
            onClick={() => handleNav({ page: 'register' })}
            className="hidden sm:inline hover:opacity-85 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user ? user.firstName : 'Register'}
          </button>

          <button
            type="button"
            className="inline-flex md:hidden items-center justify-center rounded-lg p-1.5 text-white hover:bg-white/15 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-white/25 px-5 py-4"
          style={{ backgroundColor: `${activeScent.bg}F5` }}
        >
          <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item.target)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-white cursor-pointer ${
                  item.active ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNav({ page: 'register' })}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-white hover:bg-white/15 cursor-pointer"
            >
              <span>{user ? `Account (${user.firstName})` : 'Register / Sign In'}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
