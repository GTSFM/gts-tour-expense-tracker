import * as XLSX from 'xlsx';
import { ExpenseClaim } from '../types';

export const exportClaimsToExcel = (claims: ExpenseClaim[], filename = 'GTS_Tour_Expense_Claims.xlsx') => {
  const data = claims.map((c) => ({
    'Claim ID': c.id,
    'Employee ID': c.employeeId,
    'Employee Name': c.employeeName,
    'Designation': c.designation,
    'Band': c.band,
    'Department': c.department,
    'Region': c.region,
    'Approving Authority': c.approvingAuthorityName,
    'Tour Start': c.tourStartDate,
    'Tour End': c.tourEndDate,
    'Destination': c.destination,
    'Travel': c.travelTotal,
    'Food': c.foodTotal,
    'Local Travel': c.localTravelTotal,
    'Hotel': c.hotelTotal,
    'Other': c.otherTotal,
    'Total Claim': c.grossClaim,
    'Policy Eligible': c.policyEligible,
    'Exception': c.exceptionAmount,
    'Regional Approval': c.regionalApprovedDate ? `${new Date(c.regionalApprovedDate).toLocaleDateString()} (${c.regionalApproverName})` : 'Pending',
    'Final Management Approval': (c.managementApprovedDate || c.presidentApprovedDate) ? `${new Date((c.managementApprovedDate || c.presidentApprovedDate)!).toLocaleDateString()} (${c.managementApproverName || c.presidentApproverName})` : 'Pending',
    'Audit Status': c.auditStatus || 'Pending',
    'Accounts Status': c.paymentStatus || 'Pending',
    'Payment Date': c.paymentDate || 'Pending',
    'Payment Reference': c.paymentReference || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 22 }, // Claim ID
    { wch: 14 }, // Emp ID
    { wch: 24 }, // Name
    { wch: 22 }, // Designation
    { wch: 8 },  // Band
    { wch: 20 }, // Dept
    { wch: 16 }, // Region
    { wch: 22 }, // Approver
    { wch: 12 }, // Tour Start
    { wch: 12 }, // Tour End
    { wch: 18 }, // Destination
    { wch: 12 }, // Travel
    { wch: 12 }, // Food
    { wch: 14 }, // Local
    { wch: 12 }, // Hotel
    { wch: 12 }, // Other
    { wch: 14 }, // Total Claim
    { wch: 14 }, // Eligible
    { wch: 12 }, // Exception
    { wch: 25 }, // Reg Approval
    { wch: 25 }, // Pres Approval
    { wch: 14 }, // Audit Status
    { wch: 16 }, // Accounts Status
    { wch: 14 }, // Payment Date
    { wch: 28 }  // Payment Ref
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tour Claims');
  XLSX.writeFile(workbook, filename);
};
