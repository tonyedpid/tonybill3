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
    <div className="invoice-sheet bg-white text-black border border-black print:border-none shadow-md print:shadow-none mx-auto w-full max-w-[210mm] min-h-[297mm] p-[8mm] sm:p-[10mm] print:p-0 flex flex-col justify-between box-border text-[13px] leading-normal font-sans">
      <div>
        {/* ================= COMPACT HEADER SECTION: ISSUER + TITLES ================= */}
        <div className="invoice-header grid grid-cols-12 gap-3 items-start pb-2.5 border-b-2 border-black">
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
              <div className="h-14 w-24 border border-dashed border-black rounded flex items-center justify-center text-black text-xs text-center p-1 shrink-0 font-mono font-bold">
                {issuer.businessName ? issuer.businessName.slice(0, 12) : 'ตราสัญลักษณ์'}
              </div>
            )}

            <div className="min-w-0 flex-1 text-xs leading-tight">
              <h2 className="font-black text-black text-base sm:text-lg leading-snug">
                {issuer.businessName || 'ชื่อสถานประกอบการ'}
              </h2>
              <p className="text-black text-xs sm:text-[13px] mt-0.5 leading-normal font-medium">
                {issuer.address || '-'}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-[13px] text-black mt-0.5 font-medium">
                <span>
                  <strong>เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                  <span className="font-mono font-bold">{issuer.taxId ? formatThaiTaxId(issuer.taxId) : '-'}</span>
                </span>
                <span>
                  <strong>({formatBranch(issuer.branchType, issuer.branchNumber)})</strong>
                </span>
              </div>
              {(issuer.phone || issuer.email) && (
                <div className="text-xs sm:text-[13px] text-black font-medium mt-0.5">
                  {issuer.phone && <span>โทร: {issuer.phone} </span>}
                  {issuer.email && <span>อีเมล: {issuer.email}</span>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT (5 cols): Title & Designation Box */}
          <div className="col-span-5 flex flex-col items-end text-right">
            <div className="border-2 border-black rounded py-1 px-3.5 text-center min-w-[125px] bg-white mb-1.5 shadow-xs">
              <span className="block text-base font-black text-black leading-tight">
                {designationTitle}
              </span>
              <span className="block text-xs font-bold tracking-widest text-black">
                {designationSubtitle}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight">
              ใบกำกับภาษี / ใบเสร็จรับเงิน
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-wider text-black mt-0.5">
              TAX INVOICE / RECEIPT
            </p>
          </div>
        </div>

        {/* ================= COMPACT BUYER & DOCUMENT DETAILS COMBINED SECTION ================= */}
        <div className="grid grid-cols-12 gap-3 py-2.5 border-b-2 border-black text-xs sm:text-[13px]">
          {/* LEFT (7 cols): Buyer Information */}
          <div className="col-span-7 pr-2 flex flex-col justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-black mb-0.5">
                ข้อมูลผู้ซื้อ / ผู้รับบริการ (Customer / Buyer)
              </div>
              <div className="font-black text-black text-sm sm:text-base leading-snug">
                {buyer.legalName || 'ลูกค้าทั่วไป / ไม่ได้ระบุนาม'}
              </div>
              <div className="text-black text-xs sm:text-[13px] leading-normal mt-0.5 font-medium">
                {buyer.address || '-'}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-[13px] text-black mt-0.5 font-medium">
                <span>
                  <strong>เลขประจำตัวผู้เสียภาษี:</strong>{' '}
                  <span className="font-mono font-bold">{buyer.taxId ? formatThaiTaxId(buyer.taxId) : '-'}</span>
                </span>
                <span>
                  <strong>({formatBranch(buyer.branchType, buyer.branchNumber)})</strong>
                </span>
              </div>
            </div>

            {buyer.phone && (
              <div className="text-xs sm:text-[13px] text-black font-medium mt-1">
                <span>โทร: {buyer.phone}</span>
              </div>
            )}
          </div>

          {/* RIGHT (5 cols): Document Details Box */}
          <div className="col-span-5 border-2 border-black rounded p-2.5 bg-neutral-50 flex flex-col justify-between">
            <div className="space-y-1.5 text-xs sm:text-[13px]">
              <div className="flex justify-between items-baseline border-b border-neutral-400 pb-1">
                <span className="text-black font-bold text-xs sm:text-[13px]">เลขที่ใบกำกับ:</span>
                <span className="font-black font-mono text-sm sm:text-base text-black">
                  {invoiceNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-neutral-400 pb-1">
                <span className="text-black font-bold text-xs sm:text-[13px]">เลขที่ PO:</span>
                <span className="font-bold font-mono text-xs sm:text-[13px] text-black">
                  {poNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-black font-bold text-xs sm:text-[13px]">วันที่จัดส่ง:</span>
                <span className="text-xs sm:text-[13px] font-bold text-black">
                  {deliveryDate ? formatThaiDate(deliveryDate, 'short') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= LINE ITEMS TABLE ================= */}
        <div className="mt-2.5 border-2 border-black rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 text-black text-xs sm:text-[13px] font-black border-b-2 border-black">
                <th className="py-2 px-2 text-center w-12 border-r border-black">
                  ลำดับ
                </th>
                <th className="py-2 px-3 border-r border-black">
                  รายการ
                </th>
                <th className="py-2 px-2 text-right w-20 border-r border-black">
                  จำนวน
                </th>
                <th className="py-2 px-3 text-right w-28 border-r border-black">
                  ราคา/หน่วย
                </th>
                <th className="py-2 px-3 text-right w-32">
                  ราคารวม
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-xs sm:text-[13px]">
              {lineItems.map((item, index) => (
                <tr key={item.id || index} className="align-top">
                  <td className="py-2 px-2 text-center font-mono font-bold text-black border-r border-black">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 text-black font-medium border-r border-black whitespace-pre-wrap break-words">
                    {item.description || '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-black border-r border-black">
                    {formatQuantity(item.quantity)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-black border-r border-black">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-black">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}

              {/* Blank filler rows to maintain formal layout */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-6">
                  <td className="py-2 px-2 border-r border-black">&nbsp;</td>
                  <td className="py-2 px-3 border-r border-black">&nbsp;</td>
                  <td className="py-2 px-2 border-r border-black">&nbsp;</td>
                  <td className="py-2 px-3 border-r border-black">&nbsp;</td>
                  <td className="py-2 px-3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= SUMMARY & BAHT TEXT ================= */}
        <div className="mt-2.5 grid grid-cols-12 gap-3 items-start">
          {/* Left: Baht Text */}
          <div className="col-span-7 flex flex-col justify-center self-stretch pt-0.5">
            <div className="p-2.5 bg-neutral-50 border-2 border-black rounded text-xs sm:text-[13px]">
              <span className="text-xs font-black text-black block mb-0.5">
                จำนวนเงินตัวอักษร (Amount in Words)
              </span>
              <span className="font-black text-black text-sm sm:text-base">
                ({totals.bahtText})
              </span>
            </div>
          </div>

          {/* Right: Monetary Summary Box */}
          <div className="col-span-5 border-2 border-black rounded overflow-hidden text-xs sm:text-[13px]">
            <div className="divide-y divide-neutral-300">
              <div className="flex justify-between py-1.5 px-3 bg-white">
                <span className="text-black font-bold">ราคาสินค้าและบริการ</span>
                <span className="font-mono font-bold text-black">{formatCurrency(totals.subtotal)} บาท</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 bg-white">
                <span className="text-black font-bold">ภาษีมูลค่าเพิ่ม VAT 7%</span>
                <span className="font-mono font-bold text-black">{formatCurrency(totals.vatAmount)} บาท</span>
              </div>

              {/* Highlighted Net Total in clear high-contrast border and text */}
              <div className="flex justify-between items-center py-2 px-3 bg-neutral-100 border-t-2 border-black text-black">
                <span className="font-black text-sm sm:text-base text-black">ยอดรวมสุทธิ (Net Total)</span>
                <span className="font-black font-mono text-base sm:text-lg text-black">
                  {formatCurrency(totals.netTotal)} บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SPACIOUS SIGNATURE SECTION ================= */}
      <div className="invoice-footer mt-5 pt-3 border-t-2 border-black">
        <div className="grid grid-cols-2 gap-6 text-center text-xs sm:text-[13px]">
          {/* Recipient Goods Receiver */}
          <div className="border-2 border-black rounded-md p-3.5 bg-white flex flex-col justify-between min-h-[145px]">
            <div className="font-bold text-black text-xs sm:text-sm border-b border-black pb-1.5">
              ผู้รับของ (Received By)
            </div>

            {/* Spacious handwriting / signature area */}
            <div className="h-16 flex items-end justify-center py-1">
              <div className="w-56 border-b-2 border-dashed border-black"></div>
            </div>

            <div className="space-y-1">
              <div className="text-black text-xs sm:text-[13px] font-bold">
                ( ............................................................ )
              </div>
              <div className="text-black text-xs sm:text-[13px] font-bold">
                วันที่ ......./......./ 25......
              </div>
            </div>
          </div>

          {/* Authorized Collector / Signatory */}
          <div className="border-2 border-black rounded-md p-3.5 bg-white flex flex-col justify-between min-h-[145px]">
            <div className="font-bold text-black text-xs sm:text-sm border-b border-black pb-1.5">
              ผู้รับเงิน / ผู้มีอำนาจลงนาม (Authorized Signature)
            </div>

            {/* Spacious handwriting / signature area */}
            <div className="h-16 flex items-end justify-center py-1">
              <div className="w-56 border-b-2 border-dashed border-black"></div>
            </div>

            <div className="space-y-1">
              <div className="text-black text-xs sm:text-[13px] font-bold">
                ( ............................................................ )
              </div>
              <div className="text-black text-xs sm:text-[13px] font-bold">
                วันที่ ......./......./ 25......
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
