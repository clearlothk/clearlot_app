import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Shield,
  ArrowUpDown,
  BarChart3,
  Users,
  ShoppingCart,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  Clock,
  Grid3X3,
  List,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  Building,
  Camera,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SellerRatingDisplay from './SellerRatingDisplay';
import { 
  getAllOffersForAdmin, 
  updateOfferStatus, 
  deleteOfferPermanently,
  getAllUsers,
  updateCompanyLogo,
  deleteCompanyLogo,
  updateUserVerification,
  updateOffer
} from '../services/firebaseService';
import { Offer, AuthUser } from '../types';
import { CATEGORIES } from '../constants/categories';
import { convertToHKTime, formatHKDate } from '../utils/dateUtils';

export default function AdminOffersPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showOfferDetails, setShowOfferDetails] = useState<string | null>(null);
  const [offerDetails, setOfferDetails] = useState<Offer | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCompanyLogoModal, setShowCompanyLogoModal] = useState(false);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    currentPrice: 0,
    originalPrice: 0,
    quantity: 0,
    unit: '',
    location: '',
    minOrderQuantity: 0,
    shippingEstimateDays: 0,
    tags: [] as string[],
    status: 'pending' as 'active' | 'pending' | 'rejected' | 'expired' | 'sold',
    type: 'clearance' as 'clearance'
  });
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editRemovedImages, setEditRemovedImages] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [logoUploadLoading, setLogoUploadLoading] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminData = localStorage.getItem('adminUser');
    
    if (!isAuthenticated || !adminData) {
      navigate('/hk/admin/login');
      return;
    }

    setAdminUser(JSON.parse(adminData));
    fetchOffers();
  }, [navigate]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedOffers = await getAllOffersForAdmin();
      setOffers(fetchedOffers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch offers');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (offerId: string, newStatus: 'active' | 'pending' | 'rejected' | 'expired' | 'sold') => {
    try {
      await updateOfferStatus(offerId, newStatus);
      // Update local state
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer.id === offerId 
            ? { ...offer, status: newStatus, isApproved: newStatus === 'active' }
            : offer
        )
      );
    } catch (err: any) {
      console.error('Error updating offer status:', err);
      alert(err.message || 'Failed to update offer status');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteOfferPermanently(offerId);
      // Update local state
      setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
      // Remove from selected offers if present
      setSelectedOffers(prev => prev.filter(id => id !== offerId));
    } catch (err: any) {
      console.error('Error deleting offer:', err);
      alert(err.message || 'Failed to delete offer');
    }
  };

  // View offer details
  const handleViewOffer = async (offerId: string) => {
    try {
      setDetailsLoading(true);
      // Fetch fresh offer data from database instead of using cached data
      const fetchedOffers = await getAllOffersForAdmin();
      const offer = fetchedOffers.find(o => o.id === offerId);
      if (offer) {
        setOfferDetails(offer);
        setShowOfferDetails(offerId);
        // Update the cached offers list with fresh data
        setOffers(fetchedOffers);
      }
    } catch (err: any) {
      console.error('Error loading offer details:', err);
      alert('Failed to load offer details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Edit offer
  const handleEditOffer = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    setEditingOffer(offer);
    setEditExistingImages(offer.images || []);
    setEditNewImages([]);
    setEditRemovedImages([]);
    setEditTagInput('');
    
    // Initialize form data
    setEditFormData({
      title: offer.title,
      description: offer.description,
      category: offer.category,
      currentPrice: offer.currentPrice,
      originalPrice: offer.originalPrice,
      quantity: offer.quantity,
      unit: offer.unit,
      location: offer.location,
      minOrderQuantity: offer.minOrderQuantity,
      shippingEstimateDays: offer.shippingEstimateDays,
      tags: offer.tags || [],
      status: offer.status || 'pending',
      type: offer.type || 'clearance'
    });
    
    setShowEditOfferModal(true);
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedOffers.length === filteredOffers.length) {
      setSelectedOffers([]);
    } else {
      setSelectedOffers(filteredOffers.map(offer => offer.id));
    }
  };

  const handleSelectOffer = (offerId: string) => {
    setSelectedOffers(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: 'active' | 'pending' | 'rejected' | 'expired') => {
    if (selectedOffers.length === 0) {
      alert('Please select offers to update');
      return;
    }

    if (!confirm(`Are you sure you want to update ${selectedOffers.length} offers to ${newStatus}?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const updatePromises = selectedOffers.map(offerId => 
        updateOfferStatus(offerId, newStatus)
      );
      await Promise.all(updatePromises);

      // Update local state
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          selectedOffers.includes(offer.id)
            ? { ...offer, status: newStatus, isApproved: newStatus === 'active' }
            : offer
        )
      );

      setSelectedOffers([]);
      alert(`Successfully updated ${selectedOffers.length} offers to ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating offers:', err);
      alert('Failed to update offers');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOffers.length === 0) {
      alert('Please select offers to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedOffers.length} offers? This action cannot be undone.`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const deletePromises = selectedOffers.map(offerId => 
        deleteOfferPermanently(offerId)
      );
      await Promise.all(deletePromises);

      // Update local state
      setOffers(prevOffers => 
        prevOffers.filter(offer => !selectedOffers.includes(offer.id))
      );

      setSelectedOffers([]);
      alert(`Successfully deleted ${selectedOffers.length} offers`);
    } catch (err: any) {
      console.error('Error deleting offers:', err);
      alert('Failed to delete offers');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export offers data
  const handleExportOffers = () => {
    const exportData = offers.map(offer => ({
      id: offer.id,
      offerId: offer.offerId,
      title: offer.title,
      description: offer.description,
      category: offer.category,
      currentPrice: offer.currentPrice,
      originalPrice: offer.originalPrice,
      quantity: offer.quantity,
      location: offer.location,
      supplier: offer.supplier.company,
      status: offer.status || 'pending',
      createdAt: offer.createdAt,
      views: offer.views || 0,
      favorites: offer.favorites || 0
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offers-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Refresh offers
  const handleRefreshOffers = () => {
    fetchOffers();
  };

  // Company Logo Management
  const handleOpenCompanyLogoModal = async () => {
    try {
      setUsersLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      setShowCompanyLogoModal(true);
    } catch (err: any) {
      console.error('Error loading users:', err);
      alert('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleLogoUpload = async (userId: string, file: File) => {
    try {
      setLogoUploadLoading(userId);
      const downloadURL = await updateCompanyLogo(userId, file);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, companyLogo: downloadURL }
            : user
        )
      );
      
      // Update offers if they exist
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer.supplierId === userId 
            ? { ...offer, supplier: { ...offer.supplier, logo: downloadURL } }
            : offer
        )
      );
      
      alert('Company logo updated successfully!');
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      alert(err.message || 'Failed to upload logo');
    } finally {
      setLogoUploadLoading(null);
    }
  };

  const handleLogoDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this company logo?')) {
      return;
    }

    try {
      setLogoUploadLoading(userId);
      await deleteCompanyLogo(userId);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, companyLogo: '' }
            : user
        )
      );
      
      // Update offers if they exist
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer.supplierId === userId 
            ? { ...offer, supplier: { ...offer.supplier, logo: '' } }
            : offer
        )
      );
      
      alert('Company logo deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting logo:', err);
      alert(err.message || 'Failed to delete logo');
    } finally {
      setLogoUploadLoading(null);
    }
  };

  const handleVerificationToggle = async (userId: string, isVerified: boolean) => {
    try {
      await updateUserVerification(userId, isVerified);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isVerified }
            : user
        )
      );
      
      // Update offers if they exist
      setOffers(prevOffers => 
        prevOffers.map(offer => 
          offer.supplierId === userId 
            ? { ...offer, supplier: { ...offer.supplier, isVerified } }
            : offer
        )
      );
      
      alert(`User verification ${isVerified ? 'enabled' : 'disabled'} successfully!`);
    } catch (err: any) {
      console.error('Error updating verification:', err);
      alert(err.message || 'Failed to update verification status');
    }
  };

  // Edit offer form handlers
  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setEditNewImages(prev => [...prev, ...fileArray]);
  };

  const handleEditRemoveExistingImage = (imageUrl: string) => {
    setEditExistingImages(prev => prev.filter(img => img !== imageUrl));
    setEditRemovedImages(prev => [...prev, imageUrl]);
  };

  const handleEditRemoveNewImage = (index: number) => {
    setEditNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditAddTag = () => {
    if (editTagInput.trim() && !editFormData.tags.includes(editTagInput.trim())) {
      setEditFormData(prev => ({
        ...prev,
        tags: [...prev.tags, editTagInput.trim()]
      }));
      setEditTagInput('');
    }
  };

  const handleEditRemoveTag = (tagToRemove: string) => {
    setEditFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleEditSave = async () => {
    try {
      setEditSaving(true);

      if (!editingOffer) {
        alert('No offer to save');
        return;
      }

      // Prepare the updated offer data
      const updatedOfferData = {
        ...editFormData,
        images: editExistingImages.filter(img => !editRemovedImages.includes(img)),
        updatedAt: new Date().toISOString()
      };

      // Update the offer (admin mode)
      await updateOffer(editingOffer.id, updatedOfferData, editNewImages, true);

      // Refresh the offers list to get the latest data including updated images
      const refreshedOffers = await getAllOffersForAdmin();
      setOffers(refreshedOffers);

      alert('Offer updated successfully!');
      setShowEditOfferModal(false);
      setEditingOffer(null);
    } catch (err: any) {
      console.error('Error saving offer:', err);
      alert(err.message || 'Failed to save offer');
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = () => {
    setShowEditOfferModal(false);
    setEditingOffer(null);
    setEditFormData({
      title: '',
      description: '',
      category: '',
      currentPrice: 0,
      originalPrice: 0,
      quantity: 0,
      unit: '',
      location: '',
      minOrderQuantity: 0,
      shippingEstimateDays: 0,
      tags: [],
      status: 'pending',
      type: 'clearance'
    });
    setEditExistingImages([]);
    setEditNewImages([]);
    setEditRemovedImages([]);
    setEditTagInput('');
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.supplier.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.offerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || offer.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'price':
        aValue = a.currentPrice;
        bValue = b.currentPrice;
        break;
      case 'uploadDate':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'views':
        aValue = a.views || 0;
        bValue = b.views || 0;
        break;
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Photo modal handlers
  const handlePhotoClick = (imageUrl: string, index: number) => {
    setSelectedPhoto(imageUrl);
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto('');
    setSelectedPhotoIndex(0);
  };

  const handlePreviousPhoto = () => {
    if (offerDetails && selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(offerDetails.images[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (offerDetails && selectedPhotoIndex < offerDetails.images.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(newIndex);
      setSelectedPhoto(offerDetails.images[newIndex]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Expired</span>;
      case 'sold':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sold</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const hkDate = convertToHKTime(dateString);
      return formatHKDate(hkDate);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const hkDate = convertToHKTime(timestamp);
      const now = convertToHKTime(new Date().toISOString());
      const diffInHours = (now.getTime() - hkDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return formatHKDate(hkDate);
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  };

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  if (!adminUser) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading offers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchOffers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
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
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <Package className="h-5 w-5" />
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
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <FileText className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Invoice Management</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/hk/admin/marketing');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <TrendingUp className="h-5 w-5 group-hover:text-blue-600" />
                  <span>Marketing</span>
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
                <p className="text-sm font-medium text-gray-900 truncate">{adminUser.username}</p>
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
                <Package className="h-5 w-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Offers Management</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {sortedOffers.length} offers
              </div>
              <button
                onClick={handleRefreshOffers}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title="Refresh offers"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportOffers}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Export offers"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={handleOpenCompanyLogoModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Manage company logos"
              >
                <Building className="h-5 w-5" />
              </button>
            </div>
                      </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedOffers.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedOffers.length} offer{selectedOffers.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBulkStatusUpdate('active')}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('rejected')}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleBulkStatusUpdate('expired')}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                    >
                      Mark Expired
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOffers([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

                  {/* Content */}
          <div className="p-3 md:p-6">
            {/* Filters */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="sold">Sold</option>
                </select>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{sortedOffers.length} offers</span>
                </div>

                {/* Display Mode Switcher */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setDisplayMode('grid')}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        displayMode === 'grid'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Grid View"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDisplayMode('list')}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        displayMode === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

                      {/* Offers Display */}
            {displayMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedOffers.map((offer) => (
                  <div key={offer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    {/* Offer Image */}
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={offer.images[0]}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <select
                          value={offer.status || 'pending'}
                          onChange={(e) => handleStatusUpdate(offer.id, e.target.value as 'active' | 'pending' | 'rejected' | 'expired' | 'sold')}
                          className="text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                          <option value="sold">Sold</option>
                        </select>
                      </div>
                      <div className="absolute top-3 right-3">
                        <button className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                      {offer.originalPrice > offer.currentPrice && (
                        <div className="absolute bottom-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {calculateDiscount(offer.originalPrice, offer.currentPrice)}% OFF
                        </div>
                      )}
                    </div>

                    {/* Offer Details */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{offer.title}</h3>
                      </div>
                      
                      {/* Offer ID */}
                      <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded mb-3 inline-block">
                        ID: {offer.offerId || `oid${offer.id.slice(-6)}`}
                      </div>
                      
                      {/* Description hidden for cleaner admin interface */}
                      {/* <p className="text-sm text-gray-600 mb-3 line-clamp-2">{offer.description}</p> */}
                      
                      {/* Price */}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(offer.currentPrice)}</span>
                        {offer.originalPrice > offer.currentPrice && (
                          <span className="text-sm text-gray-500 line-through">{formatCurrency(offer.originalPrice)}</span>
                        )}
                      </div>

                      {/* Supplier Info */}
                      <div className="flex items-center space-x-2 mb-3">
                        {offer.supplier.logo ? (
                          <img
                            src={offer.supplier.logo}
                            alt={`${offer.supplier.company} logo`}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {offer.supplier.company.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{offer.supplier.company}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500 truncate">Verified: {offer.supplier.isVerified ? 'Yes' : 'No'}</p>
                            <SellerRatingDisplay 
                              sellerId={offer.supplierId} 
                              showCount={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-medium">
                            {offer.status === 'sold' ? 'Sold Out' : offer.quantity.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Min Order:</span>
                          <span className="font-medium">{offer.minOrderQuantity}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Location:</span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{offer.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Shipping:</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{offer.shippingEstimateDays} days</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <span>{offer.views || 0} views</span>
                          <span>{offer.favorites || 0} favorites</span>
                        </div>
                        <span>{formatTime(offer.createdAt || new Date().toISOString())}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewOffer(offer.id)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleEditOffer(offer.id)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedOffers.length === filteredOffers.length && filteredOffers.length > 0}
                              onChange={handleSelectAll}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Offer
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Price</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('views')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Views</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                          onClick={() => handleSort('uploadDate')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Upload Date</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedOffers.map((offer) => (
                        <tr key={offer.id} className="hover:bg-gray-50">
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOffers.includes(offer.id)}
                              onChange={() => handleSelectOffer(offer.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-16 w-16">
                                <img
                                  className="h-16 w-16 rounded-lg object-cover"
                                  src={offer.images[0]}
                                  alt={offer.title}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-xs md:text-sm font-medium text-gray-900">{offer.title}</div>
                                <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                                  ID: {offer.offerId || `oid${offer.id.slice(-6)}`}
                                </div>
                                {/* Description hidden for cleaner admin interface */}
                                {/* <div className="text-sm text-gray-500 line-clamp-2">{offer.description}</div> */}
                                <div className="flex items-center mt-1">
                                  <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-500">{offer.location}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="text-xs md:text-sm font-medium text-gray-900">{formatCurrency(offer.currentPrice)}</div>
                            {offer.originalPrice > offer.currentPrice && (
                              <div className="text-sm text-gray-500 line-through">{formatCurrency(offer.originalPrice)}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              {offer.status === 'sold' ? 'Sold Out' : `Qty: ${offer.quantity.toLocaleString()}`}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {offer.supplier.logo ? (
                                <img
                                  src={offer.supplier.logo}
                                  alt={`${offer.supplier.company} logo`}
                                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {offer.supplier.company.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="ml-3">
                                <div className="text-xs md:text-sm font-medium text-gray-900">{offer.supplier.company}</div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-xs md:text-sm text-gray-500">Verified: {offer.supplier.isVerified ? 'Yes' : 'No'}</div>
                                  <SellerRatingDisplay 
                                    sellerId={offer.supplierId} 
                                    showCount={true}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            {getStatusBadge(offer.status || 'pending')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{offer.views || 0} views</div>
                            <div className="text-gray-500">{offer.favorites || 0} favorites</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{formatDate(offer.createdAt || new Date().toISOString())}</div>
                            <div className="text-xs">{formatTime(offer.createdAt || new Date().toISOString())}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleViewOffer(offer.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Offer"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleEditOffer(offer.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit Offer"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Offer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedOffers.length}</span> of{' '}
              <span className="font-medium">{offers.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Details Modal */}
      {showOfferDetails && offerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Offer Details</h3>
              <button
                onClick={() => setShowOfferDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Images ({offerDetails.images.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {offerDetails.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => handlePhotoClick(image, index)}
                        >
                          <img
                            src={image}
                            alt={`${offerDetails.title} - Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-white bg-opacity-90 rounded-full p-2">
                                <Eye className="h-4 w-4 text-gray-700" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Title:</span>
                          <p className="text-sm font-medium">{offerDetails.title}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Offer ID:</span>
                          <p className="text-sm font-medium font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                            {offerDetails.offerId || `oid${offerDetails.id.slice(-6)}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Description:</span>
                          <p className="text-sm">{offerDetails.description}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Category:</span>
                          <p className="text-sm font-medium">{offerDetails.category}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Location:</span>
                          <p className="text-sm font-medium">{offerDetails.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Current Price:</span>
                          <span className="text-sm font-medium">{formatCurrency(offerDetails.currentPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Original Price:</span>
                          <span className="text-sm font-medium">{formatCurrency(offerDetails.originalPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Discount:</span>
                          <span className="text-sm font-medium text-red-600">
                            {calculateDiscount(offerDetails.originalPrice, offerDetails.currentPrice)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Inventory */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Inventory</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Quantity:</span>
                          <span className="text-sm font-medium">{offerDetails.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Min Order:</span>
                          <span className="text-sm font-medium">{offerDetails.minOrderQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Unit:</span>
                          <span className="text-sm font-medium">{offerDetails.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Supplier */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Supplier Information</h4>
                      <div className="space-y-3">
                        {/* Company Logo and Basic Info */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {offerDetails.supplier.logo ? (
                            <img
                              src={offerDetails.supplier.logo}
                              alt={`${offerDetails.supplier.company} logo`}
                              className="h-12 w-12 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {offerDetails.supplier.company.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-gray-900">{offerDetails.supplier.company}</h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                offerDetails.supplier.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {offerDetails.supplier.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                              <span className="text-xs text-gray-500">Rating: {offerDetails.supplier.rating}/5</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <span className="text-xs text-gray-500">Email:</span>
                            <p className="text-sm font-medium text-blue-600">
                              {'email' in offerDetails.supplier ? offerDetails.supplier.email || 'N/A' : 'N/A'}
                            </p>
                        </div>
                          <div>
                            <span className="text-xs text-gray-500">Phone:</span>
                            <p className="text-sm font-medium">
                              {'phone' in offerDetails.supplier ? offerDetails.supplier.phone || 'N/A' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Address:</span>
                            <p className="text-sm font-medium">
                              {'address' in offerDetails.supplier ? offerDetails.supplier.address || 'N/A' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Website:</span>
                            <p className="text-sm font-medium text-blue-600">
                              {'website' in offerDetails.supplier && offerDetails.supplier.website ? (
                                <a href={offerDetails.supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {offerDetails.supplier.website}
                                </a>
                              ) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Business Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-gray-500">Business Type:</span>
                            <p className="text-sm font-medium">
                              {'businessType' in offerDetails.supplier ? offerDetails.supplier.businessType || 'N/A' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Industry:</span>
                            <p className="text-sm font-medium">
                              {'industry' in offerDetails.supplier ? offerDetails.supplier.industry || 'N/A' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Company Size:</span>
                            <p className="text-sm font-medium">
                              {'companySize' in offerDetails.supplier ? offerDetails.supplier.companySize || 'N/A' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">BR Number:</span>
                            <p className="text-sm font-medium">
                              {'brNumber' in offerDetails.supplier ? offerDetails.supplier.brNumber || 'N/A' : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Company Bio */}
                        {'companyBio' in offerDetails.supplier && offerDetails.supplier.companyBio && (
                          <div>
                            <span className="text-xs text-gray-500">Company Bio:</span>
                            <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded border">
                              {offerDetails.supplier.companyBio}
                            </p>
                          </div>
                        )}

                        {/* Social Media */}
                        {'socialMedia' in offerDetails.supplier && offerDetails.supplier.socialMedia && (
                          <div>
                            <span className="text-xs text-gray-500">Social Media:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {offerDetails.supplier.socialMedia.facebook && (
                                <a href={offerDetails.supplier.socialMedia.facebook} target="_blank" rel="noopener noreferrer" 
                                   className="text-xs text-blue-600 hover:underline">Facebook</a>
                              )}
                              {offerDetails.supplier.socialMedia.instagram && (
                                <a href={offerDetails.supplier.socialMedia.instagram} target="_blank" rel="noopener noreferrer" 
                                   className="text-xs text-pink-600 hover:underline">Instagram</a>
                              )}
                              {offerDetails.supplier.socialMedia.linkedin && (
                                <a href={offerDetails.supplier.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" 
                                   className="text-xs text-blue-700 hover:underline">LinkedIn</a>
                              )}
                              {offerDetails.supplier.socialMedia.tiktok && (
                                <a href={offerDetails.supplier.socialMedia.tiktok} target="_blank" rel="noopener noreferrer" 
                                   className="text-xs text-black hover:underline">TikTok</a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Account Information */}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs text-gray-500">Joined Date:</span>
                              <p className="text-sm font-medium">
                                {'joinedDate' in offerDetails.supplier && offerDetails.supplier.joinedDate 
                                  ? formatDate(offerDetails.supplier.joinedDate) 
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Account Status:</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                'status' in offerDetails.supplier && offerDetails.supplier.status === 'active' ? 'bg-green-100 text-green-800' : 
                                'status' in offerDetails.supplier && offerDetails.supplier.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                'status' in offerDetails.supplier && offerDetails.supplier.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {'status' in offerDetails.supplier ? offerDetails.supplier.status || 'Active' : 'Active'}
                          </span>
                        </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Views:</span>
                          <span className="text-sm font-medium">{offerDetails.views || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Favorites:</span>
                          <span className="text-sm font-medium">{offerDetails.favorites || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Created:</span>
                          <span className="text-sm font-medium">{formatDate(offerDetails.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowOfferDetails(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowOfferDetails(null);
                  handleEditOffer(offerDetails.id);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Edit Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Logo Management Modal */}
      {showCompanyLogoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Company Logo Management</h3>
              <button
                onClick={() => setShowCompanyLogoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading users...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Manage company logos for all users. Upload new logos or delete existing ones.
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {/* Company Logo Display */}
                          <div className="flex-shrink-0">
                            {user.companyLogo ? (
                              <img
                                src={user.companyLogo}
                                alt={user.company}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                <Building className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{user.company}</h4>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.isVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleLogoUpload(user.id, file);
                                  }
                                }}
                                className="hidden"
                                disabled={logoUploadLoading === user.id}
                              />
                              <div className="flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md cursor-pointer disabled:opacity-50">
                                {logoUploadLoading === user.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Camera className="h-3 w-3" />
                                    <span>Upload Logo</span>
                                  </>
                                )}
                              </div>
                            </label>
                            
                            {user.companyLogo && (
                              <button
                                onClick={() => handleLogoDelete(user.id)}
                                disabled={logoUploadLoading === user.id}
                                className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
                              >
                                {logoUploadLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Verification Toggle */}
                          <button
                            onClick={() => handleVerificationToggle(user.id, !user.isVerified)}
                            className={`w-full px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                              user.isVerified
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {user.isVerified ? 'Remove Verification' : 'Verify User'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCompanyLogoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {showEditOfferModal && editingOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Offer</h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Offer Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Offer Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => handleEditInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter offer title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => handleEditInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Price (HKD) *
                      </label>
                      <input
                        type="number"
                        value={editFormData.currentPrice}
                        onChange={(e) => handleEditInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (HKD) *
                      </label>
                      <input
                        type="number"
                        value={editFormData.originalPrice}
                        onChange={(e) => handleEditInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={editFormData.quantity}
                        onChange={(e) => handleEditInputChange('quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={editFormData.unit}
                        onChange={(e) => handleEditInputChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., pieces, kg, units"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Quantity *
                      </label>
                      <input
                        type="number"
                        value={editFormData.minOrderQuantity}
                        onChange={(e) => handleEditInputChange('minOrderQuantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) => handleEditInputChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Estimate (Days) *
                      </label>
                      <input
                        type="number"
                        value={editFormData.shippingEstimateDays}
                        onChange={(e) => handleEditInputChange('shippingEstimateDays', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => handleEditInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => handleEditInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter detailed description"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editFormData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleEditRemoveTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editTagInput}
                        onChange={(e) => setEditTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleEditAddTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a tag and press Enter"
                      />
                      <button
                        type="button"
                        onClick={handleEditAddTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Images</h4>
                  
                  {/* Existing Images */}
                  {editExistingImages.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {editExistingImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Offer image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleEditRemoveExistingImage(image)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images */}
                  {editNewImages.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">New Images</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {editNewImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleEditRemoveNewImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add New Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleEditImageUpload(e.target.files)}
                        className="hidden"
                        id="edit-image-upload"
                      />
                      <label
                        htmlFor="edit-image-upload"
                        className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm"
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        Choose Images
                      </label>
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Supplier Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={editingOffer.supplier.company}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Status
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          editingOffer.supplier.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {editingOffer.supplier.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Logo
                      </label>
                      <div className="flex items-center space-x-3">
                        {editingOffer.supplier.logo ? (
                          <img
                            src={editingOffer.supplier.logo}
                            alt={editingOffer.supplier.company}
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <Building className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm text-gray-500">
                          {editingOffer.supplier.logo ? 'Logo uploaded' : 'No logo uploaded'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= editingOffer.supplier.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-500 ml-2">
                          ({editingOffer.supplier.rating}/5)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center space-x-2"
              >
                {editSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {showPhotoModal && selectedPhoto && offerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-7xl max-h-[90vh] w-full mx-4">
            {/* Close button */}
            <button
              onClick={handleClosePhotoModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation buttons */}
            {offerDetails.images.length > 1 && (
              <>
                {/* Previous button */}
                {selectedPhotoIndex > 0 && (
                  <button
                    onClick={handlePreviousPhoto}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Next button */}
                {selectedPhotoIndex < offerDetails.images.length - 1 && (
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}

            {/* Main image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={selectedPhoto}
                alt={`${offerDetails.title} - Image ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {/* Photo counter */}
            {offerDetails.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                {selectedPhotoIndex + 1} / {offerDetails.images.length}
              </div>
            )}

            {/* Thumbnail strip */}
            {offerDetails.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto">
                {offerDetails.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedPhoto(image);
                      setSelectedPhotoIndex(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === selectedPhotoIndex 
                        ? 'border-white' 
                        : 'border-transparent hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 