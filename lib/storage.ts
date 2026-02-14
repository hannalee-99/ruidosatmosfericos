
const DB_NAME = 'RuidosAtmosfericosDB';
const DB_VERSION = 3; // Incremento de versão para garantir sincronia
const STORES = {
  WORKS: 'works',
  SIGNALS: 'signals',
  ABOUT: 'about'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB não suportado"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORES.WORKS)) {
          db.createObjectStore(STORES.WORKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SIGNALS)) {
          db.createObjectStore(STORES.SIGNALS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ABOUT)) {
          db.createObjectStore(STORES.ABOUT, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const storage = {
  async getAll(storeName: string): Promise<any[]> {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(storeName)) return [];
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Storage getAll Error (${storeName}):`, e);
      return [];
    }
  },
  async get(storeName: string, id: string): Promise<any> {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(storeName)) return null;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Storage get Error (${storeName}, ${id}):`, e);
      return null;
    }
  },
  async save(storeName: string, item: any): Promise<void> {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`Store ${storeName} não existe.`);
      }
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Storage save Error (${storeName}):`, e);
    }
  },
  async delete(storeName: string, id: string): Promise<void> {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(storeName)) return;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Storage delete Error (${storeName}, ${id}):`, e);
    }
  }
};
