import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { UserPlus, AlertTriangle, CheckCircle2, X, Eye, EyeOff, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered?: () => void;
  onOpenLoginWithCredentials?: (identifier: string, password: string) => void;
}

const DEPARTMENTS = [
  'Facility Operations',
  'Backoffice function',
  'Technical Services',
  'Finance & Accounts',
  'Human Resources',
  'Security & Soft Services',
  'Regional Management',
  'IT Administration'
];

const DESIGNATIONS_BY_DEPT: Record<string, string[]> = {
  'Facility Operations': [
    'Operations Executive',
    'Assistant Manager',
    'Operations Manager',
    'Senior Operations Manager',
    'Technical Supervisor'
  ],
  'Backoffice function': [
    'Executive Backend Process',
    'HR',
    'Asst HR',
    'Asst Manager Admin',
    'Manager Admin',
    'Senior Manager Admin',
    'Asst Manager Accounts',
    'Manager Accounts',
    'AGM Backend process',
    'GM Backend process',
    'Billing Executive',
    'Procurement Executive',
    'IT Support / Admin'
  ],
  'Finance & Accounts': ['Asst Manager Accounts', 'Manager Accounts', 'Chief Accountant'],
  'Human Resources': ['HR', 'Asst HR', 'Manager Admin', 'Senior Manager Admin'],
  'Technical Services': ['Technical Supervisor', 'Facility Engineer', 'Operations Manager'],
  'Security & Soft Services': ['Security Officer', 'Soft Services Executive', 'Operations Manager'],
  'Regional Management': ['RH', 'RM', 'Regional Head', 'Assistant Regional Manager'],
  'IT Administration': ['IT Support / Admin', 'Systems Administrator', 'Head of Systems & IT Governance']
};

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
  onOpenLoginWithCredentials
}) => {
  const { allUsers, refreshUserData } = useAuth();

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Facility Operations');
  const [designation, setDesignation] = useState('Operations Executive');
  const [band, setBand] = useState<'B1' | 'B2' | 'B3'>('B1');
  const [region, setRegion] = useState('Telangana');
  const [location, setLocation] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [approvingAuthorityId, setApprovingAuthorityId] = useState('');

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ name: string; employeeId: string; password: string } | null>(null);

  // Filter approvers
  const approvers = allUsers.filter(
    (u) =>
      u.role === 'REGIONAL_APPROVER' ||
      u.role === 'PRESIDENT' ||
      u.role === 'PROFIT_CENTRE_HEAD' ||
      u.id === 'u-krishnan' ||
      u.id === 'u-samuel' ||
      u.id === 'u-yoga' ||
      u.id === 'u-sundar'
  );

  // Auto-detect Band based on revised eligibility criteria table
  const getAutoBand = (desig: string): 'B1' | 'B2' | 'B3' => {
    // Row 4: GM / RM / AVP / VP / President -> B3
    if (['GM Backend process', 'GM', 'RM', 'RH', 'Regional Head', 'AVP', 'VP', 'President', 'Director', 'Head of Systems & IT Governance'].includes(desig)) {
      return 'B3';
    }
    // Row 2 & Row 3: Manager / Senior Manager / AGM -> B2
    if ([
      'AGM',
      'AGM Backend process',
      'Manager Admin',
      'Senior Manager Admin',
      'Manager Accounts',
      'Operations Manager',
      'Senior Operations Manager',
      'Quality Manager',
      'Chief Accountant'
    ].includes(desig)) {
      return 'B2';
    }
    // Row 1: Ops / Backend Process - Executive / Asst Manager -> B1
    return 'B1';
  };

  // Sync designation when department changes
  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    const available = DESIGNATIONS_BY_DEPT[dept] || ['Operations Executive'];
    const firstDesig = available[0];
    setDesignation(firstDesig);
    setBand(getAutoBand(firstDesig));

    if (dept === 'Backoffice function') {
      if (!location) setLocation('Corporate Office Bengaluru');
    }
  };

  const handleDesignationChange = (desig: string) => {
    setDesignation(desig);
    setBand(getAutoBand(desig));
  };

  // Auto-suggest approving authority when region changes
  useEffect(() => {
    if (region === 'Karnataka' || region === 'East' || region === 'Corporate HQ') {
      const samuel = allUsers.find((u) => u.id === 'u-samuel');
      if (samuel) setApprovingAuthorityId(samuel.id);
    } else if (['Tamil Nadu', 'Hosur', 'Pondicherry', 'ROTN'].includes(region)) {
      const yoga = allUsers.find((u) => u.id === 'u-yoga') || allUsers.find((u) => u.id === 'u-sundar');
      if (yoga) setApprovingAuthorityId(yoga.id);
    } else if (region === 'Telangana' || region === 'Andhra Pradesh') {
      const krishnan = allUsers.find((u) => u.id === 'u-krishnan');
      if (krishnan) setApprovingAuthorityId(krishnan.id);
    }
  }, [region, allUsers]);

  // Auto-suggest Employee ID
  const generateSuggestedEmpId = () => {
    const prefix = department === 'Backoffice function' ? 'GTS-BO-' : 'GTS';
    const num = Math.floor(100 + Math.random() * 900);
    setEmployeeId(`${prefix}${num}`);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter employee Full Name.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMessage('Please provide an Employee ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please create a password for your account.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter carefully.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please provide a valid official email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          employeeId: employeeId.trim().toUpperCase(),
          designation,
          band,
          department,
          region,
          location: location.trim() || `${region} Office`,
          mobile: mobile.trim(),
          email: email.trim().toLowerCase(),
          reportingManager: reportingManager.trim(),
          approvingAuthorityId,
          password: password.trim(),
          status: 'ACTIVE'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      setSuccessData({
        name: name.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        password: password.trim()
      });

      refreshUserData();
      if (onRegistered) onRegistered();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header with Complete Logo */}
        <div className="bg-gradient-to-r from-purple-950 via-[#3C2A9A] to-purple-800 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-20 rounded-lg overflow-hidden border border-purple-400/40 bg-[#3C2A9A] flex items-center justify-center shrink-0 p-1 shadow-xs">
              <img src="/logo.png" alt="GTS Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Register New GTS Employee</h3>
              <p className="text-xs text-white/70">Create unique profile, select department & set password</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Registration Complete!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Employee profile for <strong>{successData.name}</strong> ({successData.employeeId}) has been registered and activated.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
              <div className="text-[11px] font-bold text-purple-950 uppercase tracking-wider mb-1">
                Your Login Credentials
              </div>
              <div className="flex justify-between py-1 border-b border-purple-100">
                <span className="text-slate-600">Login Name:</span>
                <strong className="text-slate-900">{successData.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-100">
                <span className="text-slate-600">Employee ID:</span>
                <strong className="text-purple-950 font-mono">{successData.employeeId}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Password:</span>
                <strong className="text-slate-900 font-mono">••••••••</strong>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenLoginWithCredentials) {
                    onOpenLoginWithCredentials(successData.name, successData.password);
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-bold text-xs rounded-xl shadow hover:shadow-md transition-all"
              >
                Sign In Now as {successData.name}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Department Selection */}
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
              <label className="block font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-800" />
                Department Function <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {DEPARTMENTS.slice(0, 4).map((dept) => (
                  <button
                    type="button"
                    key={dept}
                    onClick={() => handleDepartmentChange(dept)}
                    className={`p-2 rounded-lg text-left font-semibold transition-all border ${
                      department === dept
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                        : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                    }`}
                  >
                    <div className="text-[11px] truncate">{dept}</div>
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full rounded-lg border border-purple-300 p-2 outline-none bg-white font-semibold text-purple-950"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma, Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateSuggestedEmpId}
                    className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold underline"
                  >
                    Auto-Suggest ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. GTS005 or GTS-BO-05"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full font-mono uppercase font-bold rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Designation & Band */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Designation / Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={designation}
                  onChange={(e) => handleDesignationChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none bg-white font-medium text-slate-900"
                >
                  {(DESIGNATIONS_BY_DEPT[department] || []).map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                  <option value="Other">Other / Custom</option>
                </select>
                {designation === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom designation"
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-slate-300 p-2 outline-none"
                  />
                )}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Policy Band (Auto-Selected)
                </label>
                <select
                  value={band}
                  onChange={(e) => setBand(e.target.value as any)}
                  className="w-full rounded-lg border border-purple-300 p-2 outline-none bg-purple-50/50 font-bold text-purple-950"
                >
                  <option value="B1">Band B1 (Food: ₹550/day • Hotel: ₹1,500/night)</option>
                  <option value="B2">Band B2 (Food: ₹600/day • Hotel: ₹1,800/night)</option>
                  <option value="B3">Band B3 (Food: ₹600/day • Hotel: ₹2,500/night • Flights Prior Approval)</option>
                </select>
              </div>
            </div>

            {/* Password Creation */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-800" />
                  Account Password Setup <span className="text-rose-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide' : 'Show'} Password
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Create Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                  />
                  {password && confirmPassword && (
                    <span
                      className={`text-[10px] font-bold block mt-1 ${
                        password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Region & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Region / Territory</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none bg-white font-semibold text-slate-900"
                >
                  <option value="Corporate HQ">Corporate HQ (Bengaluru)</option>
                  <option value="Karnataka">Karnataka (Samuel)</option>
                  <option value="East">East (Samuel)</option>
                  <option value="Tamil Nadu">Tamil Nadu (Yoga / Sundar)</option>
                  <option value="Hosur">Hosur (Yoga / Sundar)</option>
                  <option value="Pondicherry">Pondicherry (Yoga / Sundar)</option>
                  <option value="ROTN">ROTN (Yoga / Sundar)</option>
                  <option value="Telangana">Telangana (Krishnan Govindan)</option>
                  <option value="Andhra Pradesh">Andhra Pradesh (Krishnan Govindan)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Office Base</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru Central Office, Chennai Office"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gts.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 outline-none"
                />
              </div>
            </div>

            {/* Approver Selection */}
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-2">
              <div>
                <label className="block font-bold text-purple-950 mb-1">
                  Controlled Approving Authority (Auto-suggested based on Territory)
                </label>
                <select
                  value={approvingAuthorityId}
                  onChange={(e) => setApprovingAuthorityId(e.target.value)}
                  className="w-full rounded-lg border border-purple-300 p-2 outline-none bg-white font-bold text-purple-950"
                >
                  {approvers.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.designation} — {app.assignedTerritories?.join(', ') || app.region})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-purple-700 mt-1">
                  * Controlled roster according to GTS delegation of authority matrix.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white font-bold rounded-xl shadow hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering...' : 'Register Employee'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
