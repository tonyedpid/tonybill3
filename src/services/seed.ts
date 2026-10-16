import { IssuerProfile, Customer } from '../types';

export const SAMPLE_ISSUER: IssuerProfile = {
  businessName: 'บริษัท สยาม ซอฟต์แวร์ แอนด์ ดิจิทัล โซลูชั่นส์ จำกัด',
  address: '88/12 อาคารสาทรธานี ชั้น 15 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500',
  branchType: 'head_office',
  branchNumber: '00000',
  taxId: '0105556108420',
  phone: '02-638-8900',
  email: 'contact@siamsoftware.co.th',
};

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    alias: 'บจก. เทค พัฒนา',
    legalName: 'บริษัท เทค พัฒนา ซิสเต็มส์ จำกัด',
    contactPerson: 'คุณสมชาย ยอดประสิทธิ์',
    address: '123/45 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
    taxId: '0105561025782',
    branchType: 'head_office',
    branchNumber: '00000',
    defaultVatMode: '+', // VAT Added 7%
    phone: '02-512-3456',
    email: 'finance@techpattana.co.th',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-002',
    alias: 'ซีเอ็ม โกลบอล',
    legalName: 'บริษัท เชียงใหม่ โกลบอล เทรดดิ้ง จำกัด (สาขา 1)',
    contactPerson: 'คุณกานดา จิตเจริญ',
    address: '99/5 หมู่ 2 ตำบลสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200',
    taxId: '0505554001235',
    branchType: 'branch',
    branchNumber: '00001',
    defaultVatMode: '-', // VAT Included 7%
    phone: '053-221-889',
    email: 'acct@cmglobal.co.th',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-003',
    alias: 'สหกรณ์บริการ',
    legalName: 'สหกรณ์บริการเพื่อสังคม จำกัด',
    contactPerson: 'คุณประดิษฐ์ รักษ์ดี',
    address: '400/1 ถนนราชดำเนินกลาง แขวงบวรนิเวศ เขตพระนคร กรุงเทพมหานคร 10200',
    taxId: '0994000164219',
    branchType: 'head_office',
    branchNumber: '00000',
    defaultVatMode: '0', // No VAT
    phone: '02-281-9900',
    email: 'service@coop-thai.org',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
