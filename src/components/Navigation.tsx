import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  CheckSquare,
  ShieldCheck,
  CreditCard,
  Settings,
  BarChart3,
  UserCheck,
  Compass
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  pendingApprovalsCount = 0
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const role = currentUser.role;

  // Define tab items based on active role
  const getTabs = () => {
    const tabs = [];

    if (role === 'EMPLOYEE' || role === 'PROFIT_CENTRE_HEAD') {
      tabs.push({ id: 'dashboard', label: 'My Claims', icon: LayoutDashboard });
      tabs.push({ id: 'new-tour', label: '+ New Tour', icon: Compass });
      tabs.push({ id: 'new-expense', label: '+ New Expense', icon: PlusCircle });
      tabs.push({ id: 'profile', label: 'Profile', icon: UserCheck });
    } else if (role === 'REGIONAL_APPROVER') {
      tabs.push({
        id: 'approvals',
        label: 'Territory Approvals',
        icon: CheckSquare,
        badge: pendingApprovalsCount
      });
      tabs.push({ id: 'dashboard', label: 'My Personal Claims', icon: LayoutDashboard });
      tabs.push({ id: 'reports', label: 'Regional Reports', icon: BarChart3 });
    } else if (role === 'PRESIDENT' || role === 'DIRECTOR') {
      tabs.push({
        id: 'president',
        label: 'Management Approvals',
        icon: ShieldCheck,
        badge: pendingApprovalsCount
      });
      tabs.push({ id: 'all-claims', label: 'Company Claims', icon: FileText });
      tabs.push({ id: 'reports', label: 'Management Reports', icon: BarChart3 });
      tabs.push({ id: 'admin', label: 'View Master', icon: Settings });
    } else if (role === 'AUDITOR') {
      tabs.push({
        id: 'audit',
        label: 'Audit Queue',
        icon: CheckSquare,
        badge: pendingApprovalsCount
      });
      tabs.push({ id: 'all-claims', label: 'All Claims', icon: FileText });
      tabs.push({ id: 'reports', label: 'Audit Reports', icon: BarChart3 });
    } else if (role === 'ACCOUNTS') {
      tabs.push({
        id: 'accounts',
        label: 'Payment Processing',
        icon: CreditCard,
        badge: pendingApprovalsCount
      });
      tabs.push({ id: 'all-claims', label: 'All Claims', icon: FileText });
      tabs.push({ id: 'reports', label: 'Accounts Reports', icon: BarChart3 });
    } else if (role === 'MASTER_ADMIN') {
      tabs.push({ id: 'admin', label: 'Master Dashboard', icon: LayoutDashboard });
      tabs.push({ id: 'all-claims', label: 'All Claims', icon: FileText });
      tabs.push({ id: 'users', label: 'User Master', icon: UserCheck });
      tabs.push({ id: 'policies', label: 'Policy Master', icon: Settings });
      tabs.push({ id: 'reports', label: 'Reports & Export', icon: BarChart3 });
      tabs.push({ id: 'audit-trail', label: 'Audit Trail', icon: ShieldCheck });
    }

    return tabs;
  };

  const tabs = getTabs();

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-purple-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-amber-400 text-purple-950' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Mobile-first design) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 sm:hidden shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center relative ${
                  isActive ? 'text-purple-900 font-bold' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-900 stroke-[2.5]' : 'text-slate-400'}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[70px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
