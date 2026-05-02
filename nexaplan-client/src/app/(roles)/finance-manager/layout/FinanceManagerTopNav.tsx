import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, User, Lock, ChevronDown, LucideIcon } from 'lucide-react';
import logoImg from "../../../../assets/brand/nexaplan-logo.png"; // Adjusted path to go up one more level
import { ModuleView } from '../FinanceManagerSystem';

interface NavTab {
  id: ModuleView;
  label: string;
  icon: LucideIcon;
}

interface FinanceManagerTopNavProps {
  activeModule: ModuleView;
  setActiveModule: (module: ModuleView) => void;
  navTabs: NavTab[];
  onBack: () => void;
}

export function FinanceManagerTopNav({ activeModule, setActiveModule, navTabs, onBack }: FinanceManagerTopNavProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the profile dropdown to close it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
        <div>
          <div className="font-black text-xl leading-none text-white">NexaPlan</div>
          <div className="text-xs text-slate-400 mt-0.5">Finance Manager</div>
        </div>
      </div>

      {/* Center: Module Navigation */}
      <div className="flex gap-1">
        {navTabs.map(({ id, label, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => setActiveModule(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeModule === id ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-white transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        
        <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)} 
            className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm">
              FM
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-none">Maria Santos</div>
              <div className="text-xs text-slate-400 mt-0.5">Finance Manager</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="text-sm font-bold text-slate-900">Maria Santos</div>
                <div className="text-xs text-slate-500">finance@nexaplan.ph</div>
              </div>
              <div className="py-1">
                <button onClick={() => { setShowProfileDropdown(false); alert('Profile Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400" />Profile Settings
                </button>
                <button onClick={() => { setShowProfileDropdown(false); alert('Security Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Lock className="w-4 h-4 text-slate-400" />Security
                </button>
              </div>
              <div className="py-1 border-t border-slate-100">
                <button onClick={() => { setShowProfileDropdown(false); onBack(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}