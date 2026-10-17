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
}) => {
  const isOriginal = designation === 'original';
  const designationTitle = isOriginal ? 'ต้นฉบับ' : 'สำเนา';
  const designationSubtitle = isOriginal ? 'ORIGINAL' : 'COPY';

  // Ensure table fills at least 6 visible rows for formal stationery presentation
  const minRows = 6;
  const emptyRowsCount = Math.max(0, minRows - (lineItems?.length || 0));

  const formatBranch = (type?: BranchType, number?: string) => {
    if (!type || type === 'head_office') {
      return 'สำนักงานใหญ่ (Head Office)';
    }
    return `สาขาที่ ${number || '00001'} (Branch No. ${number || '00001'})`;
  };

  return (
    <div className="invoice-sheet bg-white text-slate-900 border border-slate-300 print:border-none shadow-md print:shadow-none mx-auto w-full max-w-[210mm] min-h-[297mm] p-[8mm] sm:p-[10mm] print:p-0 flex flex-col justify-between box-border text-[12px] leading-normal font-sans">
      <div>
        {/* ================= COMPACT HEADER SECTION: ISSUER + TITLES ================= */}
        <header className="grid grid-cols-12 gap-3 items-start pb-2.5 border-b border-slate-300">
          {/* LEFT (7 cols): Business Logo & Issuer Information combined */}
          <div className="col-span-7 flex items-start gap-3">
            {issuer.logoDataUrl ? (
              <img
                src={issuer.logoDataUrl}
                alt={issuer.businessName}
                referrerPolicy="no-referrer"
                className="max-h-16 max-w-[100px] object-contain shrink-0 self-start"
              />
            ) : (
              <div className="h-14 w-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[10px] text-center p-1 shrink-0 font-mono">
                {issuer.businessName ? issuer.businessName.slice(0, 12) : 'ตราสัญลักษณ์'}
              </div>
            )}

            <div className="min-w-0 flex-1 text-xs leading-tight">
              <h2 className="font-bold text-slate-900 text-sm leading-snug">
                {issuer.businessName || 'ชื่อสถานประกอบการ'}
              </h2>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                {issuer.address || '-'}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-700 mt-0.5">
                <span>
                  <strong>เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                  <span className="font-mono">{issuer.taxId ? formatThaiTaxId(issuer.taxId) : '-'}</span>
                </span>
                <span>
                  <strong>({formatBranch(issuer.branchType, issuer.branchNumber)})</strong>
                </span>
              </div>
              {(issuer.phone || issuer.email) && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {issuer.phone && <span>โทร: {issuer.phone} </span>}
                  {issuer.email && <span>อีเมล: {issuer.email}</span>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT (5 cols): Title & Designation Box */}
          <div className="col-span-5 flex flex-col items-end text-right">
            <div className="border-2 border-slate-800 rounded py-1 px-3 text-center min-w-[120px] bg-white mb-1.5">
              <span className="block text-sm font-bold text-slate-900 leading-tight">
                {designationTitle}
              </span>
              <span className="block text-[10px] font-semibold tracking-widest text-slate-600">
                {designationSubtitle}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              ใบกำกับภาษี / ใบเสร็จรับเงิน
            </h1>
            <p className="text-xs font-semibold tracking-wider text-slate-600 mt-0.5">
              TAX INVOICE / RECEIPT
            </p>
          </div>
        </header>

        {/* ================= COMPACT BUYER & DOCUMENT DETAILS COMBINED SECTION ================= */}
        <div className="grid grid-cols-12 gap-3 py-2.5 border-b border-slate-300 text-xs">
          {/* LEFT (7 cols): Buyer Information */}
          <div className="col-span-7 pr-2 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                ข้อมูลผู้ซื้อ / ผู้รับบริการ (Customer / Buyer)
              </div>
              <div className="font-bold text-slate-900 text-[13px] leading-snug">
                {buyer.legalName || 'ลูกค้าทั่วไป / ไม่ได้ระบุนาม'}
              </div>
              <div className="text-slate-700 text-[11px] leading-normal mt-0.5">
                {buyer.address || '-'}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-700 mt-0.5">
                <span>
                  <strong>เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                  <span className="font-mono">{buyer.taxId ? formatThaiTaxId(buyer.taxId) : '-'}</span>
                </span>
                <span>
                  <strong>({formatBranch(buyer.branchType, buyer.branchNumber)})</strong>
                </span>
              </div>
            </div>

            {(buyer.contactPerson || buyer.phone) && (
              <div className="text-[11px] text-slate-500 mt-1">
                {buyer.contactPerson && <span>ผู้ติดต่อ: {buyer.contactPerson} </span>}
                {buyer.phone && <span>โทร: {buyer.phone}</span>}
              </div>
            )}
          </div>

          {/* RIGHT (5 cols): Document Details Box */}
          <div className="col-span-5 border border-slate-300 rounded p-2 bg-slate-50/60 flex flex-col justify-between">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-0.5">
                <span className="text-slate-600 font-medium text-[11px]">เลขที่ใบกำกับ:</span>
                <span className="font-bold font-mono text-xs text-slate-900">
                  {invoiceNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-0.5">
                <span className="text-slate-600 font-medium text-[11px]">วันที่ออกเอกสาร:</span>
                <span className="font-medium text-[11px] text-slate-900">
                  {formatThaiDate(issueDate, 'full')}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-0.5">
                <span className="text-slate-600 font-medium text-[11px]">เลขที่ PO:</span>
                <span className="font-mono text-[11px] text-slate-800">
                  {poNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-200 pb-0.5">
                <span className="text-slate-600 font-medium text-[11px]">วันที่จัดส่ง:</span>
                <span className="text-[11px] text-slate-800">
                  {deliveryDate ? formatThaiDate(deliveryDate, 'short') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600 font-medium text-[11px]">ชื่อผู้ติดต่อ:</span>
                <span className="text-[11px] text-slate-800 truncate max-w-[130px]">
                  {contactPerson || buyer.contactPerson || '-'}
                </span>
              </div>
            </div>

            <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-500 text-right">
              {vatMode === '+' ? 'ราคาแยกภาษีมูลค่าเพิ่ม 7%' : vatMode === '-' ? 'ราคารวมภาษีมูลค่าเพิ่ม 7%' : 'ไม่คิดภาษีมูลค่าเพิ่ม'}
            </div>
          </div>
        </div>

        {/* ================= LINE ITEMS TABLE ================= */}
        <div className="mt-2.5 border border-slate-300 rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-xs font-bold border-b border-slate-300">
                <th className="py-1.5 px-2 text-center w-12 border-r border-slate-300">
                  ลำดับ
                </th>
                <th className="py-1.5 px-3 border-r border-slate-300">
                  รายการ
                </th>
                <th className="py-1.5 px-2 text-right w-20 border-r border-slate-300">
                  จำนวน
                </th>
                <th className="py-1.5 px-3 text-right w-28 border-r border-slate-300">
                  ราคา/หน่วย
                </th>
                <th className="py-1.5 px-3 text-right w-32">
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

        {/* ================= SUMMARY & BAHT TEXT (NOTES REMOVED) ================= */}
        <div className="mt-2 grid grid-cols-12 gap-3 items-start">
          {/* Left: Baht Text (Notes removed as requested) */}
          <div className="col-span-7 flex flex-col justify-center self-stretch pt-0.5">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                จำนวนเงินตัวอักษร (Amount in Words)
              </span>
              <span className="font-bold text-slate-900 text-sm">
                ({totals.bahtText})
              </span>
            </div>
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

      {/* ================= SPACIOUS SIGNATURE SECTION ================= */}
      <footer className="mt-6 pt-3 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-6 text-center text-xs">
          {/* Recipient Goods Receiver */}
          <div className="border border-slate-300 rounded-md p-3.5 bg-slate-50/30 flex flex-col justify-between min-h-[145px]">
            <div className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1.5">
              ผู้รับของ (Received By)
            </div>

            {/* Spacious handwriting / signature area */}
            <div className="h-16 flex items-end justify-center py-1">
              <div className="w-56 border-b border-dashed border-slate-400"></div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-600 text-[11px]">
                ( ............................................................ )
              </div>
              <div className="text-slate-500 text-[11px]">
                วันที่ ......./......./ 25......
              </div>
            </div>
          </div>

          {/* Authorized Collector / Signatory */}
          <div className="border border-slate-300 rounded-md p-3.5 bg-slate-50/30 flex flex-col justify-between min-h-[145px]">
            <div className="font-semibold text-slate-800 text-xs border-b border-slate-200 pb-1.5">
              ผู้รับเงิน / ผู้มีอำนาจลงนาม (Authorized Signature)
            </div>

            {/* Spacious handwriting / signature area */}
            <div className="h-16 flex items-end justify-center py-1">
              <div className="w-56 border-b border-dashed border-slate-400"></div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-600 text-[11px]">
                ( ............................................................ )
              </div>
              <div className="text-slate-500 text-[11px]">
                วันที่ ......./......./ 25......
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
