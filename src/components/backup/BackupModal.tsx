import React, { useState, useRef } from 'react';
import { X, Download, Upload, ShieldCheck, AlertCircle, FileJson, Check, AlertTriangle } from 'lucide-react';
import { AppBackupData } from '../../types';
import { exportAllData, importData } from '../../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupModal: React.FC<Props> = ({ isOpen, onClose, onDataChanged }) => {
  const [importStatus, setImportStatus] = useState<{
    loading: boolean;
    error: string;
    success: string;
  }>({ loading: false, error: '', success: '' });

  const [importCandidate, setImportCandidate] = useState<AppBackupData | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [backupBeforeImport, setBackupBeforeImport] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `thai-tax-invoice-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`ส่งออกข้อมูลไม่สำเร็จ: ${(err as Error).message}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus({ loading: false, error: '', success: '' });
    setImportCandidate(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text) as AppBackupData;

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('โครงสร้างไฟล์ไม่ใช่ JSON ที่ถูกต้อง');
        }
        if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.invoices)) {
          throw new Error('ไฟล์ข้อมูลไม่ตรงกับโครงสร้างของระบบ (ไม่พบข้อมูลลูกค้าหรือใบกำกับภาษี)');
        }

        setImportCandidate(parsed);
      } catch (err) {
        setImportStatus({
          loading: false,
          error: `ไฟล์ไม่ถูกต้อง: ${(err as Error).message}`,
          success: '',
        });
      }
    };
    reader.onerror = () => {
      setImportStatus({ loading: false, error: 'เกิดข้อผิดพลาดในการอ่านไฟล์', success: '' });
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importCandidate) return;

    setImportStatus({ loading: true, error: '', success: '' });

    try {
      // Create backup first if checked
      if (backupBeforeImport) {
        await handleExport();
      }

      const res = await importData(importCandidate, importMode);
      setImportStatus({
        loading: false,
        error: '',
        success: `นำเข้าข้อมูลสำเร็จ: ลูกค้า ${res.customerCount} รายการ, ใบกำกับภาษี ${res.invoiceCount} รายการ`,
      });
      setImportCandidate(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onDataChanged();
    } catch (err) {
      setImportStatus({
        loading: false,
        error: `นำเข้าข้อมูลล้มเหลว: ${(err as Error).message}`,
        success: '',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                สำรองและกู้คืนข้อมูล (Backup & Restore)
              </h2>
              <p className="text-xs text-slate-500">
                จัดการข้อมูลสถานประกอบการ ลูกค้า ประวัติเอกสาร และการตั้งค่า
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Privacy statement */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <strong>ความปลอดภัยและความเป็นส่วนตัว:</strong> ข้อมูลทั้งหมดถูกจัดเก็บแบบ Local-First อยู่ในเบราว์เซอร์บนเครื่องของคุณเท่านั้น ไม่มีการส่งข้อมูลลูกค้า ยอดเงิน หรือใบกำกับภาษีไปยังเซิร์ฟเวอร์ภายนอกใดๆ
            </div>
          </div>

          {/* Export Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-orange-600" />
              ส่งออกข้อมูลสำรอง (Export JSON)
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมด ได้แก่ ข้อมูลร้าน โลโก้ ฐานข้อมูลลูกค้า ประวัติใบกำกับภาษี และรูปแบบการรันเลขที่
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดไฟล์สำรอง (.json)
            </button>
          </div>

          {/* Import Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-600" />
                กู้คืน / นำเข้าข้อมูล (Import JSON)
              </h3>
              <p className="text-xs text-slate-600">
                เลือกไฟล์ JSON ที่เคยส่งออกไว้เพื่อนำกลับเข้ามาในระบบ
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
            />

            {importCandidate && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-slate-800">
                  ตรวจสอบพบข้อมูล:
                  <ul className="list-disc list-inside mt-1 font-normal text-slate-600">
                    <li>ลูกค้า: {importCandidate.customers?.length || 0} รายการ</li>
                    <li>ใบกำกับภาษี: {importCandidate.invoices?.length || 0} รายการ</li>
                    <li>ข้อมูลร้าน: {importCandidate.issuer?.businessName || 'ไม่มี'}</li>
                  </ul>
                </div>

                {/* Import Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รูปแบบการนำเข้า (Import Strategy)
                  </label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span>
                        <strong>เขียนทับทั้งหมด (Replace all):</strong> ล้างข้อมูลเก่าแล้วใช้ข้อมูลจากไฟล์
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span>
                        <strong>รวมข้อมูล (Merge):</strong> เก็บข้อมูลเดิมไว้และเพิ่มข้อมูลใหม่เข้าไป
                      </span>
                    </label>
                  </div>
                </div>

                {/* Auto backup checkbox */}
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={backupBeforeImport}
                    onChange={(e) => setBackupBeforeImport(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>ดาวน์โหลดไฟล์สำรองชุดปัจจุบันอัตโนมัติก่อนเริ่มนำเข้า (แนะนำ)</span>
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importStatus.loading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    {importStatus.loading ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้าข้อมูล'}
                  </button>
                </div>
              </div>
            )}

            {importStatus.error && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {importStatus.error}
              </p>
            )}

            {importStatus.success && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4 shrink-0" />
                {importStatus.success}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
