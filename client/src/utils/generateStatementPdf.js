import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a PDF statement for a customer
 * @param {Object} customer - The customer object { name, phone, totalBalance }
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} user - The logged in user object (optional, for shop name)
 */
export const generateStatementPdf = (customer, transactions, user = { name: 'ShopLedger' }) => {
  // Create a new PDF document (A4 portrait)
  const doc = new jsPDF();
  
  const shopName = user.shopName || user.name || 'ShopLedger';
  
  // Set fonts and colors
  doc.setFont('helvetica');
  
  // --- Header ---
  // Shop Name (Center)
  doc.setFontSize(22);
  doc.setTextColor(34, 57, 111); // text-slate-800 equivalent (#22396f)
  doc.text(shopName, 105, 20, { align: 'center' });
  
  // Statement Title
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('Customer Account Statement', 105, 30, { align: 'center' });

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, 196, 35);
  
  // Customer Info (Left)
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details:', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.name}`, 14, 52);
  doc.text(`Phone: ${customer.phone || 'N/A'}`, 14, 59);

  // Statement Meta Info (Right)
  doc.setFont('helvetica', 'bold');
  doc.text('Statement Info:', 140, 45);
  doc.setFont('helvetica', 'normal');
  const generatedDate = new Date().toLocaleDateString('en-GB');
  doc.text(`Generated: ${generatedDate}`, 140, 52);
  
  // Current Balance
  doc.setFont('helvetica', 'bold');
  doc.text(`Balance: Rs. ${Math.abs(customer.totalBalance).toLocaleString()} ${customer.totalBalance > 0 ? 'Adv' : customer.totalBalance < 0 ? 'Due' : ''}`, 140, 59);

  // --- Transactions Table ---
  // Prepare table data
  const tableData = transactions.map((tx) => {
    const date = new Date(tx.date).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    
    const type = tx.type; // 'SALE' or 'PAYMENT'
    
    let details = '';
    if (type === 'SALE' && tx.items && tx.items.length > 0) {
      details = tx.items.map(i => `${i.quantity}x ${i.name}`).join('\n');
    }
    if (tx.notes) {
      details += details ? `\nNote: ${tx.notes}` : `Note: ${tx.notes}`;
    }
    if (!details && type === 'PAYMENT') {
      details = 'Cash Received';
    }

    const amountStr = `${type === 'SALE' ? '+' : '-'}Rs. ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const balanceStr = tx.balanceAfter != null ? `Rs. ${tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
    
    return [date, type, details, amountStr, balanceStr];
  });

  // Generate Table using autotable
  autoTable(doc, {
    startY: 70,
    head: [['Date', 'Type', 'Details/Items', 'Amount', 'Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 28, 66], // text-slate-900 equivalent (#0d1c42)
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 22 }, // Type
      2: { cellWidth: 'auto' }, // Details
      3: { cellWidth: 28, halign: 'right' }, // Amount
      4: { cellWidth: 28, halign: 'right' } // Balance
    },
    didParseCell: function(data) {
      // Color-code the amount column
      if (data.section === 'body' && data.column.index === 3) {
        const isSale = data.row.raw[1] === 'SALE';
        if (isSale) {
          data.cell.styles.textColor = [220, 38, 38]; // text-red-600
        } else {
          data.cell.styles.textColor = [5, 150, 105]; // text-emerald-600
        }
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // --- Footer ---
  const finalY = doc.lastAutoTable.finalY || 70;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  // Footer text
  if (customer.totalBalance > 0) {
    doc.setTextColor(5, 150, 105); // emerald
    doc.text(`Total Outstanding: Rs. ${customer.totalBalance.toLocaleString()} (Advance)`, 196, finalY + 15, { align: 'right' });
  } else if (customer.totalBalance < 0) {
    doc.setTextColor(220, 38, 38); // red
    doc.text(`Total Outstanding: Rs. ${Math.abs(customer.totalBalance).toLocaleString()} (Due)`, 196, finalY + 15, { align: 'right' });
  } else {
    doc.setTextColor(100, 100, 100);
    doc.text(`Total Outstanding: Rs. 0 (Settled)`, 196, finalY + 15, { align: 'right' });
  }

  // Save the PDF
  const filenameSafeName = customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${filenameSafeName}_statement_${new Date().toISOString().split('T')[0]}.pdf`);
};
