export type BranchType = 'head_office' | 'branch';

export type VatMode = '0' | '+' | '-'; 
// '0': No VAT (อัตราศูนย์ / ไม่คิด VAT)
// '+': VAT Added (ราคาแยกภาษีมูลค่าเพิ่ม 7%)
// '-': VAT Included (ราคารวมภาษีมูลค่าเพิ่ม 7% แล้ว)

export interface IssuerProfile {
  businessName: string;
  address: string;
  branchType: BranchType;
  branchNumber: string; // e.g. "00000" for head office, "00001" for branch
  taxId: string; // 13 digits
  phone: string;
  email: string;
  logoDataUrl?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  alias: string; // "ชื่อเรียก" (unique after normalization)
  legalName: string; // "ชื่อผู้ซื้อ/ผู้รับบริการ"
  contactPerson: string;
  address: string;
  taxId: string; // 13 digits (or empty for non-tax registered)
  branchType: BranchType;
  branchNumber: string;
  defaultVatMode: VatMode;
  phone?: string;
  email?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // satang-accurate rounded line total
}

export interface InvoiceTotals {
  subtotal: number; // ราคาสินค้าและบริการ (ก่อนภาษี)
  vatRate: number; // 0.07 or 0
  vatAmount: number; // ภาษีมูลค่าเพิ่ม 7%
  netTotal: number; // ยอดรวมสุทธิ
  bahtText: string; // จำนวนเงินตัวอักษร
}

export type YearFormat = 'be_2' | 'be_4' | 'ad_2' | 'ad_4' | 'none';

export interface InvoiceNumberConfig {
  prefix: string; // e.g. "TK" or "INV"
  yearFormat: YearFormat; // e.g. "be_2" gives "69", "be_4" gives "2569"
  separator: string; // e.g. " " or "-" or "/"
  sequenceWidth: number; // e.g. 3 => "021"
  nextSequence: number; // e.g. 21
}

export interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  contactPerson: string;
  issueDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  customerId?: string;
  customerAlias: string;
  buyerInfo: {
    legalName: string;
    contactPerson: string;
    address: string;
    taxId: string;
    branchType: BranchType;
    branchNumber: string;
    phone: string;
    email: string;
  };
  issuerInfo: IssuerProfile;
  lineItems: LineItem[];
  vatMode: VatMode;
  totals: InvoiceTotals;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScreenView = 'editor' | 'preview_original' | 'preview_copy' | 'preview_all';

export interface InvoiceDraft {
  invoiceNumber: string;
  poNumber: string;
  contactPerson: string;
  issueDate: string;
  deliveryDate: string;
  selectedCustomerId?: string;
  customerAlias: string;
  buyer: {
    legalName: string;
    contactPerson: string;
    address: string;
    taxId: string;
    branchType: BranchType;
    branchNumber: string;
    phone: string;
    email: string;
  };
  lineItems: LineItem[];
  vatMode: VatMode;
  notes: string;
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  appName: string;
  issuer: IssuerProfile | null;
  customers: Customer[];
  invoices: SavedInvoice[];
  numberConfig: InvoiceNumberConfig;
}
