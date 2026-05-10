import React, { useRef, useEffect, useState } from 'react';
import { Lock, Search, Bell, ChevronDown, User, LogOut, LayoutDashboard, ScrollText, FolderOpen, ListChecks } from 'lucide-react';
import logoImg from "../../../../assets/brand/nexaplan-logo.png";

export type ModuleView = 'overview' | 'audit-trails' | 'financial-statements' | 'compliance-scans';

interface AuditorTopNavProps {
  activeModule: ModuleView;
  setActiveModule: (m: ModuleView) => void;
  onBack?: () => void;
  onGenerateReport: () => void;
  auditorName: string;
}

export function AuditorTopNav({ activeModule, setActiveModule, onBack, onGenerateReport, auditorName }: AuditorTopNavProps) {
  const [showProfile, setShowProfile] = React.useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
        <div>
          <div className="font-black text-xl leading-none text-white">NexaPlan</div>
          <div className="text-xs text-slate-400 mt-0.5">Auditor</div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1 rounded-full border border-slate-600 ml-2">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Read Only</span>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="flex gap-1">
        {[
          { id: 'overview' as ModuleView, label: 'Overview', icon: LayoutDashboard },
          { id: 'audit-trails' as ModuleView, label: 'Audit Trails', icon: ScrollText },
          { id: 'financial-statements' as ModuleView, label: 'Financial Statements', icon: FolderOpen },
          { id: 'compliance-scans' as ModuleView, label: 'Compliance Scans', icon: ListChecks },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveModule(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeModule === id
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onGenerateReport}
          className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-all"
        >
          <ScrollText className="w-4 h-4" />
          Generate Report
        </button>
        <button className="text-slate-400 hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
        </button>
        {/* Profile Dropdown */}
        <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm">
              {auditorName.substring(0,2).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-none">{auditorName}</div>
              <div className="text-xs text-slate-400 mt-0.5">Auditor</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="text-sm font-bold text-slate-900">{auditorName}</div>
                <div className="text-xs text-slate-500">auditor@nexaplan.ph</div>
              </div>
              <div className="py-1">
                <button onClick={() => { setShowProfile(false); setModalMessage('Profile Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400" /> Profile Settings
                </button>
                <button onClick={() => { setShowProfile(false); setModalMessage('Security Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Lock className="w-4 h-4 text-slate-400" /> Security
                </button>
              </div>
              <div className="py-1 border-t border-slate-100">
                <button onClick={() => { setShowProfile(false); onBack?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">Notice</h3>
            <p className="text-sm text-slate-600 text-center mb-6">{modalMessage}</p>
            <button onClick={() => setModalMessage(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all">Acknowledge</button>
          </div>
        </div>
      )}
    </nav>
  );
}
