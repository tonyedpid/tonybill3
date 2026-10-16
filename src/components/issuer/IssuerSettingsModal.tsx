import React, { useState, useRef } from 'react';
import { X, Upload, Building, Trash2, Check, AlertCircle } from 'lucide-react';
import { IssuerProfile, BranchType } from '../../types';
import { validateThaiTaxId, cleanTaxId, formatThaiTaxId } from '../../utils/thaiTaxId';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  issuer: IssuerProfile;
  onSave: (issuer: IssuerProfile) => void;
}

export const IssuerSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  issuer,
  onSave,
}) => {
  const [formData, setFormData] = useState<IssuerProfile>({ ...issuer });
  const [logoPreview, setLogoPreview] = useState<string | undefined>(issuer.logoDataUrl);
  const [taxIdError, setTaxIdError] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanTaxId(raw);
    setFormData((prev) => ({ ...prev, taxId: cleaned }));

    if (cleaned.length === 13) {
      const val = validateThaiTaxId(cleaned);
      setTaxIdError(val.isValid ? '' : val.message);
    } else if (cleaned.length > 0) {
      setTaxIdError(`ยังไม่ครบ 13 หลัก (${cleaned.length}/13)`);
    } else {
      setTaxIdError('');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setFileError('รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG, WebP, SVG)');
      return;
    }

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setFileError('ขนาดไฟล์ต้องไม่เกิน 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoDataUrl: result }));
    };
    reader.onerror = () => {
      setFileError('เกิดข้อผิดพลาดในการอ่านไฟล์');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(undefined);
    setFormData((prev) => ({ ...prev, logoDataUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      alert('กรุณาระบุชื่อสถานประกอบการ / บริษัท');
      return;
    }

    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    const blank: IssuerProfile = {
      businessName: '',
      address: '',
      branchType: 'head_office',
      branchNumber: '00000',
      taxId: '',
      phone: '',
      email: '',
      logoDataUrl: undefined,
    };
    setFormData(blank);
    setLogoPreview(undefined);
    setTaxIdError('');
    setShowResetConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-orange-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  ตั้งค่าข้อมูลสถานประกอบการ (ผู้ออกใบกำกับภาษี)
                </h2>
                <p className="text-xs text-slate-500">
                  ข้อมูลจะถูกบันทึกไว้ในเครื่องของคุณอัตโนมัติและแสดงบนหัวเอกสาร
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {/* Logo Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                โลโก้ร้าน / บริษัท (Business Logo)
              </label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-24 border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/30 transition-colors overflow-hidden group relative"
                  title="คลิกเพื่อเลือกไฟล์รูปภาพ"
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-600 mx-auto mb-1 transition-colors" />
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        อัปโหลดโลโก้
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      เลือกไฟล์รูปภาพ...
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบโลโก้
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    รองรับ PNG, JPG, WebP, SVG ขนาดไม่เกิน 2MB (จัดเก็บแบบออฟไลน์ในเครื่อง)
                  </p>
                  {fileError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fileError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อสถานประกอบการ / บริษัท (Business Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="เช่น บริษัท สยาม นวัตกรรม จำกัด"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่เต็มตามทะเบียนภาษี (Tax Registered Address) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="เลขที่ อาคาร ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              />
            </div>

            {/* Branch and Tax ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลขประจำตัวผู้เสียภาษีอากร 13 หลัก (Tax ID)
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={formData.taxId}
                  onChange={handleTaxIdChange}
                  placeholder="เช่น 0105556108420"
                  className={`w-full px-3 py-2 text-sm font-mono tracking-wider bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                    taxIdError
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 text-rose-900'
                      : 'border-slate-300 focus:ring-orange-500/20 focus:border-orange-500'
                  }`}
                />
                {formData.taxId && (
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    จัดรูปแบบ: {formatThaiTaxId(formData.taxId)}
                  </p>
                )}
                {taxIdError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {taxIdError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สำนักงานใหญ่ / สาขา (Branch Designation)
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        branchType: 'head_office',
                        branchNumber: '00000',
                      })
                    }
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      formData.branchType === 'head_office'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    สำนักงานใหญ่
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        branchType: 'branch',
                        branchNumber: formData.branchNumber === '00000' ? '00001' : formData.branchNumber,
                      })
                    }
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      formData.branchType === 'branch'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    สาขา
                  </button>
                </div>
                {formData.branchType === 'branch' && (
                  <input
                    type="text"
                    value={formData.branchNumber}
                    onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                    placeholder="รหัสสาขา เช่น 00001"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                )}
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ (Telephone)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 02-123-4567"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="เช่น billing@company.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
              >
                ล้างข้อมูลฟอร์ม
              </button>

              <div className="flex gap-2.5">
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
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      บันทึกแล้ว
                    </>
                  ) : (
                    'จำข้อมูลร้าน'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="ยืนยันการล้างข้อมูลร้าน"
        message="คุณต้องการล้างข้อมูลสถานประกอบการและโลโก้ใช่หรือไม่?"
        confirmLabel="ล้างข้อมูล"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
