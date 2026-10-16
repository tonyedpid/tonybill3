# Thai Tax Invoice & Receipt Builder (โปรแกรมสร้างใบกำกับภาษี / ใบเสร็จรับเงิน)

A complete, production-grade, local-first web application designed for Thai businesses to manage issuer profiles, customer databases, dynamic line items, Thai VAT calculations, Buddhist Era dates, Thai Baht text conversions, and printable A4 formal tax documents.

---

## 🌟 Key Features

1. **Three Primary Screens (แท็บสลับหน้าจอหลัก 3 หน้าจอ):**
   - **Screen 1: Invoice Editor (หน้าสร้าง/แก้ไขเอกสาร):** ฟอร์มกรอกข้อมูลสถานประกอบการ, เลือกลูกค้าจากฐานข้อมูล, กำหนดเลขที่เอกสาร, ตารางสินค้า/บริการแบบไดนามิก, สรุปภาษี และปุ่มบันทึก/รีเซ็ต
   - **Screen 2: Original Document Preview (หน้าแสดงตัวอย่างต้นฉบับ):** เอกสาร A4 พร้อมระบุข้อความ **"ต้นฉบับ / ORIGINAL"**
   - **Screen 3: Copy Document Preview (หน้าแสดงตัวอย่างสำเนา):** เอกสาร A4 พร้อมระบุข้อความ **"สำเนา / COPY"**

2. **100% Local-First & Privacy Preserving (จัดเก็บในเครื่อง ปลอดภัยสูงสุด):**
   - ข้อมูลร้านค้า, โลโก้, ฐานข้อมูลลูกค้า, รูปแบบการรันเลขที่ และประวัติใบกำกับภาษีทั้งหมดถูกจัดเก็บลงใน **IndexedDB** ภายในเบราว์เซอร์ของผู้ใช้
   - ไม่มีการส่งข้อมูลทางการเงินหรือข้อมูลส่วนบุคคลไปยังเซิร์ฟเวอร์ภายนอกใดๆ
   - ทำงานแบบ Offline ได้อย่างสมบูรณ์หลังจากโหลดแอปครั้งแรก

3. **Accurate Thai VAT Calculation (คำนวณภาษีมูลค่าเพิ่มถูกต้องตามหลักกรมสรรพากร):**
   - **Mode A (0): ไม่คิด VAT** — อัตราศูนย์หรือไม่อยู่ในบังคับภาษี (ยอดรวม = ราคาสินค้า)
   - **Mode B (+): ราคาแยกภาษี VAT 7%** — ราคาสินค้าก่อนภาษี + VAT 7% (ปัดเศษสตางค์) = ยอดสุทธิ
   - **Mode C (-): ราคารวมภาษี VAT 7%** — ราคาสินค้ารวม VAT แล้ว ถอดภาษีออก 7/107 ยอดรวมสุทธิตรงกับยอดรวมสินค้าโดยไม่มีการบวกซ้ำ

4. **Thai Baht Text Conversion (แปลงจำนวนเงินเป็นตัวอักษรภาษาไทย):**
   - รองรับหลักการอ่านตามหลักภาษาไทย (เช่น 551.00 = "ห้าร้อยห้าสิบเอ็ดบาทถ้วน", 551.25 = "ห้าร้อยห้าสิบเอ็ดบาทยี่สิบห้าสตางค์", 1,000.50 = "หนึ่งพันบาทห้าสิบสตางค์")
   - จัดการเลข 1 ในหลักหน่วย ("เอ็ด"), เลข 2 ในหลักสิบ ("ยี่สิบ"), และจำนวนหลักล้านขึ้นไปได้อย่างถูกต้อง

5. **Official 13-Digit Tax ID Validation (ตรวจสอบเลขประจำตัวผู้เสียภาษี 13 หลัก):**
   - ใช้อัลกอริทึม MOD 11 Checksum มาตรฐานของกรมสรรพากรไทย พร้อมตรวจจับเลขซ้ำผิดปกติ

6. **Buddhist Era Dates (พ.ศ.):**
   - จัดเก็บวันที่เป็น ISO (YYYY-MM-DD) ป้องกันปัญหา Timezone Shift
   - แสดงผลในเอกสารและหน้าจอเป็น พุทธศักราช (พ.ศ. = ค.ศ. + 543) พร้อมชื่อเดือนภาษาไทยเต็มและย่อ

7. **A4 Portrait Browser Native Printing:**
   - ใช้คำสั่งพิมพ์มาตรฐานของเบราว์เซอร์ (`window.print()`)
   - ซ่อนแถบควบคุม เมนู และปุ่มต่างๆ ทั้งหมดในโหมดพิมพ์
   - กำหนดขนาดหน้ากระดาษ `@page { size: A4 portrait; margin: 8mm 10mm; }` เพื่อให้พอดีกับกระดาษ 1 หน้าอย่างสวยงาม

8. **Backup & Restore (ส่งออกและกู้คืนข้อมูล):**
   - ส่งออกข้อมูลทั้งหมดเป็น JSON สำรองไว้ในคอมพิวเตอร์
   - นำเข้าข้อมูลพร้อมตัวเลือกว่าจะเขียนทับทั้งหมด (Replace) หรือรวมข้อมูล (Merge) พร้อมระบบสร้างไฟล์สำรองอัตโนมัติก่อนนำเข้า

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js version 20+ (recommended)
- npm version 9+

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run automated tests (Vitest)
npm run test

# 3. Type check
npm run lint

# 4. Start local development server
npm run dev
```

App will be accessible at: `http://localhost:3000`

---

## 🧪 Automated Test Suite

Run tests via:
```bash
npm run test
```

The test suite covers:
- **Calculation tests:** No VAT (551.00 -> 551.00), VAT added (551.00 -> 589.57 with 38.57 VAT), VAT included (1070.00 -> 1000.00 pre-tax with 70.00 VAT), multiple decimal line items, zero-value invoices, non-finite guardrails.
- **Thai Baht text tests:** 0, 1, 11, 21, 101, 551.00, 551.25, 1000.50, satang fractions, large millions, and negative values.
- **Thai Tax ID tests:** Valid tax IDs, invalid check digits, malformed lengths, identical digits.
- **Numbering tests:** Prefix format ("TK69 021", "INV-2569/001"), zero-padding, collision avoidance.
- **Thai Date tests:** CE to BE calendar year conversion, full and short Thai month formatting.

---

## 📦 Deployment to GitHub Pages

The application is configured to deploy directly to GitHub Pages:

1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings > Pages**
   - Under **Build and deployment > Source**, select **GitHub Actions**
3. The `.github/workflows/deploy.yml` workflow will automatically run tests, compile the bundle with the correct base path, and deploy the application.

---

## 🖨️ Printing Guidelines

1. Navigate to **Screen 2 (ต้นฉบับ / ORIGINAL)** or **Screen 3 (สำเนา / COPY)**.
2. Click the **"สั่งพิมพ์ (Print A4)"** button in the header toolbar or use `Ctrl + P` / `Cmd + P`.
3. In the browser print dialog:
   - **Destination:** Select your printer or "Save as PDF"
   - **Paper Size:** A4
   - **Layout:** Portrait
   - **Margins:** Default (or Minimum)
   - **Options:** Enable **Background graphics** so subtle table header fills and orange highlight borders are included.

---

## 🛡️ Anti-White-Screen Architecture

1. **Root Verification:** `main.tsx` verifies `#root` exists before mounting and shows a structured fallback if DOM loading fails.
2. **React Error Boundary:** Catches runtime render errors, prevents white screens, and provides a recovery retry action.
3. **Storage Fallback:** If IndexedDB is blocked or disabled by private browsing, an in-memory fallback engages automatically to prevent crashing.
4. **Defensive Value Coercion:** All quantities, prices, and totals are guarded against `NaN`, non-finite, and negative inputs.
