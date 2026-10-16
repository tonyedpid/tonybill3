import {
  IssuerProfile,
  Customer,
  SavedInvoice,
  InvoiceNumberConfig,
  AppBackupData,
} from '../types';
import { DEFAULT_NUMBER_CONFIG } from '../utils/numbering';

const DB_NAME = 'ThaiTaxInvoiceDB';
const DB_VERSION = 1;

const STORE_ISSUER = 'issuer';
const STORE_CUSTOMERS = 'customers';
const STORE_INVOICES = 'invoices';
const STORE_SETTINGS = 'settings';

// In-memory fallback if IndexedDB is blocked or unavailable
class MemoryFallback {
  issuer: IssuerProfile | null = null;
  customers: Map<string, Customer> = new Map();
  invoices: Map<string, SavedInvoice> = new Map();
  settings: Map<string, unknown> = new Map();

  constructor() {
    this.settings.set('numberConfig', DEFAULT_NUMBER_CONFIG);
  }
}

const memoryFallback = new MemoryFallback();
let isIndexedDBAvailable = true;

/**
 * Opens or initializes the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      isIndexedDBAvailable = false;
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_ISSUER)) {
          db.createObjectStore(STORE_ISSUER, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
          const custStore = db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'id' });
          custStore.createIndex('alias', 'alias', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_INVOICES)) {
          const invStore = db.createObjectStore(STORE_INVOICES, { keyPath: 'id' });
          invStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
          invStore.createIndex('issueDate', 'issueDate', { unique: false });
          invStore.createIndex('customerAlias', 'customerAlias', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to in-memory store', request.error);
        isIndexedDBAvailable = false;
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn('IndexedDB blocked');
      };
    } catch (err) {
      isIndexedDBAvailable = false;
      reject(err);
    }
  });
}

// ---------------- ISSUER STORE ---------------- //

export async function getIssuerProfile(): Promise<IssuerProfile | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ISSUER, 'readonly');
      const store = tx.objectStore(STORE_ISSUER);
      const req = store.get('current');
      req.onsuccess = () => {
        const result = req.result;
        resolve(result ? result.data : null);
      };
      req.onerror = () => resolve(memoryFallback.issuer);
    });
  } catch {
    return memoryFallback.issuer;
  }
}

export async function saveIssuerProfile(profile: IssuerProfile): Promise<void> {
  memoryFallback.issuer = profile;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ISSUER, 'readwrite');
      const store = tx.objectStore(STORE_ISSUER);
      const record = { id: 'current', data: profile, updatedAt: new Date().toISOString() };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Saved issuer profile to memory fallback:', err);
  }
}

// ---------------- CUSTOMER STORE ---------------- //

export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CUSTOMERS, 'readonly');
      const store = tx.objectStore(STORE_CUSTOMERS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result || []);
      };
      req.onerror = () => resolve(Array.from(memoryFallback.customers.values()));
    });
  } catch {
    return Array.from(memoryFallback.customers.values());
  }
}

export async function saveCustomer(customer: Customer): Promise<void> {
  memoryFallback.customers.set(customer.id, customer);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
      const store = tx.objectStore(STORE_CUSTOMERS);
      const req = store.put(customer);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Saved customer to memory fallback:', err);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  memoryFallback.customers.delete(id);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
      const store = tx.objectStore(STORE_CUSTOMERS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Deleted customer in memory fallback:', err);
  }
}

// ---------------- INVOICE STORE ---------------- //

export async function getAllInvoices(): Promise<SavedInvoice[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_INVOICES, 'readonly');
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: SavedInvoice[] = req.result || [];
        // Sort descending by creation date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };
      req.onerror = () => {
        const list = Array.from(memoryFallback.invoices.values());
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };
    });
  } catch {
    const list = Array.from(memoryFallback.invoices.values());
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
}

export async function saveInvoice(invoice: SavedInvoice): Promise<void> {
  memoryFallback.invoices.set(invoice.id, invoice);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INVOICES, 'readwrite');
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.put(invoice);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Saved invoice to memory fallback:', err);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  memoryFallback.invoices.delete(id);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INVOICES, 'readwrite');
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Deleted invoice in memory fallback:', err);
  }
}

// ---------------- NUMBERING SETTINGS STORE ---------------- //

export async function getNumberConfig(): Promise<InvoiceNumberConfig> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('numberConfig');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value as InvoiceNumberConfig);
        } else {
          resolve(DEFAULT_NUMBER_CONFIG);
        }
      };
      req.onerror = () => resolve(DEFAULT_NUMBER_CONFIG);
    });
  } catch {
    return (memoryFallback.settings.get('numberConfig') as InvoiceNumberConfig) || DEFAULT_NUMBER_CONFIG;
  }
}

export async function saveNumberConfig(config: InvoiceNumberConfig): Promise<void> {
  memoryFallback.settings.set('numberConfig', config);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: 'numberConfig', value: config, updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Saved number config to memory fallback:', err);
  }
}

// ---------------- EXPORT / IMPORT DATA ---------------- //

export async function exportAllData(): Promise<AppBackupData> {
  const [issuer, customers, invoices, numberConfig] = await Promise.all([
    getIssuerProfile(),
    getAllCustomers(),
    getAllInvoices(),
    getNumberConfig(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Thai Tax Invoice & Receipt Builder',
    issuer,
    customers,
    invoices,
    numberConfig,
  };
}

export async function importData(
  data: AppBackupData,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string; customerCount: number; invoiceCount: number }> {
  if (!data || typeof data !== 'object') {
    throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
  }

  // Validate structure
  if (!Array.isArray(data.customers) || !Array.isArray(data.invoices)) {
    throw new Error('ไฟล์สำรองข้อมูลขาดโครงสร้างลูกค้าหรือใบกำกับภาษีที่ถูกต้อง');
  }

  if (mode === 'replace') {
    // Clear existing data
    try {
      const db = await openDB();
      const tx = db.transaction([STORE_ISSUER, STORE_CUSTOMERS, STORE_INVOICES, STORE_SETTINGS], 'readwrite');
      tx.objectStore(STORE_ISSUER).clear();
      tx.objectStore(STORE_CUSTOMERS).clear();
      tx.objectStore(STORE_INVOICES).clear();
      tx.objectStore(STORE_SETTINGS).clear();
    } catch {
      memoryFallback.customers.clear();
      memoryFallback.invoices.clear();
      memoryFallback.issuer = null;
    }
  }

  // Restore issuer
  if (data.issuer) {
    await saveIssuerProfile(data.issuer);
  }

  // Restore number config
  if (data.numberConfig) {
    await saveNumberConfig(data.numberConfig);
  }

  // Restore customers
  for (const c of data.customers) {
    await saveCustomer(c);
  }

  // Restore invoices
  for (const inv of data.invoices) {
    await saveInvoice(inv);
  }

  return {
    success: true,
    message: 'นำเข้าข้อมูลสำเร็จ',
    customerCount: data.customers.length,
    invoiceCount: data.invoices.length,
  };
}
