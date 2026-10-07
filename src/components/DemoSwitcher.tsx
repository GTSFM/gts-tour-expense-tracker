import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ChevronDown, Sparkles, MapPin, Shield } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const roleLabels: Record<string, string> = {
    EMPLOYEE: 'Employee / Claimant',
    REGIONAL_APPROVER: 'Regional Approver',
    PROFIT_CENTRE_HEAD: 'Profit Centre Head',
    PRESIDENT: 'President (Final Authority)',
    DIRECTOR: 'Director (Management)',
    AUDITOR: 'Internal Auditor',
    ACCOUNTS: 'Accounts / Finance',
    MASTER_ADMIN: 'Master / Super Admin'
  };

  const getPersonaBadge = (u: any) => {
    if (u.id === 'u-president') return 'President (Bharanidhar Tarimana)';
    if (u.id === 'u-krishnan') return 'Approver: AP & Telangana';
    if (u.id === 'u-samuel') return 'Approver: Karnataka & East';
    if (u.id === 'u-yoga') return 'Approver: Tamil Nadu / ROTN';
    if (u.id === 'u-sundar') return 'Approver: Tamil Nadu / ROTN';
    if (u.id === 'u-tejinder') return 'Profit Centre Head (Direct to President)';
    if (u.id === 'u-dir-1') return 'Director (Mariappan)';
    if (u.id === 'u-dir-2') return 'Director (Prabakar)';
    if (u.id === 'u-auditor') return 'Auditor (13-Point Checklist)';
    if (u.id === 'u-accounts') return 'Accounts (Payment Settlement)';
    if (u.id === 'u-admin') return 'Master Admin (Policies & Users)';
    if (u.id === 'u-emp-1') return 'Demo Employee GTS001 (Band B1)';
    return `${u.designation} (${u.band})`;
  };

  return (
    <div className="relative z-50">
      <div className="bg-gts-800 text-white px-3 py-1.5 flex items-center justify-between text-xs shadow-md border-b border-gts-700">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <div className="flex items-center gap-1 font-semibold text-amber-300 uppercase tracking-wider text-[11px] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Switcher:</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-md px-2.5 py-1 transition-all border border-white/20 font-medium"
          >
            <Shield className="w-3 h-3 text-amber-300" />
            <span className="font-semibold">{currentUser.name}</span>
            <span className="text-white/70 text-[11px] hidden md:inline">
              [{roleLabels[currentUser.role] || currentUser.role}]
            </span>
            {currentUser.assignedTerritories && (
              <span className="bg-amber-400/20 text-amber-200 text-[10px] px-1.5 py-0.2 rounded hidden lg:inline">
                {currentUser.assignedTerritories.join(', ')}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-white/80" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-white/80 shrink-0">
          <span className="hidden sm:inline bg-gts-900/60 px-2 py-0.5 rounded text-amber-200">
            Band: <strong>{currentUser.band}</strong>
          </span>
          <span className="hidden md:inline bg-gts-900/60 px-2 py-0.5 rounded text-emerald-200">
            Status: <strong>{currentUser.status}</strong>
          </span>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute top-12 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] max-h-[85vh] overflow-y-auto bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Switch Demo Persona</h4>
                <p className="text-xs text-slate-500">Test workflows instantly without manual re-login</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                12 Roles Pre-seeded
              </span>
            </div>

            <div className="space-y-1.5">
              {allUsers.map(user => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-sm font-semibold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-purple-700 text-white'
                            : user.role === 'PRESIDENT'
                            ? 'bg-amber-600 text-white'
                            : user.role === 'AUDITOR'
                            ? 'bg-sky-600 text-white'
                            : user.role === 'ACCOUNTS'
                            ? 'bg-emerald-600 text-white'
                            : user.role === 'MASTER_ADMIN'
                            ? 'bg-indigo-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {user.name}
                          <span className="text-[11px] font-normal text-slate-500">
                            ({user.employeeId})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {getPersonaBadge(user)}
                        </div>
                        {user.assignedTerritories && (
                          <div className="text-[10px] text-indigo-600 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            Territories: {user.assignedTerritories.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          user.role === 'PRESIDENT'
                            ? 'bg-amber-100 text-amber-900'
                            : user.role === 'AUDITOR'
                            ? 'bg-sky-100 text-sky-900'
                            : user.role === 'ACCOUNTS'
                            ? 'bg-emerald-100 text-emerald-900'
                            : user.role === 'REGIONAL_APPROVER'
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.band} • {user.role}
                      </span>
                      {isSelected && (
                        <div className="flex items-center justify-end gap-1 text-[11px] text-purple-700 font-semibold mt-1">
                          <UserCheck className="w-3.5 h-3.5" /> Active
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
