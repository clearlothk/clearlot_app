import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Eye, 
  Download,
  Plus,
  Edit,
  Save,
  X,
  Settings,
  Palette,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  ArrowUpDown,
  MessageCircle,
  LogOut,
  Menu,
  FileDown,
  Upload,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAllPurchasesForAdmin,
  getOfferById,
  getUserById,
  uploadLogoToStorage,
  saveInvoiceTemplate,
  getAllInvoiceTemplates
} from '../services/firebaseService';
import { Purchase, Offer, AuthUser } from '../types';
import { formatHKDate } from '../utils/dateUtils';
import { ExcelInvoiceService } from '../services/excelInvoiceService';

interface InvoiceTemplate {
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


export default function AdminInvoicePage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'invoices' | 'designer'>('templates');
  
  // Template management
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  // Invoice management
  const [enhancedPurchases, setEnhancedPurchases] = useState<Array<Purchase & {
    offer?: Offer | null;
    buyer?: AuthUser | null;
    seller?: AuthUser | null;
  }>>([]);
  
  // Designer state
  const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplate | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('generatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminData = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !adminData) {
      navigate('/hk/admin/login');
      return;
    }

    setAdminUser(JSON.parse(adminData));
    loadData();
  }, [navigate]);

  const retryLoadData = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load templates from Firestore first
      await loadTemplatesFromFirestore();
      
      // Load generated invoices (mock data for now)
      loadGeneratedInvoices();
      
      // Load purchases for invoice generation with error handling and timeout
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );
        
        const purchasesPromise = getAllPurchasesForAdmin();
        const purchasesData = await Promise.race([purchasesPromise, timeoutPromise]) as Purchase[];
        
        // Set basic enhanced data without additional Firestore calls initially
        const basicEnhanced = purchasesData.map(purchase => ({
          ...purchase,
          offer: null,
          buyer: null,
          seller: null
        }));
        setEnhancedPurchases(basicEnhanced);
        
        // Load enhanced data in background (non-blocking)
        loadEnhancedDataInBackground(purchasesData);
        
      } catch (purchaseError) {
        console.error('Error loading purchases:', purchaseError);
        // Set empty arrays if purchase loading fails
        setEnhancedPurchases([]);
        setError('Failed to load purchase data. Please refresh the page.');
      }
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadEnhancedDataInBackground = async (purchasesData: Purchase[]) => {
    try {
      // Load enhanced purchase data with batching to avoid too many concurrent calls
      const batchSize = 2; // Very small batch size to prevent Firestore issues
      const enhanced: Array<Purchase & {
        offer?: Offer | null;
        buyer?: AuthUser | null;
        seller?: AuthUser | null;
      }> = [];
      
      for (let i = 0; i < purchasesData.length; i += batchSize) {
        const batch = purchasesData.slice(i, i + batchSize);
        const batchEnhanced = await Promise.all(
          batch.map(async (purchase) => {
            try {
              // Add individual timeouts for each request
              const offerPromise = getOfferById(purchase.offerId).catch(() => null);
              const buyerPromise = getUserById(purchase.buyerId).catch(() => null);
              const sellerPromise = getUserById(purchase.sellerId).catch(() => null);
              
              const [offer, buyer, seller] = await Promise.all([
                Promise.race([offerPromise, new Promise(resolve => setTimeout(() => resolve(null), 3000))]) as Promise<Offer | null>,
                Promise.race([buyerPromise, new Promise(resolve => setTimeout(() => resolve(null), 3000))]) as Promise<AuthUser | null>,
                Promise.race([sellerPromise, new Promise(resolve => setTimeout(() => resolve(null), 3000))]) as Promise<AuthUser | null>
              ]);
              
              // Debug: Log loaded data
              console.log(`Purchase ${purchase.id} data loaded:`, {
                hasOffer: !!offer,
                hasBuyer: !!buyer,
                buyerData: buyer ? {
                  id: buyer.id,
                  name: buyer.name,
                  email: buyer.email,
                  companyName: buyer.company
                } : null,
                hasSeller: !!seller,
                sellerData: seller ? {
                  id: seller.id,
                  name: seller.name,
                  email: seller.email,
                  companyName: seller.company
                } : null
              });
              
              return {
                ...purchase,
                offer,
                buyer,
                seller
              };
            } catch (error) {
              console.warn(`Error loading data for purchase ${purchase.id}:`, error);
              return {
                ...purchase,
                offer: null,
                buyer: null,
                seller: null
              };
            }
          })
        );
        enhanced.push(...batchEnhanced);
        
        // Add delay between batches to prevent overwhelming Firestore
        if (i + batchSize < purchasesData.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setEnhancedPurchases(enhanced);
    } catch (error) {
      console.warn('Error loading enhanced data in background:', error);
      // Don't show error to user, just log it
    }
  };

  const loadTemplatesFromFirestore = async () => {
    try {
      // Try to load templates from Firestore
      const firestoreTemplates = await getAllInvoiceTemplates();
      
      if (firestoreTemplates && firestoreTemplates.length > 0) {
        // Use templates from Firestore
        setTemplates(firestoreTemplates);
        
        // Automatically select the default template if no template is selected
        if (!selectedTemplate) {
          const defaultTemplate = firestoreTemplates.find(t => t.isDefault) || firestoreTemplates[0];
          setSelectedTemplate(defaultTemplate);
        }
        
        console.log('✅ Loaded templates from Firestore:', firestoreTemplates.length);
      } else {
        // Fallback to default templates if no templates in Firestore
        loadDefaultTemplates();
        console.log('⚠️ No templates in Firestore, using default templates');
      }
    } catch (error) {
      console.error('❌ Error loading templates from Firestore:', error);
      // Fallback to default templates on error
      loadDefaultTemplates();
    }
  };

  const loadDefaultTemplates = () => {
    const defaultTemplates: InvoiceTemplate[] = [
      {
        id: 'default-1',
        name: 'Default Template',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
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
            showFooter: true,
            footerText: ''
          }
        }
      }
    ];
    setTemplates(defaultTemplates);
    
    // Automatically select the default template if no template is selected
    if (!selectedTemplate) {
      setSelectedTemplate(defaultTemplates[0]);
    }
  };

  const loadGeneratedInvoices = () => {
    // Mock data for generated invoices - currently not used
    // This function can be implemented later when invoice tracking is needed
  };

  const handleCreateTemplate = () => {
    const newTemplate: InvoiceTemplate = {
      id: `template-${Date.now()}`,
      name: templateName || 'New Template',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
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
          showFooter: true,
          footerText: ''
        }
      }
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate);
    setTemplateName('');
    setShowTemplateModal(false);
    setActiveTab('designer');
  };

  const handleGenerateInvoice = async (purchase: Purchase & { offer?: Offer | null; buyer?: AuthUser | null; seller?: AuthUser | null }) => {
    try {
      // Ensure we have a valid template
      const template = selectedTemplate || templates.find(t => t.isDefault) || templates[0];
      
      if (!template) {
        setError('No template available. Please create a template first.');
        return;
      }
      
      // Debug: Log template information
      console.log('Generating invoice with template:', {
        templateId: template?.id,
        templateName: template?.name,
        isDefault: template?.isDefault,
        selectedTemplate: selectedTemplate?.id,
        availableTemplates: templates.map(t => ({ id: t.id, name: t.name }))
      });
      
      // Check if we have enhanced data, if not, load it on demand
      let enhancedPurchase = purchase;
      if (!purchase.buyer || !purchase.seller || !purchase.offer) {
        console.log('🔄 Loading missing data for purchase:', purchase.id);
        try {
          const [offer, buyer, seller] = await Promise.all([
            purchase.offer || getOfferById(purchase.offerId).catch(() => null),
            purchase.buyer || getUserById(purchase.buyerId).catch(() => null),
            purchase.seller || getUserById(purchase.sellerId).catch(() => null)
          ]);
          
          enhancedPurchase = {
            ...purchase,
            offer,
            buyer,
            seller
          };
          
          console.log('✅ Enhanced data loaded:', {
            hasOffer: !!offer,
            hasBuyer: !!buyer,
            hasSeller: !!seller
          });
        } catch (error) {
          console.warn('⚠️ Failed to load enhanced data:', error);
        }
      }
      
      const invoiceData = {
        purchase: enhancedPurchase,
        offer: enhancedPurchase.offer,
        buyer: enhancedPurchase.buyer,
        seller: enhancedPurchase.seller,
        template: template
      };
      
      // Debug: Log the data being passed to the service
      console.log('🔍 Invoice data being passed to service:', {
        purchaseId: enhancedPurchase.id,
        hasOffer: !!enhancedPurchase.offer,
        hasBuyer: !!enhancedPurchase.buyer,
        hasSeller: !!enhancedPurchase.seller,
        hasTemplate: !!template,
        buyerData: enhancedPurchase.buyer ? {
          id: enhancedPurchase.buyer.id,
          name: enhancedPurchase.buyer.name,
          companyName: enhancedPurchase.buyer.company
        } : null,
        sellerData: enhancedPurchase.seller ? {
          id: enhancedPurchase.seller.id,
          name: enhancedPurchase.seller.name,
          companyName: enhancedPurchase.seller.company
        } : null
      });
      
      // Use Excel service for better formatting and Chinese character support
      await ExcelInvoiceService.downloadInvoiceExcel(invoiceData);
      
      // Invoice generated successfully
      console.log(`Invoice generated for purchase ${purchase.id} using template ${template.name}`);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice');
    }
  };

  const handleGeneratePDF = async (purchase: Purchase & { offer?: Offer | null; buyer?: AuthUser | null; seller?: AuthUser | null }) => {
    try {
      // Ensure we have a valid template
      const template = selectedTemplate || templates.find(t => t.isDefault) || templates[0];
      
      if (!template) {
        setError('No template available. Please create a template first.');
        return;
      }
      
      // Check if we have enhanced data, if not, load it on demand
      let enhancedPurchase = purchase;
      if (!purchase.buyer || !purchase.seller || !purchase.offer) {
        console.log('🔄 Loading missing data for PDF generation:', purchase.id);
        try {
          const [offer, buyer, seller] = await Promise.all([
            purchase.offer || getOfferById(purchase.offerId).catch(() => null),
            purchase.buyer || getUserById(purchase.buyerId).catch(() => null),
            purchase.seller || getUserById(purchase.sellerId).catch(() => null)
          ]);
          
          enhancedPurchase = {
            ...purchase,
            offer,
            buyer,
            seller
          };
          
          console.log('✅ Enhanced data loaded for PDF:', {
            hasOffer: !!offer,
            hasBuyer: !!buyer,
            hasSeller: !!seller
          });
        } catch (error) {
          console.warn('⚠️ Failed to load enhanced data for PDF:', error);
        }
      }
      
      const invoiceData = {
        purchase: enhancedPurchase,
        offer: enhancedPurchase.offer,
        buyer: enhancedPurchase.buyer,
        seller: enhancedPurchase.seller,
        template: template
      };
      
      // Use Excel to PDF conversion for better formatting
      await ExcelInvoiceService.convertExcelToPDF(invoiceData);
      
    } catch (error) {
      console.error('Error generating PDF invoice:', error);
      setError('Failed to generate PDF invoice');
    }
  };

  const filteredPurchases = enhancedPurchases.filter(purchase => {
    const offerTitle = purchase.offer?.title || '';
    const buyerName = purchase.buyer?.company || '';
    const sellerName = purchase.seller?.company || '';
    
    return offerTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
           buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           purchase.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.finalAmount;
        bValue = b.finalAmount;
        break;
      case 'date':
        aValue = new Date(a.purchaseDate);
        bValue = new Date(b.purchaseDate);
        break;
      default:
        aValue = new Date(a.purchaseDate);
        bValue = new Date(b.purchaseDate);
    }
    
    return sortOrder === 'asc' ? 
      (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) :
      (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
  });

  const formatCurrency = (amount: number) => {
    return `HK$ ${amount.toFixed(2)}`;
  };

  const safeFormatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    try {
      return formatHKDate(date);
    } catch (error) {
      console.warn('Error formatting date:', date, error);
      return 'Invalid Date';
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      
      if (currentTemplate) {
        // Upload to Firebase Storage and get permanent URL
        const permanentUrl = await uploadLogoToStorage(file, currentTemplate.id);
        
        const updated = { ...currentTemplate };
        updated.settings.header.logoUrl = permanentUrl;
        setCurrentTemplate(updated);
        
        console.log('✅ Logo uploaded and saved:', permanentUrl);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (!currentTemplate) return;
      
      // Update template with current settings
      const updatedTemplate = {
        ...currentTemplate,
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firebase
      await saveInvoiceTemplate(updatedTemplate);
      
      // Update templates array
      setTemplates(prev => 
        prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
      
      // Update selected template if it's the one being saved
      if (selectedTemplate && selectedTemplate.id === updatedTemplate.id) {
        setSelectedTemplate(updatedTemplate);
      }
      
      // Show success message
      setError(null);
      alert(`Template "${updatedTemplate.name}" saved successfully!`);
      
      setActiveTab('templates');
      
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-blue-100">ClearLot</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-white hover:bg-blue-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Main Navigation */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Main
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/hk/admin/dashboard');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <BarChart3 className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>

            {/* Management */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Management
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/hk/admin/users');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Users className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Users</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/offers');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Package className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Offers</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/transactions');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <ShoppingCart className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Transactions</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/messages');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <MessageCircle className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Messages</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/invoices');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <FileText className="h-5 w-5" />
                  <span>Invoice Management</span>
                </button>
              </div>
            </div>

            {/* System */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                System
              </h3>
              <div className="space-y-1">
                <button
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed rounded-lg opacity-50"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{adminUser?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('adminAuthenticated');
                localStorage.removeItem('adminUser');
                navigate('/');
                setSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-gray-200"
            >
              <LogOut className="h-5 w-5 group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                onClick={() => navigate('/hk/admin/dashboard')}
                className="hidden lg:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <FileText className="h-5 w-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Invoice Management</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, {adminUser?.name || 'Admin'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Templates
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Download className="h-4 w-4 inline mr-2" />
                Generated Invoices
              </button>
              <button
                onClick={() => setActiveTab('designer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'designer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Palette className="h-4 w-4 inline mr-2" />
                Template Designer
              </button>
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-3">
                  <button
                    onClick={retryLoadData}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Retry ({retryCount}/3)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Invoice Templates</h2>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Created: {safeFormatDate(template.createdAt)}</p>
                    <p>Updated: {safeFormatDate(template.updatedAt)}</p>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTemplate(template);
                        setActiveTab('designer');
                      }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Generated Invoices</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template:</label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      setSelectedTemplate(template || null);
                    }}
                    className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search purchases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {selectedTemplate ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Using Template: {selectedTemplate.name}</h3>
                    <p className="text-xs text-blue-700">
                      New invoices will be generated using this template. 
                      {selectedTemplate.isDefault && ' (Default template)'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Template ID: {selectedTemplate.id} | 
                      Header: {selectedTemplate.settings.header.title} | 
                      Company: {selectedTemplate.settings.company.name}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-900">No Template Selected</h3>
                    <p className="text-xs text-yellow-700">
                      Please select a template from the dropdown above to generate invoices with custom styling.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sortedPurchases.length > 0 ? (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {purchase.offer?.title || `Purchase ${purchase.id}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {purchase.buyer?.company || purchase.buyerId} → {purchase.seller?.company || purchase.sellerId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(purchase.finalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {safeFormatDate(purchase.purchaseDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              purchase.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {purchase.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleGenerateInvoice(purchase)}
                                className="text-green-600 hover:text-green-900"
                                title="Generate Excel Invoice"
                              >
                                <FileDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleGeneratePDF(purchase)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Generate PDF Invoice"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases found</h3>
                <p className="text-gray-600">
                  {error ? 'Unable to load purchase data. Please try again.' : 'No purchases available for invoice generation.'}
                </p>
                {error && (
                  <button
                    onClick={retryLoadData}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Retry Loading
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Template Designer Tab */}
        {activeTab === 'designer' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Template Designer {currentTemplate && `- ${currentTemplate.name}`}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('templates')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Designer Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Template Settings</h3>
                
                {currentTemplate && (
                  <div className="space-y-6">
                    {/* Header Settings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Header & Branding</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Invoice Title</label>
                          <input
                            type="text"
                            value={currentTemplate.settings.header.title}
                            onChange={(e) => {
                              const updated = { ...currentTemplate };
                              updated.settings.header.title = e.target.value;
                              setCurrentTemplate(updated);
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="發票 / INVOICE"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company Subtitle</label>
                          <input
                            type="text"
                            value={currentTemplate.settings.header.subtitle}
                            onChange={(e) => {
                              const updated = { ...currentTemplate };
                              updated.settings.header.subtitle = e.target.value;
                              setCurrentTemplate(updated);
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Clearlot Platform"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                          <div className="mt-1 flex items-center space-x-4">
                            {logoPreview && (
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-16 w-16 object-contain border border-gray-200 rounded"
                              />
                            )}
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleLogoUpload(file);
                                  }
                                }}
                                className="hidden"
                                id="logo-upload"
                              />
                              <label
                                htmlFor="logo-upload"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Company Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company Name</label>
                          <input
                            type="text"
                            value={currentTemplate.settings.company.name}
                            onChange={(e) => {
                              const updated = { ...currentTemplate };
                              updated.settings.company.name = e.target.value;
                              setCurrentTemplate(updated);
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <textarea
                            value={currentTemplate.settings.company.address}
                            onChange={(e) => {
                              const updated = { ...currentTemplate };
                              updated.settings.company.address = e.target.value;
                              setCurrentTemplate(updated);
                            }}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                              type="text"
                              value={currentTemplate.settings.company.phone}
                              onChange={(e) => {
                                const updated = { ...currentTemplate };
                                updated.settings.company.phone = e.target.value;
                                setCurrentTemplate(updated);
                              }}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              value={currentTemplate.settings.company.email}
                              onChange={(e) => {
                                const updated = { ...currentTemplate };
                                updated.settings.company.email = e.target.value;
                                setCurrentTemplate(updated);
                              }}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Styling Settings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Styling & Colors</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                            <input
                              type="color"
                              value={currentTemplate.settings.styling.primaryColor}
                              onChange={(e) => {
                                const updated = { ...currentTemplate };
                                updated.settings.styling.primaryColor = e.target.value;
                                setCurrentTemplate(updated);
                              }}
                              className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                            <input
                              type="color"
                              value={currentTemplate.settings.styling.secondaryColor}
                              onChange={(e) => {
                                const updated = { ...currentTemplate };
                                updated.settings.styling.secondaryColor = e.target.value;
                                setCurrentTemplate(updated);
                              }}
                              className="mt-1 block w-full h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Font Family</label>
                          <select
                            value={currentTemplate.settings.styling.fontFamily}
                            onChange={(e) => {
                              const updated = { ...currentTemplate };
                              updated.settings.styling.fontFamily = e.target.value;
                              setCurrentTemplate(updated);
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="helvetica">Helvetica</option>
                            <option value="times">Times</option>
                            <option value="courier">Courier</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Font Size: {currentTemplate.settings.styling.fontSize}px</label>
                          <input
                            type="range"
                            min="8"
                            max="16"
                            value={currentTemplate.settings.styling.fontSize}
                            onChange={(e) => {
                              const updated = { ...currentTemplate };
                              updated.settings.styling.fontSize = parseInt(e.target.value);
                              setCurrentTemplate(updated);
                            }}
                            className="mt-1 block w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sections Settings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Invoice Sections</h4>
                      <div className="space-y-2">
                        {Object.entries(currentTemplate.settings.sections).map(([key, value]) => {
                          if (key === 'footerText') return null; // Skip footerText in checkbox list
                          
                          return (
                            <div key={key}>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={typeof value === 'boolean' ? value : false}
                                  onChange={(e) => {
                                    const updated = { ...currentTemplate };
                                    if (key !== 'footerText') {
                                      (updated.settings.sections as any)[key] = e.target.checked;
                                    }
                                    setCurrentTemplate(updated);
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </span>
                              </label>
                              
                              {/* Footer Text Input */}
                              {key === 'showFooter' && typeof value === 'boolean' && value && (
                                <div className="ml-6 mt-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Footer Text
                                  </label>
                                  <textarea
                                    value={currentTemplate.settings.sections.footerText || ''}
                                    onChange={(e) => {
                                      const updated = { ...currentTemplate };
                                      updated.settings.sections.footerText = e.target.value;
                                      setCurrentTemplate(updated);
                                    }}
                                    placeholder="Enter footer text..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96">
                  {currentTemplate ? (
                    <div className="bg-white p-4 rounded shadow-sm" style={{ fontFamily: currentTemplate.settings.styling.fontFamily }}>
                      {/* Header Section */}
                      <div className="text-center mb-6">
                        {currentTemplate.settings.header.logoUrl && (
                          <div className="mb-3">
                            <img 
                              src={currentTemplate.settings.header.logoUrl} 
                              alt="Company Logo" 
                              className="h-16 w-auto mx-auto object-contain"
                            />
                          </div>
                        )}
                        <h1 
                          className="text-xl font-bold mb-2" 
                          style={{ 
                            color: currentTemplate.settings.styling.primaryColor,
                            fontSize: `${currentTemplate.settings.styling.fontSize + 4}px`
                          }}
                        >
                          {currentTemplate.settings.header.title}
                        </h1>
                        <p 
                          className="text-sm mb-4" 
                          style={{ 
                            color: currentTemplate.settings.styling.secondaryColor,
                            fontSize: `${currentTemplate.settings.styling.fontSize}px`
                          }}
                        >
                          {currentTemplate.settings.header.subtitle}
                        </p>
                      </div>
                      
                      {/* Company Information */}
                      {currentTemplate.settings.company.showCompanyInfo && (
                        <div className="mb-6 p-4 border rounded" style={{ backgroundColor: '#f9fafb' }}>
                          <h3 
                            className="font-semibold mb-3" 
                            style={{ 
                              color: currentTemplate.settings.styling.primaryColor,
                              fontSize: `${currentTemplate.settings.styling.fontSize + 1}px`
                            }}
                          >
                            Company Information
                          </h3>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{currentTemplate.settings.company.name}</p>
                            <p className="text-sm">{currentTemplate.settings.company.address}</p>
                            <p className="text-sm">Phone: {currentTemplate.settings.company.phone}</p>
                            <p className="text-sm">Email: {currentTemplate.settings.company.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Invoice Details */}
                      <div className="mb-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Invoice No:</span> INV-2024-001
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date().toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Buyer Information */}
                      {currentTemplate.settings.sections.showBuyerInfo && (
                        <div className="mb-4 p-3 border rounded">
                          <h4 
                            className="font-semibold mb-2" 
                            style={{ 
                              color: currentTemplate.settings.styling.primaryColor,
                              fontSize: `${currentTemplate.settings.styling.fontSize}px`
                            }}
                          >
                            Buyer Information
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Company:</span> Sample Buyer Company</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Seller Information */}
                      {currentTemplate.settings.sections.showSellerInfo && (
                        <div className="mb-4 p-3 border rounded">
                          <h4 
                            className="font-semibold mb-2" 
                            style={{ 
                              color: currentTemplate.settings.styling.primaryColor,
                              fontSize: `${currentTemplate.settings.styling.fontSize}px`
                            }}
                          >
                            Seller Information
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Company:</span> Sample Seller Company</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Product Table */}
                      {currentTemplate.settings.sections.showProductTable && (
                        <div className="mb-4">
                          <h4 
                            className="font-semibold mb-2" 
                            style={{ 
                              color: currentTemplate.settings.styling.primaryColor,
                              fontSize: `${currentTemplate.settings.styling.fontSize}px`
                            }}
                          >
                            Product Details
                          </h4>
                          <div className="border rounded overflow-hidden">
                            <table className="w-full text-sm">
                              <thead style={{ backgroundColor: currentTemplate.settings.styling.primaryColor + '20' }}>
                                <tr>
                                  <th className="p-2 text-left">Product</th>
                                  <th className="p-2 text-center">Qty</th>
                                  <th className="p-2 text-right">Unit Price</th>
                                  <th className="p-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t">
                                  <td className="p-2">Sample Product</td>
                                  <td className="p-2 text-center">2</td>
                                  <td className="p-2 text-right">HK$ 100.00</td>
                                  <td className="p-2 text-right">HK$ 200.00</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Information */}
                      {currentTemplate.settings.sections.showPaymentInfo && (
                        <div className="mb-4 p-3 border rounded">
                          <h4 
                            className="font-semibold mb-2" 
                            style={{ 
                              color: currentTemplate.settings.styling.primaryColor,
                              fontSize: `${currentTemplate.settings.styling.fontSize}px`
                            }}
                          >
                            Payment Information
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Method:</span> Bank Transfer</p>
                            <p><span className="font-medium">Status:</span> Completed</p>
                            <p><span className="font-medium">Amount:</span> HK$ 200.00</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Delivery Information */}
                      {currentTemplate.settings.sections.showDeliveryInfo && (
                        <div className="mb-4 p-3 border rounded">
                          <h4 
                            className="font-semibold mb-2" 
                            style={{ 
                              color: currentTemplate.settings.styling.primaryColor,
                              fontSize: `${currentTemplate.settings.styling.fontSize}px`
                            }}
                          >
                            Delivery Information
                          </h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">District:</span> Central</p>
                            <p><span className="font-medium">Address:</span> 123 Sample Street</p>
                            <p><span className="font-medium">Contact:</span> John Doe (+852-1234-5678)</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Footer */}
                      {currentTemplate.settings.sections.showFooter && (
                        <div className="mt-6 pt-4 border-t text-center text-xs" style={{ color: currentTemplate.settings.styling.secondaryColor }}>
                          {currentTemplate.settings.sections.footerText ? (
                            <p>{currentTemplate.settings.sections.footerText}</p>
                          ) : (
                            <>
                              <p>This invoice is automatically generated by {currentTemplate.settings.header.subtitle}</p>
                              <p>Generated on: {new Date().toLocaleDateString()}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p>Select a template to start designing</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Template</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
