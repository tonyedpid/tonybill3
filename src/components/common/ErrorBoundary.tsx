import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              เกิดข้อผิดพลาดในการแสดงผล
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              ระบบป้องกันหน้าจอว่างเปล่า (Anti-White-Screen) กำลังทำงาน ข้อมูลของคุณที่ถูกบันทึกไว้ในเบราว์เซอร์ยังคงปลอดภัย
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 text-left mb-6 overflow-auto max-h-32">
                {this.state.error.message || 'Unknown render error'}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                ลองแสดงผลใหม่
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                รีเฟรชหน้าเว็บ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
