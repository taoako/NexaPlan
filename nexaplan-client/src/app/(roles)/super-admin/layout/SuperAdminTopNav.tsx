import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Building2, CreditCard, UserCog, Settings, Database, ClipboardList, ChevronDown, LogOut, User, Lock, Tag, Key } from 'lucide-react';
import logoImg from "/src/assets/brand/nexaplan-logo.png";
import type { DashboardView } from '../SuperAdminSystem';

interface SuperAdminTopNavProps {
  currentView: DashboardView;
  setCurrentView: React.Dispatch<React.SetStateAction<DashboardView>>;
  onLogout: () => void;
  pendingTrialCount: number;
}

export function SuperAdminTopNav({ currentView, setCurrentView, onLogout, pendingTrialCount }: SuperAdminTopNavProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const [user, setUser] = useState<{ name: string; firstName?: string; lastName?: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string, first?: string, last?: string) => {
    if (first && last) return (first[0] + last[0]).toUpperCase();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const displayName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name) : 'Super Admin';

  return (
    <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 shrink-0 border-b border-white/10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Super Admin</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {([
          { view: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
          { view: 'tenants', icon: Building2, label: 'Tenants' },
          { view: 'billing', icon: CreditCard, label: 'Billing' },
          { view: 'pricing', icon: Tag, label: 'Pricing' },
          { view: 'admins', icon: UserCog, label: 'Admins' },
        ] as { view: DashboardView; icon: React.ElementType; label: string }[]).map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === view ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 inline mr-1.5" />
            {label}
          </button>
        ))}

        <button
          onClick={() => setCurrentView('trial-requests')}
          className={`relative px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
            currentView === 'trial-requests' ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4 inline mr-1.5" />
          Trial Requests
          {pendingTrialCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0F172A]">
              {pendingTrialCount}
            </span>
          )}
        </button>

        {([
          { view: 'config', icon: Settings, label: 'Config' },
          { view: 'maintenance', icon: Database, label: 'Maintenance' },
        ] as { view: DashboardView; icon: React.ElementType; label: string }[]).map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === view ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 inline mr-1.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
          <span className="text-slate-300 font-medium">All Systems Operational</span>
        </div>

        <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user ? getInitials(user.name, user.firstName, user.lastName) : 'SA'}</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-none">{displayName}</div>
              <div className="text-xs text-slate-400 mt-0.5">{user?.role || 'Super Admin'}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="text-sm font-bold text-slate-900">{displayName}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
              <div className="py-1">
                <button onClick={() => { setShowProfileDropdown(false); setModalMessage('Profile Settings — Edit your display name, avatar, and contact details.'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4 text-slate-400" /> Profile Settings
                </button>
                <button onClick={() => { setShowProfileDropdown(false); setModalMessage('Security Settings — Manage MFA, password, and active sessions.'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Lock className="w-4 h-4 text-slate-400" /> Security
                </button>
              </div>
              <div className="py-1 border-t border-slate-100">
                <button onClick={() => { setShowProfileDropdown(false); onLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
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