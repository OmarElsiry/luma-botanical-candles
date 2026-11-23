import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { getScentById } from '../data/products';
import { useStore } from '../context/StoreContext';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export type OrderJourneyStep = 'cart' | 'account' | 'checkout';

interface OrderJourneyBarProps {
  currentStep: OrderJourneyStep;
}

export function OrderJourneyBar({ currentStep }: OrderJourneyBarProps) {
  const { activeScentId, navigate, cartReviewed, firebaseUser, emailVerified } = useStore();
  const activeScent = getScentById(activeScentId);

  const steps: Array<{
    id: OrderJourneyStep;
    num: string;
    shortLabel: string;
    label: string;
    done: boolean;
    clickable: boolean;
    onSelect: () => void;
  }> = [
    {
      id: 'cart',
      num: '01',
      shortLabel: 'Cart',
      label: 'Cart Review',
      done: cartReviewed && currentStep !== 'cart',
      clickable: currentStep !== 'cart',
      onSelect: () => navigate({ page: 'cart' }),
    },
    {
      id: 'account',
      num: '02',
      shortLabel: 'Account',
      label: 'Luma Account',
      done: Boolean(firebaseUser && emailVerified) && currentStep === 'checkout',
      clickable: currentStep === 'checkout',
      onSelect: () => navigate({ page: 'register' }),
    },
    {
      id: 'checkout',
      num: '03',
      shortLabel: 'COD Order',
      label: 'Delivery & COD',
      done: false,
      clickable: cartReviewed && Boolean(firebaseUser && emailVerified) && currentStep !== 'checkout',
      onSelect: () => navigate({ page: 'checkout' }),
    },
  ];

  return (
    <nav
      aria-label="Order checkout steps"
      data-testid="order-journey-bar"
      className="mt-4 rounded-2xl border p-1.5 shadow-[0_12px_32px_rgba(60,40,80,0.12)] backdrop-blur-md"
      style={{
        backgroundColor: activeScent.surface,
        borderColor: `${activeScent.accentInk}1E`,
      }}
    >
      <ol className="grid grid-cols-3 gap-1.5">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                disabled={!step.clickable}
                onClick={step.onSelect}
                aria-current={isActive ? 'step' : undefined}
                className={`relative flex w-full items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors ${
                  step.clickable ? 'cursor-pointer hover:opacity-85' : 'cursor-default'
                }`}
                style={{
                  color: isActive ? '#FFFFFF' : step.done ? activeScent.accentInk : '#5D5368',
                  backgroundColor: isActive ? 'transparent' : activeScent.surfaceWell,
                }}
              >
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0.6, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.28, ease: LUMA_EASE }}
                    className="absolute inset-0 rounded-xl shadow-xs"
                    style={{ backgroundColor: activeScent.accentInk }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1 whitespace-nowrap">
                  {step.done ? (
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${activeScent.accentInk}22`,
                        color: activeScent.accentInk,
                      }}
                    >
                      <Check className="h-2.5 w-2.5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="tabular-nums opacity-85">{step.num}.</span>
                  )}
                  <span className="sm:hidden">{step.shortLabel}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
