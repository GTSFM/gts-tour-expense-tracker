import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim } from '../types';
import { exportClaimsToExcel } from '../utils/excelExporter';
import { StatusBadge } from '../components/StatusBadge';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  Building,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [selectedReport, setSelectedReport] = useState<number>(1);
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterBand, setFilterBand] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);

    fetch('/api/claims', { headers: { 'x-user-id': currentUser.id } })
      .then((r) => r.json())
      .then((d) => setClaims(d.claims || []))
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [currentUser]);

  const REPORT_LIST = [
    { id: 1, name: '1. Employee-wise Expense Report' },
    { id: 2, name: '2. Region-wise Expense Report' },
    { id: 3, name: '3. Monthly Expense Report' },
    { id: 4, name: '4. Department-wise Expense Report' },
    { id: 5, name: '5. Band-wise Expense Report' },
    { id: 6, name: '6. Approver-wise Report' },
    { id: 7, name: '7. Pending Claims Report' },
    { id: 8, name: '8. Audit Pending Report' },
    { id: 9, name: '9. Accounts Pending Report' },
    { id: 10, name: '10. Payment & Disbursal Report' },
    { id: 11, name: '11. Policy Exception Report' },
    { id: 12, name: '12. Travel Mode Report' }
  ];

  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.destination.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRegion !== 'ALL' && c.region !== filterRegion) return false;
    if (filterBand !== 'ALL' && c.band !== filterBand) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;

    // Report-specific filtering
    if (selectedReport === 7) return !['CLOSED', 'PAYMENT_PROCESSED', 'REJECTED'].includes(c.status);
    if (selectedReport === 8) return ['PENDING_AUDIT', 'AUDIT_QUERY'].includes(c.status);
    if (selectedReport === 9) return ['AUDIT_PASSED', 'PENDING_ACCOUNTS', 'PAYMENT_PROCESSING'].includes(c.status);
    if (selectedReport === 10) return ['CLOSED', 'PAYMENT_PROCESSED'].includes(c.status);
    if (selectedReport === 11) return c.hasExceptions || c.exceptionAmount > 0;

    return true;
  });

  const totalGross = filteredClaims.reduce((acc, c) => acc + (c.grossClaim || 0), 0);
  const totalEligible = filteredClaims.reduce((acc, c) => acc + (c.policyEligible || 0), 0);
  const totalExceptions = filteredClaims.reduce((acc, c) => acc + (c.exceptionAmount || 0), 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Management Intelligence
            </span>
            <span className="text-xs text-purple-200">Export & Audit Reporting</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Tour Expense Reports & Analytics</h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Download Excel and PDF statements across all departments, regions, and band tiers
          </p>
        </div>

        <button
          onClick={() => exportClaimsToExcel(filteredClaims, `GTS_Report_${selectedReport}.xlsx`)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* 12 Reports Selector Dropdown / Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
          Select Standard Report (12 Standard Reports)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {REPORT_LIST.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all truncate ${
                selectedReport === rep.id
                  ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {rep.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="border rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Territories</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="East">East</option>
          </select>

          <select
            value={filterBand}
            onChange={(e) => setFilterBand(e.target.value)}
            className="border rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Bands</option>
            <option value="B1">Band B1</option>
            <option value="B2">Band B2</option>
            <option value="B3">Band B3</option>
          </select>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Filtered Records</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{filteredClaims.length} Claims</div>
        </div>
        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] text-purple-700 uppercase font-bold block">Total Filtered Spend</span>
          <div className="text-xl font-black text-purple-950 mt-0.5">Rs. {totalGross.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] text-rose-700 uppercase font-bold block">Exception Excess</span>
          <div className="text-xl font-black text-rose-800 mt-0.5">Rs. {totalExceptions.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Claim ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Band & Region</th>
                <th className="p-3">Destination</th>
                <th className="p-3 text-right">Travel</th>
                <th className="p-3 text-right">Food</th>
                <th className="p-3 text-right">Hotel</th>
                <th className="p-3 text-right">Total Claim</th>
                <th className="p-3 text-right">Exception</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{c.id}</td>
                  <td className="p-3 font-semibold text-slate-900">
                    {c.employeeName} <span className="text-slate-400 font-normal">({c.employeeId})</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-purple-700">{c.band}</span> • {c.region}
                  </td>
                  <td className="p-3">{c.destination}</td>
                  <td className="p-3 text-right">Rs. {c.travelTotal}</td>
                  <td className="p-3 text-right">Rs. {c.foodTotal}</td>
                  <td className="p-3 text-right">Rs. {c.hotelTotal}</td>
                  <td className="p-3 text-right font-black text-purple-950">Rs. {c.grossClaim.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">
                    {c.exceptionAmount > 0 ? (
                      <span className="text-rose-700 font-bold">Rs. {c.exceptionAmount}</span>
                    ) : (
                      <span className="text-slate-400">Rs. 0</span>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
