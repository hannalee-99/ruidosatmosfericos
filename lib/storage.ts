
const DB_NAME = 'RuidosAtmosfericosDB';
const DB_VERSION = 2;
const STORES = {
  WORKS: 'works',
  SIGNALS: 'signals',
  ABOUT: 'about'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.WORKS)) db.createObjectStore(STORES.WORKS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.SIGNALS)) db.createObjectStore(STORES.SIGNALS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.ABOUT)) db.createObjectStore(STORES.ABOUT, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storage = {
  async getAll(storeName: string): Promise<any[]> {
    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) return [];
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async get(storeName: string, id: string): Promise<any> {
    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) return null;
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async save(storeName: string, item: any): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  async delete(storeName: string, id: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
