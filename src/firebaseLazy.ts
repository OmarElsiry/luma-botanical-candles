export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

let bundlePromise: Promise<typeof import('./firebaseBundle')> | null = null;

export function loadFirebaseBundle() {
  if (!bundlePromise) {
    bundlePromise = import('./firebaseBundle');
  }
  return bundlePromise;
}
