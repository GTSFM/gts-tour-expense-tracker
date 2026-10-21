import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { store } from './store.js';
import { User, ClaimStatus } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|pdf)$/i;
    if (!file.originalname.match(allowed)) {
      return cb(new Error('Only PDF, JPG, JPEG, and PNG document formats are allowed.'));
    }
    cb(null, true);
  }
});

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper: Extract current authenticated user
// For demo and test simplicity, client sends `x-user-id` header or switches session
function getReqUser(req: Request): User {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    const user = store.getUserById(userId);
    if (user) return user;
  }
  // Default to Demo Employee GTS001
  return store.getUserById('u-emp-1') || store.getUsers()[0];
}

// ==========================================
// 1. AUTH & PROFILE ROUTES
// ==========================================

// Login route (supports Employee ID, Name, Username, or Email + Password)
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Username, Employee ID or Email is required.' });
    }

    const user = store.findUserByIdentifier(identifier);

    if (!user) {
      return res.status(401).json({ error: 'User account not found. Please check your Employee ID or Username.' });
    }

    // Verify password if user has password configured
    if (user.password) {
      if (!password) {
        return res.status(400).json({ error: 'Password is required to sign in.' });
      }
      if (user.password !== password) {
        return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
      }
    }

    user.lastLogin = new Date().toISOString();
    store.saveData();

    res.json({
      success: true,
      user,
      token: `gts-token-${user.id}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password Route (Provision for individuals to change password)
app.post('/api/auth/change-password', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    const result = store.changePassword(user.id, currentPassword, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Switch active demo persona (1-click role switcher for backward compatibility)
app.post('/api/auth/switch-demo', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = store.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Demo user not found.' });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current User Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getReqUser(req);
  res.json({ user });
});

// Employee Self-Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const {
      name,
      employeeId,
      designation,
      band,
      department,
      region,
      location,
      mobile,
      email,
      reportingManager,
      approvingAuthorityId,
      password,
      status
    } = req.body;

    if (!name || !employeeId || !designation || !band || !department || !region || !email) {
      return res.status(400).json({ error: 'All mandatory profile fields must be provided.' });
    }

    // Check duplicate
    const existing = store.getUserByEmployeeId(employeeId);
    if (existing) {
      return res.status(400).json({ error: `Employee ID "${employeeId}" already exists.` });
    }

    const approver = store.getUserById(approvingAuthorityId);

    const newUser = store.createUser({
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      designation,
      band: band || 'B1',
      department,
      region,
      location: location || `${region} Office`,
      mobile: mobile || '',
      email: email.trim().toLowerCase(),
      role: 'EMPLOYEE',
      reportingManager: reportingManager || (approver ? approver.name : 'Regional Head'),
      approvingAuthorityId: approver ? approver.id : 'u-samuel',
      approvingAuthorityName: approver ? approver.name : 'Samuel',
      status: status || 'ACTIVE',
      password: password && password.trim() ? password.trim() : 'GTS@123',
      userAliases: [name.trim(), employeeId.trim().toUpperCase(), email.trim().toLowerCase()]
    });

    res.json({
      success: true,
      message: `Employee "${newUser.name}" registered successfully. You can now log in using your name or ID and created password.`,
      user: newUser
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 2. USER MASTER & VALIDATION
// ==========================================

app.get('/api/users', (_req: Request, res: Response) => {
  res.json({ users: store.getUsers() });
});

// Admin Create User directly
app.post('/api/users', (req: Request, res: Response) => {
  try {
    const {
      name,
      employeeId,
      designation,
      band,
      department,
      region,
      location,
      mobile,
      email,
      role,
      reportingManager,
      approvingAuthorityId,
      password,
      status
    } = req.body;

    if (!name || !employeeId || !designation || !department) {
      return res.status(400).json({ error: 'Name, Employee ID, Designation and Department are mandatory.' });
    }

    const existing = store.getUserByEmployeeId(employeeId);
    if (existing) {
      return res.status(400).json({ error: `Employee ID "${employeeId}" already exists.` });
    }

    const approver = approvingAuthorityId ? store.getUserById(approvingAuthorityId) : null;

    const newUser = store.createUser({
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      designation,
      band: role === 'DIRECTOR' ? '' : (band || 'B1'),
      department,
      region: region || 'Corporate HQ',
      location: location || `${region || 'Corporate'} Office`,
      mobile: mobile || '',
      email: email ? email.trim().toLowerCase() : `${employeeId.toLowerCase()}@gts.com`,
      role: role || 'EMPLOYEE',
      reportingManager: reportingManager || (approver ? approver.name : 'President'),
      approvingAuthorityId: approver ? approver.id : 'u-president',
      approvingAuthorityName: approver ? approver.name : 'Bharanidhar Tarimana',
      status: status || 'ACTIVE',
      password: password && password.trim() ? password.trim() : 'GTS@123',
      userAliases: [name.trim(), employeeId.trim().toUpperCase(), email ? email.trim().toLowerCase() : ''].filter(Boolean)
    });

    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/:id/validate', (req: Request, res: Response) => {
  try {
    const approver = getReqUser(req);
    const updated = store.validateEmployee(req.params.id, approver);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  try {
    const currentUser = getReqUser(req);
    const updated = store.updateUser(req.params.id, req.body, currentUser);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. POLICY MASTER & TERRITORIES
// ==========================================

app.get('/api/policies', (_req: Request, res: Response) => {
  res.json({ policies: store.getPolicies() });
});

app.put('/api/policies/:band', (req: Request, res: Response) => {
  try {
    const band = req.params.band as 'B1' | 'B2' | 'B3';
    const updated = store.updatePolicy(band, req.body);
    res.json({ success: true, policy: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/territories', (_req: Request, res: Response) => {
  res.json({ territories: store.getTerritories() });
});

app.put('/api/territories/:region', (req: Request, res: Response) => {
  try {
    const { activeApproverId } = req.body;
    const updated = store.updateTerritoryApprover(req.params.region, activeApproverId);
    res.json({ success: true, territory: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({ settings: store.getSettings() });
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = store.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. TOURS
// ==========================================

app.get('/api/tours', (req: Request, res: Response) => {
  const user = getReqUser(req);
  if (user.role === 'EMPLOYEE') {
    return res.json({ tours: store.getToursByUser(user.id) });
  }
  res.json({ tours: store.getTours() });
});

app.get('/api/tours/:id', (req: Request, res: Response) => {
  const tour = store.getTourById(req.params.id);
  if (!tour) return res.status(404).json({ error: 'Tour not found.' });
  res.json({ tour });
});

app.post('/api/tours', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    const {
      purpose,
      clientOrSite,
      startLocation,
      destination,
      startDate,
      endDate,
      travelMode,
      priorApprovalRequired,
      priorApprovalRef,
      remarks
    } = req.body;

    if (!purpose || !destination || !startDate || !endDate) {
      return res.status(400).json({ error: 'Purpose, destination, and dates are mandatory.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const numberOfDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newTour = store.createTour(
      {
        employeeId: user.employeeId,
        userId: user.id,
        employeeName: user.name,
        designation: user.designation,
        band: user.band,
        department: user.department,
        region: user.region,
        approvingAuthorityName: user.approvingAuthorityName,
        purpose,
        clientOrSite: clientOrSite || destination,
        startLocation: startLocation || user.location,
        destination,
        startDate,
        endDate,
        numberOfDays,
        travelMode: travelMode || 'Train',
        priorApprovalRequired: Boolean(priorApprovalRequired),
        priorApprovalRef,
        remarks
      },
      user
    );

    res.json({ success: true, tour: newTour });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 5. CLAIMS & EXPENSE ITEMS
// ==========================================

// Get claims based on user role & strict territory
app.get('/api/claims', (req: Request, res: Response) => {
  const user = getReqUser(req);
  const claims = store.getClaimsForApprover(user);
  res.json({ claims });
});

// Get claim details with items, docs, and audit logs
app.get('/api/claims/:id', (req: Request, res: Response) => {
  const claim = store.getClaimById(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const user = getReqUser(req);
  // Security verification: Normal employee can only see their own claim
  if (user.role === 'EMPLOYEE' && claim.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized: You can only view your own expense claims.' });
  }

  // Regional approver territory check
  if (user.role === 'REGIONAL_APPROVER') {
    const assigned = user.assignedTerritories || [];
    const inTerritory = assigned.some(t => t.toLowerCase() === claim.region.toLowerCase());
    if (!inTerritory && claim.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized: Territory access restricted.' });
    }
  }

  const items = store.getExpenseItems(claim.id);
  const documents = store.getDocuments(claim.id);
  const auditLogs = store.getAuditTrail(claim.id);
  const tour = store.getTourById(claim.tourId);

  res.json({
    claim,
    items,
    documents,
    auditLogs,
    tour
  });
});

// Create draft claim for a tour
app.post('/api/claims/draft', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    const { tourId } = req.body;
    if (!tourId) return res.status(400).json({ error: 'Tour ID is required.' });

    const claim = store.createDraftClaim(tourId, user);
    res.json({ success: true, claim });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete claim
app.delete('/api/claims/:id', (_req: Request, res: Response) => {
  store.deleteClaim(_req.params.id);
  res.json({ success: true });
});

// Add expense item
app.post('/api/claims/:id/items', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    const claim = store.getClaimById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });

    if (user.role === 'EMPLOYEE' && claim.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot add expenses to another user’s claim.' });
    }

    const item = store.addExpenseItem(
      {
        claimId: claim.id,
        tourId: claim.tourId,
        ...req.body
      },
      user
    );

    const updatedClaim = store.getClaimById(claim.id);
    res.json({ success: true, item, claim: updatedClaim });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Edit expense item
app.put('/api/claims/:id/items/:itemId', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    const updated = store.updateExpenseItem(req.params.itemId, req.body, user);
    const updatedClaim = store.getClaimById(req.params.id);
    res.json({ success: true, item: updated, claim: updatedClaim });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete expense item
app.delete('/api/claims/:id/items/:itemId', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    store.deleteExpenseItem(req.params.itemId, user);
    const updatedClaim = store.getClaimById(req.params.id);
    res.json({ success: true, claim: updatedClaim });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Submit Claim
app.post('/api/claims/:id/submit', (req: Request, res: Response) => {
  try {
    const user = getReqUser(req);
    const { declarationConfirmed } = req.body;
    const submitted = store.submitClaim(req.params.id, Boolean(declarationConfirmed), user);
    res.json({ success: true, claim: submitted });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Regional Approver Action (APPROVE, REJECT, SEND_BACK)
app.post('/api/claims/:id/regional-action', (req: Request, res: Response) => {
  try {
    const approver = getReqUser(req);
    const { action, comments } = req.body;
    const updated = store.regionalAction(req.params.id, action, comments, approver);
    res.json({ success: true, claim: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Final Management Action (APPROVE, REJECT, SEND_BACK) - Available to President and both Directors
app.post('/api/claims/:id/management-action', (req: Request, res: Response) => {
  try {
    const approver = getReqUser(req);
    const { action, comments } = req.body;
    const updated = store.presidentAction(req.params.id, action, comments, approver);
    res.json({ success: true, claim: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Legacy route alias for backward compatibility
app.post('/api/claims/:id/president-action', (req: Request, res: Response) => {
  try {
    const approver = getReqUser(req);
    const { action, comments } = req.body;
    const updated = store.presidentAction(req.params.id, action, comments, approver);
    res.json({ success: true, claim: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Auditor Action (13-Point Checklist: PASS, FAIL, QUERY)
app.post('/api/claims/:id/audit-action', (req: Request, res: Response) => {
  try {
    const auditor = getReqUser(req);
    const { action, checklist, auditorComments } = req.body;
    const updated = store.auditAction(req.params.id, action, checklist || {}, auditorComments, auditor);
    res.json({ success: true, claim: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Accounts Action (MARK_FOR_PAYMENT, PAYMENT_PROCESSED, HOLD)
app.post('/api/claims/:id/accounts-action', (req: Request, res: Response) => {
  try {
    const accountsUser = getReqUser(req);
    const { action, paymentReference, paymentDate, processedAmount, remarks } = req.body;
    const updated = store.accountsAction(
      req.params.id,
      action,
      { paymentReference, paymentDate, processedAmount, remarks },
      accountsUser
    );
    res.json({ success: true, claim: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. DOCUMENT UPLOADS
// ==========================================

app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const user = getReqUser(req);
    const { claimId, expenseItemId, documentType, dataUrl } = req.body;

    const fileUrl = `/uploads/${req.file.filename}`;

    let docRecord;
    if (claimId) {
      docRecord = store.addDocument(
        {
          claimId,
          expenseItemId,
          documentType: documentType || 'Supporting Bill',
          documentName: req.file.originalname,
          fileUrl,
          dataUrl: dataUrl || undefined,
          fileSize: req.file.size,
          uploadedBy: user.name
        },
        user
      );
    }

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      document: docRecord
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6.5 DATA PERSISTENCE & AUTO-SYNC
// ==========================================

app.get('/api/sync/backup', (_req: Request, res: Response) => {
  res.json({ success: true, db: store.getFullData() });
});

app.post('/api/sync/restore', (req: Request, res: Response) => {
  try {
    const { claims, tours, expenseItems, documents, auditTrail } = req.body;
    store.restoreData({ claims, tours, expenseItems, documents, auditTrail });
    res.json({
      success: true,
      claimsCount: store.getClaims().length,
      toursCount: store.getTours().length
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. AUDIT TRAIL & NOTIFICATIONS
// ==========================================

app.get('/api/audit-trail', (req: Request, res: Response) => {
  const claimId = req.query.claimId as string | undefined;
  res.json({ auditTrail: store.getAuditTrail(claimId) });
});

app.get('/api/notifications', (req: Request, res: Response) => {
  const user = getReqUser(req);
  res.json({ notifications: store.getNotifications(user.id) });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  store.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  const user = getReqUser(req);
  store.markAllNotificationsAsRead(user.id);
  res.json({ success: true });
});

// ==========================================
// 8. DASHBOARD STATS & ANALYTICS
// ==========================================

app.get('/api/reports/dashboard-stats', (req: Request, res: Response) => {
  const user = getReqUser(req);
  const allClaims = store.getClaims();
  const visibleClaims = store.getClaimsForApprover(user);

  let totalGross = 0;
  let totalEligible = 0;
  let totalExceptions = 0;
  let totalPaid = 0;
  let pendingPayment = 0;

  let pendingRegional = 0;
  let pendingPresident = 0;
  let pendingAudit = 0;
  let pendingAccounts = 0;
  let closedCount = 0;
  let rejectedCount = 0;
  let exceptionCount = 0;

  const now = new Date().getTime();
  let ageing1Day = 0;
  let ageing3Days = 0;
  let ageing5Days = 0;
  let ageing7PlusDays = 0;

  for (const c of allClaims) {
    totalGross += c.grossClaim || 0;
    totalEligible += c.policyEligible || 0;
    totalExceptions += c.exceptionAmount || 0;

    if (c.status === 'CLOSED' || c.status === 'PAYMENT_PROCESSED') {
      totalPaid += c.processedAmount || c.grossClaim || 0;
      closedCount++;
    } else if (c.status === 'PENDING_ACCOUNTS' || c.status === 'PAYMENT_PROCESSING') {
      pendingPayment += c.grossClaim || 0;
      pendingAccounts++;
    } else if (c.status === 'PENDING_REGIONAL_APPROVAL') {
      pendingRegional++;
    } else if (c.status === 'PENDING_PRESIDENT_APPROVAL') {
      pendingPresident++;
    } else if (c.status === 'PENDING_AUDIT' || c.status === 'AUDIT_QUERY') {
      pendingAudit++;
    } else if (c.status === 'REJECTED' || c.status === 'AUDIT_FAILED') {
      rejectedCount++;
    }

    if (c.hasExceptions || (c.exceptionAmount && c.exceptionAmount > 0)) {
      exceptionCount++;
    }

    // Ageing calculations for pending claims
    if (c.submissionDate && !['CLOSED', 'PAYMENT_PROCESSED', 'REJECTED', 'CANCELLED'].includes(c.status)) {
      const subTime = new Date(c.submissionDate).getTime();
      const days = Math.floor((now - subTime) / (1000 * 60 * 60 * 24));
      if (days >= 7) ageing7PlusDays++;
      else if (days >= 5) ageing5Days++;
      else if (days >= 3) ageing3Days++;
      else if (days >= 1) ageing1Day++;
    }
  }

  res.json({
    metrics: {
      totalEmployees: store.getUsers().length,
      activeEmployees: store.getUsers().filter(u => u.status === 'ACTIVE').length,
      totalClaims: allClaims.length,
      visibleClaimsCount: visibleClaims.length,
      pendingRegional,
      pendingPresident,
      pendingAudit,
      pendingAccounts,
      closedCount,
      rejectedCount,
      exceptionCount,
      financials: {
        totalGross,
        totalEligible,
        totalExceptions,
        totalPaid,
        pendingPayment
      },
      ageing: {
        day1: ageing1Day,
        day3: ageing3Days,
        day5: ageing5Days,
        day7Plus: ageing7PlusDays
      }
    }
  });
});

const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
}

const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`GTS Tour Expense Tracker API running on http://${HOST}:${PORT}`);
});

