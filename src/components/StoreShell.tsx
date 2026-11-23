import React, { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { getScentById } from '../data/products';
import { useStore } from '../context/StoreContext';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';

const ShopPage = lazy(() => import('../pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const DesignCandlePage = lazy(() =>
  import('../pages/DesignCandlePage').then((m) => ({ default: m.DesignCandlePage }))
);
const ScentDetailPage = lazy(() =>
  import('../pages/ScentDetailPage').then((m) => ({ default: m.ScentDetailPage }))
);
const CartPage = lazy(() => import('../pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() =>
  import('../pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const RegisterPage = lazy(() =>
  import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

const PAGE_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export function StoreShell() {
  const { route, activeScentId } = useStore();
  const activeScent = route.page === 'scent' ? getScentById(route.scentId) : getScentById(activeScentId);

  // Warm adjacent studio chunks quietly once inside store shell
  useEffect(() => {
    const id = window.setTimeout(() => {
      void import('../pages/ShopPage');
      void import('../pages/DesignCandlePage');
    }, 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="flex min-h-dvh flex-col overflow-x-clip text-[#2B2233] transition-colors duration-700"
        style={{ backgroundColor: activeScent.bg }}
      >
        <StoreHeader />
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6 py-16">
                <div
                  className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-label="Loading page"
                />
              </div>
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={route.page === 'scent' ? `scent-${route.scentId}` : route.page}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.32, ease: PAGE_EASE }}
              >
                {route.page === 'shop' && <ShopPage />}
                {route.page === 'design' && <DesignCandlePage />}
                {route.page === 'scent' && <ScentDetailPage scentId={route.scentId} />}
                {route.page === 'cart' && <CartPage />}
                {route.page === 'checkout' && <CheckoutPage />}
                {route.page === 'register' && <RegisterPage />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
        <StoreFooter />
      </div>
    </MotionConfig>
  );
}
