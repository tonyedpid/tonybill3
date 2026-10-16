import React, { useState } from 'react';
import {
  Customer,
  IssuerProfile,
  LineItem,
  VatMode,
  InvoiceTotals,
  BranchType,
  InvoiceDraft,
} from '../../types';
import {
  calculateInvoiceTotals,
  calculateLineTotal,
  formatCurrency,
} from '../../utils/calculations';
import { formatThaiDate } from '../../utils/thaiDate';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Search,
  Eye,
  AlertTriangle,
  Building,
  Check,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Props {
  draft: InvoiceDraft;
  issuer: IssuerProfile;
  customers: Customer[];
  onDraftChange: (draft: InvoiceDraft) => void;
  onSaveInvoice: () => Promise<void>;
  onResetDraft: () => void;
  onViewOriginal: () => void;
  onViewCopy: () => void;
  onOpenIssuerModal: () => void;
  onOpenCustomerModal: () => void;
  activeSavedInvoiceId: string | null;
}

export const InvoiceEditor: React.FC<Props> = ({
  draft,
  issuer,
  customers,
  onDraftChange,
  onSaveInvoice,
  onResetDraft,
  onViewOriginal,
  onViewCopy,
  onOpenIssuerModal,
  onOpenCustomerModal,
  activeSavedInvoiceId,
}) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recalculate totals immediately
  const totals: InvoiceTotals = calculateInvoiceTotals(draft.lineItems, draft.vatMode);

  // Customer filter
  const filteredCustomers = customers.filter(
    (c) =>
      c.alias.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.legalName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.taxId && c.taxId.includes(customerSearch))
  );

  const handleSelectCustomer = (c: Customer) => {
    onDraftChange({
      ...draft,
      selectedCustomerId: c.id,
      customerAlias: c.alias,
      vatMode: c.defaultVatMode || draft.vatMode,
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
    });
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    onDraftChange({
      ...draft,
      lineItems: [...draft.lineItems, newItem],
    });
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = draft.lineItems.filter((_, i) => i !== index);
    onDraftChange({
      ...draft,
      lineItems: updated.length > 0 ? updated : [],
    });
  };

  const handleLineItemChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    value: string | number
  ) => {
    const updated = [...draft.lineItems];
    const item = { ...updated[index] };

    if (field === 'description') {
      item.description = String(value);
    } else if (field === 'quantity') {
      const q = typeof value === 'number' ? value : parseFloat(value);
      item.quantity = isNaN(q) ? 0 : q;
      item.total = calculateLineTotal(item.quantity, item.unitPrice);
    } else if (field === 'unitPrice') {
      const p = typeof value === 'number' ? value : parseFloat(value);
      item.unitPrice = isNaN(p) ? 0 : p;
      item.total = calculateLineTotal(item.quantity, item.unitPrice);
    }

    updated[index] = item;
    onDraftChange({ ...draft, lineItems: updated });
  };

  const handleSave = async () => {
    if (!draft.invoiceNumber.trim()) {
      alert('กรุณาระบุเลขที่ใบกำกับ');
      return;
    }
    if (draft.lineItems.length === 0) {
      alert('กรุณาเพิ่มรายการสินค้าหรือบริการอย่างน้อย 1 รายการ');
      return;
    }

    await onSaveInvoice();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Alert for A4 Capacity if line items > 12 */}
      {draft.lineItems.length > 12 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>คำเตือนการพิมพ์:</strong> คุณมีรายการสินค้า {draft.lineItems.length} รายการ (เกิน 12 รายการ) เอกสารอาจขยายเกิน 1 หน้า A4 ในการพิมพ์ กรุณาตรวจสอบในหน้า &quot;ต้นฉบับ&quot; เพื่อความเรียบร้อย
          </div>
        </div>
      )}

      {/* Editing saved document alert */}
      {activeSavedInvoiceId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
          <span>
            คุณกำลังแก้ไขเอกสารที่เคยบันทึกไว้ (เลขที่ <strong>{draft.invoiceNumber}</strong>) การกดบันทึกจะอัปเดตข้อมูลเอกสารฉบับนี้
          </span>
          <button
            type="button"
            onClick={onResetDraft}
            className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            สร้างเอกสารใหม่
          </button>
        </div>
      )}

      {/* Grid: Issuer Card & Document Meta Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Issuer Quick View */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  ผู้ออกเอกสาร (Issuer)
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenIssuerModal}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                แก้ไขข้อมูลร้าน
              </button>
            </div>

            <div className="flex items-start gap-3 mb-2">
              {issuer.logoDataUrl ? (
                <img
                  src={issuer.logoDataUrl}
                  alt="Logo"
                  className="w-14 h-14 object-contain rounded border border-slate-200 p-1 shrink-0 bg-white"
                />
              ) : (
                <div className="w-14 h-14 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0 text-center">
                  ไม่มีโลโก้
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {issuer.businessName || 'ยังไม่ได้ระบุชื่อร้าน/บริษัท'}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                  {issuer.address || 'กรุณากด "แก้ไขข้อมูลร้าน" เพื่อใส่ที่อยู่'}
                </p>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Tax ID: {issuer.taxId || '-'} ·{' '}
                  {issuer.branchType === 'head_office' ? 'สำนักงานใหญ่' : `สาขา ${issuer.branchNumber}`}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>โทร: {issuer.phone || '-'}</span>
            <span>อีเมล: {issuer.email || '-'}</span>
          </div>
        </div>

        {/* Right Column (7 Cols): Document Meta (Number, PO, Dates) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              ข้อมูลเอกสาร (Document Header)
            </h3>
            <span className="text-xs text-slate-500">
              วันที่ในระบบ: {formatThaiDate(draft.issueDate, 'short')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่ใบกำกับ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={draft.invoiceNumber}
                onChange={(e) => onDraftChange({ ...draft, invoiceNumber: e.target.value })}
                placeholder="เช่น TK69 021"
                className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่ใบสั่งซื้อ (PO)
              </label>
              <input
                type="text"
                value={draft.poNumber}
                onChange={(e) => onDraftChange({ ...draft, poNumber: e.target.value })}
                placeholder="เช่น PO-2026-08"
                className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ติดต่อ
              </label>
              <input
                type="text"
                value={draft.contactPerson}
                onChange={(e) => onDraftChange({ ...draft, contactPerson: e.target.value })}
                placeholder="เช่น คุณกานดา"
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ออกเอกสาร (Issue Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={draft.issueDate}
                onChange={(e) => onDraftChange({ ...draft, issueDate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                พ.ศ.: {formatThaiDate(draft.issueDate, 'full')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่จัดส่ง (Delivery Date)
              </label>
              <input
                type="date"
                value={draft.deliveryDate}
                onChange={(e) => onDraftChange({ ...draft, deliveryDate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-0.5">
                พ.ศ.: {draft.deliveryDate ? formatThaiDate(draft.deliveryDate, 'full') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Selection & Buyer Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              ข้อมูลผู้ซื้อ / ผู้รับบริการ (Buyer Information)
            </h3>
            <p className="text-xs text-slate-500">
              เลือกลูกค้าจากฐานข้อมูลหรือพิมพ์รายละเอียดโดยตรงสำหรับเอกสารฉบับนี้
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Customer Search Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                เลือกลูกค้าจากระบบ ({customers.length})
              </button>

              {showCustomerDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="พิมพ์ชื่อเรียก, นิติบุคคล, หรือ Tax ID..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        ไม่พบข้อมูลลูกค้า
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2 hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-bold text-slate-900">
                              {c.alias}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {c.branchType === 'head_office' ? 'สนง.ใหญ่' : `สาขา ${c.branchNumber}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">
                            {c.legalName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        onOpenCustomerModal();
                      }}
                      className="text-xs text-orange-600 hover:underline font-semibold"
                    >
                      + เพิ่มหรือจัดการลูกค้าในระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenCustomerModal}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
            >
              จัดการลูกค้า
            </button>
          </div>
        </div>

        {/* Buyer Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อผู้ซื้อ / นิติบุคคลเต็ม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={draft.buyer.legalName}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  buyer: { ...draft.buyer, legalName: e.target.value },
                })
              }
              placeholder="เช่น บริษัท เทค พัฒนา ซิสเต็มส์ จำกัด"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อเรียกของลูกค้า (Alias)
            </label>
            <input
              type="text"
              value={draft.customerAlias}
              onChange={(e) => onDraftChange({ ...draft, customerAlias: e.target.value })}
              placeholder="เช่น บจก. เทค พัฒนา"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ที่อยู่ผู้ซื้อ (Address) <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={draft.buyer.address}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                buyer: { ...draft.buyer, address: e.target.value },
              })
            }
            placeholder="เลขที่ อาคาร ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขประจำตัวผู้เสียภาษี 13 หลัก
            </label>
            <input
              type="text"
              maxLength={13}
              value={draft.buyer.taxId}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  buyer: { ...draft.buyer, taxId: e.target.value },
                })
              }
              placeholder="0105561025782"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สำนักงานใหญ่ / สาขา
            </label>
            <select
              value={draft.buyer.branchType}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  buyer: {
                    ...draft.buyer,
                    branchType: e.target.value as BranchType,
                    branchNumber: e.target.value === 'head_office' ? '00000' : '00001',
                  },
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="head_office">สำนักงานใหญ่</option>
              <option value="branch">สาขา</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสสาขา
            </label>
            <input
              type="text"
              disabled={draft.buyer.branchType === 'head_office'}
              value={draft.buyer.branchType === 'head_office' ? '00000 (สำนักงานใหญ่)' : draft.buyer.branchNumber}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  buyer: { ...draft.buyer, branchNumber: e.target.value },
                })
              }
              placeholder="00001"
              className="w-full px-3 py-2 text-sm font-mono bg-white disabled:bg-slate-100 disabled:text-slate-500 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Line Items Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              รายการสินค้าและบริการ (Line Items)
            </h3>
            <p className="text-xs text-slate-500">
              ระบุรายการ จำนวน และราคาต่อหน่วย (ระบบคำนวณราคารวมให้อัตโนมัติ)
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddLineItem}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่มแถวรายการ
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                <th className="py-2.5 px-4">รายการสินค้า / บริการ</th>
                <th className="py-2.5 px-3 text-right w-28">จำนวน</th>
                <th className="py-2.5 px-3 text-right w-36">ราคา/หน่วย (฿)</th>
                <th className="py-2.5 px-4 text-right w-36">ราคารวม (฿)</th>
                <th className="py-2.5 px-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {draft.lineItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="ระบุรายละเอียดสินค้าหรือบริการ..."
                      className="w-full px-2.5 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 text-sm font-mono text-right bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice === 0 ? '' : item.unitPrice}
                      onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-sm font-mono text-right bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="ลบแถวนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {draft.lineItems.length === 0 && (
          <div className="p-8 text-center bg-slate-50/50">
            <p className="text-xs text-slate-500 mb-2">ยังไม่มีรายการสินค้า</p>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors cursor-pointer"
            >
              + เพิ่มแถวแรก
            </button>
          </div>
        )}
      </div>

      {/* VAT Mode & Financial Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): VAT Selector & Notes */}
        <div className="lg:col-span-7 space-y-4">
          {/* VAT Mode Segmented Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              รูปแบบการคิดภาษีมูลค่าเพิ่ม (VAT Calculation Mode)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onDraftChange({ ...draft, vatMode: '+' })}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  draft.vatMode === '+'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">
                    ราคาแยก VAT 7%
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-600">(+)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  ราคาสินค้ายังไม่รวมภาษี ระบบบวกภาษี 7% เพิ่ม
                </p>
              </button>

              <button
                type="button"
                onClick={() => onDraftChange({ ...draft, vatMode: '-' })}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  draft.vatMode === '-'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">
                    ราคารวม VAT 7%
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-600">(-)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  ราคาสินค้ารวม VAT แล้ว ระบบถอดภาษีออก 7/107
                </p>
              </button>

              <button
                type="button"
                onClick={() => onDraftChange({ ...draft, vatMode: '0' })}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  draft.vatMode === '0'
                    ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">
                    ไม่คิด VAT
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">(0)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  ไม่อยู่ในระบบ VAT หรืออัตราศูนย์ (ภาษี = 0.00 บาท)
                </p>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              หมายเหตุท้ายเอกสาร (Notes)
            </label>
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => onDraftChange({ ...draft, notes: e.target.value })}
              placeholder="เช่น เลขที่บัญชีธนาคารโอนเงิน หรือเงื่อนไขการชำระเงิน"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>

        {/* Right Column (5 Cols): Calculation Summary Box */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            สรุปยอดเงิน (Monetary Summary)
          </h3>

          <div className="space-y-2 text-sm divide-y divide-slate-100">
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-slate-600">ราคาสินค้าและบริการ:</span>
              <span className="font-mono font-medium text-slate-800">
                ฿{formatCurrency(totals.subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-slate-600">
                ภาษีมูลค่าเพิ่ม VAT 7% ({draft.vatMode === '+' ? 'แยก' : draft.vatMode === '-' ? 'รวมใน' : '0%'}):
              </span>
              <span className="font-mono font-medium text-slate-800">
                ฿{formatCurrency(totals.vatAmount)}
              </span>
            </div>

            {/* Prominent Net Total in orange-bordered box */}
            <div className="pt-3">
              <div className="p-3.5 bg-orange-50/80 border-2 border-orange-500 rounded-xl flex items-baseline justify-between shadow-xs">
                <span className="font-bold text-sm text-orange-950">
                  ยอดรวมสุทธิ (Net Total)
                </span>
                <span className="font-bold font-mono text-xl text-orange-950">
                  ฿{formatCurrency(totals.netTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Thai Baht Text */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
              จำนวนเงินตัวอักษร:
            </span>
            <span className="font-bold text-slate-900 text-xs">
              ({totals.bahtText})
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer order-2 sm:order-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          รีเซ็ตฟอร์ม (Clear Draft)
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={onViewOriginal}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            ดูต้นฉบับ
          </button>

          <button
            type="button"
            onClick={onViewCopy}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            ดูสำเนา
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                บันทึกแล้ว!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                บันทึกใบกำกับภาษี
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="ยืนยันการรีเซ็ตฟอร์ม"
        message="การรีเซ็ตจะล้างข้อมูลในฟอร์มปัจจุบัน แต่จะไม่ลบข้อมูลร้าน ฐานข้อมูลลูกค้า หรือใบกำกับภาษีที่เคยบันทึกไว้ในระบบ"
        confirmLabel="รีเซ็ตฟอร์ม"
        cancelLabel="ยกเลิก"
        isDestructive={false}
        onConfirm={() => {
          onResetDraft();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
