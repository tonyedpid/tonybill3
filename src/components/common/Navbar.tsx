import React from 'react';
import { ScreenView } from '../../types';
import { FileEdit, FileCheck, Copy, Building, Users, Hash, History, HardDrive, Printer } from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenView;
  onScreenChange: (screen: ScreenView) => void;
  onOpenIssuerModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenNumberingModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenBackupModal: () => void;
  onPrint: () => void;
  isDraftModified: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onScreenChange,
  onOpenIssuerModal,
  onOpenCustomerModal,
  onOpenNumberingModal,
  onOpenHistoryModal,
  onOpenBackupModal,
  onPrint,
  isDraftModified,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top tier: Brand & Global Tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            ใบ
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              Thai Tax Invoice & Receipt
            </h1>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              ระบบสร้างใบกำกับภาษี/ใบเสร็จรับเงิน (Local-First IndexedDB)
            </p>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenIssuerModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="ตั้งค่าข้อมูลร้านและโลโก้"
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">ข้อมูลร้าน</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomerModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="จัดการฐานข้อมูลลูกค้า"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">ลูกค้า</span>
          </button>

          <button
            type="button"
            onClick={onOpenNumberingModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="ตั้งค่ารูปแบบเลขที่ใบกำกับ"
          >
            <Hash className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">เลขที่เอกสาร</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistoryModal}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="ประวัติใบกำกับภาษีที่บันทึกไว้"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>ประวัติเอกสาร</span>
          </button>

          <button
            type="button"
            onClick={onOpenBackupModal}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="สำรอง/กู้คืนข้อมูล (Backup & Restore)"
          >
            <HardDrive className="w-4 h-4" />
          </button>

          {currentScreen !== 'editor' && (
            <button
              type="button"
              onClick={onPrint}
              className="ml-1 px-3 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="พิมพ์เอกสารออกเครื่องพิมพ์ / PDF (A4)"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ (Print A4)</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Navigation Tabs: exactly 3 primary screens */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 py-1.5 overflow-x-auto">
          {/* Screen 1: Invoice Editor */}
          <button
            type="button"
            onClick={() => onScreenChange('editor')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              currentScreen === 'editor'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5 text-orange-600" />
            <span>1. สร้าง/แก้ไขเอกสาร</span>
            {isDraftModified && currentScreen !== 'editor' && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="มีข้อมูลกำลังแก้ไข" />
            )}
          </button>

          {/* Combined Screen 2: ดูเอกสารก่อนพิมพ์ (Shows both Original & Copy) */}
          <button
            type="button"
            onClick={() => onScreenChange('preview_all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              currentScreen !== 'editor'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>2. ดูเอกสารก่อนพิมพ์</span>
          </button>
        </div>
      </div>
    </header>
  );
};
