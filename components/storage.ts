
/**
 * Utilitário de Armazenamento Robusto (IndexedDB)
 * Garante que imagens em Base64 não estourem o limite do localStorage (5MB).
 */

const DB_NAME = 'RuidosAtmosfericosDB';
const DB_VERSION = 2; // Version incremented to force upgrade for new store if needed
const STORES = {
  WORKS: 'works',
  SIGNALS: 'signals',
  ABOUT: 'about' // New store for profile data
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
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
  });
};

export const storage = {
  async getAll(storeName: string): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      // Verifica se a store existe antes de tentar transacionar (para evitar erros em upgrades parciais)
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]); // Retorna vazio se a store ainda não foi criada corretamente
        return;
      }
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName: string, id: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains(storeName)) {
            resolve(null);
            return;
        }
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },

  async save(storeName: string, item: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(storeName)) {
         // Fallback crítico se a versão do DB não tiver atualizado
         console.warn(`Store ${storeName} not found.`);
         reject("Store not found");
         return;
      }
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
