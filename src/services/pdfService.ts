import jsPDF from 'jspdf';
import { Purchase, Offer, AuthUser } from '../types';

export interface InvoiceData {
  purchase: Purchase;
  offer?: Offer | null;
  buyer?: AuthUser | null;
  seller?: AuthUser | null;
  template?: InvoiceTemplate | null;
}

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
    };
  };
}

export class PDFService {
  private static formatCurrency(amount: number): string {
    return `HK$ ${amount.toFixed(2)}`;
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static generateInvoice(invoiceData: InvoiceData): jsPDF {
    const { purchase, offer, buyer, seller, template } = invoiceData;
    const doc = new jsPDF();
    
    // Debug: Log template information
    console.log('PDFService: Template received:', {
      hasTemplate: !!template,
      templateId: template?.id,
      templateName: template?.name,
      templateSettings: template?.settings
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
        fontFamily: 'helvetica',
        fontSize: 12
      },
      sections: {
        showBuyerInfo: true,
        showSellerInfo: true,
        showProductTable: true,
        showPaymentInfo: true,
        showDeliveryInfo: true,
        showFooter: true
      }
    };

    // Helper function to convert hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 37, g: 99, b: 235 }; // Default blue
    };

    // Set primary color for headers
    const primaryColor = hexToRgb(settings.styling.primaryColor);
    const secondaryColor = hexToRgb(settings.styling.secondaryColor);

    // Set font
    doc.setFont(settings.styling.fontFamily);

    let currentY = 20;

    // Header (no logo)
    doc.setFontSize(settings.styling.fontSize + 4);
    doc.setFont(settings.styling.fontFamily, 'bold');
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(settings.header.title, 20, currentY);
    currentY += 15;

    // Company info
    if (settings.company.showCompanyInfo) {
      doc.setFontSize(settings.styling.fontSize);
      doc.setFont(settings.styling.fontFamily, 'normal');
      doc.setTextColor(0, 0, 0); // Black text
      doc.text(settings.company.name, 20, currentY);
      currentY += 7;
      doc.text(settings.header.subtitle, 20, currentY);
      currentY += 7;
      doc.text(settings.company.address, 20, currentY);
      currentY += 7;
      doc.text(`Phone: ${settings.company.phone}`, 20, currentY);
      currentY += 7;
      doc.text(`Email: ${settings.company.email}`, 20, currentY);
      currentY += 15;
    }

    // Invoice details
    doc.setFontSize(settings.styling.fontSize - 2);
    doc.setTextColor(0, 0, 0); // Black text
    doc.text(`發票編號 / Invoice No: ${purchase.id}`, 20, currentY);
    currentY += 7;
    doc.text(`日期 / Date: ${this.formatDate(purchase.purchaseDate)}`, 20, currentY);
    currentY += 7;
    doc.text(`交易編號 / Transaction ID: ${purchase.paymentDetails?.transactionId || 'N/A'}`, 20, currentY);
    currentY += 15;

    // Buyer information
    if (settings.sections.showBuyerInfo) {
      doc.setFontSize(settings.styling.fontSize);
      doc.setFont(settings.styling.fontFamily, 'bold');
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text('買方資料 / Buyer Information', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(settings.styling.fontSize - 2);
      doc.setFont(settings.styling.fontFamily, 'normal');
      doc.setTextColor(0, 0, 0); // Black text
      if (buyer) {
        doc.text(`公司名稱 / Company: ${buyer.company || 'N/A'}`, 20, currentY);
        currentY += 15;
      } else {
        doc.text('買方資料不詳 / Buyer information not available', 20, currentY);
        currentY += 15;
      }
    }

    // Seller information
    if (settings.sections.showSellerInfo) {
      doc.setFontSize(settings.styling.fontSize);
      doc.setFont(settings.styling.fontFamily, 'bold');
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text('賣方資料 / Seller Information', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(settings.styling.fontSize - 2);
      doc.setFont(settings.styling.fontFamily, 'normal');
      doc.setTextColor(0, 0, 0); // Black text
      if (seller) {
        doc.text(`公司名稱 / Company: ${seller.companyName || 'N/A'}`, 20, currentY);
        currentY += 15;
      } else {
        doc.text('賣方資料不詳 / Seller information not available', 20, currentY);
        currentY += 15;
      }
    }

    // Product details
    if (settings.sections.showProductTable) {
      doc.setFontSize(settings.styling.fontSize);
      doc.setFont(settings.styling.fontFamily, 'bold');
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text('產品詳情 / Product Details', 20, currentY);
      currentY += 10;

      // Table header
      doc.setFontSize(settings.styling.fontSize - 2);
      doc.setFont(settings.styling.fontFamily, 'bold');
      doc.setTextColor(0, 0, 0); // Black text
      doc.text('產品名稱 / Product', 20, currentY);
      doc.text('數量 / Qty', 100, currentY);
      doc.text('單價 / Unit Price', 130, currentY);
      doc.text('總額 / Total', 170, currentY);
      currentY += 10;

      // Table content
      doc.setFont(settings.styling.fontFamily, 'normal');
      const productName = offer?.title || '產品名稱不詳 / Product name not available';
      const quantity = purchase.quantity;
      const unitPrice = purchase.unitPrice;
      const subtotal = purchase.totalAmount;

      doc.text(productName, 20, currentY);
      doc.text(quantity.toString(), 100, currentY);
      doc.text(this.formatCurrency(unitPrice), 130, currentY);
      doc.text(this.formatCurrency(subtotal), 170, currentY);
      currentY += 15;
    }

    // Summary
    doc.setFontSize(settings.styling.fontSize - 2);
    doc.setFont(settings.styling.fontFamily, 'normal');
    doc.setTextColor(0, 0, 0); // Black text
    doc.text(`小計 / Subtotal: ${this.formatCurrency(purchase.totalAmount)}`, 130, currentY);
    currentY += 7;
    doc.text(`平台費用 / Platform Fee: ${this.formatCurrency(purchase.platformFee)}`, 130, currentY);
    currentY += 7;
    
    doc.setFont(settings.styling.fontFamily, 'bold');
    doc.setFontSize(settings.styling.fontSize);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(`總計 / Total: ${this.formatCurrency(purchase.finalAmount)}`, 130, currentY);
    currentY += 20;

    // Payment information
    if (settings.sections.showPaymentInfo) {
      doc.setFontSize(settings.styling.fontSize);
      doc.setFont(settings.styling.fontFamily, 'bold');
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text('付款資訊 / Payment Information', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(settings.styling.fontSize - 2);
      doc.setFont(settings.styling.fontFamily, 'normal');
      doc.setTextColor(0, 0, 0); // Black text
      doc.text('付款方式 / Payment Method: 銀行轉帳 / Bank Transfer', 20, currentY);
      currentY += 7;
      doc.text(`付款狀態 / Payment Status: ${purchase.paymentDetails?.status || 'N/A'}`, 20, currentY);
      currentY += 7;
      
      if (purchase.paymentDetails?.timestamp) {
        doc.text(`付款時間 / Payment Time: ${this.formatDate(purchase.paymentDetails.timestamp)}`, 20, currentY);
        currentY += 7;
      }
      currentY += 10;
    }

    // Delivery information
    if (settings.sections.showDeliveryInfo && purchase.deliveryDetails) {
      doc.setFontSize(settings.styling.fontSize);
      doc.setFont(settings.styling.fontFamily, 'bold');
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text('送貨地址 / Delivery Address', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(settings.styling.fontSize - 2);
      doc.setFont(settings.styling.fontFamily, 'normal');
      doc.setTextColor(0, 0, 0); // Black text
      doc.text(`地區 / District: ${purchase.deliveryDetails.district}`, 20, currentY);
      currentY += 7;
      doc.text(`分區 / Subdivision: ${purchase.deliveryDetails.subdivision}`, 20, currentY);
      currentY += 7;
      doc.text(`地址 / Address: ${purchase.deliveryDetails.address1}`, 20, currentY);
      currentY += 7;
      if (purchase.deliveryDetails.address2) {
        doc.text(purchase.deliveryDetails.address2, 20, currentY);
        currentY += 7;
      }
      doc.text(`聯絡人 / Contact Person: ${purchase.deliveryDetails.contactPersonName}`, 20, currentY);
      currentY += 7;
      doc.text(`聯絡電話 / Contact Phone: ${purchase.deliveryDetails.contactPersonPhone}`, 20, currentY);
      currentY += 15;
    }

    // Footer
    if (settings.sections.showFooter) {
      doc.setFontSize(settings.styling.fontSize - 4);
      doc.setFont(settings.styling.fontFamily, 'normal');
      doc.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      doc.text('此發票由 Clearlot 平台自動生成 / This invoice is automatically generated by Clearlot Platform', 20, 280);
      doc.text(`生成時間 / Generated: ${this.formatDate(new Date().toISOString())}`, 20, 287);
    }

    return doc;
  }

  static downloadInvoice(invoiceData: InvoiceData, filename?: string): void {
    const doc = this.generateInvoice(invoiceData);
    const defaultFilename = `invoice_${invoiceData.purchase.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename || defaultFilename);
  }

  static openInvoiceInNewTab(invoiceData: InvoiceData): void {
    const doc = this.generateInvoice(invoiceData);
    const pdfDataUri = doc.output('datauristring');
    window.open(pdfDataUri, '_blank');
  }

  static getInvoiceAsBlob(invoiceData: InvoiceData): Blob {
    const doc = this.generateInvoice(invoiceData);
    return doc.output('blob');
  }

  static getInvoiceAsDataUri(invoiceData: InvoiceData): string {
    const doc = this.generateInvoice(invoiceData);
    return doc.output('datauristring');
  }
}
