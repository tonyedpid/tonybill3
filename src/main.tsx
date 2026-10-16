import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  const fallback = document.createElement('div');
  fallback.id = 'root-missing-fallback';
  fallback.style.padding = '2rem';
  fallback.style.fontFamily = 'sans-serif';
  fallback.innerHTML = '<h2>เกิดข้อผิดพลาดในการเริ่มต้นระบบ</h2><p>ไม่พบองค์ประกอบหลักของหน้าเว็บ (#root)</p>';
  document.body.appendChild(fallback);
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('Fatal initialization error:', err);
    rootElement.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; font-family: sans-serif;">
        <h2 style="color: #dc2626;">เกิดข้อผิดพลาดในการโหลดโปรแกรม</h2>
        <p style="color: #475569; margin: 1rem 0;">โปรดรีเฟรชหน้าเว็บ หรือตรวจสอบว่าเบราว์เซอร์อนุญาตให้ใช้งาน IndexedDB หรือไม่</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #ea580c; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">รีเฟรชหน้าเว็บ</button>
      </div>
    `;
  }
}
