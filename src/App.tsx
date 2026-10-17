import React, { useState, useEffect, useCallback } from 'react';
import {
  ScreenView,
  IssuerProfile,
  Customer,
  SavedInvoice,
  InvoiceNumberConfig,
  LineItem,
  VatMode,
  InvoiceDraft,
  BranchType,
} from './types';
import {
  getIssuerProfile,
  saveIssuerProfile,
  getAllCustomers,
  saveCustomer,
  deleteCustomer,
  getAllInvoices,
  saveInvoice,
  deleteInvoice,
  getNumberConfig,
  saveNumberConfig,
  saveCustomerOrder,
} from './services/db';
import { SAMPLE_ISSUER, SAMPLE_CUSTOMERS } from './services/seed';
import {
  getNextAvailableInvoiceNumber,
  getNextInvoiceNumberFromLatest,
  extractSequenceNumber,
  incrementInvoiceNumber,
} from './utils/numbering';
import { getTodayIsoDate } from './utils/thaiDate';
import { calculateInvoiceTotals, calculateLineTotal } from './utils/calculations';
import { Printer } from 'lucide-react';

import { Navbar } from './components/common/Navbar';
import { InvoiceEditor } from './components/editor/InvoiceEditor';
import { InvoiceDocument } from './components/preview/InvoiceDocument';
import { IssuerSettingsModal } from './components/issuer/IssuerSettingsModal';
import { CustomerModal } from './components/customer/CustomerModal';
import { NumberingSettingsModal } from './components/numbering/NumberingSettingsModal';
import { InvoiceHistoryModal } from './components/history/InvoiceHistoryModal';
import { BackupModal } from './components/backup/BackupModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const INITIAL_LINE_ITEMS: LineItem[] = [
  {
    id: 'item-1',
    description: 'ค่าบริการออกแบบและพัฒนาระบบซอฟต์แวร์ (Software Development)',
    quantity: 1,
    unitPrice: 15000,
    total: 15000,
  },
  {
    id: 'item-2',
    description: 'ค่าบริการดูแลรักษาระบบรายเดือน (Monthly System Maintenance)',
    quantity: 1,
    unitPrice: 3500,
    total: 3500,
  },
];

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('editor');
  const [isInitializing, setIsInitializing] = useState(true);

  // Database states
  const [issuer, setIssuer] = useState<IssuerProfile>(SAMPLE_ISSUER);
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [numberConfig, setNumberConfig] = useState<InvoiceNumberConfig>({
    prefix: 'TK',
    yearFormat: 'be_2',
    separator: ' ',
    sequenceWidth: 3,
    nextSequence: 1,
  });

  // Active saved invoice ID (if editing existing)
  const [activeSavedInvoiceId, setActiveSavedInvoiceId] = useState<string | null>(null);

  // Draft state
  const [draft, setDraft] = useState<InvoiceDraft>({
    invoiceNumber: '',
    poNumber: 'PO-6901',
    contactPerson: 'คุณสมชาย ยอดประสิทธิ์',
    issueDate: getTodayIsoDate(),
    deliveryDate: getTodayIsoDate(),
    selectedCustomerId: 'cust-001',
    customerAlias: 'บจก. เทค พัฒนา',
    buyer: {
      legalName: 'บริษัท เทค พัฒนา ซิสเต็มส์ จำกัด',
      contactPerson: 'คุณสมชาย ยอดประสิทธิ์',
      address: '123/45 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
      taxId: '0105561025782',
      branchType: 'head_office' as BranchType,
      branchNumber: '00000',
      phone: '02-512-3456',
      email: 'finance@techpattana.co.th',
    },
    lineItems: INITIAL_LINE_ITEMS,
    vatMode: '+' as VatMode,
    notes: 'ชำระเงินโดยการโอนเข้าบัญชีธนาคารกรุงเทพ เลขที่ 012-3-45678-9',
  });

  const [isDraftModified, setIsDraftModified] = useState(false);

  // Modal states
  const [isIssuerModalOpen, setIsIssuerModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNumberingModalOpen, setIsNumberingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Load persistent data on initial mount
  const refreshData = useCallback(async () => {
    try {
      const [storedIssuer, storedCustomers, storedInvoices, storedConfig] =
        await Promise.all([
          getIssuerProfile(),
          getAllCustomers(),
          getAllInvoices(),
          getNumberConfig(),
        ]);

      // Seed if fresh
      const finalIssuer: IssuerProfile = storedIssuer || SAMPLE_ISSUER;
      if (!storedIssuer) {
        await saveIssuerProfile(SAMPLE_ISSUER);
      }
      setIssuer(finalIssuer);

      let finalCustomers = storedCustomers;
      if (storedCustomers.length === 0) {
        for (const c of SAMPLE_CUSTOMERS) {
          await saveCustomer(c);
        }
        finalCustomers = SAMPLE_CUSTOMERS;
      }
      setCustomers(finalCustomers);

      setInvoices(storedInvoices);
      setNumberConfig(storedConfig);

      // Generate invoice number if draft is empty
      const existingNumbers = storedInvoices.map((inv) => inv.invoiceNumber);
      const latestInv = storedInvoices.length > 0 ? storedInvoices[0] : null;
      const nextNum = getNextInvoiceNumberFromLatest(
        latestInv?.invoiceNumber,
        storedConfig,
        existingNumbers,
        draft.issueDate
      );
      setDraft((prev) => ({
        ...prev,
        invoiceNumber: prev.invoiceNumber || nextNum.invoiceNumber,
      }));
    } catch (err) {
      console.error('Error initializing database:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [draft.issueDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Draft change listener
  const handleDraftChange = (newDraft: typeof draft) => {
    setDraft(newDraft);
    setIsDraftModified(true);
  };

  // Save Invoice
  const handleSaveInvoice = async () => {
    const totals = calculateInvoiceTotals(draft.lineItems, draft.vatMode);
    const now = new Date().toISOString();

    const invoiceToSave: SavedInvoice = {
      id: activeSavedInvoiceId || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      invoiceNumber: draft.invoiceNumber.trim(),
      poNumber: draft.poNumber.trim(),
      contactPerson: draft.contactPerson.trim(),
      issueDate: draft.issueDate,
      deliveryDate: draft.deliveryDate,
      customerId: draft.selectedCustomerId,
      customerAlias: draft.customerAlias.trim(),
      buyerInfo: { ...draft.buyer },
      issuerInfo: { ...issuer },
      lineItems: draft.lineItems.map((item) => ({
        ...item,
        total: calculateLineTotal(item.quantity, item.unitPrice),
      })),
      vatMode: draft.vatMode,
      totals,
      notes: draft.notes,
      createdAt: activeSavedInvoiceId
        ? invoices.find((i) => i.id === activeSavedInvoiceId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    await saveInvoice(invoiceToSave);

    // If new invoice (not editing old), advance sequence counter if matching
    if (!activeSavedInvoiceId) {
      const nextSeq = Math.max(numberConfig.nextSequence + 1, 1);
      const newConfig = { ...numberConfig, nextSequence: nextSeq };
      await saveNumberConfig(newConfig);
      setNumberConfig(newConfig);
      setActiveSavedInvoiceId(invoiceToSave.id);
    }

    setIsDraftModified(false);
    const updatedInvoices = await getAllInvoices();
    setInvoices(updatedInvoices);
  };

  // Create New Invoice / Reset to fresh draft
  const handleCreateNewInvoice = async () => {
    try {
      const allInvoices = await getAllInvoices();
      setInvoices(allInvoices);
      const config = await getNumberConfig();
      setNumberConfig(config);

      const existingNumbers = allInvoices.map((inv) => inv.invoiceNumber);

      // Determine base number to increment (+1):
      // 1. Prioritize current draft's invoice number on screen (e.g. "01" => "02")
      // 2. Otherwise use the most recent saved invoice
      let baseNumber = draft.invoiceNumber?.trim();

      if (!baseNumber && allInvoices && allInvoices.length > 0) {
        const sorted = [...allInvoices].sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });
        baseNumber = sorted[0]?.invoiceNumber?.trim();
      }

      let nextInvoiceNumber = '';
      let nextSeq = config.nextSequence;

      if (baseNumber) {
        nextInvoiceNumber = incrementInvoiceNumber(baseNumber);
        const extracted = extractSequenceNumber(nextInvoiceNumber);
        if (extracted !== null) {
          nextSeq = extracted;
        }
      } else {
        const gen = getNextAvailableInvoiceNumber(config, existingNumbers, getTodayIsoDate());
        nextInvoiceNumber = gen.invoiceNumber;
        nextSeq = gen.sequence;
      }

      // Advance sequence counter in numberConfig and persist
      const updatedConfig = {
        ...config,
        nextSequence: Math.max(config.nextSequence, nextSeq + 1),
      };
      await saveNumberConfig(updatedConfig);
      setNumberConfig(updatedConfig);

      setActiveSavedInvoiceId(null);
      setDraft({
        invoiceNumber: nextInvoiceNumber,
        poNumber: '',
        contactPerson: '',
        issueDate: getTodayIsoDate(),
        deliveryDate: '',
        selectedCustomerId: undefined,
        customerAlias: '',
        buyer: {
          legalName: '',
          contactPerson: '',
          address: '',
          taxId: '',
          branchType: 'head_office',
          branchNumber: '00000',
          phone: '',
          email: '',
        },
        lineItems: [
          {
            id: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
        vatMode: '+',
        notes: '',
      });
      setIsDraftModified(false);
    } catch (err) {
      console.error('Error creating new invoice:', err);
    }
  };

  // Reset Draft
  const handleResetDraft = () => {
    handleCreateNewInvoice();
  };

  // Open saved invoice
  const handleOpenSavedInvoice = (inv: SavedInvoice) => {
    setActiveSavedInvoiceId(inv.id);
    setDraft({
      invoiceNumber: inv.invoiceNumber,
      poNumber: inv.poNumber || '',
      contactPerson: inv.contactPerson || inv.buyerInfo?.contactPerson || '',
      issueDate: inv.issueDate,
      deliveryDate: inv.deliveryDate || '',
      selectedCustomerId: inv.customerId,
      customerAlias: inv.customerAlias || '',
      buyer: {
        legalName: inv.buyerInfo?.legalName || '',
        contactPerson: inv.buyerInfo?.contactPerson || '',
        address: inv.buyerInfo?.address || '',
        taxId: inv.buyerInfo?.taxId || '',
        branchType: inv.buyerInfo?.branchType || 'head_office',
        branchNumber: inv.buyerInfo?.branchNumber || '00000',
        phone: inv.buyerInfo?.phone || '',
        email: inv.buyerInfo?.email || '',
      },
      lineItems: inv.lineItems || [],
      vatMode: inv.vatMode,
      notes: inv.notes || '',
    });
    setIsDraftModified(false);
    setCurrentScreen('editor');
  };

  // Print Original from history
  const handlePrintOriginalFromHistory = (inv: SavedInvoice) => {
    handleOpenSavedInvoice(inv);
    setCurrentScreen('preview_original');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Print Copy from history
  const handlePrintCopyFromHistory = (inv: SavedInvoice) => {
    handleOpenSavedInvoice(inv);
    setCurrentScreen('preview_copy');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Duplicate as new draft
  const handleDuplicateInvoice = (inv: SavedInvoice) => {
    const existingNumbers = invoices.map((i) => i.invoiceNumber);
    const nextNum = getNextAvailableInvoiceNumber(numberConfig, existingNumbers, getTodayIsoDate());

    setActiveSavedInvoiceId(null);
    setDraft({
      invoiceNumber: nextNum.invoiceNumber,
      poNumber: inv.poNumber ? `${inv.poNumber}-COPY` : '',
      contactPerson: inv.contactPerson || '',
      issueDate: getTodayIsoDate(),
      deliveryDate: '',
      selectedCustomerId: inv.customerId,
      customerAlias: inv.customerAlias || '',
      buyer: {
        legalName: inv.buyerInfo?.legalName || '',
        contactPerson: inv.buyerInfo?.contactPerson || '',
        address: inv.buyerInfo?.address || '',
        taxId: inv.buyerInfo?.taxId || '',
        branchType: inv.buyerInfo?.branchType || 'head_office',
        branchNumber: inv.buyerInfo?.branchNumber || '00000',
        phone: inv.buyerInfo?.phone || '',
        email: inv.buyerInfo?.email || '',
      },
      lineItems: inv.lineItems.map((item) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
      vatMode: inv.vatMode,
      notes: inv.notes || '',
    });
    setIsDraftModified(true);
    setCurrentScreen('editor');
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    await deleteInvoice(id);
    const updated = await getAllInvoices();
    setInvoices(updated);
    if (activeSavedInvoiceId === id) {
      handleResetDraft();
    }
  };

  // Issuer Save
  const handleSaveIssuer = async (profile: IssuerProfile) => {
    await saveIssuerProfile(profile);
    setIssuer(profile);
  };

  // Customer Save & Delete
  const handleSaveCustomer = async (c: Customer) => {
    await saveCustomer(c);
    const list = await getAllCustomers();
    setCustomers(list);
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    const list = await getAllCustomers();
    setCustomers(list);
  };

  const handleReorderCustomers = async (reordered: Customer[]) => {
    setCustomers(reordered);
    await saveCustomerOrder(reordered);
  };

  // Number config save
  const handleSaveNumberConfig = async (config: InvoiceNumberConfig) => {
    await saveNumberConfig(config);
    setNumberConfig(config);
    // If drafting a fresh invoice, update the draft invoice number
    if (!activeSavedInvoiceId) {
      const existing = invoices.map((i) => i.invoiceNumber);
      const next = getNextAvailableInvoiceNumber(config, existing, draft.issueDate);
      setDraft((prev) => ({ ...prev, invoiceNumber: next.invoiceNumber }));
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  const totals = calculateInvoiceTotals(draft.lineItems, draft.vatMode);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">กำลังเปิดระบบฐานข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
        {/* Navigation Bar */}
        <Navbar
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
          onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
          onOpenNumberingModal={() => setIsNumberingModalOpen(true)}
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onPrint={handlePrint}
          isDraftModified={isDraftModified}
        />

        {/* Primary Screen View Area */}
        <main className="flex-1 pb-16">
          {currentScreen === 'editor' && (
            <InvoiceEditor
              draft={draft}
              issuer={issuer}
              customers={customers}
              onDraftChange={handleDraftChange}
              onSaveInvoice={handleSaveInvoice}
              onResetDraft={handleResetDraft}
              onCreateNewInvoice={handleCreateNewInvoice}
              onViewOriginal={() => setCurrentScreen('preview_original')}
              onViewCopy={() => setCurrentScreen('preview_copy')}
              onViewPreview={() => setCurrentScreen('preview_all')}
              onOpenIssuerModal={() => setIsIssuerModalOpen(true)}
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              activeSavedInvoiceId={activeSavedInvoiceId}
              latestInvoiceNumber={invoices.length > 0 ? invoices[0].invoiceNumber : undefined}
            />
          )}

          {/* Combined Screen: แสดงตัวอย่างเอกสาร (ต้นฉบับ + สำเนา) */}
          {currentScreen === 'preview_all' && (
            <div className="py-6 px-4 sm:px-6">
              {/* Document Banner toolbar */}
              <div className="no-print max-w-[210mm] mx-auto mb-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">
                      หน้าแสดงตัวอย่างเอกสารก่อนพิมพ์ (Document Preview)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      แสดงทั้ง ต้นฉบับ (ORIGINAL) และ สำเนา (COPY) พร้อมพิมพ์ออกกระดาษ A4
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('editor')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    กลับไปแก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    สั่งพิมพ์เอกสาร A4 (ทั้ง 2 แผ่น)
                  </button>
                </div>
              </div>

              {/* Both Documents: Original & Copy */}
              <div className="space-y-8 print:space-y-0">
                {/* 1. Original Document */}
                <div className="invoice-print-wrapper">
                  <div className="no-print max-w-[210mm] mx-auto mb-2 flex items-center justify-between px-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      แผ่นที่ 1: ต้นฉบับ / ORIGINAL
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {draft.invoiceNumber ? `เลขที่ ${draft.invoiceNumber}` : ''}
                    </span>
                  </div>
                  <InvoiceDocument
                    designation="original"
                    invoiceNumber={draft.invoiceNumber}
                    poNumber={draft.poNumber}
                    contactPerson={draft.contactPerson}
                    issueDate={draft.issueDate}
                    deliveryDate={draft.deliveryDate}
                    issuer={issuer}
                    buyer={draft.buyer}
                    lineItems={draft.lineItems}
                    vatMode={draft.vatMode}
                    totals={totals}
                    notes={draft.notes}
                  />
                </div>

                {/* Separator / Page Break indicator on screen */}
                <div className="no-print max-w-[210mm] mx-auto py-2 flex items-center gap-3">
                  <div className="flex-1 border-t border-dashed border-slate-300" />
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    สิ้นสุดแผ่นที่ 1 (ต้นฉบับ) • หน้าถัดไปคือแผ่นที่ 2 (สำเนา)
                  </span>
                  <div className="flex-1 border-t border-dashed border-slate-300" />
                </div>

                {/* 2. Copy Document */}
                <div className="invoice-print-wrapper">
                  <div className="no-print max-w-[210mm] mx-auto mb-2 flex items-center justify-between px-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      แผ่นที่ 2: สำเนา / COPY
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {draft.invoiceNumber ? `เลขที่ ${draft.invoiceNumber}` : ''}
                    </span>
                  </div>
                  <InvoiceDocument
                    designation="copy"
                    invoiceNumber={draft.invoiceNumber}
                    poNumber={draft.poNumber}
                    contactPerson={draft.contactPerson}
                    issueDate={draft.issueDate}
                    deliveryDate={draft.deliveryDate}
                    issuer={issuer}
                    buyer={draft.buyer}
                    lineItems={draft.lineItems}
                    vatMode={draft.vatMode}
                    totals={totals}
                    notes={draft.notes}
                  />
                </div>
              </div>
            </div>
          )}

          {currentScreen === 'preview_original' && (
            <div className="py-6 px-4 sm:px-6">
              {/* Document Banner toolbar */}
              <div className="no-print max-w-[210mm] mx-auto mb-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    แสดงตัวอย่างเอกสารต้นฉบับ (ORIGINAL)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('editor')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    กลับไปแก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('preview_all')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    ดูทั้งต้นฉบับและสำเนา
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    สั่งพิมพ์เอกสาร A4
                  </button>
                </div>
              </div>

              {/* Printable Original Document */}
              <InvoiceDocument
                designation="original"
                invoiceNumber={draft.invoiceNumber}
                poNumber={draft.poNumber}
                contactPerson={draft.contactPerson}
                issueDate={draft.issueDate}
                deliveryDate={draft.deliveryDate}
                issuer={issuer}
                buyer={draft.buyer}
                lineItems={draft.lineItems}
                vatMode={draft.vatMode}
                totals={totals}
                notes={draft.notes}
              />
            </div>
          )}

          {currentScreen === 'preview_copy' && (
            <div className="py-6 px-4 sm:px-6">
              {/* Document Banner toolbar */}
              <div className="no-print max-w-[210mm] mx-auto mb-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="text-xs font-bold text-slate-900">
                    แสดงตัวอย่างเอกสารสำเนา (COPY)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('editor')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    กลับไปแก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('preview_all')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    ดูทั้งต้นฉบับและสำเนา
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    สั่งพิมพ์เอกสาร A4
                  </button>
                </div>
              </div>

              {/* Printable Copy Document */}
              <InvoiceDocument
                designation="copy"
                invoiceNumber={draft.invoiceNumber}
                poNumber={draft.poNumber}
                contactPerson={draft.contactPerson}
                issueDate={draft.issueDate}
                deliveryDate={draft.deliveryDate}
                issuer={issuer}
                buyer={draft.buyer}
                lineItems={draft.lineItems}
                vatMode={draft.vatMode}
                totals={totals}
                notes={draft.notes}
              />
            </div>
          )}
        </main>

        {/* Modals */}
        <IssuerSettingsModal
          isOpen={isIssuerModalOpen}
          onClose={() => setIsIssuerModalOpen(false)}
          issuer={issuer}
          onSave={handleSaveIssuer}
        />

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          customers={customers}
          onSaveCustomer={handleSaveCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onReorderCustomers={handleReorderCustomers}
          onSelectCustomer={(c) => {
            setDraft((prev) => ({
              ...prev,
              selectedCustomerId: c.id,
              customerAlias: c.alias,
              vatMode: c.defaultVatMode || prev.vatMode,
              buyer: {
                legalName: c.legalName,
                contactPerson: c.contactPerson || '',
                address: c.address,
                taxId: c.taxId || '',
                branchType: c.branchType || 'head_office',
                branchNumber: c.branchNumber || '00000',
                phone: c.phone || '',
                email: c.email || '',
              },
            }));
            setIsDraftModified(true);
          }}
        />

        <NumberingSettingsModal
          isOpen={isNumberingModalOpen}
          onClose={() => setIsNumberingModalOpen(false)}
          config={numberConfig}
          onSave={handleSaveNumberConfig}
        />

        <InvoiceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          invoices={invoices}
          onOpenInvoice={handleOpenSavedInvoice}
          onPrintOriginal={handlePrintOriginalFromHistory}
          onPrintCopy={handlePrintCopyFromHistory}
          onDuplicateInvoice={handleDuplicateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
        />

        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          onDataChanged={refreshData}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
