
import { ScanResult, FileRecord, UserProfile, UserMessage } from '../types';

const DB_NAME = 'SBOM_PLATFORM_DB';
const DB_VERSION = 3;
const STORES = {
  USERS: 'users',
  SCANS: 'scans',
  FILES: 'files',
  MESSAGES: 'messages'
};

class DBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          db.createObjectStore(STORES.USERS, { keyPath: 'email' });
        }
        if (!db.objectStoreNames.contains(STORES.SCANS)) {
          const scansStore = db.createObjectStore(STORES.SCANS, { keyPath: 'id' });
          scansStore.createIndex('userEmail', 'userEmail', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.FILES)) {
          const filesStore = db.createObjectStore(STORES.FILES, { keyPath: 'id' });
          filesStore.createIndex('scanId', 'scanId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
    const db = await this.init();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  async saveUser(user: UserProfile) {
    const store = await this.getStore(STORES.USERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getUser(email: string): Promise<UserProfile | undefined> {
    const store = await this.getStore(STORES.USERS);
    return new Promise((resolve, reject) => {
      const request = store.get(email);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveScan(userEmail: string, scan: ScanResult) {
    const store = await this.getStore(STORES.SCANS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ ...scan, userEmail });
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getScans(userEmail: string): Promise<ScanResult[]> {
    const store = await this.getStore(STORES.SCANS);
    const index = store.index('userEmail');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userEmail);
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveFile(file: FileRecord) {
    const store = await this.getStore(STORES.FILES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(file);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getFilesByScanId(scanId: string): Promise<FileRecord[]> {
    const store = await this.getStore(STORES.FILES);
    const index = store.index('scanId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(scanId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMessage(message: UserMessage) {
    const store = await this.getStore(STORES.MESSAGES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(message);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMessages(): Promise<UserMessage[]> {
    const store = await this.getStore(STORES.MESSAGES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markMessageRead(id: string) {
    const store = await this.getStore(STORES.MESSAGES, 'readwrite');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const msg = getReq.result;
        if (msg) {
          msg.read = true;
          store.put(msg).onsuccess = () => resolve(true);
        } else {
          resolve(false);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const dbService = new DBService();
