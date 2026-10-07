# GTS Tour Expense Management & Claim Tracker
**Company:** GTS Facility Management Services Pvt Ltd

A production-ready, mobile-first, and responsive enterprise web application built for **GTS Facility Management Services Pvt Ltd** to manage Tour Expense Budgets, Claims, Approvals, Compliance Audit, and Accounts Payment Settlement.

---

## Key Features & Highlights

1. **Mobile-First "3-Click" Interface**:
   - Designed specifically for field executives and site operations staff with large touch targets and minimal typing.
   - 5-step intuitive flow: **Select Tour → Select Category → Enter Amount → Upload Bill / Photo → Save**.
   - Direct camera photo capture and file picker with client-side image compression while preserving bill legibility.

2. **Band-Wise Policy Validation Engine**:
   - **Band B1** (Operations Executives / AM / OM):
     - Train: Up to 3rd AC
     - Local Travel: Ola, Uber, Rapido, Auto, Cab, Metro, Bus
     - Food: Breakfast ₹100, Lunch ₹200, Tea ₹50, Dinner ₹200 (Daily Max: ₹550)
     - Hotel: Maximum ₹1,500/night
   - **Band B2** (AGM):
     - Food: ₹600/day
     - Hotel: Maximum ₹1,800/night
   - **Band B3** (GM, RH, AVP, VP, President):
     - Food: ₹700/day
     - Hotel: Maximum ₹2,500/night
     - Flights: Flagged with "Prior approval required" warning banner.
   - **Real-Time Limit Feedback**:
     - Automatically compares entries against Band limits.
     - Displays `STATUS: WITHIN LIMIT` or `STATUS: EXCEPTION – ABOVE POLICY LIMIT` with Policy Limit, Claimed, and Excess amount breakdown.
     - Approvers can Approve, Reject, Send Back, or Approve with Exception (mandatory reason).

3. **Strict Territorial Isolation & Role-Based Access Control**:
   - **Samuel**: Karnataka & East only.
   - **Yoga / Yoganandam & Sundar**: Tamil Nadu, Hosur, Pondicherry, ROTN. (Master Admin can toggle active approver between Yoga and Sundar).
   - **Krishnan Govindan**: Andhra Pradesh & Telangana only.
   - **Rule 1**: An approver cannot approve his/her own claim.
   - **Rule 2**: Regional approvers cannot access or view claims outside their assigned territory.
   - **Rule 3 (Profit Centre Heads)**: Claims by Profit Centre Heads (Samuel, Yoganandam, Tejinder, Krishnan Govindan) bypass regional approval and route directly to **Mr. Bharanidhar Tarimana (President)**.

4. **13-Point Compliance Audit Module**:
   - Claims approved by the President move to the dedicated Internal Audit queue.
   - 13-point interactive checklist with Pass, Fail, or NA:
     1. Employee verified
     2. Employee ID verified
     3. Tour dates verified
     4. Travel documents verified
     5. Food bills verified
     6. Local travel documents verified
     7. Hotel invoice verified
     8. Other expenses verified
     9. Policy limits verified
     10. Exception approvals verified
     11. Duplicate bills checked
     12. Documents readable
     13. Total calculation verified
   - Comments are strictly mandatory for any failed item.
   - Pass moves claim to Accounts; Fail/Query returns claim with justification.

5. **Accounts Payment Settlement**:
   - Claims with `AUDIT_PASSED` status appear in the Accounts queue.
   - Records Bank/Payroll Reference (UTR), Payment Date, Processed Amount, and Remarks.
   - Updates claim status to `PAYMENT PROCESSED` and final `CLOSED`.

6. **Reporting & Document Generation**:
   - **PDF Claim Statement**: Crisp, official PDF statement with GTS logo, employee meta, itemized breakdown, policy cap comparisons, approval timeline, and digital employee declaration.
   - **Excel Export (.xlsx)**: 1-click export containing all 24 required business columns.
   - **12 Standard Reports**: Employee-wise, Region-wise, Monthly, Department-wise, Band-wise, Approver-wise, Pending, Audit, Accounts, Payment, Exception, and Travel Mode reports.

7. **12 Pre-Seeded Personas & 1-Click Demo Switcher**:
   - Switch between all 12 users instantly using the top demo ribbon:
     1. Demo Operations Executive (`GTS001`, B1 - Telangana)
     2. Krishnan Govindan (Regional Approver: AP & Telangana)
     3. Samuel (Regional Approver: Karnataka & East)
     4. Yoga / Yoganandam (Regional Approver: Tamil Nadu / ROTN)
     5. Sundar (Regional Approver: Tamil Nadu / ROTN)
     6. Tejinder (Profit Centre Head)
     7. Bharanidhar Tarimana (President)
     8. Mariappan (Director)
     9. Prabakar (Director)
     10. Demo Auditor (Auditor)
     11. Demo Accounts User (Accounts)
     12. Master Administrator (Super Admin)

---

## Running the Application

### 1. Dev Mode (Vite Frontend with Hot-Reloading + Express API):
```bash
# In C:\Users\tarim\.gemini\antigravity\scratch\gts-tour-expense-tracker
npm run dev
```
- **Frontend URL**: `http://localhost:3000/` (or on your local network: `http://192.168.29.179:3000/`)
- **Backend API URL**: `http://localhost:5050/api`

### 2. Standalone Production Mode:
```bash
npm start
```
- Serves the compiled client and REST API together on `http://localhost:5050/`.

### 3. Run Automated Workflow Test Suite:
```bash
npx tsx test_workflow.ts
```
Executes 25 comprehensive automated test cases validating business rules, calculations, territory isolation, audit checklist, and payment transitions.
