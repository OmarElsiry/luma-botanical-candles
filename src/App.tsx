import React, { Suspense, lazy, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { getScentById } from './data/products';
import { StoreProvider, useStore } from './context/StoreContext';
import { HeroSlider } from './components/HeroSlider';

const StoreShell = lazy(() =>
  import('./components/StoreShell').then((m) => ({ default: m.StoreShell }))
);
const CartDrawer = lazy(() =>
  import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);

function LumaShell() {
  const { route, activeScentId, toastMessage, dismissToast, isCartOpen, openCart } = useStore();
  const [cartDrawerMounted, setCartDrawerMounted] = useState(false);
  const activeScent = route.page === 'scent' ? getScentById(route.scentId) : getScentById(activeScentId);

  useEffect(() => {
    if (isCartOpen && !cartDrawerMounted) {
      setCartDrawerMounted(true);
    }
  }, [isCartOpen, cartDrawerMounted]);

  // Gently prefetch StoreShell chunk after initial hero paint is idle
  useEffect(() => {
    if (route.page !== 'hero') return;
    const idleId = window.setTimeout(() => {
      void import('./components/StoreShell');
    }, 1200);
    return () => window.clearTimeout(idleId);
  }, [route.page]);

  return (
    <>
      {route.page === 'hero' ? (
        <HeroSlider />
      ) : (
        <Suspense
          fallback={
            <div
              className="flex min-h-dvh items-center justify-center"
              style={{ backgroundColor: activeScent.bg }}
            >
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-label="Loading store"
              />
            </div>
          }
        >
          <StoreShell />
        </Suspense>
      )}

      {cartDrawerMounted && (
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      )}

      {toastMessage && !isCartOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-2xl border border-white/25 px-4 py-3 text-xs font-medium text-white shadow-xl backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
          style={{ backgroundColor: activeScent.accentInk }}
        >
          <CheckCircle2 className="h-4 w-4 text-white/90 shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              dismissToast();
              openCart();
            }}
            className="rounded-lg bg-white/18 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/28 transition-colors cursor-pointer whitespace-nowrap"
          >
            View Cart
          </button>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <LumaShell />
    </StoreProvider>
  );
}
