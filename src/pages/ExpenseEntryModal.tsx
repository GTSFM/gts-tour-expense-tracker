import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tour, ExpenseClaim, ExpenseCategory, ExpenseItem, BandPolicy } from '../types';
import {
  Utensils,
  Plane,
  Car,
  Hotel,
  Receipt,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Trash2
} from 'lucide-react';

interface ExpenseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  preselectedTourId?: string;
  preselectedClaimId?: string;
}

export const ExpenseEntryModal: React.FC<ExpenseEntryModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
  preselectedTourId,
  preselectedClaimId
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState(preselectedTourId || '');
  const [currentClaim, setCurrentClaim] = useState<ExpenseClaim | null>(null);
  const [bandPolicy, setBandPolicy] = useState<BandPolicy | null>(null);

  // Category
  const [category, setCategory] = useState<ExpenseCategory>('FOOD');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');

  // Category-specific states
  // Food
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Tea' | 'Dinner'>('Lunch');
  const [restaurantVendor, setRestaurantVendor] = useState('');
  const [foodBillNo, setFoodBillNo] = useState('');

  // Travel
  const [travelFrom, setTravelFrom] = useState('');
  const [travelTo, setTravelTo] = useState('');
  const [travelMode, setTravelMode] = useState('Train');
  const [ticketNo, setTicketNo] = useState('');

  // Local Travel
  const [localFrom, setLocalFrom] = useState('');
  const [localTo, setLocalTo] = useState('');
  const [localMode, setLocalMode] = useState('Ola');
  const [localReceiptNo, setLocalReceiptNo] = useState('');
  const [localPurpose, setLocalPurpose] = useState('Client site meeting');

  // Hotel
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [hotelNights, setHotelNights] = useState<number>(1);
  const [roomAmount, setRoomAmount] = useState<number | ''>('');
  const [hotelGst, setHotelGst] = useState<number | ''>('');
  const [hotelInvoiceNo, setHotelInvoiceNo] = useState('');

  // Other
  const [otherCategory, setOtherCategory] = useState<'Parking' | 'Toll' | 'Communication' | 'Other'>('Parking');
  const [otherDescription, setOtherDescription] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');

  // Document attachment
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Policy Limit Feedback
  const [exceptionReason, setExceptionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load tours and policy
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    fetch('/api/tours', { headers: { 'x-user-id': currentUser.id } })
      .then((r) => r.json())
      .then((data) => {
        if (data.tours) {
          setTours(data.tours);
          if (!selectedTourId && data.tours.length > 0) {
            setSelectedTourId(data.tours[0].id);
          }
        }
      });

    fetch('/api/policies')
      .then((r) => r.json())
      .then((data) => {
        if (data.policies) {
          const p = data.policies.find((x: BandPolicy) => x.band === currentUser.band);
          setBandPolicy(p || data.policies[0]);
        }
      });
  }, [isOpen, currentUser]);

  // Load or create draft claim for selected tour
  useEffect(() => {
    if (!selectedTourId || !currentUser) return;

    fetch('/api/claims/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ tourId: selectedTourId })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.claim) {
          setCurrentClaim(data.claim);
        }
      });
  }, [selectedTourId, currentUser]);

  // Update hotel total when roomAmount or hotelGst changes
  useEffect(() => {
    if (category === 'HOTEL') {
      const room = Number(roomAmount) || 0;
      const gst = Number(hotelGst) || 0;
      setAmount(room + gst);
    }
  }, [roomAmount, hotelGst, category]);

  if (!isOpen || !currentUser) return null;

  // Real-time Policy Validation Calculations
  const numericAmount = Number(amount) || 0;
  let policyLimit = 0;
  let isAboveLimit = false;
  let excess = 0;

  if (bandPolicy) {
    if (category === 'FOOD') {
      if (mealType === 'Breakfast') policyLimit = bandPolicy.foodBreakfastMax;
      else if (mealType === 'Lunch') policyLimit = bandPolicy.foodLunchMax;
      else if (mealType === 'Tea') policyLimit = bandPolicy.foodTeaMax;
      else if (mealType === 'Dinner') policyLimit = bandPolicy.foodDinnerMax;
      else policyLimit = bandPolicy.foodMaxDaily;

      if (numericAmount > policyLimit) {
        isAboveLimit = true;
        excess = numericAmount - policyLimit;
      }
    } else if (category === 'HOTEL') {
      let perNight = bandPolicy.hotelMaxPerNight;
      const des = (currentUser?.designation || '').toUpperCase();
      if (bandPolicy.band === 'B2') {
        if (des.includes('AGM')) {
          perNight = bandPolicy.hotelMaxPerNightByDesignation?.['AGM'] || 2000;
        } else {
          perNight = 1800;
        }
      }
      policyLimit = perNight * (hotelNights || 1);
      if (numericAmount > policyLimit) {
        isAboveLimit = true;
        excess = numericAmount - policyLimit;
      }
    } else if (category === 'TRAVEL') {
      if (travelMode === 'Flight' && bandPolicy.priorApprovalForFlight) {
        isAboveLimit = true; // Flight flags warning
        policyLimit = numericAmount;
      } else {
        policyLimit = numericAmount;
      }
    } else {
      policyLimit = numericAmount;
    }
  }

  // Client-side image compression & upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      let fileToUpload = file;

      // If it's an image, compress with canvas
      if (file.type.startsWith('image/')) {
        fileToUpload = await new Promise<File>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            setPreviewImage(img.src);
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 1200;

              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const compressed = new File([blob], file.name, { type: 'image/jpeg' });
                    resolve(compressed);
                  } else {
                    resolve(file);
                  }
                },
                'image/jpeg',
                0.78
              );
            };
          };
        });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      if (currentClaim) {
        formData.append('claimId', currentClaim.id);
        formData.append('documentType', `${category} Receipt`);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadedFileUrl(data.fileUrl);
      setUploadedFileName(data.fileName);
      setUploadedFileSize(data.fileSize);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentClaim) {
      setErrorMessage('Please select a valid tour claim.');
      return;
    }

    if (!amount || numericAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount.');
      return;
    }

    if (isAboveLimit && category !== 'TRAVEL' && !exceptionReason.trim()) {
      setErrorMessage('Please provide a mandatory reason for the policy limit exception.');
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
        category,
        date: expenseDate,
        amount: numericAmount,
        documentUrl: uploadedFileUrl || undefined,
        documentName: uploadedFileName || undefined,
        remarks,
        exceptionReason: isAboveLimit ? exceptionReason : undefined
      };

      if (category === 'FOOD') {
        payload.mealType = mealType;
        payload.restaurantVendor = restaurantVendor;
        payload.foodBillNo = foodBillNo;
      } else if (category === 'TRAVEL') {
        payload.fromLocation = travelFrom;
        payload.toLocation = travelTo;
        payload.travelMode = travelMode;
        payload.ticketNo = ticketNo;
      } else if (category === 'LOCAL_TRAVEL') {
        payload.localFrom = localFrom;
        payload.localTo = localTo;
        payload.localMode = localMode;
        payload.localReceiptNo = localReceiptNo;
        payload.localPurpose = localPurpose;
      } else if (category === 'HOTEL') {
        payload.hotelName = hotelName;
        payload.hotelCity = hotelCity;
        payload.nights = hotelNights;
        payload.roomAmount = Number(roomAmount) || 0;
        payload.gst = Number(hotelGst) || 0;
        payload.hotelInvoiceNo = hotelInvoiceNo;
      } else if (category === 'OTHER') {
        payload.otherCategory = otherCategory;
        payload.otherDescription = otherDescription;
        payload.businessPurpose = businessPurpose;
      }

      const res = await fetch(`/api/claims/${currentClaim.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save expense.');

      onExpenseAdded();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">Add Tour Expense</h3>
              <p className="text-xs text-white/70">Fast 3-click expense entry & bill upload</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Tour */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              Step 1: Select Tour / Destination
            </label>
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-600 outline-none"
            >
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.destination} ({t.startDate} to {t.endDate}) — {t.purpose}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Step 2: Choose Category
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { id: 'FOOD', label: 'Food', icon: Utensils },
                { id: 'TRAVEL', label: 'Travel', icon: Plane },
                { id: 'LOCAL_TRAVEL', label: 'Local', icon: Car },
                { id: 'HOTEL', label: 'Hotel', icon: Hotel },
                { id: 'OTHER', label: 'Other', icon: Receipt }
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id as ExpenseCategory);
                      setAmount('');
                    }}
                    className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-purple-900 border-purple-900 text-white shadow-md font-bold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span className="text-[11px] sm:text-xs leading-none">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Category-Specific Form Fields */}

          {/* CATEGORY: FOOD */}
          {category === 'FOOD' && (
            <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950">Food Details & Meal Caps</span>
                {bandPolicy && (
                  <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                    Band {currentUser.band} Daily Cap: Rs. {bandPolicy.foodMaxDaily}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meal Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Breakfast', 'Lunch', 'Tea', 'Dinner'] as const).map((meal) => {
                    const cap =
                      meal === 'Breakfast'
                        ? bandPolicy?.foodBreakfastMax
                        : meal === 'Lunch'
                        ? bandPolicy?.foodLunchMax
                        : meal === 'Tea'
                        ? bandPolicy?.foodTeaMax
                        : bandPolicy?.foodDinnerMax;
                    return (
                      <button
                        key={meal}
                        type="button"
                        onClick={() => setMealType(meal)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          mealType === meal
                            ? 'bg-purple-800 text-white border-purple-800 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {meal}
                        <span className="block text-[10px] opacity-75 font-normal">Cap: Rs.{cap}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Restaurant / Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Udupi Grand Restaurant"
                    value={restaurantVendor}
                    onChange={(e) => setRestaurantVendor(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill / Token Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-9912"
                    value={foodBillNo}
                    onChange={(e) => setFoodBillNo(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: HOTEL */}
          {category === 'HOTEL' && (
            <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950">Hotel Room Stay Details</span>
                {bandPolicy && (
                  <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                    {currentUser.designation?.toUpperCase().includes('AGM')
                      ? 'AGM Lodging Cap: Rs. 2,000 / night'
                      : `Band ${currentUser.band} Lodging Cap: Rs. ${bandPolicy.hotelMaxPerNight} / night`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Minerva Grand / Royal Orchid"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nights</label>
                  <input
                    type="number"
                    min={1}
                    value={hotelNights}
                    onChange={(e) => setHotelNights(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Rent (Rs)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1400"
                    value={roomAmount}
                    onChange={(e) => setRoomAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST (Rs)</label>
                  <input
                    type="number"
                    placeholder="e.g. 168"
                    value={hotelGst}
                    onChange={(e) => setHotelGst(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-MG-2026-4410"
                  value={hotelInvoiceNo}
                  onChange={(e) => setHotelInvoiceNo(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                />
              </div>
            </div>
          )}

          {/* CATEGORY: TRAVEL */}
          {category === 'TRAVEL' && (
            <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From</label>
                  <input
                    type="text"
                    placeholder="Starting Station / City"
                    value={travelFrom}
                    onChange={(e) => setTravelFrom(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To</label>
                  <input
                    type="text"
                    placeholder="Destination City"
                    value={travelTo}
                    onChange={(e) => setTravelTo(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Mode</label>
                  <select
                    value={travelMode}
                    onChange={(e) => setTravelMode(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  >
                    <option value="Train">Train (Up to 3rd AC / 3rd AC)</option>
                    <option value="Sleeper Bus">Sleeper Bus</option>
                    <option value="Bus">Bus / Intercity</option>
                    <option value="Cab">Local Cab (Ola, Uber, Rapido, Auto)</option>
                    <option value="Flight">Flight (Prior Approval Required)</option>
                    <option value="Personal Vehicle">Personal Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket / PNR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PNR-8429104820"
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>

              {travelMode === 'Flight' && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <strong>Policy Rule:</strong> Flight travel requires prior approval. Ensure prior approval reference
                    is entered.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CATEGORY: LOCAL TRAVEL */}
          {category === 'LOCAL_TRAVEL' && (
            <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From</label>
                  <input
                    type="text"
                    placeholder="e.g. Majestic Railway Station"
                    value={localFrom}
                    onChange={(e) => setLocalFrom(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To</label>
                  <input
                    type="text"
                    placeholder="e.g. Client Site Electronic City"
                    value={localTo}
                    onChange={(e) => setLocalTo(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conveyance Mode</label>
                  <select
                    value={localMode}
                    onChange={(e) => setLocalMode(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  >
                    <option value="Ola">Ola</option>
                    <option value="Uber">Uber</option>
                    <option value="Rapido">Rapido</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Metro">Metro</option>
                    <option value="Cab">Cab</option>
                    <option value="Bus">Local Bus</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Ride CRN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CRN-OLA-99120"
                    value={localReceiptNo}
                    onChange={(e) => setLocalReceiptNo(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: OTHER */}
          {category === 'OTHER' && (
            <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Type</label>
                  <select
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  >
                    <option value="Parking">Parking</option>
                    <option value="Toll">Toll Gate</option>
                    <option value="Communication">Business Communication</option>
                    <option value="Other">Other Approved Business Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of the item"
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Amount Input & Live Visual Policy Indicator */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Step 3: Total Amount Claimed (Rs) <span className="text-rose-500">*</span>
              </label>
              {policyLimit > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  Policy Limit: <strong>Rs. {policyLimit.toLocaleString('en-IN')}</strong>
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                required
                min={1}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-lg font-extrabold text-slate-900 rounded-lg border border-slate-300 pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white"
              />
            </div>

            {/* Visual Policy Limit Indicator Badge */}
            {numericAmount > 0 && (
              <div>
                {!isAboveLimit ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>STATUS: WITHIN POLICY LIMIT</span>
                    </div>
                    <span className="text-[11px] font-semibold">100% Eligible (Rs. {numericAmount})</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>STATUS: EXCEPTION – ABOVE POLICY LIMIT</span>
                      </div>
                      <span className="bg-rose-200 text-rose-950 font-bold px-2 py-0.5 rounded text-[11px]">
                        Excess: Rs. {excess}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 text-[11px] pt-1 border-t border-rose-200 text-slate-700">
                      <div>
                        Policy Limit: <strong>Rs. {policyLimit}</strong>
                      </div>
                      <div>
                        Claimed: <strong>Rs. {numericAmount}</strong>
                      </div>
                      <div>
                        Excess: <strong className="text-rose-700">Rs. {excess}</strong>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 mb-1">
                        Mandatory Exception Justification <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Reason why expense exceeded standard Band limit..."
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        className="w-full text-xs rounded-lg border border-rose-300 px-3 py-1.5 outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: Bill / Document Upload (Camera & File Picker with Compression) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              Step 4: Upload Bill / Supporting Document
            </label>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {/* Direct Camera capture for Mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />

            {!uploadedFileUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-100 border-2 border-dashed border-purple-300 rounded-xl text-xs font-bold text-purple-900 transition-colors shadow-xs"
                >
                  <Camera className="w-5 h-5 text-purple-700" />
                  <span>Take Photo with Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-xs"
                >
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span>Upload File / PDF</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Receipt preview" className="w-10 h-10 object-cover rounded-md border" />
                  ) : (
                    <FileText className="w-8 h-8 text-emerald-700 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-bold text-emerald-900 truncate">{uploadedFileName}</p>
                    <p className="text-[11px] text-emerald-700">{Math.round(uploadedFileSize / 1024)} KB • Attached</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileUrl('');
                    setUploadedFileName('');
                    setPreviewImage(null);
                  }}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                  title="Remove uploaded document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {isUploading && (
              <p className="text-center text-xs text-purple-700 font-semibold animate-pulse">
                Compressing and uploading bill...
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Additional Remarks</label>
            <input
              type="text"
              placeholder="e.g. Dinner with site client operations manager"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* STEP 5: Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 active:bg-purple-950 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Saving Expense...' : 'Save & Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
