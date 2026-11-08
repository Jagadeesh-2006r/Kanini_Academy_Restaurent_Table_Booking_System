import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates an elegant, professional PDF confirmation for a restaurant table reservation
 */
export const downloadReservationPDF = (reservation) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header background banner (Dark Charcoal)
  doc.setFillColor(24, 25, 28);
  doc.rect(0, 0, 210, 42, 'F');

  // Gold accent bar
  doc.setFillColor(194, 136, 51);
  doc.rect(0, 42, 210, 3, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SAVORIA BISTRO', 15, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(212, 154, 69);
  doc.text('RESTAURANT TABLE RESERVATION CONFIRMATION', 15, 28);

  // Reference number top-right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: ${reservation.referenceNumber}`, 195, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  const issuedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Issued: ${issuedDate}`, 195, 28, { align: 'right' });

  // Main Reservation Details Title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Reservation Summary', 15, 58);

  // Format reservation date
  const resDate = new Date(reservation.reservationDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const branchName = reservation.branch?.branchName || 'Savoria Bistro';
  const branchAddress = reservation.branch?.address || 'Restaurant Branch';
  const tableNumber = reservation.table?.tableNumber || `Table #${reservation.tableId}`;
  const seatingArea = reservation.table?.seatingArea || 'Standard';
  const customerName = reservation.customer?.name || 'Valued Guest';
  const customerPhone = reservation.customer?.phone || 'N/A';
  const customerEmail = reservation.customer?.email || 'N/A';

  // Details Table using AutoTable
  const tableData = [
    ['Reservation Reference', reservation.referenceNumber],
    ['Reservation Status', reservation.status],
    ['Restaurant Branch', branchName],
    ['Branch Address', branchAddress],
    ['Reservation Date', resDate],
    ['Time Slot', `${reservation.startTime} - ${reservation.endTime}`],
    ['Guest Party Size', `${reservation.partySize} Guests`],
    ['Allocated Table', `${tableNumber} (${seatingArea})`],
    ['Customer Name', customerName],
    ['Contact Phone', customerPhone],
    ['Contact Email', customerEmail],
    ['Special Requests', reservation.specialRequest || 'None specified'],
  ];

  doc.autoTable({
    startY: 64,
    head: [['Detail Field', 'Information']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [194, 136, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: [71, 85, 105] },
      1: { cellWidth: 125, textColor: [15, 23, 42] },
    },
    styles: {
      fontSize: 9.5,
      cellPadding: 3.5,
    },
  });

  const finalY = doc.lastAutoTable.finalY + 12;

  // Important Guest Instructions
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(15, finalY, 180, 32, 2, 2, 'F');

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Important Guest Policy & Arrival Notes:', 20, finalY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text('1. Please present this reference code or your registered phone number at the host desk upon arrival.', 20, finalY + 15);
  doc.text('2. Table holds are guaranteed for up to 15 minutes past your reserved start time.', 20, finalY + 21);
  doc.text('3. To modify or cancel your booking, please visit the Savoria web portal at least 1 hour in advance.', 20, finalY + 27);

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing Savoria Bistro. We look forward to serving you an exceptional dining experience.', 105, 280, { align: 'center' });

  // Save the PDF with clean filename
  doc.save(`${reservation.referenceNumber}_Confirmation.pdf`);
};
