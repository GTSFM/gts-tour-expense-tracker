import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, BandPolicy, TerritoryConfig, AuditTrailItem, ExpenseClaim } from '../types';
import {
  Users,
  Settings,
  ShieldAlert,
  MapPin,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Edit2,
  Save,
  Check,
  UserPlus,
  Building2,
  X,
  Filter
} from 'lucide-react';

export const MasterAdminDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'METRICS' | 'USERS' | 'POLICIES' | 'TERRITORIES' | 'AUDIT'>('METRICS');

  const [users, setUsers] = useState<User[]>([]);
  const [policies, setPolicies] = useState<BandPolicy[]>([]);
  const [territories, setTerritories] = useState<TerritoryConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    employeeId: '',
    department: 'Backoffice function',
    designation: 'HR',
    band: 'B1',
    region: 'Corporate HQ',
    location: 'Bengaluru Corporate Office',
    email: '',
    mobile: '',
    password: 'GTSBO@123',
    approvingAuthorityId: 'u-samuel'
  });
  const [addUserError, setAddUserError] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Policy Edit State
  const [editingBand, setEditingBand] = useState<'B1' | 'B2' | 'B3' | null>(null);
  const [policyForm, setPolicyForm] = useState<Partial<BandPolicy>>({});

  const loadAdminData = () => {
    fetch('/api/users').then((r) => r.json()).then((d) => setUsers(d.users || []));
    fetch('/api/policies').then((r) => r.json()).then((d) => setPolicies(d.policies || []));
    fetch('/api/territories').then((r) => r.json()).then((d) => setTerritories(d.territories || []));
    fetch('/api/audit-trail').then((r) => r.json()).then((d) => setAuditLogs(d.auditTrail || []));
    fetch('/api/reports/dashboard-stats').then((r) => r.json()).then((d) => setStats(d.metrics || null));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleValidateUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/validate`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser?.id || 'u-admin' }
      });
      if (res.ok) {
        loadAdminData();
        refreshUserData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    if (!addUserForm.name.trim() || !addUserForm.employeeId.trim()) {
      setAddUserError('Name and Employee ID are mandatory.');
      return;
    }
    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'u-admin'
        },
        body: JSON.stringify(addUserForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create employee.');
      setShowAddUserModal(false);
      setAddUserForm({
        name: '',
        employeeId: '',
        department: 'Backoffice function',
        designation: 'HR',
        band: 'B1',
        region: 'Corporate HQ',
        location: 'Bengaluru Corporate Office',
        email: '',
        mobile: '',
        password: 'GTSBO@123',
        approvingAuthorityId: 'u-samuel'
      });
      loadAdminData();
      refreshUserData();
    } catch (err: any) {
      setAddUserError(err.message);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleTerritoryApprover = async (region: string, approverId: string) => {
    try {
      const res = await fetch(`/api/territories/${encodeURIComponent(region)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeApproverId: approverId })
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePolicy = async (band: 'B1' | 'B2' | 'B3') => {
    try {
      const res = await fetch(`/api/policies/${band}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyForm)
      });
      if (res.ok) {
        setEditingBand(null);
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Admin Ribbon */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Super Admin Console
            </span>
            <span className="text-xs text-purple-200">System Configuration & Governance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">GTS Master Administration</h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Configure Band Limits, User Roster, Regional Territorials & Review Immutable Audit Trail
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'METRICS', label: 'Company Overview', icon: TrendingUp },
            { id: 'USERS', label: 'User Master', icon: Users },
            { id: 'POLICIES', label: 'Policy Master', icon: Settings },
            { id: 'TERRITORIES', label: 'Territory Setup', icon: MapPin },
            { id: 'AUDIT', label: 'Audit Trail', icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-purple-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: METRICS OVERVIEW */}
      {activeTab === 'METRICS' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-semibold block uppercase">Total Employees</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalEmployees}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{stats.activeEmployees} Active Accounts</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-semibold block uppercase">Total Claims</span>
              <div className="text-2xl font-black text-purple-950 mt-1">{stats.totalClaims}</div>
              <span className="text-[11px] text-slate-500 font-medium">All tours company-wide</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-semibold block uppercase">Gross Spend</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Rs. {stats.financials.totalGross.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Eligible: Rs. {stats.financials.totalEligible.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-xs font-semibold block uppercase">Exceptions Value</span>
              <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
                Rs. {stats.financials.totalExceptions.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold">{stats.exceptionCount} Claims with Excess</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ageing Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700" />
                Pending Claims Ageing Analysis
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                  <span className="text-slate-500 block text-[10px]">1-2 Days</span>
                  <strong className="text-base font-black text-blue-900">{stats.ageing.day1}</strong>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span className="text-slate-500 block text-[10px]">3-4 Days</span>
                  <strong className="text-base font-black text-amber-900">{stats.ageing.day3}</strong>
                </div>
                <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-200">
                  <span className="text-slate-500 block text-[10px]">5-6 Days</span>
                  <strong className="text-base font-black text-orange-900">{stats.ageing.day5}</strong>
                </div>
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <span className="text-slate-500 block text-[10px]">7+ Days (Critical)</span>
                  <strong className="text-base font-black text-red-900">{stats.ageing.day7Plus}</strong>
                </div>
              </div>
            </div>

            {/* Workflow Pipeline Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-700" />
                Approval Pipeline Queue
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-indigo-50 text-indigo-950 font-medium">
                  <span>Pending Regional Approver</span>
                  <strong>{stats.pendingRegional} Claims</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-purple-50 text-purple-950 font-medium">
                  <span>Pending President Approval</span>
                  <strong>{stats.pendingPresident} Claims</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-sky-50 text-sky-950 font-medium">
                  <span>Pending Internal Audit (13-Point)</span>
                  <strong>{stats.pendingAudit} Claims</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-950 font-medium">
                  <span>Pending Accounts Payment</span>
                  <strong>{stats.pendingAccounts} Claims</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MASTER */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-800" />
                User Master & Employee Directory
              </h3>
              <p className="text-xs text-slate-500">
                Manage all company employees, create multiple users across Operations and Backoffice, and configure access
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, ID, role, designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 text-xs transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Employee</span>
              </button>
            </div>
          </div>

          {/* Department Filter Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Department:
            </span>
            {[
              { id: 'ALL', label: 'All', count: users.length },
              {
                id: 'Backoffice function',
                label: 'Backoffice Function',
                count: users.filter((u) => u.department === 'Backoffice function').length
              },
              {
                id: 'Facility Operations',
                label: 'Facility Operations',
                count: users.filter((u) => u.department === 'Facility Operations').length
              },
              {
                id: 'LEADERSHIP',
                label: 'Board & Leadership',
                count: users.filter((u) => u.role === 'DIRECTOR' || u.role === 'PRESIDENT').length
              },
              {
                id: 'REGIONAL',
                label: 'Regional Approvers',
                count: users.filter((u) => u.role === 'REGIONAL_APPROVER').length
              },
              {
                id: 'AUDIT_ACCOUNTS',
                label: 'Audit & Accounts',
                count: users.filter((u) => u.role === 'AUDITOR' || u.role === 'ACCOUNTS').length
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDeptFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  deptFilter === tab.id
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label} <span className="opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Designation & Band</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">Approver</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter((u) => {
                    const matchesSearch =
                      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.department.toLowerCase().includes(searchTerm.toLowerCase());

                    if (!matchesSearch) return false;
                    if (deptFilter === 'ALL') return true;
                    if (deptFilter === 'LEADERSHIP') return u.role === 'DIRECTOR' || u.role === 'PRESIDENT';
                    if (deptFilter === 'REGIONAL') return u.role === 'REGIONAL_APPROVER';
                    if (deptFilter === 'AUDIT_ACCOUNTS') return u.role === 'AUDITOR' || u.role === 'ACCOUNTS';
                    return u.department === deptFilter;
                  })
                  .map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{user.employeeId}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {user.name}
                        {user.isProfitCentreHead && (
                          <span className="block text-[9px] text-amber-700 font-bold">PCH (Direct to President)</span>
                        )}
                      </td>
                      <td className="p-3">
                        {user.designation}
                        {user.role !== 'DIRECTOR' && user.band ? (
                          <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded ml-1 text-[10px]">
                            {user.band}
                          </span>
                        ) : user.role === 'DIRECTOR' ? (
                          <span className="text-slate-400 italic text-[11px] ml-1">(Board)</span>
                        ) : null}
                      </td>
                      <td className="p-3 font-medium">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            user.department === 'Backoffice function'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : user.department === 'Facility Operations'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.department}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-purple-700">{user.region}</td>
                      <td className="p-3 text-slate-600">{user.approvingAuthorityName || '—'}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : user.status === 'PENDING_VALIDATION'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {user.status === 'PENDING_VALIDATION' && (
                          <button
                            onClick={() => handleValidateUser(user.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] shadow-2xs"
                          >
                            Validate & Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Add Employee Modal */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="bg-gradient-to-r from-purple-950 via-[#3C2A9A] to-purple-800 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-5 h-5 text-amber-300" />
                    <div>
                      <h4 className="font-bold text-base">Add New Employee</h4>
                      <p className="text-xs text-white/70">Create and activate employee across departments</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddUserModal(false)} className="p-1 rounded-lg text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
                  {addUserError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {addUserError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anand Sharma"
                        value={addUserForm.name}
                        onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. GTS012 or GTS-BO-12"
                        value={addUserForm.employeeId}
                        onChange={(e) => setAddUserForm({ ...addUserForm, employeeId: e.target.value.toUpperCase() })}
                        className="w-full font-mono font-bold uppercase rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Department *</label>
                      <select
                        value={addUserForm.department}
                        onChange={(e) => {
                          const dept = e.target.value;
                          const defaultDesig = dept === 'Backoffice function' ? 'HR' : 'Operations Executive';
                          const defaultBand = dept === 'Backoffice function' ? 'B1' : 'B1';
                          setAddUserForm({
                            ...addUserForm,
                            department: dept,
                            designation: defaultDesig,
                            band: defaultBand,
                            password: dept === 'Backoffice function' ? 'GTSBO@123' : 'GTSOPS@123'
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 p-2 outline-none bg-white font-semibold"
                      >
                        <option value="Backoffice function">Backoffice function</option>
                        <option value="Facility Operations">Facility Operations</option>
                        <option value="Technical Services">Technical Services</option>
                        <option value="Finance & Accounts">Finance & Accounts</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Regional Management">Regional Management</option>
                        <option value="IT Administration">IT Administration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Designation *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HR, Manager Admin, Operations Exec"
                        value={addUserForm.designation}
                        onChange={(e) => {
                          const des = e.target.value;
                          let b = 'B1';
                          if (['Senior Manager Admin', 'Manager Accounts', 'AGM Backend process', 'AGM', 'Operations Manager', 'Manager Admin', 'Senior Operations Manager', 'Quality Manager'].includes(des)) b = 'B2';
                          if (['GM Backend process', 'GM', 'RH', 'AVP', 'VP', 'President'].includes(des)) b = 'B3';
                          setAddUserForm({ ...addUserForm, designation: des, band: b });
                        }}
                        className="w-full rounded-lg border border-slate-300 p-2 outline-none bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Policy Band</label>
                      <select
                        value={addUserForm.band}
                        onChange={(e) => setAddUserForm({ ...addUserForm, band: e.target.value as any })}
                        className="w-full rounded-lg border border-purple-300 p-2 outline-none bg-purple-50 font-bold text-purple-950"
                      >
                        <option value="B1">Band B1 (Ops / Backend - Exec / Asst Mgr)</option>
                        <option value="B2">Band B2 (Manager / Sr Manager / AGM)</option>
                        <option value="B3">Band B3 (GM / RM / AVP / VP / President)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Region / Location</label>
                      <select
                        value={addUserForm.region}
                        onChange={(e) => setAddUserForm({ ...addUserForm, region: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 outline-none bg-white"
                      >
                        <option value="Corporate HQ">Corporate HQ (Bengaluru)</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="East">East</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Approving Authority</label>
                      <select
                        value={addUserForm.approvingAuthorityId}
                        onChange={(e) => setAddUserForm({ ...addUserForm, approvingAuthorityId: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 outline-none bg-white"
                      >
                        {users
                          .filter((u) => u.role === 'REGIONAL_APPROVER' || u.role === 'PRESIDENT' || u.role === 'PROFIT_CENTRE_HEAD')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.designation} — {u.region})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                      <input
                        type="text"
                        required
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingUser}
                      className="px-5 py-2 bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-bold rounded-lg shadow hover:shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmittingUser ? 'Creating...' : 'Create Employee'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POLICY MASTER */}
      {activeTab === 'POLICIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
          <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Approved Corporate Policy Matrix
                </span>
                <span className="text-xs text-slate-500 font-semibold">Effective 2026</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mt-0.5">Eligibility Criteria & Expense Policy Master</h3>
              <p className="text-xs text-slate-500">
                Official company-wide eligibility guidelines, band classification, lodging caps, food allowance, and travel entitlements.
              </p>
            </div>
          </div>

          {/* Official Eligibility Criteria Table (Verbatim corporate eligibility standard) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 border-r border-purple-800/60">Category / Designation</th>
                  <th className="p-3.5 border-r border-purple-800/60 text-center w-20">Band</th>
                  <th className="p-3.5 border-r border-purple-800/60">Daily Food Cap</th>
                  <th className="p-3.5 border-r border-purple-800/60">Lodging / Hotel Cap</th>
                  <th className="p-3.5">Travel Class Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-purple-50/30 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    <div>Ops / Backend Process - Executive / Asst Manager</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Operations Executives, Assistant Managers, Technical Supervisors, HR, Asst HR, Admin / Accounts Executives
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-black border-r border-slate-200">
                    <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded font-black text-xs">B1</span>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹550 / day</strong>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Breakfast ₹100 • Lunch ₹200 • Tea ₹50 • Dinner ₹200
                    </div>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹1,500 / night</strong>
                  </td>
                  <td className="p-3.5 text-slate-800 font-medium">
                    Train up to 3rd AC / Local Cabs (Ola, Uber, Rapido, Auto) / Sleeper Bus
                  </td>
                </tr>

                <tr className="hover:bg-purple-50/30 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    <div>Manager / Senior Manager</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Operations Managers, Senior Operations Managers, Manager Admin, Senior Manager Admin, Manager Accounts, Quality Managers
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-black border-r border-slate-200">
                    <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded font-black text-xs">B2</span>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹600 / day</strong>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Breakfast ₹120 • Lunch ₹220 • Tea ₹60 • Dinner ₹200
                    </div>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹1,800 / night</strong>
                  </td>
                  <td className="p-3.5 text-slate-800 font-medium">
                    Train up to 3rd AC / Local Cabs / Sleeper Bus
                  </td>
                </tr>

                <tr className="hover:bg-purple-50/30 transition-colors bg-purple-50/15">
                  <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    <div>AGM</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Assistant General Managers (AGM Facility Operations, AGM Backend Process)
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-black border-r border-slate-200">
                    <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded font-black text-xs">B2</span>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹600 / day</strong>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Breakfast ₹120 • Lunch ₹220 • Tea ₹60 • Dinner ₹200
                    </div>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-purple-950 font-black">₹2,000 / night</strong>
                    <span className="block text-[10px] text-purple-700 font-bold">* AGM Tier Lodging Cap</span>
                  </td>
                  <td className="p-3.5 text-slate-800 font-medium">
                    Train up to 3rd AC / Local Cabs / Sleeper Bus
                  </td>
                </tr>

                <tr className="hover:bg-purple-50/30 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                    <div>GM / RM / AVP / VP / President</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      General Managers, Regional Heads / RMs, Assistant Vice Presidents, Vice Presidents, President
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-black border-r border-slate-200">
                    <span className="bg-purple-100 text-purple-900 px-2 py-1 rounded font-black text-xs">B3</span>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹600 / day</strong>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Breakfast ₹120 • Lunch ₹220 • Tea ₹60 • Dinner ₹200
                    </div>
                  </td>
                  <td className="p-3.5 border-r border-slate-200">
                    <strong className="text-slate-900 font-black">₹2,500 / night</strong>
                  </td>
                  <td className="p-3.5 text-slate-800 font-medium">
                    Train 3rd AC / Sleeper Bus
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interactive Policy Tuner Cards */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Interactive Policy Allowance Tuning</h4>
            <p className="text-xs text-slate-500 mb-3">
              Master Admin can tune these allowances dynamically. Changes take effect immediately for new claims.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {policies.map((pol) => {
                const isEditing = editingBand === pol.band;
                return (
                  <div
                    key={pol.band}
                    className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                      isEditing ? 'border-purple-600 bg-purple-50/20 ring-2 ring-purple-600' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div>
                        <span className="text-base font-black text-purple-950">BAND {pol.band}</span>
                        {pol.categoryLabel && (
                          <span className="block text-[10px] text-purple-700 font-semibold">{pol.categoryLabel}</span>
                        )}
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => {
                            setEditingBand(pol.band);
                            setPolicyForm({ ...pol });
                          }}
                          className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Caps
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSavePolicy(pol.band)}
                          className="bg-purple-800 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1 shadow-2xs"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="space-y-2 text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Food Cap</span>
                          <strong className="text-slate-900 text-sm">Rs. {pol.foodMaxDaily}/day</strong>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Breakfast: Rs. {pol.foodBreakfastMax} • Lunch: Rs. {pol.foodLunchMax} • Tea: Rs. {pol.foodTeaMax} • Dinner: Rs. {pol.foodDinnerMax}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Hotel Room Max Cap</span>
                          <strong className="text-slate-900 text-sm">Rs. {pol.hotelMaxPerNight} / night</strong>
                          {pol.band === 'B2' && pol.hotelMaxPerNightByDesignation?.AGM && (
                            <div className="text-[11px] text-purple-800 font-bold mt-0.5">
                              AGM Tier: Rs. {pol.hotelMaxPerNightByDesignation.AGM} / night
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Travel Class & Modes</span>
                          <strong className="text-slate-800 text-[11px] block">{pol.travelClassEligibility || pol.trainEligibility}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Food Daily Max (Rs)</label>
                          <input
                            type="number"
                            value={policyForm.foodMaxDaily || ''}
                            onChange={(e) => setPolicyForm({ ...policyForm, foodMaxDaily: Number(e.target.value) })}
                            className="w-full border rounded p-1 text-xs bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-600">Breakfast (Rs)</label>
                            <input
                              type="number"
                              value={policyForm.foodBreakfastMax || ''}
                              onChange={(e) => setPolicyForm({ ...policyForm, foodBreakfastMax: Number(e.target.value) })}
                              className="w-full border rounded p-1 text-xs bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-600">Lunch (Rs)</label>
                            <input
                              type="number"
                              value={policyForm.foodLunchMax || ''}
                              onChange={(e) => setPolicyForm({ ...policyForm, foodLunchMax: Number(e.target.value) })}
                              className="w-full border rounded p-1 text-xs bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700">Hotel Max / Night (Rs)</label>
                          <input
                            type="number"
                            value={policyForm.hotelMaxPerNight || ''}
                            onChange={(e) => setPolicyForm({ ...policyForm, hotelMaxPerNight: Number(e.target.value) })}
                            className="w-full border rounded p-1 text-xs bg-white"
                          />
                        </div>
                        {pol.band === 'B2' && (
                          <div>
                            <label className="block text-[10px] font-bold text-purple-900">AGM Hotel Cap / Night (Rs)</label>
                            <input
                              type="number"
                              value={policyForm.hotelMaxPerNightByDesignation?.AGM || 2000}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPolicyForm({
                                  ...policyForm,
                                  hotelMaxPerNightByDesignation: {
                                    ...policyForm.hotelMaxPerNightByDesignation,
                                    AGM: val,
                                    'AGM Backend process': val
                                  }
                                });
                              }}
                              className="w-full border border-purple-300 rounded p-1 text-xs bg-white font-bold text-purple-900"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TERRITORY CONFIGURATION */}
      {activeTab === 'TERRITORIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base">Territory Approving Authority Configuration</h3>
            <p className="text-xs text-slate-500">
              Configure active approvers per region. Specifically toggle whether <strong>Yoga / Yoganandam</strong> or{' '}
              <strong>Sundar</strong> is active for Tamil Nadu, Hosur, Pondicherry, ROTN.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {territories.map((terr) => {
              const isTNCluster = ['Tamil Nadu', 'Hosur', 'Pondicherry', 'ROTN'].includes(terr.region);
              return (
                <div key={terr.region} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-purple-950">{terr.region}</span>
                    <MapPin className="w-4 h-4 text-purple-700" />
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Approver</span>
                    <strong className="text-slate-900">{terr.activeApproverName}</strong>
                  </div>

                  {isTNCluster && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                        Switch Active Approver:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTerritoryApprover(terr.region, 'u-yoga')}
                          className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-colors ${
                            terr.activeApproverId === 'u-yoga'
                              ? 'bg-purple-800 text-white border-purple-800'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Yoga
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleTerritoryApprover(terr.region, 'u-sundar')}
                          className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-colors ${
                            terr.activeApproverId === 'u-sundar'
                              ? 'bg-purple-800 text-white border-purple-800'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Sundar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Company-wide Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable ledger of all actions, approvals, and edits</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{log.action}</strong>
                    {log.claimId && (
                      <span className="font-mono text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-bold">
                        {log.claimId}
                      </span>
                    )}
                    <span className="text-purple-700 font-semibold">{log.userName}</span>
                    <span className="text-slate-400 text-[10px]">({log.userRole})</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.comment}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 shrink-0">
                  <span>{log.date}</span>
                  <span className="block">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
