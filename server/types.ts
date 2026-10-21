export type UserRole =
  | 'MASTER_ADMIN'
  | 'PRESIDENT'
  | 'DIRECTOR'
  | 'REGIONAL_APPROVER'
  | 'PROFIT_CENTRE_HEAD'
  | 'EMPLOYEE'
  | 'AUDITOR'
  | 'ACCOUNTS';

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_EMPLOYEE_VALIDATION'
  | 'PENDING_REGIONAL_APPROVAL'
  | 'REGIONAL_APPROVED'
  | 'PENDING_PRESIDENT_APPROVAL'
  | 'PRESIDENT_APPROVED'
  | 'PENDING_AUDIT'
  | 'AUDIT_QUERY'
  | 'AUDIT_PASSED'
  | 'AUDIT_FAILED'
  | 'PENDING_ACCOUNTS'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_PROCESSED'
  | 'CLOSED'
  | 'REJECTED'
  | 'SENT_BACK'
  | 'CANCELLED';

export type UserStatus = 'PENDING_VALIDATION' | 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  band?: 'B1' | 'B2' | 'B3' | '' | '-' | null;
  department: string;
  region: string;
  location: string;
  mobile: string;
  email: string;
  role: UserRole;
  reportingManager: string;
  approvingAuthorityId: string;
  approvingAuthorityName: string;
  status: UserStatus;
  isProfitCentreHead?: boolean;
  assignedTerritories?: string[]; // Territories approver can inspect
  createdAt: string;
  lastLogin?: string;
  password?: string;
  userAliases?: string[];
}

export interface TerritoryConfig {
  region: string; // e.g. "Karnataka", "Tamil Nadu", "Telangana"
  activeApproverId: string; // User ID
  activeApproverName: string;
}

export interface BandPolicy {
  band: 'B1' | 'B2' | 'B3';
  categoryLabel?: string;
  eligibleDesignations: string[];
  trainEligibility: string;
  travelClassEligibility?: string;
  localTravelModes: string[];
  foodMaxDaily: number;
  foodBreakfastMax: number;
  foodLunchMax: number;
  foodTeaMax: number;
  foodDinnerMax: number;
  hotelMaxPerNight: number;
  hotelMaxPerNightByDesignation?: { [designation: string]: number };
  flightEligibility: string;
  priorApprovalForFlight: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Tour {
  id: string; // GTS-TRV-YYYY-XXXXXX
  employeeId: string;
  userId: string;
  employeeName: string;
  designation: string;
  band: 'B1' | 'B2' | 'B3';
  department: string;
  region: string;
  approvingAuthorityName: string;
  purpose: string;
  clientOrSite: string;
  startLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  travelMode: string;
  priorApprovalRequired: boolean;
  priorApprovalRef?: string;
  remarks?: string;
  status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export type ExpenseCategory = 'TRAVEL' | 'FOOD' | 'LOCAL_TRAVEL' | 'HOTEL' | 'OTHER';

export interface ExpenseItem {
  id: string;
  claimId: string;
  tourId: string;
  category: ExpenseCategory;
  date: string;
  amount: number;
  
  // Category specific fields
  // Travel
  fromLocation?: string;
  toLocation?: string;
  travelMode?: string;
  ticketNo?: string;
  
  // Food
  mealType?: 'Breakfast' | 'Lunch' | 'Tea' | 'Dinner';
  restaurantVendor?: string;
  foodBillNo?: string;
  
  // Local Travel
  localFrom?: string;
  localTo?: string;
  localMode?: string;
  localReceiptNo?: string;
  localPurpose?: string;
  
  // Hotel
  hotelName?: string;
  hotelCity?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  roomAmount?: number;
  gst?: number;
  hotelInvoiceNo?: string;
  
  // Other
  otherCategory?: 'Parking' | 'Toll' | 'Communication' | 'Other';
  otherDescription?: string;
  businessPurpose?: string;

  // Common attachments & policy checks
  documentUrl?: string;
  documentName?: string;
  remarks?: string;
  policyLimit: number;
  claimedAmount: number;
  isException: boolean;
  excessAmount: number;
  eligibleAmount: number;
  exceptionReason?: string;
  createdAt: string;
}

export interface DocumentAttachment {
  id: string;
  claimId: string;
  expenseItemId?: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  dataUrl?: string;
  fileSize: number;
  uploadedBy: string;
  uploadDate: string;
  isHistorical?: boolean;
}

export interface AuditChecklistItem {
  key: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NA';
  comment?: string;
}

export interface ExpenseClaim {
  id: string; // GTS-CLM-YYYY-XXXXXX
  tourId: string;
  employeeId: string;
  userId: string;
  employeeName: string;
  designation: string;
  band: 'B1' | 'B2' | 'B3';
  department: string;
  region: string;
  approvingAuthorityId: string;
  approvingAuthorityName: string;
  destination: string;
  tourStartDate: string;
  tourEndDate: string;
  numberOfDays: number;
  status: ClaimStatus;
  
  // Calculated financial totals
  travelTotal: number;
  foodTotal: number;
  localTravelTotal: number;
  hotelTotal: number;
  otherTotal: number;
  grossClaim: number;
  policyEligible: number;
  exceptionAmount: number;
  hasExceptions: boolean;
  exceptionNotes?: string;
  
  declarationConfirmed: boolean;
  isPotentialDuplicate?: boolean;
  duplicateWarningReason?: string;
  
  // Regional approval
  submissionDate?: string;
  regionalApprovedDate?: string;
  regionalApproverName?: string;
  regionalComments?: string;
  
  // President approval
  presidentApprovedDate?: string;
  presidentApproverName?: string;
  presidentComments?: string;
  
  // Audit
  auditStatus?: 'PASSED' | 'FAILED' | 'QUERY';
  auditDate?: string;
  auditorName?: string;
  auditComments?: string;
  auditChecklist?: AuditChecklistItem[];
  
  // Accounts
  paymentStatus?: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'HOLD';
  paymentReference?: string;
  paymentDate?: string;
  processedAmount?: number;
  accountsRemarks?: string;
  
  // Historical snapshot of policy at submission time
  applicablePolicySnapshot?: BandPolicy;
  
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrailItem {
  id: string;
  claimId?: string;
  date: string;
  time: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  claimId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
}

export interface SystemSettings {
  companyName: string;
  companyAddress: string;
  companyGSTIN: string;
  logoUrl: string;
  currency: string;
  regions: string[];
  departments: string[];
  designations: Record<string, string[]>; // Band -> Designations
  otherExpenseCategories: string[];
}
