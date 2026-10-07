import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  UserPlus,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Download,
  Smartphone,
  X,
  Laptop,
  KeyRound,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenChangePassword: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegister,
  onOpenLogin,
  onOpenChangePassword,
  onNavigateTab
}) => {
  const { currentUser, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const canViewMaster =
    currentUser &&
    (currentUser.role === 'PRESIDENT' ||
      currentUser.role === 'DIRECTOR' ||
      currentUser.role === 'MASTER_ADMIN');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Company Brand & Complete Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 sm:h-11 w-20 sm:w-24 rounded-lg overflow-hidden border border-purple-900/30 bg-[#3C2A9A] flex items-center justify-center shrink-0 shadow-xs p-1">
              <img
                src="/logo.png"
                alt="GTS Facility Management Services Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-purple-950">
                  GTS
                </span>
                <span className="hidden sm:inline text-xs font-semibold text-slate-500 uppercase tracking-wider border-l border-slate-300 pl-2">
                  Facility Management Services Pvt Ltd
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight">
                Tour Expense Management & Claim Tracker
              </h1>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Master (Strictly restricted to President & Directors) */}
            {canViewMaster && (
              <button
                onClick={() => onNavigateTab && onNavigateTab('admin')}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1.5 transition-colors shadow-2xs"
                title="View Master Configuration (Only President & Directors)"
              >
                <Settings className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">View Master</span>
              </button>
            )}

            {/* Download Standalone Package */}
            <a
              href="/gts-tour-expense-tracker-portable.zip"
              download="gts-tour-expense-tracker-portable.zip"
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg px-2.5 py-1.5 transition-colors shadow-2xs"
              title="Download Full Standalone Portable Package (.zip)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Download ZIP</span>
            </a>

            {/* Install Guide Modal Trigger */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1.5 transition-colors"
              title="How to Install on Mobile & Desktop"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-700" />
              <span>Install App</span>
            </button>

            {/* Register Employee Button */}
            <button
              onClick={onOpenRegister}
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition-colors"
              title="Register New Employee"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">Notifications</span>
                      <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                        {notifications.length}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-purple-700 hover:text-purple-900 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                            n.read
                              ? 'bg-slate-50 border-slate-100 text-slate-600'
                              : 'bg-purple-50/60 border-purple-200 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {n.type === 'SUCCESS' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : n.type === 'WARNING' || n.type === 'ERROR' ? (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : (
                              <Bell className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 leading-tight">{n.title}</p>
                              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Actions */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-purple-900 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left mr-1">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 leading-tight">
                    {currentUser.designation} {currentUser.role !== 'DIRECTOR' && currentUser.band ? `• Band ${currentUser.band}` : ''}
                  </div>
                </div>

                {/* Change Password Button */}
                <button
                  onClick={onOpenChangePassword}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                  title="Change Account Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                {/* Switch User / Login Button */}
                <button
                  onClick={onOpenLogin}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                  title="Switch User / Sign In"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Install & Operate Guide Modal */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 text-slate-800 text-xs space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-sm text-slate-900">Download & Install GTS Mobile App</h3>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Mobile PWA */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1.5">
                <span className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-4 h-4 text-purple-700" />
                  1. Install Directly on Phone (Android & iPhone / iPad)
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Open this link in your mobile browser.
                  <br />
                  • <strong>Android (Chrome / Samsung Internet)</strong>: Tap the menu (⋮) → tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  <br />
                  • <strong>iPhone / iPad (Safari)</strong>: Tap the Share button (⎋) → scroll down and tap <strong>"Add to Home Screen"</strong>.
                  <br />
                  The official GTS purple icon will appear on your phone home screen and open in full-screen standalone mode.
                </p>
              </div>

              {/* Option 2: Desktop / Laptop Offline ZIP */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Laptop className="w-4 h-4 text-emerald-700" />
                  2. Offline Standalone Package (.ZIP) for Laptop / Desktop
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Download the complete standalone package to run locally on Windows, Mac, or Linux without internet:
                </p>
                <a
                  href="/gts-tour-expense-tracker-portable.zip"
                  download="gts-tour-expense-tracker-portable.zip"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs mt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Portable Package (ZIP)</span>
                </a>
                <p className="text-[10px] text-slate-500 mt-1">
                  Includes 1-click startup script (<code>start_app.bat</code>), pre-seeded demo claims, and source code.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
