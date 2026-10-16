import React, { useState } from 'react';
import { X, Search, FileText, Printer, Copy, Trash2, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { SavedInvoice } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { formatThaiDate } from '../../utils/thaiDate';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoices: SavedInvoice[];
  onOpenInvoice: (invoice: SavedInvoice) => void;
  onPrintOriginal: (invoice: SavedInvoice) => void;
  onPrintCopy: (invoice: SavedInvoice) => void;
  onDuplicateInvoice: (invoice: SavedInvoice) => void;
  onDeleteInvoice: (id: string) => Promise<void>;
}

export const InvoiceHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invoices,
  onOpenInvoice,
  onPrintOriginal,
  onPrintCopy,
  onDuplicateInvoice,
  onDeleteInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalized = searchQuery.trim().toLowerCase();
  const filtered = invoices.filter((inv) => {
    return (
      (inv.customerAlias && inv.customerAlias.toLowerCase().includes(normalized)) ||
      (inv.buyerInfo?.legalName && inv.buyerInfo.legalName.toLowerCase().includes(normalized)) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(normalized)) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(normalized)) ||
      (inv.issueDate && inv.issueDate.includes(normalized))
    );
  });

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await onDeleteInvoice(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-orange-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  ประวัติใบกำกับภาษี / ใบเสร็จรับเงิน (Saved Invoices)
                </h2>
                <p className="text-xs text-slate-500">
                  รายการเอกสารทั้งหมดที่เคยบันทึกไว้ในเครื่อง ({invoices.length} ฉบับ)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-6 py-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาตามชื่อเรียก, ชื่อลูกค้า, เลขที่ใบกำกับ, เลขที่ PO, หรือวันที่ (YYYY-MM-DD)..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          {/* Invoices List */}
          <div className="p-6 overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <FileText className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {searchQuery ? 'ไม่พบเอกสารที่ตรงกับคำค้นหา' : 'ยังไม่มีประวัติใบกำกับภาษีที่บันทึกไว้'}
                </p>
                <p className="text-xs text-slate-500">
                  {searchQuery
                    ? 'ลองค้นหาด้วยคำอื่น หรือตรวจสอบเลขที่เอกสาร'
                    : 'เมื่อคุณกด "บันทึกใบกำกับภาษี" ในหน้าสร้างเอกสาร ข้อมูลจะมาปรากฏที่นี่'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-bold font-mono text-base text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {inv.invoiceNumber}
                        </span>
                        {inv.poNumber && (
                          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            PO: {inv.poNumber}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatThaiDate(inv.issueDate, 'short')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">
                          {inv.vatMode === '+' ? 'VAT แยก 7%' : inv.vatMode === '-' ? 'VAT รวมใน 7%' : 'ไม่มี VAT'}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-800 mb-0.5 flex items-center gap-2">
                        <span>{inv.customerAlias || 'ลูกค้าทั่วไป'}</span>
                        <span className="text-xs font-normal text-slate-500 truncate max-w-md">
                          ({inv.buyerInfo?.legalName})
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        {inv.lineItems?.length || 0} รายการสินค้า/บริการ · ยอดรวมสุทธิ:{' '}
                        <span className="font-bold text-slate-900 font-mono">
                          ฿{formatCurrency(inv.totals?.netTotal || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenInvoice(inv);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="เปิดในหน้าแก้ไข"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        เปิดแก้ไข
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onPrintOriginal(inv);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="พิมพ์ต้นฉบับ"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        พิมพ์ต้นฉบับ
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onPrintCopy(inv);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="พิมพ์สำเนา"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        พิมพ์สำเนา
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onDuplicateInvoice(inv);
                          onClose();
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="คัดลอกเป็นร่างใหม่พร้อมรันเลขใหม่"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบใบกำกับภาษี"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="ยืนยันการลบใบกำกับภาษี"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบใบกำกับภาษีนี้? การลบเอกสารภาษีที่เคยบันทึกไว้จะไม่สามารถกู้คืนได้เว้นแต่จะมีไฟล์สำรอง"
        confirmLabel="ลบเอกสาร"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
};
