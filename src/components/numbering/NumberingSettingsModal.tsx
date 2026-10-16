import React, { useState } from 'react';
import { X, Hash, AlertTriangle, Check } from 'lucide-react';
import { InvoiceNumberConfig, YearFormat } from '../../types';
import { formatInvoiceNumber } from '../../utils/numbering';
import { getTodayIsoDate } from '../../utils/thaiDate';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: InvoiceNumberConfig;
  onSave: (config: InvoiceNumberConfig) => void;
}

export const NumberingSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<InvoiceNumberConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const todayIso = getTodayIsoDate();
  const sampleNumber = formatInvoiceNumber(formData, formData.nextSequence, todayIso);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Hash className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ตั้งค่ารูปแบบเลขที่เอกสาร (Invoice Numbering)
              </h2>
              <p className="text-xs text-slate-500">
                กำหนดการขึ้นเลขที่ใบกำกับภาษีอัตโนมัติ
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Live Preview Box */}
          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl text-center">
            <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider block mb-1">
              ตัวอย่างเลขที่เอกสารฉบับถัดไป
            </span>
            <span className="text-2xl font-bold font-mono text-orange-950 tracking-wider">
              {sampleNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำนำหน้า (Prefix)
              </label>
              <input
                type="text"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="เช่น TK หรือ INV"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รูปแบบปี (Year Format)
              </label>
              <select
                value={formData.yearFormat}
                onChange={(e) => setFormData({ ...formData, yearFormat: e.target.value as YearFormat })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="be_2">พ.ศ. 2 หลัก (เช่น 69)</option>
                <option value="be_4">พ.ศ. 4 หลัก (เช่น 2569)</option>
                <option value="ad_2">ค.ศ. 2 หลัก (เช่น 26)</option>
                <option value="ad_4">ค.ศ. 4 หลัก (เช่น 2026)</option>
                <option value="none">ไม่ระบุปี</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตัวคั่น (Separator)
              </label>
              <select
                value={formData.separator}
                onChange={(e) => setFormData({ ...formData, separator: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 font-mono"
              >
                <option value=" ">เว้นวรรค (space)</option>
                <option value="-">ขีดกลาง (-)</option>
                <option value="/">ทับ (/)</option>
                <option value="">ไม่มีตัวคั่น</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวนหลักลำดับ
              </label>
              <select
                value={formData.sequenceWidth}
                onChange={(e) => setFormData({ ...formData, sequenceWidth: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 font-mono"
              >
                <option value={2}>2 หลัก (01)</option>
                <option value={3}>3 หลัก (001)</option>
                <option value={4}>4 หลัก (0001)</option>
                <option value={5}>5 หลัก (00001)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขลำดับถัดไป
              </label>
              <input
                type="number"
                min={1}
                max={999999}
                value={formData.nextSequence}
                onChange={(e) =>
                  setFormData({ ...formData, nextSequence: Math.max(1, parseInt(e.target.value, 10) || 1) })
                }
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          {/* Warning banner */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>ข้อควรระวัง:</strong> การรันเลขที่เอกสารทำงานด้วย IndexedDB ในเครื่อง หากใช้งานหลายอุปกรณ์หรือคนละเบราว์เซอร์ เลขที่จะไม่ซิงค์ข้ามเครื่องกัน กรุณาตรวจสอบลำดับก่อนออกเอกสาร
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  บันทึกแล้ว
                </>
              ) : (
                'บันทึกการตั้งค่า'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
