import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseClaim, ExpenseItem, DocumentAttachment, Tour } from '../types';
import { GTS_LOGO_BASE64 } from '../assets/logoBase64';

export const generateClaimPDF = (
  claim: ExpenseClaim,
  items: ExpenseItem[],
  documents: DocumentAttachment[],
  tour?: Tour
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [67, 36, 136]; // GTS Purple #432488
  const grayColor: [number, number, number] = [100, 116, 139];

  // Header Logo
  try {
    if (GTS_LOGO_BASE64) {
      doc.addImage(GTS_LOGO_BASE64, 'JPEG', 14, 12, 28, 14);
    }
  } catch (e) {
    console.warn('Failed to embed logo into PDF:', e);
  }

  // Header Company Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('GTS FACILITY MANAGEMENT SERVICES PVT LTD', 46, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('Official Tour Expense Statement & Claim Settlement Report', 46, 22);
  doc.text('CIN: U74900KA2015PTC081234 | GSTIN: 29AABCG1234F1Z8', 46, 26);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);

  // Claim Meta Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 33, 182, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Column 1
  doc.text(`Tour Claim ID:`, 18, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.id}`, 46, 40);

  doc.setFont('helvetica', 'bold');
  doc.text(`Employee Name:`, 18, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.employeeName}`, 46, 46);

  doc.setFont('helvetica', 'bold');
  doc.text(`Employee ID:`, 18, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.employeeId} (Band: ${claim.band})`, 46, 52);

  doc.setFont('helvetica', 'bold');
  doc.text(`Department:`, 18, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.department}`, 46, 58);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text(`Destination:`, 110, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.destination}`, 136, 40);

  doc.setFont('helvetica', 'bold');
  doc.text(`Tour Period:`, 110, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.tourStartDate} to ${claim.tourEndDate} (${claim.numberOfDays} Days)`, 136, 46);

  doc.setFont('helvetica', 'bold');
  doc.text(`Region / Office:`, 110, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${claim.region}`, 136, 52);

  doc.setFont('helvetica', 'bold');
  doc.text(`Claim Status:`, 110, 58);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`${claim.status.replace(/_/g, ' ')}`, 136, 58);

  // Expense Summary Box
  let currentY = 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXPENSE CATEGORY SUMMARY', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Category', 'Claimed Amount (INR)', 'Policy Eligible (INR)', 'Exception / Excess (INR)', 'Remarks']],
    body: [
      ['Travel (Train/Bus/Cab)', `Rs. ${claim.travelTotal.toLocaleString('en-IN')}`, `Rs. ${claim.travelTotal.toLocaleString('en-IN')}`, 'Rs. 0', 'Ticket bills attached'],
      ['Daily Food Allowance', `Rs. ${claim.foodTotal.toLocaleString('en-IN')}`, `Rs. ${claim.foodTotal.toLocaleString('en-IN')}`, 'Rs. 0', `Band ${claim.band} daily cap applied`],
      ['Local Conveyance', `Rs. ${claim.localTravelTotal.toLocaleString('en-IN')}`, `Rs. ${claim.localTravelTotal.toLocaleString('en-IN')}`, 'Rs. 0', 'Auto/Ola/Cab bills'],
      ['Hotel Stay / Room', `Rs. ${claim.hotelTotal.toLocaleString('en-IN')}`, `Rs. ${(claim.hotelTotal - claim.exceptionAmount).toLocaleString('en-IN')}`, `Rs. ${claim.exceptionAmount.toLocaleString('en-IN')}`, claim.hasExceptions ? 'Above Band limit' : 'Within limit'],
      ['Other Approved Expenses', `Rs. ${claim.otherTotal.toLocaleString('en-IN')}`, `Rs. ${claim.otherTotal.toLocaleString('en-IN')}`, 'Rs. 0', 'Toll/Parking/Comm.'],
      ['GROSS TOTAL CLAIM', `Rs. ${claim.grossClaim.toLocaleString('en-IN')}`, `Rs. ${claim.policyEligible.toLocaleString('en-IN')}`, `Rs. ${claim.exceptionAmount.toLocaleString('en-IN')}`, claim.hasExceptions ? 'EXCEPTION APPROVED' : '100% ELIGIBLE']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Itemized Line Items Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ITEMIZED EXPENSE DETAILS & POLICY LIMIT CHECKS', 14, currentY);

  const itemRows = items.map((item, idx) => {
    let desc = '';
    if (item.category === 'TRAVEL') desc = `${item.travelMode || ''}: ${item.fromLocation || ''} -> ${item.toLocation || ''} (Tkt: ${item.ticketNo || 'N/A'})`;
    else if (item.category === 'FOOD') desc = `${item.mealType || 'Meal'} @ ${item.restaurantVendor || 'Restaurant'} (Bill: ${item.foodBillNo || 'N/A'})`;
    else if (item.category === 'HOTEL') desc = `${item.hotelName || 'Hotel'}, ${item.hotelCity || ''} (${item.nights || 1} nights @ Rs. ${Math.round(item.amount / (item.nights || 1))}/nt)`;
    else if (item.category === 'LOCAL_TRAVEL') desc = `${item.localMode || 'Conveyance'}: ${item.localFrom || ''} -> ${item.localTo || ''}`;
    else desc = `${item.otherCategory || 'Other'}: ${item.otherDescription || item.remarks || ''}`;

    return [
      String(idx + 1),
      item.date,
      item.category,
      desc,
      `Rs. ${item.amount.toLocaleString('en-IN')}`,
      `Rs. ${item.policyLimit.toLocaleString('en-IN')}`,
      item.isException ? `EXCESS: Rs. ${item.excessAmount}` : 'WITHIN LIMIT'
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Date', 'Category', 'Description & Bill Details', 'Claimed', 'Policy Cap', 'Policy Status']],
    body: itemRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.8
    },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if page break needed
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Approvals & Sign-off Timeline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. APPROVAL, AUDIT & PAYMENT SETTLEMENT TIMELINE', 14, currentY);

  const approvalRows = [
    [
      'Regional Approver',
      claim.regionalApproverName || claim.approvingAuthorityName,
      claim.regionalApprovedDate ? new Date(claim.regionalApprovedDate).toLocaleDateString() : 'Pending',
      claim.regionalComments || 'N/A'
    ],
    [
      'President Approval',
      claim.presidentApproverName || 'Bharanidhar Tarimana',
      claim.presidentApprovedDate ? new Date(claim.presidentApprovedDate).toLocaleDateString() : 'Pending',
      claim.presidentComments || 'Final Management Approval'
    ],
    [
      'Internal Audit (13-Point)',
      claim.auditorName || 'Internal Auditor',
      claim.auditDate ? new Date(claim.auditDate).toLocaleDateString() : 'Pending',
      claim.auditStatus ? `Status: ${claim.auditStatus} - ${claim.auditComments || 'Verified'}` : 'Pending Verification'
    ],
    [
      'Accounts Settlement',
      'Finance & Accounts',
      claim.paymentDate || 'Pending',
      claim.paymentReference ? `Ref: ${claim.paymentReference} (Settled Rs. ${claim.processedAmount || claim.grossClaim})` : 'Pending Payment'
    ]
  ];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Stage', 'Authorized Officer', 'Date', 'Action Comments & Settlement Info']],
    body: approvalRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  // Employee Declaration
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, 182, 28, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EMPLOYEE DECLARATION:', 18, currentY + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '"I confirm that the expenses claimed are related to official company travel and the information/documents',
    18,
    currentY + 11
  );
  doc.text('submitted are correct and legitimate according to GTS travel policies."', 18, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Digitally Verified: ${claim.employeeName} (${claim.employeeId})`, 18, currentY + 23);
  doc.text(`Date of Submission: ${claim.submissionDate ? new Date(claim.submissionDate).toLocaleDateString() : 'Draft'}`, 120, currentY + 23);

  // Save PDF
  doc.save(`${claim.id}_Expense_Statement.pdf`);
};
