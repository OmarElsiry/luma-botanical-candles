import React from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import { getScentById } from './data/products';
import { StoreProvider, useStore } from './context/StoreContext';
import { HeroSlider } from './components/HeroSlider';
import { StoreHeader } from './components/StoreHeader';
import { StoreFooter } from './components/StoreFooter';
import { CartDrawer } from './components/CartDrawer';
import { ShopPage } from './pages/ShopPage';
import { DesignCandlePage } from './pages/DesignCandlePage';
import { ScentDetailPage } from './pages/ScentDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { RegisterPage } from './pages/RegisterPage';
import { CartPage } from './pages/CartPage';

const PAGE_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

function LumaShell() {
  const { route, activeScentId, toastMessage, dismissToast, isCartOpen, openCart } = useStore();
  const activeScent = route.page === 'scent' ? getScentById(route.scentId) : getScentById(activeScentId);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {route.page === 'hero' ? (
          <motion.div
            key="hero-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: PAGE_EASE }}
          >
            <HeroSlider />
          </motion.div>
        ) : (
          <motion.div
            key="store-shell"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: PAGE_EASE }}
            className="flex min-h-dvh flex-col overflow-x-clip text-[#2B2233] transition-colors duration-700"
            style={{ backgroundColor: activeScent.bg }}
          >
            <StoreHeader />
            <main className="flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={route.page === 'scent' ? `scent-${route.scentId}` : route.page}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: PAGE_EASE }}
                >
                  {route.page === 'shop' && <ShopPage />}
                  {route.page === 'design' && <DesignCandlePage />}
                  {route.page === 'scent' && <ScentDetailPage scentId={route.scentId} />}
                  {route.page === 'cart' && <CartPage />}
                  {route.page === 'checkout' && <CheckoutPage />}
                  {route.page === 'register' && <RegisterPage />}
                </motion.div>
              </AnimatePresence>
            </main>
            <StoreFooter />
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer />

      <AnimatePresence>
        {toastMessage && !isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 0.8, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-2xl border border-white/25 px-4 py-3 text-xs font-medium text-white shadow-xl backdrop-blur-md"
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <LumaShell />
      </StoreProvider>
    </MotionConfig>
  );
}
