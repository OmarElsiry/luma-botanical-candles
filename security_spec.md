# Luma Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **PII Ownership**: Every `/users/{userId}` document is readable and writable only when `request.auth.uid == userId`. Unauthenticated or cross-user reads are denied.
2. **Email Verification Gate**: Creating/updating user delivery profiles, saving custom candle designs, and creating COD orders require `request.auth.token.email_verified == true`.
3. **Master Gate on Subcollections**: `/users/{userId}/designs/{designId}` and `/users/{userId}/blends/{blendId}` check `exists(/databases/$(database)/documents/users/$(userId))` and verify `data.userId == request.auth.uid`.
4. **Immutable Ownership & Timestamps**: `uid`, `userId`, and `createdAt` cannot be modified after creation. `createdAt == request.time` on create; `updatedAt == request.time` on update.
5. **Terminal State Locking on Orders**: Orders start with `status == 'Confirmed'`. A customer may only transition their own order from `'Confirmed'` to `'Cancelled'` (updating only `status` and `updatedAt`); once `'Cancelled'`, no further updates are permitted.
6. **Strict Schema, Bounded Lists & No Shadow Fields**: Every collection validates `.keys().hasAll(...)` and `.keys().hasOnly(...)` and enforces `.size()` limits on all strings. Custom blends strictly bound `fruits` to 1..3 strings, `toppings` to 0..6 strings, and `sweetness` to `[0, 25, 50, 75, 100]`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/u1`
2. Cross-user read of `/users/u2` while signed in as `u1`
3. Unverified email (`email_verified: false`) writing `/orders/LUM-1001`
4. Shadow field injection (`isAdmin: true`) in `/users/u1`
5. Identity spoofing (`userId: 'u2'`) in `/orders/LUM-1001` while signed in as `u1`
6. Oversized `id` (> 128 chars or invalid chars) on `/orders/bad$id`
7. Client-forged `createdAt` timestamp != `request.time`
8. Mutating `total` or `paymentStatus` during an order update
9. Updating an already `'Cancelled'` order back to `'Confirmed'`
10. Blanket `list` query on `/orders` without `where('userId', '==', uid)`
11. Creating `/users/u1/blends/b1` with 4 fruit bases (exceeds max 3) or invalid `sweetness: 150`
12. Injecting a 2000-character string into `customText` on a saved blend or design
