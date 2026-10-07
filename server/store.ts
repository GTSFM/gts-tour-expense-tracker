import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User,
  BandPolicy,
  TerritoryConfig,
  SystemSettings,
  Tour,
  ExpenseClaim,
  ExpenseItem,
  DocumentAttachment,
  AuditTrailItem,
  NotificationItem,
  ClaimStatus
} from './types.js';
import {
  INITIAL_SETTINGS,
  INITIAL_POLICIES,
  INITIAL_USERS,
  INITIAL_TERRITORY_CONFIGS,
  INITIAL_TOURS,
  INITIAL_CLAIMS,
  INITIAL_EXPENSE_ITEMS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_TRAIL
} from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'db.json');

export interface DatabaseSchema {
  settings: SystemSettings;
  policies: BandPolicy[];
  users: User[];
  territories: TerritoryConfig[];
  tours: Tour[];
  claims: ExpenseClaim[];
  expenseItems: ExpenseItem[];
  documents: DocumentAttachment[];
  auditTrail: AuditTrailItem[];
  notifications: NotificationItem[];
}

export class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          // Pre-seeded dummy employees to purge completely
          const PURGED_USER_IDS = new Set([
            'u-emp-1', 'u-emp-2', 'u-emp-3', 'u-emp-4', 'u-emp-pending',
            'u-bo-1', 'u-bo-2', 'u-bo-3', 'u-bo-4', 'u-bo-5',
            'u-bo-6', 'u-bo-7', 'u-bo-8', 'u-bo-9', 'u-bo-10'
          ]);
          const PURGED_EMP_IDS = new Set([
            'GTS001', 'GTS002', 'GTS003', 'GTS004', 'GTS099',
            'GTS-BO-01', 'GTS-BO-02', 'GTS-BO-03', 'GTS-BO-04', 'GTS-BO-05',
            'GTS-BO-06', 'GTS-BO-07', 'GTS-BO-08', 'GTS-BO-09', 'GTS-BO-10'
          ]);

          // Filter out dummy users, keep official roles & dynamically registered users
          parsed.users = parsed.users.filter(
            (u: User) => !PURGED_USER_IDS.has(u.id) && !PURGED_EMP_IDS.has(u.employeeId.toUpperCase())
          );

          // Ensure official authority users are present with correct details
          for (const initU of INITIAL_USERS) {
            const existing = parsed.users.find(
              (u: User) => u.id === initU.id || u.employeeId.toUpperCase() === initU.employeeId.toUpperCase()
            );
            if (existing) {
              existing.name = initU.name;
              existing.designation = initU.designation;
              existing.password = initU.password;
              existing.userAliases = initU.userAliases;
              existing.role = initU.role;
              existing.reportingManager = initU.reportingManager;
              existing.approvingAuthorityId = initU.approvingAuthorityId;
              existing.approvingAuthorityName = initU.approvingAuthorityName;
              if (existing.role === 'DIRECTOR') {
                existing.band = '';
              } else {
                existing.band = initU.band;
              }
            } else {
              parsed.users.push(initU);
            }
          }

          // Clear all sample claims, tours, items, documents, and notifications
          parsed.claims = [];
          parsed.tours = [];
          parsed.expenseItems = [];
          parsed.documents = [];
          parsed.auditTrail = [];
          parsed.notifications = [];

          parsed.settings = INITIAL_SETTINGS;
          parsed.policies = INITIAL_POLICIES;
          parsed.territories = INITIAL_TERRITORY_CONFIGS;

          this.saveData(parsed);
          return parsed;
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading db.json, falling back to seed:', err);
    }

    const initialData: DatabaseSchema = {
      settings: INITIAL_SETTINGS,
      policies: INITIAL_POLICIES,
      users: INITIAL_USERS,
      territories: INITIAL_TERRITORY_CONFIGS,
      tours: INITIAL_TOURS,
      claims: INITIAL_CLAIMS,
      expenseItems: INITIAL_EXPENSE_ITEMS,
      documents: INITIAL_DOCUMENTS,
      auditTrail: INITIAL_AUDIT_TRAIL,
      notifications: []
    };

    this.saveData(initialData);
    return initialData;
  }

  public saveData(dataToSave?: DatabaseSchema): void {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  // --- SETTINGS & POLICIES ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();
    return this.data.settings;
  }

  public getPolicies(): BandPolicy[] {
    return this.data.policies;
  }

  public getPolicyByBand(band: 'B1' | 'B2' | 'B3'): BandPolicy {
    return this.data.policies.find(p => p.band === band) || this.data.policies[0];
  }

  public updatePolicy(band: 'B1' | 'B2' | 'B3', updates: Partial<BandPolicy>): BandPolicy {
    const idx = this.data.policies.findIndex(p => p.band === band);
    if (idx !== -1) {
      this.data.policies[idx] = { ...this.data.policies[idx], ...updates };
      this.saveData();
      return this.data.policies[idx];
    }
    throw new Error(`Policy for band ${band} not found.`);
  }

  // --- TERRITORIES ---
  public getTerritories(): TerritoryConfig[] {
    return this.data.territories;
  }

  public updateTerritoryApprover(region: string, approverId: string): TerritoryConfig {
    const user = this.getUserById(approverId);
    if (!user) throw new Error(`Approver ${approverId} not found.`);

    const idx = this.data.territories.findIndex(t => t.region.toLowerCase() === region.toLowerCase());
    if (idx !== -1) {
      this.data.territories[idx].activeApproverId = user.id;
      this.data.territories[idx].activeApproverName = user.name;
    } else {
      this.data.territories.push({
        region,
        activeApproverId: user.id,
        activeApproverName: user.name
      });
    }
    this.saveData();
    return this.data.territories.find(t => t.region.toLowerCase() === region.toLowerCase())!;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmployeeId(empId: string): User | undefined {
    return this.data.users.find(u => u.employeeId.toUpperCase() === empId.toUpperCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByIdentifier(identifier: string): User | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(u => {
      if (u.id.toLowerCase() === clean) return true;
      if (u.employeeId.toLowerCase() === clean) return true;
      if (u.email.toLowerCase() === clean) return true;
      if (u.name.toLowerCase() === clean) return true;
      if (u.userAliases && u.userAliases.some(a => a.toLowerCase() === clean)) return true;
      return false;
    });
  }

  public changePassword(userId: string, currentPass: string, newPass: string): { success: boolean; message: string } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found.');

    if (user.password && user.password !== currentPass) {
      throw new Error('Current password does not match.');
    }

    if (!newPass || newPass.trim().length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    user.password = newPass.trim();
    this.saveData();

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Password Changed',
      comment: `Password updated successfully for ${user.name} (${user.employeeId}).`
    });

    return { success: true, message: 'Password changed successfully.' };
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const existing = this.getUserByEmployeeId(userData.employeeId);
    if (existing) {
      throw new Error(`Employee ID "${userData.employeeId}" is already registered.`);
    }

    const aliases = userData.userAliases && userData.userAliases.length > 0
      ? userData.userAliases
      : [userData.name, userData.employeeId, userData.email].filter(Boolean) as string[];

    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: userData.status || 'ACTIVE',
      password: userData.password || 'GTS@123',
      userAliases: aliases,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.saveData();

    this.logAudit({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'User Registered',
      newValue: newUser.status,
      comment: `New employee registered with ID ${newUser.employeeId}. Status: ${newUser.status}`
    });

    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>, adminUser?: User): User {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');

    const old = this.data.users[idx];
    this.data.users[idx] = { ...old, ...updates };
    this.saveData();

    if (adminUser) {
      this.logAudit({
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role,
        action: 'User Profile Updated',
        oldValue: old.status,
        newValue: this.data.users[idx].status,
        comment: `User ${old.name} (${old.employeeId}) profile updated by ${adminUser.name}.`
      });
    }

    return this.data.users[idx];
  }

  public validateEmployee(userId: string, approverUser: User): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found.');

    user.status = 'ACTIVE';
    this.saveData();

    this.logAudit({
      userId: approverUser.id,
      userName: approverUser.name,
      userRole: approverUser.role,
      action: 'Profile Approved',
      oldValue: 'PENDING_VALIDATION',
      newValue: 'ACTIVE',
      comment: `Employee ${user.name} (${user.employeeId}) validated and activated by ${approverUser.name}.`
    });

    this.addNotification({
      userId: user.id,
      title: 'Registration Approved',
      message: `Your employee profile has been validated. You can now submit tour requests and expense claims.`,
      type: 'SUCCESS'
    });

    return user;
  }

  // --- TOURS ---
  public getTours(): Tour[] {
    return this.data.tours;
  }

  public getTourById(id: string): Tour | undefined {
    return this.data.tours.find(t => t.id === id);
  }

  public getToursByUser(userId: string): Tour[] {
    return this.data.tours.filter(t => t.userId === userId);
  }

  public createTour(tourData: Omit<Tour, 'id' | 'createdAt' | 'status'>, user: User): Tour {
    const year = new Date().getFullYear();
    const count = this.data.tours.length + 101;
    const tourId = `GTS-TRV-${year}-${String(count).padStart(6, '0')}`;

    const newTour: Tour = {
      ...tourData,
      id: tourId,
      status: 'PLANNED',
      createdAt: new Date().toISOString()
    };

    this.data.tours.unshift(newTour);
    this.saveData();

    this.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Tour Created',
      newValue: newTour.id,
      comment: `New tour created: ${newTour.startLocation} to ${newTour.destination} (${newTour.numberOfDays} days).`
    });

    return newTour;
  }

  // --- CLAIMS ---
  public getClaims(): ExpenseClaim[] {
    return this.data.claims;
  }

  public getClaimById(id: string): ExpenseClaim | undefined {
    return this.data.claims.find(c => c.id === id);
  }

  public getClaimsByUser(userId: string): ExpenseClaim[] {
    return this.data.claims.filter(c => c.userId === userId);
  }

  /**
   * Strict Territory-Based Filtering for Regional Approvers
   */
  public getClaimsForApprover(approver: User): ExpenseClaim[] {
    if (approver.role === 'MASTER_ADMIN' || approver.role === 'PRESIDENT' || approver.role === 'DIRECTOR') {
      return this.data.claims;
    }

    if (approver.role === 'REGIONAL_APPROVER') {
      const assigned = approver.assignedTerritories || [];
      return this.data.claims.filter(claim => {
        // Territory check: claim region must be in approver's territory
        const inTerritory = assigned.some(t => t.toLowerCase() === claim.region.toLowerCase());
        if (!inTerritory) return false;

        // Active territory approver config check (e.g. Yoga vs Sundar)
        const terrConfig = this.data.territories.find(t => t.region.toLowerCase() === claim.region.toLowerCase());
        if (terrConfig && terrConfig.activeApproverId && terrConfig.activeApproverId !== approver.id) {
          return false;
        }

        // Rule 1: An employee cannot approve their own claim!
        if (claim.userId === approver.id) {
          return false;
        }

        return true;
      });
    }

    if (approver.role === 'AUDITOR') {
      // Auditor sees claims approved by President or later
      const allowedStatuses: ClaimStatus[] = [
        'PRESIDENT_APPROVED',
        'PENDING_AUDIT',
        'AUDIT_QUERY',
        'AUDIT_PASSED',
        'AUDIT_FAILED',
        'PENDING_ACCOUNTS',
        'PAYMENT_PROCESSING',
        'PAYMENT_PROCESSED',
        'CLOSED'
      ];
      return this.data.claims.filter(c => allowedStatuses.includes(c.status));
    }

    if (approver.role === 'ACCOUNTS') {
      // Accounts sees claims where audit is PASSED or in payment
      const allowedStatuses: ClaimStatus[] = [
        'AUDIT_PASSED',
        'PENDING_ACCOUNTS',
        'PAYMENT_PROCESSING',
        'PAYMENT_PROCESSED',
        'CLOSED'
      ];
      return this.data.claims.filter(c => allowedStatuses.includes(c.status));
    }

    // Default to own claims for employees
    return this.data.claims.filter(c => c.userId === approver.id);
  }

  public createDraftClaim(tourId: string, user: User): ExpenseClaim {
    const tour = this.getTourById(tourId);
    if (!tour) throw new Error('Tour not found.');

    // Check if a claim already exists for this tour
    const existing = this.data.claims.find(c => c.tourId === tourId && c.status !== 'CANCELLED');
    if (existing) {
      return existing;
    }

    const year = new Date().getFullYear();
    const count = this.data.claims.length + 101;
    const claimId = `GTS-CLM-${year}-${String(count).padStart(6, '0')}`;

    const newClaim: ExpenseClaim = {
      id: claimId,
      tourId: tour.id,
      employeeId: user.employeeId,
      userId: user.id,
      employeeName: user.name,
      designation: user.designation,
      band: user.band,
      department: user.department,
      region: user.region,
      approvingAuthorityId: user.approvingAuthorityId,
      approvingAuthorityName: user.approvingAuthorityName,
      destination: tour.destination,
      tourStartDate: tour.startDate,
      tourEndDate: tour.endDate,
      numberOfDays: tour.numberOfDays,
      status: 'DRAFT',
      travelTotal: 0,
      foodTotal: 0,
      localTravelTotal: 0,
      hotelTotal: 0,
      otherTotal: 0,
      grossClaim: 0,
      policyEligible: 0,
      exceptionAmount: 0,
      hasExceptions: false,
      declarationConfirmed: false,
      isPotentialDuplicate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.claims.unshift(newClaim);
    this.saveData();

    this.logAudit({
      claimId: newClaim.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Claim Draft Created',
      newValue: 'DRAFT',
      comment: `Draft claim created for tour ${tour.id}.`
    });

    return newClaim;
  }

  public deleteClaim(claimId: string): void {
    const idx = this.data.claims.findIndex(c => c.id === claimId);
    if (idx !== -1) {
      const claim = this.data.claims[idx];
      this.data.claims.splice(idx, 1);
      this.data.expenseItems = this.data.expenseItems.filter(i => i.claimId !== claimId);
      this.data.documents = this.data.documents.filter(d => d.claimId !== claimId);
      this.data.auditTrail = this.data.auditTrail.filter(a => a.claimId !== claimId);
      if (claim.tourId) {
        this.data.tours = this.data.tours.filter(t => t.id !== claim.tourId);
      }
      this.saveData();
    }
  }

  // --- EXPENSE ITEMS & RECALCULATIONS ---
  public getExpenseItems(claimId: string): ExpenseItem[] {
    return this.data.expenseItems.filter(item => item.claimId === claimId);
  }

  public addExpenseItem(itemData: Omit<ExpenseItem, 'id' | 'createdAt'>, user: User): ExpenseItem {
    const claim = this.getClaimById(itemData.claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.status !== 'DRAFT' && claim.status !== 'SENT_BACK') {
      throw new Error(`Cannot modify claim in ${claim.status} status.`);
    }

    const policy = this.getPolicyByBand(claim.band);
    const validatedItem = this.validateItemAgainstPolicy(itemData, policy, claim);

    const newItem: ExpenseItem = {
      ...itemData,
      ...validatedItem,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    } as ExpenseItem;

    this.data.expenseItems.push(newItem);
    this.recalculateClaim(claim.id);
    this.checkForDuplicates(claim.id);
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Expense Added',
      newValue: `₹${newItem.amount} (${newItem.category})`,
      comment: `Added ${newItem.category} expense of ₹${newItem.amount}. Exception: ${newItem.isException ? 'YES (Excess ₹' + newItem.excessAmount + ')' : 'NO'}`
    });

    return newItem;
  }

  public updateExpenseItem(itemId: string, updates: Partial<ExpenseItem>, user: User): ExpenseItem {
    const idx = this.data.expenseItems.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('Expense item not found.');

    const oldItem = this.data.expenseItems[idx];
    const claim = this.getClaimById(oldItem.claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.status !== 'DRAFT' && claim.status !== 'SENT_BACK') {
      throw new Error(`Cannot edit expense in status ${claim.status}.`);
    }

    const merged = { ...oldItem, ...updates };
    const policy = this.getPolicyByBand(claim.band);
    const validated = this.validateItemAgainstPolicy(merged, policy, claim);

    this.data.expenseItems[idx] = { ...merged, ...validated };
    this.recalculateClaim(claim.id);
    this.checkForDuplicates(claim.id);
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Expense Edited',
      oldValue: `₹${oldItem.amount}`,
      newValue: `₹${this.data.expenseItems[idx].amount}`,
      comment: `Edited ${oldItem.category} item.`
    });

    return this.data.expenseItems[idx];
  }

  public deleteExpenseItem(itemId: string, user: User): void {
    const idx = this.data.expenseItems.findIndex(i => i.id === itemId);
    if (idx === -1) throw new Error('Item not found.');

    const oldItem = this.data.expenseItems[idx];
    const claim = this.getClaimById(oldItem.claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.status !== 'DRAFT' && claim.status !== 'SENT_BACK') {
      throw new Error(`Cannot delete item in ${claim.status} status.`);
    }

    this.data.expenseItems.splice(idx, 1);
    this.recalculateClaim(claim.id);
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Expense Deleted',
      oldValue: `₹${oldItem.amount} (${oldItem.category})`,
      comment: `Removed ${oldItem.category} item.`
    });
  }

  /**
   * Band-wise Policy Limit Validation Engine
   */
  private validateItemAgainstPolicy(item: Partial<ExpenseItem>, policy: BandPolicy, claim?: ExpenseClaim): Partial<ExpenseItem> {
    const amount = Number(item.amount) || 0;
    let limit = 0;
    let isException = false;
    let excessAmount = 0;
    let eligibleAmount = amount;

    if (item.category === 'FOOD') {
      // Specific meal cap or daily allowance
      if (item.mealType === 'Breakfast') limit = policy.foodBreakfastMax;
      else if (item.mealType === 'Lunch') limit = policy.foodLunchMax;
      else if (item.mealType === 'Tea') limit = policy.foodTeaMax;
      else if (item.mealType === 'Dinner') limit = policy.foodDinnerMax;
      else limit = policy.foodMaxDaily;

      if (amount > limit) {
        isException = true;
        excessAmount = amount - limit;
        eligibleAmount = limit;
      }
    } else if (item.category === 'HOTEL') {
      const nights = Number(item.nights) || 1;
      let perNight = policy.hotelMaxPerNight;
      const des = (claim?.designation || '').toUpperCase();
      if (policy.band === 'B2') {
        if (des.includes('AGM')) {
          perNight = policy.hotelMaxPerNightByDesignation?.['AGM'] || 2000;
        } else {
          perNight = 1800;
        }
      }
      limit = perNight * nights;
      if (amount > limit) {
        isException = true;
        excessAmount = amount - limit;
        eligibleAmount = limit;
      }
    } else if (item.category === 'TRAVEL') {
      // Flight travel policy check
      if (item.travelMode === 'Flight' && policy.priorApprovalForFlight) {
        limit = amount;
        // Flights require prior approval flag
        if (!item.remarks?.includes('Prior Approved') && !item.ticketNo?.startsWith('PA-')) {
          isException = true;
          excessAmount = 0; // flagged for prior approval exception review
        }
      } else {
        limit = amount;
      }
    } else {
      limit = amount;
    }

    return {
      policyLimit: limit,
      claimedAmount: amount,
      isException,
      excessAmount,
      eligibleAmount
    };
  }

  /**
   * Recalculates all sums, policy eligible amounts, and exception amounts
   */
  public recalculateClaim(claimId: string): ExpenseClaim {
    const claim = this.getClaimById(claimId);
    if (!claim) throw new Error('Claim not found.');

    const items = this.getExpenseItems(claimId);
    let travelTotal = 0;
    let foodTotal = 0;
    let localTravelTotal = 0;
    let hotelTotal = 0;
    let otherTotal = 0;
    let grossClaim = 0;
    let exceptionAmount = 0;
    let hasExceptions = false;

    for (const item of items) {
      const amt = Number(item.amount) || 0;
      grossClaim += amt;

      if (item.category === 'TRAVEL') travelTotal += amt;
      else if (item.category === 'FOOD') foodTotal += amt;
      else if (item.category === 'LOCAL_TRAVEL') localTravelTotal += amt;
      else if (item.category === 'HOTEL') hotelTotal += amt;
      else if (item.category === 'OTHER') otherTotal += amt;

      if (item.isException) {
        hasExceptions = true;
        exceptionAmount += item.excessAmount || 0;
      }
    }

    claim.travelTotal = travelTotal;
    claim.foodTotal = foodTotal;
    claim.localTravelTotal = localTravelTotal;
    claim.hotelTotal = hotelTotal;
    claim.otherTotal = otherTotal;
    claim.grossClaim = grossClaim;
    claim.exceptionAmount = exceptionAmount;
    claim.policyEligible = Math.max(0, grossClaim - exceptionAmount);
    claim.hasExceptions = hasExceptions;
    claim.updatedAt = new Date().toISOString();

    return claim;
  }

  /**
   * Duplicate Claim & Bill Detection Rule
   */
  public checkForDuplicates(claimId: string): { isDuplicate: boolean; reason?: string } {
    const currentClaim = this.getClaimById(claimId);
    if (!currentClaim) return { isDuplicate: false };

    const currentItems = this.getExpenseItems(claimId);
    const allOtherItems = this.data.expenseItems.filter(i => i.claimId !== claimId);

    for (const item of currentItems) {
      // Check if identical date, amount and invoice/ticket number exist for same employee in another claim
      const match = allOtherItems.find(other => {
        const otherClaim = this.getClaimById(other.claimId);
        if (!otherClaim || otherClaim.employeeId !== currentClaim.employeeId) return false;
        if (other.date !== item.date) return false;
        if (other.amount !== item.amount) return false;

        const doc1 = item.ticketNo || item.foodBillNo || item.hotelInvoiceNo || item.localReceiptNo;
        const doc2 = other.ticketNo || other.foodBillNo || other.hotelInvoiceNo || other.localReceiptNo;
        if (doc1 && doc2 && doc1.trim().toLowerCase() === doc2.trim().toLowerCase()) {
          return true;
        }
        return false;
      });

      if (match) {
        currentClaim.isPotentialDuplicate = true;
        currentClaim.duplicateWarningReason = `POTENTIAL DUPLICATE EXPENSE: Item ₹${item.amount} on ${item.date} matches bill number in existing claim ${match.claimId}.`;
        return { isDuplicate: true, reason: currentClaim.duplicateWarningReason };
      }
    }

    currentClaim.isPotentialDuplicate = false;
    currentClaim.duplicateWarningReason = undefined;
    return { isDuplicate: false };
  }

  // --- DOCUMENTS ---
  public getDocuments(claimId: string): DocumentAttachment[] {
    return this.data.documents.filter(d => d.claimId === claimId && !d.isHistorical);
  }

  public addDocument(docData: Omit<DocumentAttachment, 'id' | 'uploadDate'>, user: User): DocumentAttachment {
    const newDoc: DocumentAttachment = {
      ...docData,
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadDate: new Date().toISOString()
    };

    this.data.documents.push(newDoc);
    this.saveData();

    this.logAudit({
      claimId: docData.claimId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Document Uploaded',
      newValue: newDoc.documentName,
      comment: `Uploaded document: ${newDoc.documentName} (${newDoc.documentType}, ${Math.round(newDoc.fileSize / 1024)} KB)`
    });

    return newDoc;
  }

  // --- WORKFLOW ACTIONS ---

  /**
   * Submit Claim with Business Rules:
   * Rule 14: Employee must be ACTIVE.
   * Rule 3: If claimant is Profit Centre Head, skip Regional Approver -> goes straight to President!
   * Rule 12: Freeze snapshot of current policy in applicablePolicySnapshot.
   */
  public submitClaim(claimId: string, declarationConfirmed: boolean, user: User): ExpenseClaim {
    const claim = this.getClaimById(claimId);
    if (!claim) throw new Error('Claim not found.');

    if (user.status !== 'ACTIVE') {
      throw new Error('Your employee account is PENDING VALIDATION. Only active employees can submit claims.');
    }

    if (!declarationConfirmed) {
      throw new Error('You must confirm the official declaration checkbox before submitting.');
    }

    const items = this.getExpenseItems(claimId);
    if (items.length === 0) {
      throw new Error('Cannot submit an empty claim. Please add at least one expense item.');
    }

    // Freeze policy snapshot
    claim.applicablePolicySnapshot = this.getPolicyByBand(claim.band);
    claim.declarationConfirmed = true;
    claim.submissionDate = new Date().toISOString();

    const isPresident = user.role === 'PRESIDENT';
    const isDirector = user.role === 'DIRECTOR';
    const isProfitCentreHead = user.isProfitCentreHead || user.role === 'PROFIT_CENTRE_HEAD';

    let submitComment = '';

    if (isPresident) {
      // HIERARCHY: President reports to Directors - personal claims move directly to Directors for Final Approval
      claim.status = 'PENDING_PRESIDENT_APPROVAL';
      claim.approvingAuthorityId = 'u-dir-1';
      claim.approvingAuthorityName = 'Board of Directors (Mr. Mariappan S / Mr. Prabakar B)';
      submitComment = 'President personal tour claim routed to Board of Directors for Final Management Approval.';
    } else if (isDirector) {
      // Director claim routed to peer Management for Final Approval
      claim.status = 'PENDING_PRESIDENT_APPROVAL';
      claim.approvingAuthorityName = 'Board of Directors / President';
      submitComment = 'Director tour claim routed to Management for Final Approval.';
    } else if (isProfitCentreHead) {
      // Profit Centre Head Claim goes directly to Management (President / Directors)
      claim.status = 'PENDING_PRESIDENT_APPROVAL';
      claim.approvingAuthorityName = 'Management (President / Directors)';
      submitComment = 'Profit Centre Head claim routed directly to Management (President & Directors).';
    } else {
      claim.status = 'PENDING_REGIONAL_APPROVAL';
      submitComment = `Claim submitted for regional approval to ${claim.approvingAuthorityName}.`;
    }

    this.recalculateClaim(claim.id);
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Claim Submitted',
      oldValue: 'DRAFT',
      newValue: claim.status,
      comment: submitComment
    });

    // Notify Approvers
    if (isPresident) {
      const directors = this.data.users.filter(u => u.role === 'DIRECTOR');
      for (const d of directors) {
        this.addNotification({
          userId: d.id,
          claimId: claim.id,
          title: 'President Claim Awaiting Director Approval',
          message: `President ${user.name} submitted claim ${claim.id} for ₹${claim.grossClaim.toLocaleString('en-IN')}.`,
          type: 'INFO'
        });
      }
    } else if (isDirector) {
      const management = this.data.users.filter(u => (u.role === 'DIRECTOR' || u.role === 'PRESIDENT') && u.id !== user.id);
      for (const m of management) {
        this.addNotification({
          userId: m.id,
          claimId: claim.id,
          title: 'Director Claim Awaiting Management Approval',
          message: `Director ${user.name} submitted claim ${claim.id} for ₹${claim.grossClaim.toLocaleString('en-IN')}.`,
          type: 'INFO'
        });
      }
    } else if (isProfitCentreHead) {
      const management = this.data.users.filter(u => u.role === 'PRESIDENT' || u.role === 'DIRECTOR');
      for (const m of management) {
        this.addNotification({
          userId: m.id,
          claimId: claim.id,
          title: 'Profit Centre Head Claim Awaiting Approval',
          message: `${user.name} submitted claim ${claim.id} for ₹${claim.grossClaim.toLocaleString('en-IN')}.`,
          type: 'INFO'
        });
      }
    } else {
      if (claim.approvingAuthorityId) {
        this.addNotification({
          userId: claim.approvingAuthorityId,
          claimId: claim.id,
          title: 'New Claim Awaiting Regional Approval',
          message: `${user.name} submitted claim ${claim.id} for ₹${claim.grossClaim.toLocaleString('en-IN')} (${claim.region}).`,
          type: 'INFO'
        });
      }
    }

    return claim;
  }

  /**
   * Regional Approval Actions: APPROVE, REJECT, SEND_BACK
   */
  public regionalAction(
    claimId: string,
    action: 'APPROVE' | 'REJECT' | 'SEND_BACK',
    comments: string,
    approver: User
  ): ExpenseClaim {
    const claim = this.getClaimById(claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.status !== 'PENDING_REGIONAL_APPROVAL') {
      throw new Error(`Claim is in ${claim.status} status and cannot be actioned by Regional Approver.`);
    }

    // Rule 1: Cannot approve own claim
    if (claim.userId === approver.id) {
      throw new Error('RULE 1 VIOLATION: An employee cannot approve his/her own claim.');
    }

    // Rule 2: Territory verification
    if (approver.role === 'REGIONAL_APPROVER') {
      const assigned = approver.assignedTerritories || [];
      const match = assigned.some(t => t.toLowerCase() === claim.region.toLowerCase());
      if (!match) {
        throw new Error(`RULE 2 VIOLATION: You are not authorized to approve claims for territory: ${claim.region}.`);
      }
    }

    // Rule 7 & 8: Mandatory comments
    if ((action === 'REJECT' || action === 'SEND_BACK') && (!comments || comments.trim().length === 0)) {
      throw new Error('Mandatory reason/comment is required for rejection or sending back a claim.');
    }

    const now = new Date().toISOString();
    const oldStatus = claim.status;

    if (action === 'APPROVE') {
      claim.status = 'PENDING_PRESIDENT_APPROVAL';
      claim.regionalApprovedDate = now;
      claim.regionalApproverName = approver.name;
      claim.regionalComments = comments;

      // Notify Management (President and both Directors)
      const managementUsers = this.data.users.filter(u => u.role === 'PRESIDENT' || u.role === 'DIRECTOR');
      for (const m of managementUsers) {
        this.addNotification({
          userId: m.id,
          claimId: claim.id,
          title: 'Claim Ready for Final Management Approval',
          message: `Claim ${claim.id} by ${claim.employeeName} (₹${claim.grossClaim.toLocaleString('en-IN')}) approved regionally by ${approver.name}.`,
          type: 'INFO'
        });
      }
    } else if (action === 'REJECT') {
      claim.status = 'REJECTED';
      claim.regionalComments = comments;
    } else if (action === 'SEND_BACK') {
      claim.status = 'SENT_BACK';
      claim.regionalComments = comments;
    }

    claim.updatedAt = now;
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: approver.id,
      userName: approver.name,
      userRole: approver.role,
      action: `Regional ${action}`,
      oldValue: oldStatus,
      newValue: claim.status,
      comment: comments || `Actioned by regional approver ${approver.name}.`
    });

    // Notify Claimant
    this.addNotification({
      userId: claim.userId,
      claimId: claim.id,
      title: `Claim ${action === 'APPROVE' ? 'Regionally Approved' : action === 'REJECT' ? 'Rejected' : 'Sent Back'}`,
      message: `Your claim ${claim.id} was ${action.toLowerCase().replace('_', ' ')} by ${approver.name}. Remarks: ${comments || 'None'}`,
      type: action === 'APPROVE' ? 'SUCCESS' : action === 'REJECT' ? 'ERROR' : 'WARNING'
    });

    return claim;
  }

  /**
   * Final Management Approval Actions: APPROVE, REJECT, SEND_BACK
   * Can be performed by all 3: President (Mr. Bharanidhar Tarimana) and both Directors (Mr. Mariappan S & Mr. Prabakar B)
   */
  public presidentAction(
    claimId: string,
    action: 'APPROVE' | 'REJECT' | 'SEND_BACK',
    comments: string,
    approver: User
  ): ExpenseClaim {
    const claim = this.getClaimById(claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.status !== 'PENDING_PRESIDENT_APPROVAL') {
      throw new Error(`Claim is in ${claim.status} status and not pending Management approval.`);
    }

    // Role check: President, Director, or Master Admin
    if (approver.role !== 'PRESIDENT' && approver.role !== 'DIRECTOR' && approver.role !== 'MASTER_ADMIN') {
      throw new Error('RULE VIOLATION: Final Management Approval is restricted to Company Directors and President.');
    }

    // Rule 1: An executive cannot approve their own claim!
    if (claim.userId === approver.id) {
      throw new Error('RULE 1 VIOLATION: An executive cannot approve their own tour claim. Approval must be completed by another Director or Executive.');
    }

    if ((action === 'REJECT' || action === 'SEND_BACK') && (!comments || comments.trim().length === 0)) {
      throw new Error('Mandatory reason/clarification is required for rejection or sending back a claim.');
    }

    const now = new Date().toISOString();
    const oldStatus = claim.status;
    const approverTitle = approver.designation || (approver.role === 'PRESIDENT' ? 'President' : 'Director');
    const approverDisplay = `${approver.name} (${approverTitle})`;

    if (action === 'APPROVE') {
      // Moves to PENDING_AUDIT upon Final Management Approval
      claim.status = 'PENDING_AUDIT';
      claim.presidentApprovedDate = now;
      claim.presidentApproverName = approverDisplay;
      claim.presidentComments = comments;
      claim.managementApprovedDate = now;
      claim.managementApproverName = approverDisplay;
      claim.managementApproverRole = approver.role;
      claim.managementComments = comments;

      // Notify Auditors
      const auditors = this.data.users.filter(u => u.role === 'AUDITOR');
      for (const aud of auditors) {
        this.addNotification({
          userId: aud.id,
          claimId: claim.id,
          title: 'Claim Awaiting Audit Verification',
          message: `Claim ${claim.id} (${claim.employeeName}, ₹${claim.grossClaim.toLocaleString('en-IN')}) has received Final Management Approval from ${approverDisplay}.`,
          type: 'INFO'
        });
      }
    } else if (action === 'REJECT') {
      claim.status = 'REJECTED';
      claim.presidentComments = comments;
      claim.presidentApproverName = approverDisplay;
      claim.managementComments = comments;
      claim.managementApproverName = approverDisplay;
      claim.managementApproverRole = approver.role;
    } else if (action === 'SEND_BACK') {
      claim.status = 'SENT_BACK';
      claim.presidentComments = comments;
      claim.presidentApproverName = approverDisplay;
      claim.managementComments = comments;
      claim.managementApproverName = approverDisplay;
      claim.managementApproverRole = approver.role;
    }

    claim.updatedAt = now;
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: approver.id,
      userName: approver.name,
      userRole: approver.role,
      action: `Final Management ${action}`,
      oldValue: oldStatus,
      newValue: claim.status,
      comment: comments || `Actioned with Final Management Approval by ${approverDisplay}.`
    });

    this.addNotification({
      userId: claim.userId,
      claimId: claim.id,
      title: `Management Review: ${action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Sent Back'}`,
      message: `Your claim ${claim.id} received Final Management review by ${approverDisplay}. Status: ${claim.status}.`,
      type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING'
    });

    return claim;
  }

  /**
   * Auditor 13-Point Checklist & Verification Action
   */
  public auditAction(
    claimId: string,
    action: 'PASS' | 'FAIL' | 'QUERY',
    checklist: Record<string, { status: 'PASS' | 'FAIL' | 'NA'; comment?: string }>,
    auditorComments: string,
    auditor: User
  ): ExpenseClaim {
    const claim = this.getClaimById(claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.status !== 'PENDING_AUDIT' && claim.status !== 'AUDIT_QUERY') {
      throw new Error(`Claim is in ${claim.status} status and not pending audit.`);
    }

    // Check if any checklist item failed without a comment
    const checklistItems = Object.entries(checklist).map(([key, val]) => ({
      key,
      label: key.replace(/_/g, ' '),
      status: val.status,
      comment: val.comment
    }));

    const failedItem = checklistItems.find(i => i.status === 'FAIL' && (!i.comment || i.comment.trim().length === 0));
    if (failedItem) {
      throw new Error(`Auditor comments are mandatory for any failed checklist item (${failedItem.key}).`);
    }

    if (action === 'FAIL' && (!auditorComments || auditorComments.trim().length === 0)) {
      throw new Error('Mandatory audit comments required when marking audit as FAILED.');
    }

    const now = new Date().toISOString();
    const oldStatus = claim.status;

    claim.auditChecklist = checklistItems;
    claim.auditorName = auditor.name;
    claim.auditDate = now;
    claim.auditComments = auditorComments;

    if (action === 'PASS') {
      // RULE 5: Pass moves to PENDING_ACCOUNTS
      claim.status = 'PENDING_ACCOUNTS';
      claim.auditStatus = 'PASSED';

      // Notify Accounts
      const accountsUsers = this.data.users.filter(u => u.role === 'ACCOUNTS');
      for (const acc of accountsUsers) {
        this.addNotification({
          userId: acc.id,
          claimId: claim.id,
          title: 'New Claim Ready for Payment Processing',
          message: `Claim ${claim.id} for ${claim.employeeName} (₹${claim.grossClaim}) has PASSED Audit. Ready for payment settlement.`,
          type: 'SUCCESS'
        });
      }
    } else if (action === 'QUERY') {
      claim.status = 'AUDIT_QUERY';
      claim.auditStatus = 'QUERY';
    } else if (action === 'FAIL') {
      claim.status = 'AUDIT_FAILED';
      claim.auditStatus = 'FAILED';
    }

    claim.updatedAt = now;
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: auditor.id,
      userName: auditor.name,
      userRole: auditor.role,
      action: `Audit ${action}`,
      oldValue: oldStatus,
      newValue: claim.status,
      comment: auditorComments || `13-point audit verification executed by ${auditor.name}. Result: ${action}`
    });

    this.addNotification({
      userId: claim.userId,
      claimId: claim.id,
      title: `Audit Status Update: ${action}`,
      message: `Claim ${claim.id} audit status is ${action}. Remarks: ${auditorComments || 'Audit passed.'}`,
      type: action === 'PASS' ? 'SUCCESS' : 'WARNING'
    });

    return claim;
  }

  /**
   * Accounts Payment Settlement Actions:
   * RULE 6: Accounts cannot process a claim unless Audit status is PASSED!
   */
  public accountsAction(
    claimId: string,
    action: 'MARK_FOR_PAYMENT' | 'PAYMENT_PROCESSED' | 'PAYMENT_FAILED' | 'HOLD',
    paymentDetails: {
      paymentReference?: string;
      paymentDate?: string;
      processedAmount?: number;
      remarks?: string;
    },
    accountsUser: User
  ): ExpenseClaim {
    const claim = this.getClaimById(claimId);
    if (!claim) throw new Error('Claim not found.');

    if (claim.auditStatus !== 'PASSED') {
      throw new Error('RULE 6 VIOLATION: Accounts cannot process a claim unless Audit status is PASSED.');
    }

    const now = new Date().toISOString();
    const oldStatus = claim.status;

    if (action === 'MARK_FOR_PAYMENT') {
      claim.status = 'PAYMENT_PROCESSING';
      claim.paymentStatus = 'PROCESSING';
      claim.accountsRemarks = paymentDetails.remarks || 'Queued in bank payout batch.';
    } else if (action === 'PAYMENT_PROCESSED') {
      if (!paymentDetails.paymentReference || paymentDetails.paymentReference.trim().length === 0) {
        throw new Error('Payment reference (UTR/Cheque/NEFT reference) is mandatory.');
      }
      claim.status = 'CLOSED'; // Final Closed status!
      claim.paymentStatus = 'PROCESSED';
      claim.paymentReference = paymentDetails.paymentReference;
      claim.paymentDate = paymentDetails.paymentDate || new Date().toISOString().split('T')[0];
      claim.processedAmount = paymentDetails.processedAmount || claim.grossClaim;
      claim.accountsRemarks = paymentDetails.remarks;
    } else if (action === 'HOLD') {
      claim.paymentStatus = 'HOLD';
      claim.accountsRemarks = paymentDetails.remarks || 'Payment placed on hold.';
    } else if (action === 'PAYMENT_FAILED') {
      claim.paymentStatus = 'FAILED';
      claim.accountsRemarks = paymentDetails.remarks || 'Bank transaction rejected.';
    }

    claim.updatedAt = now;
    this.saveData();

    this.logAudit({
      claimId: claim.id,
      userId: accountsUser.id,
      userName: accountsUser.name,
      userRole: accountsUser.role,
      action: `Accounts ${action}`,
      oldValue: oldStatus,
      newValue: claim.status,
      comment: `Payment Ref: ${paymentDetails.paymentReference || 'N/A'}, Amount: ₹${claim.processedAmount || claim.grossClaim}. ${paymentDetails.remarks || ''}`
    });

    if (action === 'PAYMENT_PROCESSED') {
      this.addNotification({
        userId: claim.userId,
        claimId: claim.id,
        title: 'Payment Processed - Claim Closed',
        message: `Your claim ${claim.id} for ₹${claim.processedAmount?.toLocaleString('en-IN')} has been settled. Bank Ref: ${claim.paymentReference}.`,
        type: 'SUCCESS'
      });
    }

    return claim;
  }

  // --- AUDIT TRAIL ---
  public getAuditTrail(claimId?: string): AuditTrailItem[] {
    if (claimId) {
      return this.data.auditTrail.filter(a => a.claimId === claimId);
    }
    return this.data.auditTrail;
  }

  public logAudit(entry: {
    claimId?: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    ipAddress?: string;
  }): AuditTrailItem {
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0];

    const item: AuditTrailItem = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: dateStr,
      time: timeStr,
      ...entry
    };

    this.data.auditTrail.unshift(item);
    this.saveData();
    return item;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): NotificationItem {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(item);
    this.saveData();
    return item;
  }

  public markNotificationAsRead(id: string): void {
    const n = this.data.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.saveData();
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    for (const n of this.data.notifications) {
      if (n.userId === userId) {
        n.read = true;
      }
    }
    this.saveData();
  }
}

export const store = new Store();
