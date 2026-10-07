import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tour } from '../types';
import { Compass, Calendar, MapPin, Building, AlertTriangle, X } from 'lucide-react';

interface NewTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourCreated: (tour: Tour) => void;
}

export const NewTourModal: React.FC<NewTourModalProps> = ({ isOpen, onClose, onTourCreated }) => {
  const { currentUser } = useAuth();

  const [purpose, setPurpose] = useState('');
  const [clientOrSite, setClientOrSite] = useState('');
  const [startLocation, setStartLocation] = useState(currentUser?.location || 'Hyderabad');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [travelMode, setTravelMode] = useState('Train');
  const [priorApprovalRequired, setPriorApprovalRequired] = useState(false);
  const [priorApprovalRef, setPriorApprovalRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !currentUser) return null;

  // Auto calculate days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!purpose.trim() || !destination.trim()) {
      setError('Tour Purpose and Destination are mandatory.');
      return;
    }

    if (end < start) {
      setError('Tour End Date cannot be earlier than Start Date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          purpose,
          clientOrSite: clientOrSite || destination,
          startLocation,
          destination,
          startDate,
          endDate,
          travelMode,
          priorApprovalRequired,
          priorApprovalRef: priorApprovalRequired ? priorApprovalRef : undefined,
          remarks
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tour.');
      }

      onTourCreated(data.tour);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Create New Tour Request</h3>
              <p className="text-xs text-white/70">Plan your official tour and travel dates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-populated Employee Meta Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee</span>
            <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.employeeId})
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Band & Dept</span>
            <strong className="text-purple-700">{currentUser.band}</strong> • {currentUser.department}
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Region</span>
            <strong className="text-slate-900">{currentUser.region}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Approver</span>
            <strong className="text-slate-900">{currentUser.approvingAuthorityName}</strong>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tour Purpose <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Client Site Inspection & Team Training"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client / Facility Site Name
              </label>
              <input
                type="text"
                placeholder="e.g. Phoenix Tech Park Phase 2"
                value={clientOrSite}
                onChange={(e) => setClientOrSite(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Starting Location
              </label>
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Destination <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru / Chennai / Vijayawada"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tour Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tour End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duration (Days)
              </label>
              <div className="w-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 rounded-lg px-3 py-2 flex items-center justify-between">
                <span>Calculated:</span>
                <span className="text-sm bg-purple-700 text-white px-2 py-0.5 rounded">
                  {isNaN(diffDays) ? 1 : diffDays} {diffDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Mode of Travel
              </label>
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="Train">Train (Up to 3rd AC / 3rd AC)</option>
                <option value="Sleeper Bus">Sleeper Bus</option>
                <option value="Bus">Bus / Intercity Coach</option>
                <option value="Cab">Local / Outstation Cab (Ola, Uber, Rapido, Auto)</option>
                <option value="Flight">Flight (Prior Approval Mandatory)</option>
                <option value="Personal Vehicle">Personal Vehicle (Pre-approved)</option>
              </select>
              {travelMode === 'Flight' && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1 bg-amber-50 p-1.5 rounded border border-amber-200">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Flight travel requires prior management approval.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="priorApp"
                  checked={priorApprovalRequired}
                  onChange={(e) => setPriorApprovalRequired(e.target.checked)}
                  className="w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-600"
                />
                <label htmlFor="priorApp" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Prior Approval Granted / Required
                </label>
              </div>
              {priorApprovalRequired && (
                <input
                  type="text"
                  placeholder="Prior Approval Email Ref / Memo No."
                  value={priorApprovalRef}
                  onChange={(e) => setPriorApprovalRef(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:ring-2 focus:ring-purple-600 outline-none"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks & Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Any specific client commitments or site details..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 active:bg-purple-950 rounded-lg transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Creating Tour...' : 'Confirm & Create Tour'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
