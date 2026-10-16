import React from 'react';
import { IssuerProfile, LineItem, InvoiceTotals, VatMode, BranchType } from '../../types';
import { formatCurrency, formatQuantity } from '../../utils/calculations';
import { formatThaiDate } from '../../utils/thaiDate';
import { formatThaiTaxId } from '../../utils/thaiTaxId';

interface InvoiceDocumentProps {
  designation: 'original' | 'copy'; // 'original' = "ต้นฉบับ / ORIGINAL", 'copy' = "สำเนา / COPY"
  invoiceNumber: string;
  poNumber?: string;
  contactPerson?: string;
  issueDate: string; // YYYY-MM-DD
  deliveryDate?: string; // YYYY-MM-DD
  issuer: IssuerProfile;
  buyer: {
    legalName: string;
    contactPerson?: string;
    address: string;
    taxId?: string;
    branchType?: BranchType;
    branchNumber?: string;
    phone?: string;
    email?: string;
  };
  lineItems: LineItem[];
  vatMode: VatMode;
  totals: InvoiceTotals;
  notes?: string;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  designation,
  invoiceNumber,
  poNumber,
  contactPerson,
  issueDate,
  deliveryDate,
  issuer,
  buyer,
  lineItems,
  vatMode,
  totals,
  notes,
}) => {
  const isOriginal = designation === 'original';
  const designationTitle = isOriginal ? 'ต้นฉบับ' : 'สำเนา';
  const designationSubtitle = isOriginal ? 'ORIGINAL' : 'COPY';

  // Ensure table fills at least 7-8 visible rows for formal stationery presentation
  const minRows = 7;
  const emptyRowsCount = Math.max(0, minRows - (lineItems?.length || 0));

  const formatBranch = (type?: BranchType, number?: string) => {
    if (!type || type === 'head_office') {
      return 'สำนักงานใหญ่ (Head Office)';
    }
    return `สาขาที่ ${number || '00001'} (Branch No. ${number || '00001'})`;
  };

  return (
    <div className="invoice-sheet bg-white text-slate-900 border border-slate-300 print:border-none shadow-md print:shadow-none mx-auto w-full max-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[12mm] print:p-0 flex flex-col justify-between box-border text-[13px] leading-normal font-sans">
      <div>
        {/* ================= HEADER SECTION ================= */}
        <header className="grid grid-cols-12 gap-3 items-start pb-4 border-b border-slate-300">
          {/* LEFT: Business Logo or Name */}
          <div className="col-span-3 flex flex-col justify-start">
            {issuer.logoDataUrl ? (
              <img
                src={issuer.logoDataUrl}
                alt={issuer.businessName}
                referrerPolicy="no-referrer"
                className="max-h-20 max-w-full object-contain self-start"
              />
            ) : (
              <div className="h-16 w-32 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs text-center p-1 font-mono">
                {issuer.businessName ? issuer.businessName.slice(0, 15) : 'ตราสัญลักษณ์'}
              </div>
            )}
          </div>

          {/* CENTER: Document Titles */}
          <div className="col-span-6 text-center pt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              ใบกำกับภาษี / ใบเสร็จรับเงิน
            </h1>
            <p className="text-sm font-semibold tracking-wider text-slate-600 mt-0.5">
              TAX INVOICE / RECEIPT
            </p>
          </div>

          {/* RIGHT: Designation Box (ORIGINAL / COPY) */}
          <div className="col-span-3 flex justify-end">
            <div className="border-2 border-slate-800 rounded-md py-1.5 px-3 text-center min-w-[110px] bg-white">
              <span className="block text-sm font-bold text-slate-900 leading-tight">
                {designationTitle}
              </span>
              <span className="block text-[11px] font-semibold tracking-widest text-slate-600">
                {designationSubtitle}
              </span>
            </div>
          </div>
        </header>

        {/* ================= ISSUER & BUYER & METADATA SECTION ================= */}
        <div className="grid grid-cols-12 gap-4 py-3 border-b border-slate-300 text-xs leading-relaxed">
          {/* LEFT 7 COLS: ISSUER & BUYER */}
          <div className="col-span-7 space-y-3">
            {/* Issuer Information */}
            <div>
              <div className="font-bold text-slate-900 text-[13px] leading-snug">
                {issuer.businessName || 'ชื่อสถานประกอบการ'}
              </div>
              <div className="text-slate-700">
                {issuer.address || '-'}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 text-slate-800 mt-0.5">
                <span>
                  <strong>เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                  <span className="font-mono">{issuer.taxId ? formatThaiTaxId(issuer.taxId) : '-'}</span>
                </span>
                <span>
                  <strong>สถานะ:</strong> {formatBranch(issuer.branchType, issuer.branchNumber)}
                </span>
              </div>
              {(issuer.phone || issuer.email) && (
                <div className="text-slate-600">
                  {issuer.phone && <span>โทร: {issuer.phone} </span>}
                  {issuer.email && <span>อีเมล: {issuer.email}</span>}
                </div>
              )}
            </div>

            {/* Buyer Information */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                ชื่อและที่อยู่ผู้ซื้อ (Customer / Buyer)
              </div>
              <div className="font-bold text-slate-900 text-[13px] leading-snug">
                {buyer.legalName || 'ลูกค้าทั่วไป / ไม่ได้ระบุนาม'}
              </div>
              <div className="text-slate-700">
                {buyer.address || '-'}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 text-slate-800 mt-0.5">
                <span>
                  <strong>เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                  <span className="font-mono">{buyer.taxId ? formatThaiTaxId(buyer.taxId) : '-'}</span>
                </span>
                <span>
                  <strong>สถานะ:</strong> {formatBranch(buyer.branchType, buyer.branchNumber)}
                </span>
              </div>
              {(buyer.contactPerson || buyer.phone) && (
                <div className="text-slate-600">
                  {buyer.contactPerson && <span>ผู้ติดต่อ: {buyer.contactPerson} </span>}
                  {buyer.phone && <span>โทร: {buyer.phone}</span>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: DOCUMENT DETAILS TABLE */}
          <div className="col-span-5 border border-slate-300 rounded-md p-2.5 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-medium">เลขที่ใบกำกับ:</span>
                <span className="font-bold font-mono text-sm text-slate-900">
                  {invoiceNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-medium">วันที่ออกเอกสาร:</span>
                <span className="font-medium text-slate-900">
                  {formatThaiDate(issueDate, 'full')}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-medium">เลขที่ PO:</span>
                <span className="font-mono text-slate-800">
                  {poNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                <span className="text-slate-600 font-medium">วันที่จัดส่ง:</span>
                <span className="text-slate-800">
                  {deliveryDate ? formatThaiDate(deliveryDate, 'short') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600 font-medium">ชื่อผู้ติดต่อ:</span>
                <span className="text-slate-800">
                  {contactPerson || buyer.contactPerson || '-'}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-slate-200 text-[10px] text-slate-500 text-right">
              ประเภทภาษี: {vatMode === '+' ? 'ราคาแยกภาษีมูลค่าเพิ่ม 7%' : vatMode === '-' ? 'ราคารวมภาษีมูลค่าเพิ่ม 7%' : 'ไม่คิดภาษีมูลค่าเพิ่ม'}
            </div>
          </div>
        </div>

        {/* ================= LINE ITEMS TABLE ================= */}
        <div className="mt-3 border border-slate-300 rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-xs font-bold border-b border-slate-300">
                <th className="py-2 px-2 text-center w-12 border-r border-slate-300">
                  ลำดับ
                </th>
                <th className="py-2 px-3 border-r border-slate-300">
                  รายการ
                </th>
                <th className="py-2 px-2 text-right w-20 border-r border-slate-300">
                  จำนวน
                </th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-300">
                  ราคา/หน่วย
                </th>
                <th className="py-2 px-3 text-right w-32">
                  ราคารวม
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {lineItems.map((item, index) => (
                <tr key={item.id || index} className="align-top">
                  <td className="py-1.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                    {index + 1}
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 border-r border-slate-200 whitespace-pre-wrap break-words">
                    {item.description || '-'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                    {formatQuantity(item.quantity)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-800 border-r border-slate-200">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}

              {/* Blank filler rows to maintain formal layout */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-6">
                  <td className="py-1.5 px-2 border-r border-slate-200">&nbsp;</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">&nbsp;</td>
                  <td className="py-1.5 px-2 border-r border-slate-200">&nbsp;</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">&nbsp;</td>
                  <td className="py-1.5 px-3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= SUMMARY & BAHT TEXT ================= */}
        <div className="mt-2.5 grid grid-cols-12 gap-3 items-start">
          {/* Left: Baht Text & Notes */}
          <div className="col-span-7 flex flex-col justify-between self-stretch pt-1">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                จำนวนเงินตัวอักษร (Amount in Words)
              </span>
              <span className="font-bold text-slate-900 text-sm">
                ({totals.bahtText})
              </span>
            </div>

            {notes && (
              <div className="text-[11px] text-slate-600 mt-2 p-2 border-l-2 border-slate-300">
                <strong>หมายเหตุ:</strong> {notes}
              </div>
            )}
          </div>

          {/* Right: Monetary Summary Box */}
          <div className="col-span-5 border border-slate-300 rounded overflow-hidden text-xs">
            <div className="divide-y divide-slate-200">
              <div className="flex justify-between py-1.5 px-3 bg-white">
                <span className="text-slate-600">ราคาสินค้าและบริการ</span>
                <span className="font-mono text-slate-800">{formatCurrency(totals.subtotal)} บาท</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 bg-white">
                <span className="text-slate-600">ภาษีมูลค่าเพิ่ม VAT 7%</span>
                <span className="font-mono text-slate-800">{formatCurrency(totals.vatAmount)} บาท</span>
              </div>

              {/* Highlighted Net Total in restrained orange accent box */}
              <div className="flex justify-between items-center py-2 px-3 bg-orange-50/80 border-t-2 border-orange-500 text-slate-900">
                <span className="font-bold text-sm text-orange-950">ยอดรวมสุทธิ (Net Total)</span>
                <span className="font-bold font-mono text-base text-orange-950">
                  {formatCurrency(totals.netTotal)} บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SIGNATURE SECTION ================= */}
      <footer className="mt-8 pt-4 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          {/* Recipient Goods Receiver */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center">
              <div className="w-48 border-b border-dashed border-slate-400"></div>
            </div>
            <div className="mt-1 font-semibold text-slate-800">
              ผู้รับของ (Received By)
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              ( ............................................................ )
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              วันที่ ......./......./ 25......
            </div>
          </div>

          {/* Authorized Collector / Signatory */}
          <div className="flex flex-col items-center">
            <div className="h-12 w-full flex items-end justify-center">
              <div className="w-48 border-b border-dashed border-slate-400"></div>
            </div>
            <div className="mt-1 font-semibold text-slate-800">
              ผู้รับเงิน / ผู้มีอำนาจลงนาม (Authorized Signature)
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              ( ............................................................ )
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              วันที่ ......./......./ 25......
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
