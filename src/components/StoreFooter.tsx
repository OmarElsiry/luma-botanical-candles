import React from 'react';
import { SCENTS } from '../data/products';
import { useStore } from '../context/StoreContext';

export function StoreFooter() {
  const { navigate } = useStore();

  return (
    <footer
      className="border-t border-white/30 bg-white/12 text-white backdrop-blur-sm"
      style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
    >
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'hero' })}
              className="font-display text-4xl font-extrabold tracking-tight text-white cursor-pointer"
            >
              Luma
            </button>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/95">
              Small-batch 240 g botanical soy candles hand-poured into matte ivory stoneware vessels with unbleached
              cotton wicks.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/80">Scents</h3>
            <ul className="mt-3 space-y-2 text-sm font-medium">
              {SCENTS.map((scent) => (
                <li key={scent.id}>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'scent', scentId: scent.id })}
                    className="text-white hover:underline cursor-pointer"
                  >
                    {scent.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/80">Atelier</h3>
            <ul className="mt-3 space-y-2 text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop' })}
                  className="text-white hover:underline cursor-pointer"
                >
                  Shop &amp; Trio Builder
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'design' })}
                  className="text-white hover:underline cursor-pointer"
                >
                  Design Your Candle
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'cart' })}
                  className="text-white hover:underline cursor-pointer"
                >
                  Shopping Cart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'register' })}
                  className="text-white hover:underline cursor-pointer"
                >
                  Account &amp; Orders
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/25 pt-6 text-xs font-medium text-white/90 sm:flex-row sm:items-center sm:justify-between">
          <span>Luma Botanical Soy Candles · 240 g Stoneware</span>
          <span>Cash on Delivery (COD) · Free courier over $75.00</span>
        </div>
      </div>
    </footer>
  );
}
