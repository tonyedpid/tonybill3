import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  Check,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Customer, BranchType, VatMode } from '../../types';
import { validateThaiTaxId, cleanTaxId, formatThaiTaxId } from '../../utils/thaiTaxId';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onSelectCustomer?: (customer: Customer) => void;
  onReorderCustomers?: (customers: Customer[]) => Promise<void> | void;
}

const EMPTY_CUSTOMER: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
  alias: '',
  legalName: '',
  contactPerson: '',
  address: '',
  taxId: '',
  branchType: 'head_office',
  branchNumber: '00000',
  defaultVatMode: '+',
  phone: '',
  email: '',
};

export const CustomerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomer,
  onReorderCustomers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_CUSTOMER);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taxIdError, setTaxIdError] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleMoveUp = (index: number) => {
    if (index <= 0 || searchQuery.trim()) return;
    const updated = [...customers];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onReorderCustomers?.(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= customers.length - 1 || searchQuery.trim()) return;
    const updated = [...customers];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onReorderCustomers?.(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (searchQuery.trim()) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (searchQuery.trim()) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (searchQuery.trim() || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...customers];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    setDragOverIndex(null);
    onReorderCustomers?.(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isOpen) return null;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCustomers = customers.filter((c) => {
    return (
      c.alias.toLowerCase().includes(normalizedQuery) ||
      c.legalName.toLowerCase().includes(normalizedQuery) ||
      (c.taxId && c.taxId.includes(normalizedQuery))
    );
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_CUSTOMER);
    setTaxIdError('');
    setAliasError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      alias: c.alias,
      legalName: c.legalName,
      contactPerson: c.contactPerson || '',
      address: c.address,
      taxId: c.taxId || '',
      branchType: c.branchType || 'head_office',
      branchNumber: c.branchNumber || '00000',
      defaultVatMode: c.defaultVatMode || '+',
      phone: c.phone || '',
      email: c.email || '',
    });
    setTaxIdError('');
    setAliasError('');
    setIsFormOpen(true);
  };

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = cleanTaxId(e.target.value);
    setFormData((prev) => ({ ...prev, taxId: raw }));

    if (raw.length === 13) {
      const val = validateThaiTaxId(raw);
      setTaxIdError(val.isValid ? '' : val.message);
    } else if (raw.length > 0) {
      setTaxIdError(`ยังไม่ครบ 13 หลัก (${raw.length}/13)`);
    } else {
      setTaxIdError('');
    }
  };

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, alias: val }));

    const normalized = val.trim().toLowerCase();
    const duplicate = customers.find(
      (c) => c.alias.trim().toLowerCase() === normalized && c.id !== editingId
    );

    if (duplicate) {
      setAliasError('ชื่อเรียกนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
    } else {
      setAliasError('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedAlias = formData.alias.trim();
    if (!normalizedAlias) {
      setAliasError('กรุณาระบุชื่อเรียก');
      return;
    }

    const duplicate = customers.find(
      (c) => c.alias.trim().toLowerCase() === normalizedAlias.toLowerCase() && c.id !== editingId
    );
    if (duplicate) {
      setAliasError('ชื่อเรียกนี้มีอยู่ในระบบแล้ว');
      return;
    }

    if (!formData.legalName.trim()) {
      alert('กรุณาระบุชื่อนิติบุคคลหรือชื่อบุคคลผู้ซื้อ');
      return;
    }

    const now = new Date().toISOString();
    const customerToSave: Customer = {
      id: editingId || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      alias: normalizedAlias,
      legalName: formData.legalName.trim(),
      contactPerson: formData.contactPerson.trim(),
      address: formData.address.trim(),
      taxId: formData.taxId.trim(),
      branchType: formData.branchType,
      branchNumber: formData.branchType === 'head_office' ? '00000' : formData.branchNumber.trim(),
      defaultVatMode: formData.defaultVatMode,
      phone: formData.phone?.trim(),
      email: formData.email?.trim(),
      createdAt: editingId
        ? customers.find((c) => c.id === editingId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    await onSaveCustomer(customerToSave);
    setIsFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await onDeleteCustomer(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  ฐานข้อมูลลูกค้า (Customer Directory)
                </h2>
                <p className="text-xs text-slate-500">
                  บันทึกข้อมูลลูกค้าไว้ใช้ซ้ำและเลือกใส่ใบกำกับภาษีได้สะดวกรวดเร็ว
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Area */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col">
            {isFormOpen ? (
              /* Add/Edit Sub-form */
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingId ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    กลับไปรายการลูกค้า
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อเรียก (Alias สำหรับค้นหาด่วน) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.alias}
                      onChange={handleAliasChange}
                      placeholder="เช่น บจก. เทค พัฒนา หรือ ร้านสมชาย"
                      className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                        aliasError ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-orange-200'
                      }`}
                    />
                    {aliasError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {aliasError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ซื้อ / นิติบุคคลเต็ม (Legal Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      placeholder="เช่น บริษัท เทค พัฒนา ซิสเต็มส์ จำกัด"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลขประจำตัวผู้เสียภาษี 13 หลัก
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={formData.taxId}
                      onChange={handleTaxIdChange}
                      placeholder="เช่น 0105561025782"
                      className={`w-full px-3 py-2 text-sm font-mono tracking-wider bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                        taxIdError ? 'border-rose-400 focus:ring-rose-200 text-rose-900' : 'border-slate-300 focus:ring-orange-200'
                      }`}
                    />
                    {formData.taxId && formData.taxId.length === 13 && (
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        {formatThaiTaxId(formData.taxId)}
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
                      สำนักงานใหญ่ / สาขา
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, branchType: 'head_office', branchNumber: '00000' })
                        }
                        className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          formData.branchType === 'head_office'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300'
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
                        className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          formData.branchType === 'branch'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        สาขา
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสสาขา (ถ้าเป็นสาขา)
                    </label>
                    <input
                      type="text"
                      disabled={formData.branchType === 'head_office'}
                      value={formData.branchType === 'head_office' ? '00000 (สำนักงานใหญ่)' : formData.branchNumber}
                      onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                      placeholder="เช่น 00001"
                      className="w-full px-3 py-2 text-sm font-mono bg-white disabled:bg-slate-100 disabled:text-slate-500 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ที่อยู่ (Address) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="เลขที่ อาคาร ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อผู้ติดต่อ (Contact Person)
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="เช่น คุณสมชาย"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ (Telephone)
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="เช่น 02-512-3456"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รูปแบบ VAT เริ่มต้น
                    </label>
                    <select
                      value={formData.defaultVatMode}
                      onChange={(e) => setFormData({ ...formData, defaultVatMode: e.target.value as VatMode })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="+">แยกภาษี VAT 7% (+)</option>
                      <option value="-">รวมภาษี VAT 7% (-)</option>
                      <option value="0">ไม่คิด VAT (0)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลูกค้า'}
                  </button>
                </div>
              </form>
            ) : (
              /* Customers List */
              <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาตามชื่อเรียก, นิติบุคคล, หรือเลขผู้เสียภาษี..."
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มลูกค้าใหม่
                  </button>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Users className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {searchQuery ? 'ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อมูลลูกค้าในระบบ'}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {searchQuery ? 'ลองค้นหาด้วยคำอื่น หรือเพิ่มลูกค้าใหม่' : 'กดปุ่ม "เพิ่มลูกค้าใหม่" เพื่อเริ่มสร้างประวัติลูกค้า'}
                    </p>
                    {!searchQuery && (
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                      >
                        เพิ่มลูกค้าคนแรก
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {!searchQuery.trim() && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>กดเม้าส์ค้างแล้วลากเพื่อย้ายตำแหน่งลูกค้า หรือใช้ปุ่มลูกศร ขึ้น-ลง (↑ / ↓) เพื่อจัดลำดับ</span>
                      </div>
                    )}

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {filteredCustomers.map((c) => {
                        const index = customers.findIndex((item) => item.id === c.id);
                        const isBeingDragged = draggedIndex === index;
                        const isDragOver = dragOverIndex === index;

                        return (
                          <div
                            key={c.id}
                            draggable={!searchQuery.trim()}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`p-3.5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                              isDragOver
                                ? 'bg-orange-50/90 ring-2 ring-orange-500 ring-inset'
                                : isBeingDragged
                                ? 'opacity-40 bg-slate-100'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {/* Drag Handle & Up/Down Arrows */}
                              <div className="flex items-center gap-1 shrink-0">
                                <div
                                  className={`p-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 ${
                                    searchQuery ? 'opacity-20 cursor-not-allowed' : ''
                                  }`}
                                  title={searchQuery ? 'ไม่สามารถลากขณะค้นหา' : 'คลิกค้างแล้วลากเพื่อย้ายตำแหน่ง'}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index <= 0 || !!searchQuery.trim()}
                                    title="เลื่อนขึ้น (Move Up)"
                                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index >= customers.length - 1 || !!searchQuery.trim()}
                                    title="เลื่อนลง (Move Down)"
                                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900">
                                    {c.alias}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    · {c.legalName}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                                    {c.branchType === 'head_office' ? 'สำนักงานใหญ่' : `สาขา ${c.branchNumber}`}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    VAT: {c.defaultVatMode === '+' ? 'แยก 7%' : c.defaultVatMode === '-' ? 'รวม 7%' : 'ไม่คิด'}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 truncate max-w-2xl mb-1">
                                  {c.address}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
                                  {c.taxId && <span>Tax ID: {formatThaiTaxId(c.taxId)}</span>}
                                  {c.contactPerson && <span className="font-sans">ผู้ติดต่อ: {c.contactPerson}</span>}
                                  {c.phone && <span>โทร: {c.phone}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {onSelectCustomer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectCustomer(c);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors cursor-pointer"
                                >
                                  เลือกใส่อินวอยซ์
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetId(c.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="ยืนยันการลบลูกค้า"
        message="คุณต้องการลบข้อมูลลูกค้านี้ใช่หรือไม่? ใบกำกับภาษีในอดีตที่เคยบันทึกไว้จะไม่ได้รับผลกระทบ"
        confirmLabel="ลบลูกค้า"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
};
