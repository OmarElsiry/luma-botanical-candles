import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, loadFirebaseBundle } from '../firebaseLazy';
import {
  CANDLE_FONTS,
  CANDLE_INKS,
  SCENTS,
  VESSEL_COLORS,
  getScentById,
  type PackSize,
  type ScentId,
  type SmoothieFruitId,
  type SmoothieSizeId,
  type SmoothieToppingId,
  type SweetnessLevel,
  type TrioAddonId,
} from '../data/products';
import {
  type AppRoute,
  type CartItem,
  type CartSummary,
  type CodPaymentMethod,
  type CustomCandleSpec,
  type CustomSmoothieBlendSpec,
  type OrderRecord,
  type UserProfile,
  computeCartSummary,
  makeCustomCandleCartItem,
  makeCustomSmoothieCartItem,
  makeCustomTrioCartItem,
  makeStandardCartItem,
  parseHashRoute,
  routeToHash,
  summarizeCustomCandle,
  summarizeCustomMix,
  summarizeCustomSmoothie,
  updateCartQuantity,
  upsertCartItem,
} from '../utils/commerce';

const CART_KEY = 'luma_cart_v1';
const USER_KEY = 'luma_user_v1';
const ORDERS_KEY = 'luma_orders_v1';

export interface SavedDesignRecord extends CustomCandleSpec {
  id: string;
  createdAt: string;
}

export interface SavedBlendRecord extends CustomSmoothieBlendSpec {
  id: string;
  createdAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function splitDisplayName(displayName: string | null | undefined, email: string | null | undefined): {
  firstName: string;
  surname: string;
} {
  const raw = (displayName ?? '').trim();
  if (raw) {
    const parts = raw.split(/\s+/);
    const firstName = parts[0] || 'Luma';
    const surname = parts.slice(1).join(' ') || 'Member';
    return { firstName, surname };
  }
  const handle = (email ?? 'luma').split('@')[0] || 'Luma';
  return { firstName: handle, surname: 'Member' };
}

function buildItemsSummary(items: CartItem[]): string {
  return items
    .map((item) => {
      if (item.customSmoothie) {
        return `${item.quantity}x ${item.title} (${summarizeCustomSmoothie(item.customSmoothie)})`;
      }
      if (item.customCandle) {
        return `${item.quantity}x ${item.title} (${summarizeCustomCandle(item.customCandle)})`;
      }
      if (item.customMix) {
        return `${item.quantity}x ${item.title} (${summarizeCustomMix(item.customMix, item.addons)})`;
      }
      const sizeLabel = item.packSize === 1 ? 'Single' : item.packSize === 3 ? 'Trio' : '6-Case';
      return `${item.quantity}x ${item.title} (${sizeLabel})`;
    })
    .join('; ')
    .slice(0, 600);
}

interface StoreContextValue {
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  heroIndex: number;
  setHeroIndex: (index: number) => void;
  activeScentId: ScentId;
  setActiveScentId: (id: ScentId) => void;
  cart: CartItem[];
  cartSummary: CartSummary;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (scentId: ScentId, packSize: PackSize, quantity?: number, openDrawer?: boolean) => void;
  addCustomPackToCart: (mix: ScentId[], addonCounts?: Partial<Record<TrioAddonId, number>>) => void;
  addCustomCandleToCart: (spec: CustomCandleSpec, packSize?: PackSize, quantity?: number, openDrawer?: boolean) => void;
  addCustomSmoothieToCart: (spec: CustomSmoothieBlendSpec, quantity?: number, openDrawer?: boolean) => void;
  stepCartItem: (id: string, delta: number) => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;
  cartReviewed: boolean;
  markCartReviewed: () => void;
  authReturnRoute: AppRoute | null;
  setAuthReturnRoute: (next: AppRoute | null) => void;
  flowNotice: string | null;
  setFlowNotice: (msg: string | null) => void;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  emailVerified: boolean;
  firebaseProjectId: string;
  user: UserProfile | null;
  orders: OrderRecord[];
  savedDesigns: SavedDesignRecord[];
  savedBlends: SavedBlendRecord[];
  registerWithEmail: (input: { firstName: string; surname: string; email: string; password: string }) => Promise<void>;
  signInWithEmail: (input: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  saveUserProfile: (profile: {
    firstName: string;
    surname: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  }) => Promise<void>;
  saveCustomDesign: (spec: CustomCandleSpec) => Promise<void>;
  deleteCustomDesign: (designId: string) => Promise<void>;
  saveCustomBlend: (spec: CustomSmoothieBlendSpec) => Promise<void>;
  deleteCustomBlend: (blendId: string) => Promise<void>;
  signOut: () => Promise<void>;
  placeOrder: (shipping: {
    firstName: string;
    surname: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    deliveryNotes?: string;
    paymentMethod: CodPaymentMethod;
  }) => Promise<OrderRecord>;
  cancelOrder: (orderNumber: string) => Promise<void>;
  toastMessage: string | null;
  dismissToast: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseHashRoute(window.location.hash) : { page: 'hero' }
  );
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [activeScentId, setActiveScentId] = useState<ScentId>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseHashRoute(window.location.hash);
      if (parsed.page === 'scent') return parsed.scentId;
    }
    return 'iris';
  });

  const [cart, setCart] = useState<CartItem[]>(() =>
    typeof window !== 'undefined' ? readJson<CartItem[]>(CART_KEY, []) : []
  );
  const [user, setUser] = useState<UserProfile | null>(() =>
    typeof window !== 'undefined' ? readJson<UserProfile | null>(USER_KEY, null) : null
  );
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    typeof window !== 'undefined' ? readJson<OrderRecord[]>(ORDERS_KEY, []) : []
  );
  const [savedDesigns, setSavedDesigns] = useState<SavedDesignRecord[]>([]);
  const [savedBlends, setSavedBlends] = useState<SavedBlendRecord[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartReviewed, setCartReviewed] = useState(false);
  const [authReturnRoute, setAuthReturnRoute] = useState<AppRoute | null>(null);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const firebaseProjectId = firebaseConfig.projectId;
  const firebaseInitializedRef = useRef(false);
  const [firebaseTrigger, setFirebaseTrigger] = useState(0);

  const triggerFirebaseInit = useCallback(() => {
    if (!firebaseInitializedRef.current) {
      firebaseInitializedRef.current = true;
      setFirebaseTrigger((v) => v + 1);
    }
  }, []);

  // Activate Firebase immediately when returning user exists or visiting auth/order/studio pages;
  // otherwise defer until hero initial paint & interactions are idle.
  useEffect(() => {
    if (firebaseInitializedRef.current) return;
    if (
      user !== null ||
      route.page === 'register' ||
      route.page === 'checkout' ||
      route.page === 'design'
    ) {
      triggerFirebaseInit();
      return;
    }
    const timerId = window.setTimeout(() => {
      triggerFirebaseInit();
    }, 4500);
    return () => window.clearTimeout(timerId);
  }, [route.page, user, triggerFirebaseInit]);

  // Firebase Auth state + Firestore profile / orders / saved designs & blends sync
  useEffect(() => {
    if (firebaseTrigger === 0) return;

    let cancelled = false;
    let unsubAuth: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;
    let unsubDesigns: (() => void) | null = null;
    let unsubBlends: (() => void) | null = null;

    void loadFirebaseBundle().then((fb) => {
      if (cancelled) return;
      void fb.testFirestoreConnection();

      unsubAuth = fb.onAuthStateChanged(fb.auth, async (fbUser) => {
      if (unsubOrders) {
        unsubOrders();
        unsubOrders = null;
      }
      if (unsubDesigns) {
        unsubDesigns();
        unsubDesigns = null;
      }
      if (unsubBlends) {
        unsubBlends();
        unsubBlends = null;
      }

      setFirebaseUser(fbUser);
      setEmailVerified(Boolean(fbUser?.emailVerified));
      setAuthReady(true);

      if (!fbUser) {
        setSavedDesigns([]);
        setSavedBlends([]);
        return;
      }

      const userRef = fb.doc(fb.db, 'users', fbUser.uid);
      try {
        const snap = await fb.getDoc(userRef);
        const derived = splitDisplayName(fbUser.displayName, fbUser.email);
        if (snap.exists()) {
          const data = snap.data();
          const firstName = String(data.firstName || derived.firstName);
          const surname = String(data.surname || derived.surname);
          setUser({
            uid: fbUser.uid,
            firstName,
            surname,
            name: `${firstName} ${surname}`.trim(),
            email: String(data.email || fbUser.email || ''),
            emailVerified: fbUser.emailVerified,
            phone: String(data.phone || ''),
            address: String(data.address || ''),
            city: String(data.city || ''),
            postalCode: String(data.postalCode || ''),
            createdAt:
              typeof data.createdAt?.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          });
          if (Boolean(data.emailVerified) !== fbUser.emailVerified) {
            await fb.updateDoc(userRef, {
              emailVerified: fbUser.emailVerified,
              updatedAt: fb.serverTimestamp(),
            }).catch(() => {});
          }
        } else {
          const profilePayload: UserProfile = {
            uid: fbUser.uid,
            firstName: derived.firstName,
            surname: derived.surname,
            name: `${derived.firstName} ${derived.surname}`.trim(),
            email: fbUser.email || '',
            emailVerified: fbUser.emailVerified,
            phone: '',
            address: '',
            city: '',
            postalCode: '',
            createdAt: new Date().toISOString(),
          };
          setUser(profilePayload);
          await fb.setDoc(userRef, {
            uid: fbUser.uid,
            firstName: derived.firstName,
            surname: derived.surname,
            email: fbUser.email || '',
            emailVerified: fbUser.emailVerified,
            phone: '',
            address: '',
            city: '',
            postalCode: '',
            createdAt: fb.serverTimestamp(),
            updatedAt: fb.serverTimestamp(),
          });
        }
      } catch (error) {
        fb.handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
      }

      // Listen to user's orders
      const ordersQ = fb.query(
        fb.collection(fb.db, 'orders'),
        fb.where('userId', '==', fbUser.uid),
        fb.orderBy('createdAt', 'desc')
      );
      unsubOrders = fb.onSnapshot(
        ordersQ,
        (snapshot) => {
          const cloudOrders: OrderRecord[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              orderNumber: String(data.orderNumber || d.id),
              placedAt:
                typeof data.createdAt?.toDate === 'function'
                  ? data.createdAt.toDate().toISOString()
                  : new Date().toISOString(),
              items: Array.isArray(data.items)
                ? (data.items as CartItem[])
                : [
                    {
                      id: `${d.id}-summary`,
                      scentId: 'iris',
                      title: String(data.itemsSummary || 'Luma Candle Order'),
                      packSize: 1,
                      unitPrice: Number(data.subtotal || data.total || 0),
                      quantity: 1,
                    },
                  ],
              subtotal: Number(data.subtotal || 0),
              shipping: Number(data.shipping || 0),
              total: Number(data.total || 0),
              firstName: String(data.firstName || ''),
              surname: String(data.surname || ''),
              customerName: String(data.customerName || ''),
              customerEmail: String(data.customerEmail || ''),
              customerPhone: String(data.customerPhone || ''),
              shippingAddress: String(data.shippingAddress || ''),
              deliveryNotes: data.deliveryNotes ? String(data.deliveryNotes) : undefined,
              paymentMethod: (data.paymentMethod === 'cod-pos' ? 'cod-pos' : 'cod') as CodPaymentMethod,
              paymentStatus: 'Cash Due on Delivery',
              status: data.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
            };
          });
          setOrders((prevLocal) => {
            const cloudIds = new Set(cloudOrders.map((o) => o.orderNumber));
            const localOnly = prevLocal.filter((o) => !cloudIds.has(o.orderNumber));
            return [...cloudOrders, ...localOnly];
          });
        },
        (error) => {
          if (error instanceof Error && error.message.toLowerCase().includes('index')) {
            return;
          }
          fb.handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      );

      // Listen to saved custom candle designs
      const designsQ = fb.query(
        fb.collection(fb.db, 'users', fbUser.uid, 'designs'),
        fb.where('userId', '==', fbUser.uid)
      );
      unsubDesigns = fb.onSnapshot(
        designsQ,
        (snapshot) => {
          const list: SavedDesignRecord[] = snapshot.docs.map((d) => {
            const data = d.data();
            const vColorId = String(data.vesselColorId || 'ivory');
            const matchedVessel = VESSEL_COLORS.find((v) => v.id === vColorId);
            const sId = (data.scentId || 'iris') as ScentId;
            const fId = (data.fontId || 'cormorant') as CustomCandleSpec['fontId'];
            const iId = (data.inkId || 'charcoal') as CustomCandleSpec['inkId'];
            const fontLabel = CANDLE_FONTS.find((f) => f.id === fId)?.name ?? 'Cormorant';
            const inkOpt = CANDLE_INKS.find((i) => i.id === iId) ?? CANDLE_INKS[0];
            const inkHex = iId === 'botanical' ? getScentById(sId).accentInk : inkOpt.hex;
            return {
              id: d.id,
              vesselColorId: vColorId,
              vesselColorName: matchedVessel ? matchedVessel.name : 'Custom Kiln Glaze',
              vesselColorHex: String(data.vesselColorHex || '#F6F1E7'),
              scentId: sId,
              customText: String(data.customText || ''),
              customSubtext: String(data.customSubtext || ''),
              fontId: fId,
              fontLabel,
              inkId: iId,
              inkHex,
              createdAt:
                typeof data.createdAt?.toDate === 'function'
                  ? data.createdAt.toDate().toISOString()
                  : new Date().toISOString(),
            };
          });
          setSavedDesigns(list);
        },
        (error) => {
          fb.handleFirestoreError(error, OperationType.LIST, `users/${fbUser.uid}/designs`);
        }
      );
      // Listen to saved custom smoothie blends
      const blendsQ = fb.query(
        fb.collection(fb.db, 'users', fbUser.uid, 'blends'),
        fb.where('userId', '==', fbUser.uid)
      );
      unsubBlends = fb.onSnapshot(
        blendsQ,
        (snapshot) => {
          const list: SavedBlendRecord[] = snapshot.docs.map((d) => {
            const data = d.data();
            const fontId = (data.fontId || 'cormorant') as CustomSmoothieBlendSpec['fontId'];
            const fontLabel = CANDLE_FONTS.find((f) => f.id === fontId)?.name ?? 'Cormorant';
            const fruitsRaw: SmoothieFruitId[] = Array.isArray(data.fruits)
              ? (data.fruits as SmoothieFruitId[])
              : ['strawberry'];
            const toppingsRaw: SmoothieToppingId[] = Array.isArray(data.toppings)
              ? (data.toppings as SmoothieToppingId[])
              : [];
            const sweetnessVal = Number(data.sweetness);
            const sweetness = ([0, 25, 50, 75, 100].includes(sweetnessVal) ? sweetnessVal : 50) as SweetnessLevel;
            const size = (['12oz', '16oz', 'pack3'].includes(String(data.size)) ? data.size : '16oz') as SmoothieSizeId;
            return {
              id: d.id,
              fruits: fruitsRaw.slice(0, 3),
              toppings: toppingsRaw.slice(0, 6),
              sweetness,
              size,
              customText: String(data.customText || ''),
              fontId,
              fontLabel,
              createdAt:
                typeof data.createdAt?.toDate === 'function'
                  ? data.createdAt.toDate().toISOString()
                  : new Date().toISOString(),
            };
          });
          setSavedBlends(list);
        },
        (error) => {
          fb.handleFirestoreError(error, OperationType.LIST, `users/${fbUser.uid}/blends`);
        }
      );
      });
    });

    return () => {
      cancelled = true;
      if (unsubAuth) unsubAuth();
      if (unsubOrders) unsubOrders();
      if (unsubDesigns) unsubDesigns();
      if (unsubBlends) unsubBlends();
    };
  }, [firebaseTrigger]);

  // Sync hash navigation & active pastel mood
  useEffect(() => {
    const onHashChange = () => {
      const next = parseHashRoute(window.location.hash);
      setRoute(next);
      if (next.page === 'scent') {
        setActiveScentId(next.scentId);
        const idx = SCENTS.findIndex((s) => s.id === next.scentId);
        if (idx >= 0) setHeroIndex(idx);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSetHeroIndex = useCallback((index: number) => {
    setHeroIndex(index);
    const scent = SCENTS[index];
    if (scent) {
      setActiveScentId(scent.id);
    }
  }, []);

  const handleSetActiveScentId = useCallback((id: ScentId) => {
    setActiveScentId(id);
    const idx = SCENTS.findIndex((s) => s.id === id);
    if (idx >= 0) {
      setHeroIndex(idx);
    }
  }, []);

  useEffect(() => {
    const isHero = route.page === 'hero';
    document.documentElement.classList.toggle('is-hero-route', isHero);
    const currentScent =
      route.page === 'hero'
        ? SCENTS[heroIndex] ?? SCENTS[0]
        : route.page === 'scent'
          ? getScentById(route.scentId)
          : getScentById(activeScentId);
    document.body.style.backgroundColor = currentScent.bg;
  }, [route, heroIndex, activeScentId]);

  useEffect(() => writeJson(CART_KEY, cart), [cart]);
  useEffect(() => {
    if (user) {
      writeJson(USER_KEY, user);
    } else {
      try {
        window.localStorage.removeItem(USER_KEY);
      } catch {
        // ignore
      }
    }
  }, [user]);
  useEffect(() => writeJson(ORDERS_KEY, orders), [orders]);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const navigate = useCallback((next: AppRoute) => {
    const targetHash = routeToHash(next);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setRoute(next);
    if (next.page === 'scent') {
      setActiveScentId(next.scentId);
      const idx = SCENTS.findIndex((s) => s.id === next.scentId);
      if (idx >= 0) setHeroIndex(idx);
    }
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const addToCart = useCallback(
    (scentId: ScentId, packSize: PackSize, quantity = 1, openDrawer = true) => {
      const item = makeStandardCartItem(scentId, packSize, quantity);
      setCart((prev) => upsertCartItem(prev, item));
      setCartReviewed(false);
      if (openDrawer) {
        setIsCartOpen(true);
      } else {
        setToastMessage(`Added ${item.title} (${packSize === 1 ? 'Single' : packSize === 3 ? 'Trio Set' : '6-Case'})`);
      }
    },
    []
  );

  const addCustomPackToCart = useCallback(
    (mix: ScentId[], addonCounts?: Partial<Record<TrioAddonId, number>>) => {
      const item = makeCustomTrioCartItem(mix, addonCounts);
      setCart((prev) => upsertCartItem(prev, item));
      setCartReviewed(false);
      setIsCartOpen(true);
    },
    []
  );

  const addCustomCandleToCart = useCallback(
    (spec: CustomCandleSpec, packSize: PackSize = 1, quantity = 1, openDrawer = true) => {
      const item = makeCustomCandleCartItem(spec, packSize, quantity);
      setCart((prev) => upsertCartItem(prev, item));
      setCartReviewed(false);
      if (openDrawer) {
        setIsCartOpen(true);
      } else {
        setToastMessage(`Added ${item.title}`);
      }
    },
    []
  );

  const addCustomSmoothieToCart = useCallback(
    (spec: CustomSmoothieBlendSpec, quantity = 1, openDrawer = true) => {
      const item = makeCustomSmoothieCartItem(spec, quantity);
      setCart((prev) => upsertCartItem(prev, item));
      setCartReviewed(false);
      if (openDrawer) {
        setIsCartOpen(true);
      } else {
        setToastMessage(`Added ${item.title}`);
      }
    },
    []
  );

  const stepCartItem = useCallback((id: string, delta: number) => {
    setCart((prev) => updateCartQuantity(prev, id, delta));
  }, []);

  const removeCartItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartReviewed(false);
  }, []);

  const markCartReviewed = useCallback(() => {
    setCartReviewed(true);
  }, []);

  const registerWithEmail = useCallback(
    async (input: { firstName: string; surname: string; email: string; password: string }) => {
      triggerFirebaseInit();
      const fb = await loadFirebaseBundle();
      const first = input.firstName.trim();
      const last = input.surname.trim();
      const fullName = `${first} ${last}`.trim();
      const cred = await fb.createUserWithEmailAndPassword(fb.auth, input.email.trim(), input.password);
      await fb.updateProfile(cred.user, { displayName: fullName });
      await fb.sendEmailVerification(cred.user);

      const profilePath = `users/${cred.user.uid}`;
      try {
        await fb.setDoc(fb.doc(fb.db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          firstName: first,
          surname: last,
          email: input.email.trim(),
          emailVerified: cred.user.emailVerified,
          phone: '',
          address: '',
          city: '',
          postalCode: '',
          createdAt: fb.serverTimestamp(),
          updatedAt: fb.serverTimestamp(),
        });
      } catch (error) {
        fb.handleFirestoreError(error, OperationType.CREATE, profilePath);
      }

      setUser({
        uid: cred.user.uid,
        firstName: first,
        surname: last,
        name: fullName,
        email: input.email.trim(),
        emailVerified: cred.user.emailVerified,
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        createdAt: new Date().toISOString(),
      });
      setEmailVerified(cred.user.emailVerified);
    },
    [triggerFirebaseInit]
  );

  const signInWithEmail = useCallback(
    async (input: { email: string; password: string }) => {
      triggerFirebaseInit();
      const fb = await loadFirebaseBundle();
      const cred = await fb.signInWithEmailAndPassword(fb.auth, input.email.trim(), input.password);
      setEmailVerified(cred.user.emailVerified);
    },
    [triggerFirebaseInit]
  );

  const signInWithGoogle = useCallback(async () => {
    triggerFirebaseInit();
    const fb = await loadFirebaseBundle();
    const cred = await fb.signInWithPopup(fb.auth, fb.googleProvider);
    setEmailVerified(cred.user.emailVerified);
  }, [triggerFirebaseInit]);

  const resendVerificationEmail = useCallback(async () => {
    const fb = await loadFirebaseBundle();
    if (!fb.auth.currentUser) throw new Error('No signed-in user.');
    await fb.sendEmailVerification(fb.auth.currentUser);
  }, []);

  const refreshVerificationStatus = useCallback(async (): Promise<boolean> => {
    const fb = await loadFirebaseBundle();
    if (!fb.auth.currentUser) return false;
    await fb.reload(fb.auth.currentUser);
    const verified = Boolean(fb.auth.currentUser.emailVerified);
    setEmailVerified(verified);
    setFirebaseUser(fb.auth.currentUser);
    if (verified && user) {
      setUser({ ...user, emailVerified: true });
      const userRef = fb.doc(fb.db, 'users', fb.auth.currentUser.uid);
      await fb.updateDoc(userRef, {
        emailVerified: true,
        updatedAt: fb.serverTimestamp(),
      }).catch(() => {});
    }
    return verified;
  }, [user]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const fb = await loadFirebaseBundle();
    await fb.sendPasswordResetEmail(fb.auth, email.trim());
  }, []);

  const saveUserProfile = useCallback(
    async (profile: {
      firstName: string;
      surname: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
    }) => {
      const fb = await loadFirebaseBundle();
      const first = profile.firstName.trim();
      const last = profile.surname.trim();
      const updatedLocal: UserProfile = {
        uid: fb.auth.currentUser?.uid ?? user?.uid,
        firstName: first,
        surname: last,
        name: `${first} ${last}`.trim(),
        email: fb.auth.currentUser?.email ?? user?.email ?? '',
        emailVerified: fb.auth.currentUser?.emailVerified ?? user?.emailVerified ?? false,
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
        postalCode: profile.postalCode.trim(),
        createdAt: user?.createdAt ?? new Date().toISOString(),
      };
      setUser(updatedLocal);

      if (fb.auth.currentUser) {
        const path = `users/${fb.auth.currentUser.uid}`;
        try {
          await fb.updateDoc(fb.doc(fb.db, 'users', fb.auth.currentUser.uid), {
            firstName: first,
            surname: last,
            emailVerified: fb.auth.currentUser.emailVerified,
            phone: profile.phone.trim(),
            address: profile.address.trim(),
            city: profile.city.trim(),
            postalCode: profile.postalCode.trim(),
            updatedAt: fb.serverTimestamp(),
          });
        } catch (error) {
          fb.handleFirestoreError(error, OperationType.UPDATE, path);
        }
      }
    },
    [user]
  );

  const saveCustomDesign = useCallback(async (spec: CustomCandleSpec) => {
    const fb = await loadFirebaseBundle();
    if (!fb.auth.currentUser) {
      throw new Error('Sign in with a verified email to save designs to your studio.');
    }
    if (!fb.auth.currentUser.emailVerified) {
      throw new Error('Verify your email address first to save designs.');
    }
    const designId = `design_${Date.now()}`;
    const path = `users/${fb.auth.currentUser.uid}/designs/${designId}`;
    try {
      await fb.setDoc(fb.doc(fb.db, 'users', fb.auth.currentUser.uid, 'designs', designId), {
        id: designId,
        userId: fb.auth.currentUser.uid,
        vesselColorId: spec.vesselColorId,
        vesselColorHex: spec.vesselColorHex,
        scentId: spec.scentId,
        customText: spec.customText.trim().slice(0, 32),
        customSubtext: (spec.customSubtext ?? '').trim().slice(0, 32),
        fontId: spec.fontId,
        inkId: spec.inkId,
        createdAt: fb.serverTimestamp(),
      });
      setToastMessage('Saved custom candle design to your studio');
    } catch (error) {
      fb.handleFirestoreError(error, OperationType.CREATE, path);
    }
  }, []);

  const deleteCustomDesign = useCallback(async (designId: string) => {
    const fb = await loadFirebaseBundle();
    if (!fb.auth.currentUser) return;
    const path = `users/${fb.auth.currentUser.uid}/designs/${designId}`;
    try {
      await fb.deleteDoc(fb.doc(fb.db, 'users', fb.auth.currentUser.uid, 'designs', designId));
    } catch (error) {
      fb.handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, []);

  const saveCustomBlend = useCallback(async (spec: CustomSmoothieBlendSpec) => {
    const fb = await loadFirebaseBundle();
    if (!fb.auth.currentUser) {
      throw new Error('Sign in with a verified email to save blends to your studio.');
    }
    if (!fb.auth.currentUser.emailVerified) {
      throw new Error('Verify your email address first to save blends.');
    }
    const cleanFruits = spec.fruits.slice(0, 3);
    if (cleanFruits.length === 0) {
      throw new Error('Select at least 1 fruit base before saving.');
    }
    const blendId = `blend_${Date.now()}`;
    const path = `users/${fb.auth.currentUser.uid}/blends/${blendId}`;
    try {
      await fb.setDoc(fb.doc(fb.db, 'users', fb.auth.currentUser.uid, 'blends', blendId), {
        id: blendId,
        userId: fb.auth.currentUser.uid,
        fruits: cleanFruits,
        toppings: spec.toppings.slice(0, 6),
        sweetness: spec.sweetness,
        size: spec.size,
        customText: spec.customText.trim().slice(0, 28),
        fontId: spec.fontId,
        createdAt: fb.serverTimestamp(),
      });
      setToastMessage('Saved custom smoothie blend to your studio');
    } catch (error) {
      fb.handleFirestoreError(error, OperationType.CREATE, path);
    }
  }, []);

  const deleteCustomBlend = useCallback(async (blendId: string) => {
    const fb = await loadFirebaseBundle();
    if (!fb.auth.currentUser) return;
    const path = `users/${fb.auth.currentUser.uid}/blends/${blendId}`;
    try {
      await fb.deleteDoc(fb.doc(fb.db, 'users', fb.auth.currentUser.uid, 'blends', blendId));
    } catch (error) {
      fb.handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, []);

  const signOut = useCallback(async () => {
    const fb = await loadFirebaseBundle();
    await fb.signOut(fb.auth);
    setUser(null);
    setEmailVerified(false);
    setSavedDesigns([]);
    setSavedBlends([]);
    setToastMessage('Signed out');
  }, []);

  const cartSummary = useMemo(() => computeCartSummary(cart), [cart]);

  const placeOrder = useCallback(
    async (shipping: {
      firstName: string;
      surname: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      postalCode: string;
      deliveryNotes?: string;
      paymentMethod: CodPaymentMethod;
    }): Promise<OrderRecord> => {
      const fb = await loadFirebaseBundle();
      if (!fb.auth.currentUser) {
        throw new Error('Please sign in or create a Luma account before placing an order.');
      }
      if (!fb.auth.currentUser.emailVerified) {
        throw new Error('Please verify your email address before placing your COD order.');
      }
      if (cart.length === 0) {
        throw new Error('Your cart is empty. Add blends before placing an order.');
      }

      const summary = computeCartSummary(cart);
      const first = shipping.firstName.trim();
      const last = shipping.surname.trim();
      const fullName = `${first} ${last}`.trim();
      const orderNumber = `LUM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
      const fullAddress = `${shipping.address.trim()}, ${shipping.city.trim()} ${shipping.postalCode.trim()}`;

      const order: OrderRecord = {
        orderNumber,
        placedAt: new Date().toISOString(),
        items: cart,
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        total: summary.total,
        firstName: first,
        surname: last,
        customerName: fullName,
        customerEmail: shipping.email.trim(),
        customerPhone: shipping.phone.trim(),
        shippingAddress: fullAddress,
        deliveryNotes: shipping.deliveryNotes?.trim() || undefined,
        paymentMethod: shipping.paymentMethod,
        paymentStatus: 'Cash Due on Delivery',
        status: 'Confirmed',
      };

      const orderPath = `orders/${orderNumber}`;
      try {
        await fb.setDoc(fb.doc(fb.db, 'orders', orderNumber), {
          orderNumber,
          userId: fb.auth.currentUser.uid,
          firstName: first,
          surname: last,
          customerName: fullName,
          customerEmail: shipping.email.trim(),
          customerPhone: shipping.phone.trim(),
          shippingAddress: fullAddress,
          deliveryNotes: shipping.deliveryNotes?.trim().slice(0, 240) || '',
          paymentMethod: shipping.paymentMethod,
          paymentStatus: 'Cash Due on Delivery',
          subtotal: summary.subtotal,
          shipping: summary.shipping,
          total: summary.total,
          itemCount: Math.max(1, summary.totalItems),
          itemsSummary: buildItemsSummary(cart),
          status: 'Confirmed',
          createdAt: fb.serverTimestamp(),
          updatedAt: fb.serverTimestamp(),
        });

        await fb.updateDoc(fb.doc(fb.db, 'users', fb.auth.currentUser.uid), {
          firstName: first,
          surname: last,
          phone: shipping.phone.trim(),
          address: shipping.address.trim(),
          city: shipping.city.trim(),
          postalCode: shipping.postalCode.trim(),
          updatedAt: fb.serverTimestamp(),
        }).catch(() => {});
      } catch (error) {
        fb.handleFirestoreError(error, OperationType.CREATE, orderPath);
      }

      setOrders((prev) => [order, ...prev]);
      setCart([]);
      setCartReviewed(false);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              firstName: first,
              surname: last,
              name: fullName,
              phone: shipping.phone.trim(),
              address: shipping.address.trim(),
              city: shipping.city.trim(),
              postalCode: shipping.postalCode.trim(),
            }
          : prev
      );
      return order;
    },
    [cart]
  );

  const cancelOrder = useCallback(async (orderNumber: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === orderNumber && o.status === 'Confirmed' ? { ...o, status: 'Cancelled' } : o))
    );
    const fb = await loadFirebaseBundle();
    if (fb.auth.currentUser && fb.auth.currentUser.emailVerified) {
      const orderPath = `orders/${orderNumber}`;
      try {
        await fb.updateDoc(fb.doc(fb.db, 'orders', orderNumber), {
          status: 'Cancelled',
          updatedAt: fb.serverTimestamp(),
        });
      } catch (error) {
        if (error instanceof Error && !error.message.includes('NOT_FOUND')) {
          fb.handleFirestoreError(error, OperationType.UPDATE, orderPath);
        }
      }
    }
  }, []);

  const value: StoreContextValue = {
    route,
    navigate,
    heroIndex,
    setHeroIndex: handleSetHeroIndex,
    activeScentId,
    setActiveScentId: handleSetActiveScentId,
    cart,
    cartSummary,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    addToCart,
    addCustomPackToCart,
    addCustomCandleToCart,
    addCustomSmoothieToCart,
    stepCartItem,
    removeCartItem,
    clearCart,
    cartReviewed,
    markCartReviewed,
    authReturnRoute,
    setAuthReturnRoute,
    flowNotice,
    setFlowNotice,
    firebaseUser,
    authReady,
    emailVerified,
    firebaseProjectId,
    user,
    orders,
    savedDesigns,
    savedBlends,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    resendVerificationEmail,
    refreshVerificationStatus,
    sendPasswordReset,
    saveUserProfile,
    saveCustomDesign,
    deleteCustomDesign,
    saveCustomBlend,
    deleteCustomBlend,
    signOut,
    placeOrder,
    cancelOrder,
    toastMessage,
    dismissToast: () => setToastMessage(null),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
