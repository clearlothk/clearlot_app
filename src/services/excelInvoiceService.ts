import ExcelJS from 'exceljs';
import { Purchase, Offer, AuthUser } from '../types';

export interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  settings: {
    header: {
      title: string;
      subtitle: string;
      logoUrl?: string;
      showLogo: boolean;
    };
    company: {
      name: string;
      address: string;
      phone: string;
      email: string;
      showCompanyInfo: boolean;
    };
    styling: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      fontSize: number;
    };
    sections: {
      showBuyerInfo: boolean;
      showSellerInfo: boolean;
      showProductTable: boolean;
      showPaymentInfo: boolean;
      showDeliveryInfo: boolean;
      showFooter: boolean;
      footerText: string;
    };
  };
}

export interface InvoiceData {
  purchase: Purchase;
  offer?: Offer | null;
  buyer?: AuthUser | null;
  seller?: AuthUser | null;
  template?: InvoiceTemplate | null;
}

export class ExcelInvoiceService {
  private static formatCurrency(amount: number): string {
    return `HK$ ${amount.toFixed(2)}`;
  }

  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  static async generateInvoiceExcel(invoiceData: InvoiceData): Promise<ExcelJS.Workbook> {
    const { purchase, offer, buyer, seller, template } = invoiceData;
    
    // Debug: Log all data
    console.log('ExcelInvoiceService: All data received:', {
      hasTemplate: !!template,
      templateId: template?.id,
      templateName: template?.name,
      templateSettings: template?.settings,
      hasBuyer: !!buyer,
      buyerData: buyer ? {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        companyName: buyer.company
      } : null,
      hasSeller: !!seller,
      sellerData: seller ? {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        companyName: seller.company
      } : null,
      hasOffer: !!offer,
      offerData: offer ? {
        id: offer.id,
        title: offer.title
      } : null,
      purchaseData: {
        id: purchase.id,
        buyerId: purchase.buyerId,
        sellerId: purchase.sellerId,
        offerId: purchase.offerId
      }
    });
    
    // Use template settings if provided, otherwise use defaults
    const settings = template?.settings || {
      header: {
        title: '發票 / INVOICE',
        subtitle: 'Clearlot Platform',
        showLogo: true
      },
      company: {
        name: 'Clearlot Platform',
        address: 'Hong Kong',
        phone: '+852-XXXX-XXXX',
        email: 'info@clearlot.com',
        showCompanyInfo: true
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial',
        fontSize: 12
      },
      sections: {
        showBuyerInfo: true,
        showSellerInfo: true,
        showProductTable: true,
        showPaymentInfo: true,
        showDeliveryInfo: true,
        showFooter: true,
        footerText: ''
      }
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    // Set page setup for better PDF conversion
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      }
    };

    // Helper function to convert hex color to Excel color
    const hexToExcelColor = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        return {
          argb: `FF${result[1]}${result[2]}${result[3]}`
        };
      }
      return { argb: 'FF2563EB' }; // Default blue
    };

    const primaryColor = hexToExcelColor(settings.styling.primaryColor);
    const secondaryColor = hexToExcelColor(settings.styling.secondaryColor);

    let currentRow = 1;

    // Logo functionality removed - no logo will be displayed

    // Title
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = settings.header.title;
    titleRow.getCell(1).font = {
      name: settings.styling.fontFamily,
      size: settings.styling.fontSize + 4,
      bold: true,
      color: primaryColor
    };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.height = 25;
    currentRow++;

    // Subtitle
    const subtitleRow = worksheet.getRow(currentRow);
    subtitleRow.getCell(1).value = settings.header.subtitle;
    subtitleRow.getCell(1).font = {
      name: settings.styling.fontFamily,
      size: settings.styling.fontSize,
      color: secondaryColor
    };
    subtitleRow.getCell(1).alignment = { horizontal: 'center' };
    subtitleRow.height = 20;
    currentRow += 2;

    // Company Information
    if (settings.company.showCompanyInfo) {
      const companyRow = worksheet.getRow(currentRow);
      companyRow.getCell(1).value = settings.company.name;
      companyRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true
      };
      currentRow++;

      const addressRow = worksheet.getRow(currentRow);
      addressRow.getCell(1).value = settings.company.address;
      addressRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize
      };
      currentRow++;

      const phoneRow = worksheet.getRow(currentRow);
      phoneRow.getCell(1).value = `Phone: ${settings.company.phone}`;
      phoneRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize
      };
      currentRow++;

      const emailRow = worksheet.getRow(currentRow);
      emailRow.getCell(1).value = `Email: ${settings.company.email}`;
      emailRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize
      };
      currentRow += 2;
    }

    // Invoice Details
    const invoiceNoRow = worksheet.getRow(currentRow);
    invoiceNoRow.getCell(1).value = `發票編號 / Invoice No: ${purchase.id}`;
    invoiceNoRow.getCell(1).font = {
      name: settings.styling.fontFamily,
      size: settings.styling.fontSize - 2
    };
    currentRow++;

    const dateRow = worksheet.getRow(currentRow);
    dateRow.getCell(1).value = `日期 / Date: ${this.formatDate(purchase.purchaseDate)}`;
    dateRow.getCell(1).font = {
      name: settings.styling.fontFamily,
      size: settings.styling.fontSize - 2
    };
    currentRow++;

    const transactionRow = worksheet.getRow(currentRow);
    transactionRow.getCell(1).value = `交易編號 / Transaction ID: ${purchase.paymentDetails?.transactionId || 'N/A'}`;
    transactionRow.getCell(1).font = {
      name: settings.styling.fontFamily,
      size: settings.styling.fontSize - 2
    };
    currentRow += 2;

    // Buyer Information
    if (settings.sections.showBuyerInfo) {
      const buyerTitleRow = worksheet.getRow(currentRow);
      buyerTitleRow.getCell(1).value = '買方資料 / Buyer Information';
      buyerTitleRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true,
        color: primaryColor
      };
      buyerTitleRow.height = 20;
      currentRow++;

      if (buyer) {
        const buyerCompanyRow = worksheet.getRow(currentRow);
        buyerCompanyRow.getCell(1).value = `公司名稱 / Company: ${buyer.company || 'N/A'}`;
        buyerCompanyRow.getCell(1).font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        currentRow++;
      } else {
        const buyerNARow = worksheet.getRow(currentRow);
        buyerNARow.getCell(1).value = '買方資料不詳 / Buyer information not available';
        buyerNARow.getCell(1).font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        currentRow++;
      }
      currentRow++;
    }

    // Seller Information
    if (settings.sections.showSellerInfo) {
      const sellerTitleRow = worksheet.getRow(currentRow);
      sellerTitleRow.getCell(1).value = '賣方資料 / Seller Information';
      sellerTitleRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true,
        color: primaryColor
      };
      sellerTitleRow.height = 20;
      currentRow++;

      if (seller) {
        const sellerCompanyRow = worksheet.getRow(currentRow);
        sellerCompanyRow.getCell(1).value = `公司名稱 / Company: ${seller.company || 'N/A'}`;
        sellerCompanyRow.getCell(1).font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        currentRow++;
      } else {
        const sellerNARow = worksheet.getRow(currentRow);
        sellerNARow.getCell(1).value = '賣方資料不詳 / Seller information not available';
        sellerNARow.getCell(1).font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        currentRow++;
      }
      currentRow++;
    }

    // Product Details Table
    if (settings.sections.showProductTable) {
      const productTitleRow = worksheet.getRow(currentRow);
      productTitleRow.getCell(1).value = '產品詳情 / Product Details';
      productTitleRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true,
        color: primaryColor
      };
      productTitleRow.height = 20;
      currentRow++;

      // Table Header
      const tableHeaderRow = worksheet.getRow(currentRow);
      tableHeaderRow.getCell(1).value = '產品名稱 / Product';
      tableHeaderRow.getCell(2).value = '數量 / Qty';
      tableHeaderRow.getCell(3).value = '單價 / Unit Price';
      tableHeaderRow.getCell(4).value = '總額 / Total';
      
      // Style header cells
      for (let i = 1; i <= 4; i++) {
        const cell = tableHeaderRow.getCell(i);
        cell.font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: primaryColor
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
      }
      tableHeaderRow.height = 25;
      currentRow++;

      // Table Data
      const productName = offer?.title || '產品名稱不詳 / Product name not available';
      const quantity = purchase.quantity;
      const unitPrice = purchase.unitPrice;
      const subtotal = purchase.totalAmount;

      const tableDataRow = worksheet.getRow(currentRow);
      tableDataRow.getCell(1).value = productName;
      tableDataRow.getCell(2).value = quantity;
      tableDataRow.getCell(3).value = this.formatCurrency(unitPrice);
      tableDataRow.getCell(4).value = this.formatCurrency(subtotal);
      
      // Style data cells
      for (let i = 1; i <= 4; i++) {
        const cell = tableDataRow.getCell(i);
        cell.font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        if (i === 1) {
          cell.alignment = { horizontal: 'left' };
        } else {
          cell.alignment = { horizontal: 'center' };
        }
      }
      tableDataRow.height = 25;
      currentRow += 2;

      // Summary
      const subtotalRow = worksheet.getRow(currentRow);
      subtotalRow.getCell(3).value = `小計 / Subtotal: ${this.formatCurrency(purchase.totalAmount)}`;
      subtotalRow.getCell(3).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      subtotalRow.getCell(3).alignment = { horizontal: 'right' };
      currentRow++;

      const platformFeeRow = worksheet.getRow(currentRow);
      platformFeeRow.getCell(3).value = `平台費用 / Platform Fee: ${this.formatCurrency(purchase.platformFee)}`;
      platformFeeRow.getCell(3).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      platformFeeRow.getCell(3).alignment = { horizontal: 'right' };
      currentRow++;

      const totalRow = worksheet.getRow(currentRow);
      totalRow.getCell(3).value = `總計 / Total: ${this.formatCurrency(purchase.finalAmount)}`;
      totalRow.getCell(3).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true,
        color: primaryColor
      };
      totalRow.getCell(3).alignment = { horizontal: 'right' };
      currentRow += 2;
    }

    // Payment Information
    if (settings.sections.showPaymentInfo) {
      const paymentTitleRow = worksheet.getRow(currentRow);
      paymentTitleRow.getCell(1).value = '付款資訊 / Payment Information';
      paymentTitleRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true,
        color: primaryColor
      };
      paymentTitleRow.height = 20;
      currentRow++;

      const paymentMethodRow = worksheet.getRow(currentRow);
      paymentMethodRow.getCell(1).value = '付款方式 / Payment Method: 銀行轉帳 / Bank Transfer';
      paymentMethodRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow++;

      const paymentStatusRow = worksheet.getRow(currentRow);
      paymentStatusRow.getCell(1).value = `付款狀態 / Payment Status: ${purchase.paymentDetails?.status || 'N/A'}`;
      paymentStatusRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow++;

      if (purchase.paymentDetails?.timestamp) {
        const paymentTimeRow = worksheet.getRow(currentRow);
        paymentTimeRow.getCell(1).value = `付款時間 / Payment Time: ${this.formatDate(purchase.paymentDetails.timestamp)}`;
        paymentTimeRow.getCell(1).font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        currentRow++;
      }
      currentRow++;
    }

    // Delivery Information
    if (settings.sections.showDeliveryInfo && purchase.deliveryDetails) {
      const deliveryTitleRow = worksheet.getRow(currentRow);
      deliveryTitleRow.getCell(1).value = '送貨地址 / Delivery Address';
      deliveryTitleRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize,
        bold: true,
        color: primaryColor
      };
      deliveryTitleRow.height = 20;
      currentRow++;

      const districtRow = worksheet.getRow(currentRow);
      districtRow.getCell(1).value = `地區 / District: ${purchase.deliveryDetails.district}`;
      districtRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow++;

      const subdivisionRow = worksheet.getRow(currentRow);
      subdivisionRow.getCell(1).value = `分區 / Subdivision: ${purchase.deliveryDetails.subdivision}`;
      subdivisionRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow++;

      const addressRow = worksheet.getRow(currentRow);
      addressRow.getCell(1).value = `地址 / Address: ${purchase.deliveryDetails.address1}`;
      addressRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow++;

      if (purchase.deliveryDetails.address2) {
        const address2Row = worksheet.getRow(currentRow);
        address2Row.getCell(1).value = purchase.deliveryDetails.address2;
        address2Row.getCell(1).font = {
          name: settings.styling.fontFamily,
          size: settings.styling.fontSize - 2
        };
        currentRow++;
      }

      const contactPersonRow = worksheet.getRow(currentRow);
      contactPersonRow.getCell(1).value = `聯絡人 / Contact Person: ${purchase.deliveryDetails.contactPersonName}`;
      contactPersonRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow++;

      const contactPhoneRow = worksheet.getRow(currentRow);
      contactPhoneRow.getCell(1).value = `聯絡電話 / Contact Phone: ${purchase.deliveryDetails.contactPersonPhone}`;
      contactPhoneRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 2
      };
      currentRow += 2;
    }

    // Footer
    if (settings.sections.showFooter) {
      const footerRow = worksheet.getRow(currentRow);
      const footerText = settings.sections.footerText || '此發票由 Clearlot 平台自動生成 / This invoice is automatically generated by Clearlot Platform';
      footerRow.getCell(1).value = footerText;
      footerRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 4,
        color: secondaryColor
      };
      footerRow.getCell(1).alignment = { horizontal: 'center' };
      currentRow++;

      const generatedRow = worksheet.getRow(currentRow);
      generatedRow.getCell(1).value = `生成時間 / Generated: ${this.formatDate(new Date().toISOString())}`;
      generatedRow.getCell(1).font = {
        name: settings.styling.fontFamily,
        size: settings.styling.fontSize - 4,
        color: secondaryColor
      };
      generatedRow.getCell(1).alignment = { horizontal: 'center' };
    }

    // Set column widths
    worksheet.getColumn(1).width = 50;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;

    return workbook;
  }

  static async downloadInvoiceExcel(invoiceData: InvoiceData, filename?: string): Promise<void> {
    const workbook = await this.generateInvoiceExcel(invoiceData);
    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const defaultFilename = `invoice_${invoiceData.purchase.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.download = filename || defaultFilename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Convert Excel to PDF using html2canvas and jsPDF
  static async convertExcelToPDF(invoiceData: InvoiceData, filename?: string): Promise<void> {
    try {
      // Pre-process logo to avoid CORS issues
      let processedHtmlContent = this.generateHTMLFromExcel(invoiceData);
      
      // Logo functionality removed - no logo processing needed
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = processedHtmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use html2canvas to capture the content
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5, // Reduced scale to fit content better
        useCORS: true,
        allowTaint: true, // Allow taint since we're using base64 images
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        scrollX: 0,
        scrollY: 0
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Convert canvas to PDF using jsPDF
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      
      // Calculate the height to fit the content in one page
      const maxHeight = pageHeight - 20; // Leave some margin
      const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, maxHeight);
      
      // Add image to PDF (single page)
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth - 20, imgHeight);
      
      // Download the PDF
      const defaultFilename = `invoice_${invoiceData.purchase.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename || defaultFilename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to the original PDF service
      const { PDFService } = await import('./pdfService');
      PDFService.downloadInvoice(invoiceData, filename);
    }
  }


  private static generateHTMLFromExcel(invoiceData: InvoiceData): string {
    const settings = invoiceData.template?.settings || {
      header: {
        title: '發票 / INVOICE',
        subtitle: 'Clearlot Platform',
        showLogo: false
      },
      company: {
        name: 'Clearlot Platform',
        address: 'Hong Kong',
        phone: '+852-XXXX-XXXX',
        email: 'info@clearlot.com',
        showCompanyInfo: true
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial',
        fontSize: 12
      },
      sections: {
        showBuyerInfo: true,
        showSellerInfo: true,
        showProductTable: true,
        showPaymentInfo: true,
        showDeliveryInfo: true,
        showFooter: true,
        footerText: ''
      }
    };

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: ${settings.styling.fontFamily}, sans-serif;
            font-size: ${settings.styling.fontSize}px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .title {
            font-size: ${settings.styling.fontSize + 4}px;
            font-weight: bold;
            color: ${settings.styling.primaryColor};
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: ${settings.styling.fontSize}px;
            color: ${settings.styling.secondaryColor};
            margin-bottom: 20px;
          }
          .section-title {
            font-size: ${settings.styling.fontSize}px;
            font-weight: bold;
            color: ${settings.styling.primaryColor};
            margin: 20px 0 10px 0;
            border-bottom: 2px solid ${settings.styling.primaryColor};
            padding-bottom: 5px;
          }
          .company-info {
            margin-bottom: 20px;
          }
          .invoice-details {
            margin-bottom: 20px;
            font-size: ${settings.styling.fontSize - 2}px;
          }
          .info-section {
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 5px;
            font-size: ${settings.styling.fontSize - 2}px;
          }
          .product-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .product-table th {
            background-color: ${settings.styling.primaryColor};
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          .product-table td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: center;
          }
          .product-table td:first-child {
            text-align: left;
          }
          .summary {
            text-align: right;
            margin: 20px 0;
          }
          .summary-item {
            margin-bottom: 5px;
            font-size: ${settings.styling.fontSize - 2}px;
          }
          .total {
            font-weight: bold;
            font-size: ${settings.styling.fontSize}px;
            color: ${settings.styling.primaryColor};
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: ${settings.styling.fontSize - 4}px;
            color: ${settings.styling.secondaryColor};
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
    `;

    // Add content based on template settings
    html += `
        <div class="header">
          <div class="title">${settings.header.title}</div>
          <div class="subtitle">${settings.header.subtitle}</div>
        </div>
        
        ${settings.company.showCompanyInfo ? `
        <div class="company-info">
          <div>${settings.company.name}</div>
          <div>${settings.company.address}</div>
          <div>Phone: ${settings.company.phone}</div>
          <div>Email: ${settings.company.email}</div>
        </div>
        ` : ''}
        
        <div class="invoice-details">
          <div>發票編號 / Invoice No: ${invoiceData.purchase.id}</div>
          <div>日期 / Date: ${this.formatDate(invoiceData.purchase.purchaseDate)}</div>
          <div>交易編號 / Transaction ID: ${invoiceData.purchase.paymentDetails?.transactionId || 'N/A'}</div>
        </div>
    `;

    // Add buyer info
    if (invoiceData.buyer) {
      html += `
        <div class="info-section">
          <div class="section-title">買方資料 / Buyer Information</div>
          <div class="info-item">公司名稱 / Company: ${invoiceData.buyer.company || 'N/A'}</div>
        </div>
      `;
    }

    // Add seller info
    if (invoiceData.seller) {
      html += `
        <div class="info-section">
          <div class="section-title">賣方資料 / Seller Information</div>
          <div class="info-item">公司名稱 / Company: ${invoiceData.seller.company || 'N/A'}</div>
        </div>
      `;
    }

    // Add product table
    html += `
      <div class="section-title">產品詳情 / Product Details</div>
      <table class="product-table">
        <thead>
          <tr>
            <th>產品名稱 / Product</th>
            <th>數量 / Qty</th>
            <th>單價 / Unit Price</th>
            <th>總額 / Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoiceData.offer?.title || '產品名稱不詳 / Product name not available'}</td>
            <td>${invoiceData.purchase.quantity}</td>
            <td>${this.formatCurrency(invoiceData.purchase.unitPrice)}</td>
            <td>${this.formatCurrency(invoiceData.purchase.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-item">小計 / Subtotal: ${this.formatCurrency(invoiceData.purchase.totalAmount)}</div>
        <div class="summary-item">平台費用 / Platform Fee: ${this.formatCurrency(invoiceData.purchase.platformFee)}</div>
        <div class="summary-item total">總計 / Total: ${this.formatCurrency(invoiceData.purchase.finalAmount)}</div>
      </div>
    `;

    // Add payment info
    if (settings.sections.showPaymentInfo) {
      html += `
        <div class="section-title">付款資訊 / Payment Information</div>
        <div class="info-item">付款方式 / Payment Method: 銀行轉帳 / Bank Transfer</div>
        <div class="info-item">付款狀態 / Payment Status: ${invoiceData.purchase.paymentDetails?.status || 'N/A'}</div>
        ${invoiceData.purchase.paymentDetails?.timestamp ? 
          `<div class="info-item">付款時間 / Payment Time: ${this.formatDate(invoiceData.purchase.paymentDetails.timestamp)}</div>` : 
          ''
        }
      `;
    }

    // Add delivery info
    if (settings.sections.showDeliveryInfo && invoiceData.purchase.deliveryDetails) {
      html += `
        <div class="section-title">送貨地址 / Delivery Address</div>
        <div class="info-item">地區 / District: ${invoiceData.purchase.deliveryDetails.district}</div>
        <div class="info-item">分區 / Subdivision: ${invoiceData.purchase.deliveryDetails.subdivision}</div>
        <div class="info-item">地址 / Address: ${invoiceData.purchase.deliveryDetails.address1}</div>
        ${invoiceData.purchase.deliveryDetails.address2 ? 
          `<div class="info-item">${invoiceData.purchase.deliveryDetails.address2}</div>` : 
          ''
        }
        <div class="info-item">聯絡人 / Contact Person: ${invoiceData.purchase.deliveryDetails.contactPersonName}</div>
        <div class="info-item">聯絡電話 / Contact Phone: ${invoiceData.purchase.deliveryDetails.contactPersonPhone}</div>
      `;
    }

    // Add footer
    if (settings.sections.showFooter) {
      const footerText = settings.sections.footerText || '此發票由 Clearlot 平台自動生成 / This invoice is automatically generated by Clearlot Platform';
      html += `
        <div class="footer">
          <div>${footerText}</div>
          <div>生成時間 / Generated: ${this.formatDate(new Date().toISOString())}</div>
        </div>
      `;
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }
}
