import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateCompanyLogo, updateCompanyCoverPhoto, deleteCompanyCoverPhoto } from '../services/firebaseService';
import { formatPhoneForDisplay, filterPhoneInput } from '../utils/phoneUtils';
import { isCurrentUserPage } from '../utils/slugUtils';
import ContactPersonCard from './ContactPersonCard';
import AddContactCard from './AddContactCard';
import DeliveryAddressCard from './DeliveryAddressCard';
import AddDeliveryAddressCard from './AddDeliveryAddressCard';
import { 
  Building, 
  Shield, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Clock,
  Camera,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  Edit3,
  Save,
  X,
  User,
  Briefcase,
  Hash,
  Facebook,
  Instagram,
  Linkedin,
  Plus,
  UserPlus,
  CreditCard,
  Phone,
  Smartphone,
  Eye
} from 'lucide-react';

export default function CompanySettingsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverPhotoUploading, setIsCoverPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [contactPersons, setContactPersons] = useState(user?.contactPersons || []);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({});
  const [deliveryAddresses, setDeliveryAddresses] = useState(user?.deliveryAddresses || []);
  const [isAddingDeliveryAddress, setIsAddingDeliveryAddress] = useState(false);
  const [editingDeliveryAddress, setEditingDeliveryAddress] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef(user);

  // 檢查用戶權限
  const isAuthorized = user && userId && isCurrentUserPage(user.id, userId);

  // 如果用戶未授權，重定向到登入頁面
  useEffect(() => {
    if (user && userId && !isAuthorized) {
      navigate('/hk/login');
    }
  }, [user, userId, isAuthorized, navigate]);

  // Update user ref when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Handle company logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('請選擇有效的圖片文件');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片文件大小不能超過 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const downloadURL = await updateCompanyLogo(user.id, file);
      await updateUser({ companyLogo: downloadURL });
      console.log('Company logo updated successfully');
    } catch (error) {
      console.error('Error updating company logo:', error);
      alert('上傳公司標誌失敗，請重試');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle company cover photo upload
  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('請選擇有效的圖片文件');
      return;
    }

    // Validate file size (max 10MB for cover photos)
    if (file.size > 10 * 1024 * 1024) {
      alert('封面照片文件大小不能超過 10MB');
      return;
    }

    setIsCoverPhotoUploading(true);
    try {
      const downloadURL = await updateCompanyCoverPhoto(user.id, file);
      await updateUser({ companyCoverPhoto: downloadURL });
      alert('公司封面照片更新成功！');
    } catch (error) {
      console.error('Error updating company cover photo:', error);
      alert('上傳公司封面照片失敗，請重試');
    } finally {
      setIsCoverPhotoUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle cover photo delete
  const handleCoverPhotoDelete = async () => {
    if (!user) return;
    
    if (!confirm('確定要刪除封面照片嗎？')) {
      return;
    }

    setIsCoverPhotoUploading(true);
    try {
      await deleteCompanyCoverPhoto(user.id);
      await updateUser({ companyCoverPhoto: '' });
      alert('封面照片已刪除');
    } catch (error) {
      console.error('Error deleting company cover photo:', error);
      alert('刪除封面照片失敗，請重試');
    } finally {
      setIsCoverPhotoUploading(false);
    }
  };


  // Load uploaded files from user data
  useEffect(() => {
    if (user?.verificationDocuments) {
      const files: { [key: string]: string } = {};
      Object.entries(user.verificationDocuments).forEach(([key, value]) => {
        if (typeof value === 'string') {
          files[key] = value;
        }
      });
      setUploadedFiles(files);
    }
  }, [user?.verificationDocuments]);

  // Update contactPersons when user data changes
  useEffect(() => {
    if (user?.contactPersons) {
      setContactPersons(user.contactPersons);
    }
  }, [user?.contactPersons]);

  // Update deliveryAddresses when user data changes
  useEffect(() => {
    if (user?.deliveryAddresses) {
      setDeliveryAddresses(user.deliveryAddresses);
    }
  }, [user?.deliveryAddresses]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    company: user?.company || '',
    businessType: user?.businessType || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    companyBio: user?.companyBio || '',
    website: user?.website || '',
    address: user?.address || '',
    phone: user?.phone || '',
    brNumber: user?.brNumber || '',
    socialMedia: {
      facebook: user?.socialMedia?.facebook || '',
      instagram: user?.socialMedia?.instagram || '',
      linkedin: user?.socialMedia?.linkedin || '',
      tiktok: user?.socialMedia?.tiktok || ''
    }
  });

  // Bank form data
  const [bankFormData, setBankFormData] = useState({
    bankName: user?.bankDetails?.bankName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    accountHolderName: user?.bankDetails?.accountHolderName || '',
    branchCode: user?.bankDetails?.branchCode || '',
    fpsId: user?.bankDetails?.fpsId || '',
    paymeId: user?.bankDetails?.paymeId || ''
  });

  // Bank editing state
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);

  // Contact management states
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<{
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    department: string;
    photo?: string;
  } | null>(null);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setCompanyFormData({
        company: user.company || '',
        businessType: user.businessType || '',
        industry: user.industry || '',
        companySize: user.companySize || '',
        companyBio: user.companyBio || '',
        website: user.website || '',
        address: user.address || '',
        phone: user.phone || '',
        brNumber: user.brNumber || '',
        socialMedia: {
          facebook: user?.socialMedia?.facebook || '',
          instagram: user?.socialMedia?.instagram || '',
          linkedin: user?.socialMedia?.linkedin || '',
          tiktok: user?.socialMedia?.tiktok || ''
        }
      });

      setBankFormData({
        bankName: user?.bankDetails?.bankName || '',
        accountNumber: user?.bankDetails?.accountNumber || '',
        accountHolderName: user?.bankDetails?.accountHolderName || '',
        branchCode: user?.bankDetails?.branchCode || '',
        fpsId: user?.bankDetails?.fpsId || '',
        paymeId: user?.bankDetails?.paymeId || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      await updateUser(companyFormData);
      setIsEditing(false);
      console.log('Company data saved successfully');
    } catch (error) {
      console.error('Error saving company data:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle bank details save
  const handleSaveBankDetails = async () => {
    if (!user) return;

    try {
      const updatedBankDetails = {
        bankDetails: {
          bankName: bankFormData.bankName,
          accountNumber: bankFormData.accountNumber,
          accountHolderName: bankFormData.accountHolderName,
          branchCode: bankFormData.branchCode,
          fpsId: bankFormData.fpsId,
          paymeId: bankFormData.paymeId
        }
      };

      await updateUser(updatedBankDetails);
      setIsEditingBankDetails(false);
      console.log('Bank details updated successfully');
    } catch (error) {
      console.error('Error updating bank details:', error);
    }
  };

  // Handle contact management

  const handleDeleteContact = async (contactId: string) => {
    if (!user) return;
    
    try {
      const updatedContacts = contactPersons.filter(c => c.id !== contactId);
      await updateUser({ contactPersons: updatedContacts });
      setContactPersons(updatedContacts);
      console.log('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleAddContact = async (contactData: any) => {
    if (!user) return;
    
    try {
      // Clean the contact data to remove undefined values
      const cleanContactData = {
        id: contactData.id,
        name: contactData.name || '',
        title: contactData.title || '',
        email: contactData.email || '',
        phone: contactData.phone || '',
        department: contactData.department || '',
        photo: contactData.photo || null
      };
      
      const updatedContacts = [...contactPersons, cleanContactData];
      await updateUser({ contactPersons: updatedContacts });
      setContactPersons(updatedContacts);
      setIsAddingContact(false);
      console.log('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleUpdateContact = async (contactData: any) => {
    if (!user) return;
    
    try {
      // Clean the contact data to remove undefined values
      const cleanContactData = {
        id: contactData.id,
        name: contactData.name || '',
        title: contactData.title || '',
        email: contactData.email || '',
        phone: contactData.phone || '',
        department: contactData.department || '',
        photo: contactData.photo || null
      };
      
      const updatedContacts = contactPersons.map(c => 
        c.id === contactData.id ? cleanContactData : c
      );
      
      await updateUser({ contactPersons: updatedContacts });
      setContactPersons(updatedContacts);
      setEditingContact(null);
      console.log('Contact updated successfully');
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
  };

  const handleCancelAdd = () => {
    setIsAddingContact(false);
  };

  // Delivery Address Management Functions
  const handleAddDeliveryAddress = async (addressData: any) => {
    if (!user) return;
    
    try {
      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        district: addressData.district,
        subdivision: addressData.subdivision,
        address1: addressData.address1,
        address2: addressData.address2 || undefined,
        contactPersonName: addressData.contactPersonName,
        contactPersonPhone: addressData.contactPersonPhone,
        isDefault: addressData.isDefault || false,
        createdAt: new Date().toISOString()
      };

      let updatedAddresses = [...deliveryAddresses, newAddress];
      
      // If this is set as default, remove default from others
      if (addressData.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === newAddress.id
        }));
      }
      
      await updateUser({ deliveryAddresses: updatedAddresses });
      setDeliveryAddresses(updatedAddresses);
      setIsAddingDeliveryAddress(false);
      console.log('Delivery address added successfully');
    } catch (error) {
      console.error('Error adding delivery address:', error);
    }
  };

  const handleUpdateDeliveryAddress = async (id: string, updatedData: any) => {
    if (!user) return;
    
    try {
      const updatedAddresses = deliveryAddresses.map(addr => 
        addr.id === id ? { ...addr, ...updatedData } : addr
      );
      
      await updateUser({ deliveryAddresses: updatedAddresses });
      setDeliveryAddresses(updatedAddresses);
      setEditingDeliveryAddress(null);
      console.log('Delivery address updated successfully');
    } catch (error) {
      console.error('Error updating delivery address:', error);
    }
  };

  const handleDeleteDeliveryAddress = async (id: string) => {
    if (!user) return;
    
    try {
      const updatedAddresses = deliveryAddresses.filter(addr => addr.id !== id);
      await updateUser({ deliveryAddresses: updatedAddresses });
      setDeliveryAddresses(updatedAddresses);
      console.log('Delivery address deleted successfully');
    } catch (error) {
      console.error('Error deleting delivery address:', error);
    }
  };

  const handleSetDefaultDeliveryAddress = async (id: string) => {
    if (!user) return;
    
    try {
      const updatedAddresses = deliveryAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      
      await updateUser({ deliveryAddresses: updatedAddresses });
      setDeliveryAddresses(updatedAddresses);
      console.log('Default delivery address updated successfully');
    } catch (error) {
      console.error('Error setting default delivery address:', error);
    }
  };

  const handleEditDeliveryAddress = (id: string) => {
    setEditingDeliveryAddress(id);
  };

  const handleCancelEditDeliveryAddress = () => {
    setEditingDeliveryAddress(null);
  };

  const handleCancelAddDeliveryAddress = () => {
    setIsAddingDeliveryAddress(false);
  };

  const handleFileSelect = (fileType: string) => {
    if (fileInputRefs.current[fileType]) {
      fileInputRefs.current[fileType]?.click();
    }
  };

  const handleFileChange = async (fileType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingFiles(prev => ({ ...prev, [fileType]: true }));
    
    try {
      const fileName = `vertify/${user.id}/${fileType}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setUploadedFiles(prev => ({ ...prev, [fileType]: downloadURL }));
      
      // Update user data with verification submission timestamp
      const updates: any = {};
      updates[`verificationDocuments.${fileType}`] = downloadURL;
      updates.verificationSubmittedAt = new Date().toISOString();
      updates.verificationStatus = 'pending';
      await updateUser(updates);
      
      console.log(`${fileType} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleRemoveFile = async (fileType: string) => {
    if (!user || !uploadedFiles[fileType]) return;
    
    try {
      // Remove from Firebase Storage
      const storageRef = ref(storage, uploadedFiles[fileType]);
      await deleteObject(storageRef);
      
      // Remove from local state
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fileType];
        return newFiles;
      });
      
      // Update user data
      const updates: any = {};
      updates[`verificationDocuments.${fileType}`] = null;
      await updateUser(updates);
      
      console.log(`${fileType} removed successfully`);
    } catch (error) {
      console.error(`Error removing ${fileType}:`, error);
    }
  };


  if (!user || !isAuthorized) {
      return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入用戶資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
              {/* Cover Photo Section */}
              <div className="mb-6">
                <div className="relative group">
                  <div 
                    className="relative h-32 rounded-xl overflow-hidden cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700"
                    onClick={() => document.getElementById('cover-photo-upload-input')?.click()}
                  >
                    {user.companyCoverPhoto ? (
                      <img
                        src={user.companyCoverPhoto}
                        alt="Company Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <Camera className="h-8 w-8 mx-auto mb-2 opacity-70" />
                          <p className="text-sm opacity-70">點擊上傳封面照片</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay with upload icon */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white bg-opacity-90 rounded-full p-2">
                          <Camera className="h-5 w-5 text-gray-700" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete button for existing cover photo */}
                    {user.companyCoverPhoto && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoverPhotoDelete();
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors duration-200"
                        disabled={isCoverPhotoUploading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    
                    {/* Upload Loading Indicator */}
                    {isCoverPhotoUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                          <p className="text-xs">上傳中...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    id="cover-photo-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverPhotoUpload}
                    disabled={isCoverPhotoUploading}
                  />
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('logo-upload-input')?.click()}>
                  {user.companyLogo ? (
                    <img
                      src={user.companyLogo}
                      alt={user.company}
                      className="w-24 h-24 rounded-2xl mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                      {user.company.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                  
                  {/* Small Upload Icon in Top Right Corner */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 group-hover:scale-110">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  
                  {/* Upload Loading Indicator */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                        <span className="text-xs">上傳中...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Hidden File Input */}
                  <input
                    id="logo-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">{user.company}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                
                {/* Simple Upload Hint */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    點擊標誌區域上傳新標誌
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>狀態: {user.verificationStatus === 'approved' ? '已認證' : user.verificationStatus === 'pending' ? '審核中' : user.verificationStatus === 'rejected' ? '認證失敗' : '未認證'}</span>
                </div>
                {user.status === 'inactive' && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">帳戶狀態: 非活躍</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>加入時間: {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : '未知'}</span>
                </div>
              </div>

              {/* Company Profile Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/hk/company/${user.id}`)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-colors duration-200 font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>查看公司檔案</span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  查看您的公開公司檔案
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap gap-2 px-4 py-3 sm:px-6 sm:py-4">
                  {[
                    { id: 'company', label: '公司信息', icon: Building },
                    { id: 'contact', label: '聯繫人', icon: User },
                    { id: 'delivery', label: '送貨地址', icon: MapPin },
                    { id: 'banking', label: '銀行詳情', icon: CreditCard },
                    { id: 'documents', label: '文件', icon: FileText }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-2.5 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.length > 4 ? tab.label.substring(0, 4) : tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {/* Company Information Tab */}
                {activeTab === 'company' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">公司信息</h2>
                        <p className="text-gray-600">管理您的公司詳細信息和業務信息</p>
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>編輯</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            disabled={isUploading}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            <span>{isUploading ? '保存中...' : '保存'}</span>
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                          >
                            <X className="h-4 w-4" />
                            <span>取消</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <Building className="h-4 w-4 mr-2 text-blue-600" />
                          公司名稱
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={companyFormData.company}
                            onChange={(e) => setCompanyFormData(prev => ({ ...prev, company: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.company || '未設置'}
                          </div>
                        )}
                      </div>

                      {/* Business Type */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                          商業類型
                        </label>
                        {isEditing ? (
                                                     <select 
                             value={companyFormData.businessType}
                             onChange={(e) => setCompanyFormData(prev => ({ ...prev, businessType: e.target.value }))}
                             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                           >
                             <option value="">選擇商業類型</option>
                             <option value="有限公司">有限公司 (Limited Company)</option>
                             <option value="無限公司">無限公司 (Unlimited Company)</option>
                             <option value="擔保有限公司">擔保有限公司 (Company Limited by Guarantee)</option>
                             <option value="海外公司">海外公司 (Overseas Company)</option>
                             <option value="獨資經營">獨資經營 (Sole Proprietorship)</option>
                             <option value="合夥經營">合夥經營 (Partnership)</option>
                             <option value="分支機構">分支機構 (Branch Office)</option>
                             <option value="代表辦事處">代表辦事處 (Representative Office)</option>
                           </select>
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.businessType || '未設置'}
                          </div>
                        )}
                      </div>

                      {/* Industry */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                          行業
                        </label>
                        {isEditing ? (
                                                       <select 
                             value={companyFormData.industry}
                             onChange={(e) => setCompanyFormData(prev => ({ ...prev, industry: e.target.value }))}
                             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                           >
                             <option value="">選擇行業</option>
                             <option value="電子產品">電子產品 (Electronics)</option>
                             <option value="電腦及配件">電腦及配件 (Computers & Accessories)</option>
                             <option value="手機及配件">手機及配件 (Mobile Phones & Accessories)</option>
                             <option value="家電">家電 (Home Appliances)</option>
                             <option value="服裝及鞋類">服裝及鞋類 (Clothing & Footwear)</option>
                             <option value="時尚配飾">時尚配飾 (Fashion Accessories)</option>
                             <option value="珠寶首飾">珠寶首飾 (Jewelry & Watches)</option>
                             <option value="食品及飲料">食品及飲料 (Food & Beverages)</option>
                             <option value="家居用品">家居用品 (Home & Garden)</option>
                             <option value="傢俱">傢俱 (Furniture)</option>
                             <option value="化妝品及護膚">化妝品及護膚 (Cosmetics & Skincare)</option>
                             <option value="玩具及遊戲">玩具及遊戲 (Toys & Games)</option>
                             <option value="運動用品">運動用品 (Sports & Outdoor)</option>
                             <option value="汽車配件">汽車配件 (Automotive Parts)</option>
                             <option value="建築材料">建築材料 (Building Materials)</option>
                             <option value="工業設備">工業設備 (Industrial Equipment)</option>
                             <option value="醫療用品">醫療用品 (Medical Supplies)</option>
                             <option value="辦公用品">辦公用品 (Office Supplies)</option>
                             <option value="其他">其他 (Others)</option>
                           </select>
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.industry || '未設置'}
                          </div>
                        )}
                      </div>

                      {/* Company Size */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          公司規模
                        </label>
                        {isEditing ? (
                          <select 
                            value={companyFormData.companySize}
                            onChange={(e) => setCompanyFormData(prev => ({ ...prev, companySize: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                          >
                            <option value="">選擇公司規模</option>
                            <option value="1-10人">1-10人</option>
                            <option value="11-50人">11-50人</option>
                            <option value="51-200人">51-200人</option>
                            <option value="201-500人">201-500人</option>
                            <option value="500人以上">500人以上</option>
                          </select>
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.companySize || '未設置'}
                          </div>
                        )}
                      </div>

                      {/* Company Bio/Introduction */}
                      <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-600" />
                          公司簡介
                        </label>
                        {isEditing ? (
                          <textarea
                            value={companyFormData.companyBio}
                            onChange={(e) => setCompanyFormData(prev => ({ ...prev, companyBio: e.target.value }))}
                            placeholder="請介紹您的公司，包括業務範圍、特色、優勢等..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200 resize-none"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium min-h-[100px]">
                            {user.companyBio ? (
                              <div className="whitespace-pre-wrap">{user.companyBio}</div>
                            ) : (
                              <span className="text-gray-500">未設置</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-blue-600" />
                          網站
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={companyFormData.website}
                            onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.website || '未設置'}
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          地址
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={companyFormData.address}
                            onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="公司地址"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.address || '未設置'}
                          </div>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-blue-600" />
                          電話
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={companyFormData.phone}
                            onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: filterPhoneInput(e.target.value) }))}
                            placeholder="+852 1234 5678"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                            {user.phone ? formatPhoneForDisplay(user.phone) : '未設置'}
                          </div>
                        )}
                      </div>

                                             {/* BR Number */}
                       <div>
                         <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                           <Hash className="h-4 w-4 mr-2 text-blue-600" />
                           商業登記號
                         </label>
                         {isEditing ? (
                           <input
                             type="text"
                             value={companyFormData.brNumber}
                             onChange={(e) => setCompanyFormData(prev => ({ ...prev, brNumber: e.target.value }))}
                             placeholder="BR號碼"
                             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                           />
                         ) : (
                           <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                             {user.brNumber || '未設置'}
                           </div>
                         )}
                       </div>

                       {/* Social Media Links */}
                       <div className="md:col-span-2">
                         <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                           <Globe className="h-4 w-4 mr-2 text-blue-600" />
                           社交媒體鏈接
                         </label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Facebook */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                               <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                               Facebook
                             </label>
                             {isEditing ? (
                               <input
                                 type="url"
                                 value={companyFormData.socialMedia.facebook}
                                 onChange={(e) => setCompanyFormData(prev => ({ 
                                   ...prev, 
                                   socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                                 }))}
                                 placeholder="https://facebook.com/yourcompany"
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                               />
                             ) : (
                               <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                                 {user.socialMedia?.facebook || '未設置'}
                               </div>
                             )}
                           </div>

                           {/* Instagram */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                               <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                               Instagram
                             </label>
                             {isEditing ? (
                               <input
                                 type="url"
                                 value={companyFormData.socialMedia.instagram}
                                 onChange={(e) => setCompanyFormData(prev => ({ 
                                   ...prev, 
                                   socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                                 }))}
                                 placeholder="https://instagram.com/yourcompany"
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                               />
                             ) : (
                               <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                                 {user.socialMedia?.instagram || '未設置'}
                               </div>
                             )}
                           </div>

                           {/* LinkedIn */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                               <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                               LinkedIn
                             </label>
                             {isEditing ? (
                               <input
                                 type="url"
                                 value={companyFormData.socialMedia.linkedin}
                                 onChange={(e) => setCompanyFormData(prev => ({ 
                                   ...prev, 
                                   socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                                 }))}
                                 placeholder="https://linkedin.com/company/yourcompany"
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                               />
                             ) : (
                               <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                                 {user.socialMedia?.linkedin || '未設置'}
                               </div>
                             )}
                           </div>

                           {/* TikTok */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                               <div className="w-4 h-4 mr-2 bg-black rounded flex items-center justify-center">
                                 <span className="text-white text-xs font-bold">T</span>
                               </div>
                               TikTok
                             </label>
                             {isEditing ? (
                               <input
                                 type="url"
                                 value={companyFormData.socialMedia.tiktok}
                                 onChange={(e) => setCompanyFormData(prev => ({ 
                                   ...prev, 
                                   socialMedia: { ...prev.socialMedia, tiktok: e.target.value }
                                 }))}
                                 placeholder="https://tiktok.com/@yourcompany"
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                               />
                             ) : (
                               <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                                 {user.socialMedia?.tiktok || '未設置'}
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}


                {/* Other tabs can be added here */}
                                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">聯繫人管理</h3>
                        <p className="text-gray-600">管理您的公司聯繫人信息</p>
                      </div>
                      <button
                        onClick={() => setIsAddingContact(true)}
                        disabled={contactPersons.length >= 2}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center ${
                          contactPersons.length >= 2
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        添加聯繫人
                        <span className="ml-2 text-sm">({contactPersons.length}/2)</span>
                      </button>
                    </div>

                    {/* Contact Persons List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Add Contact Card */}
                      {isAddingContact && (
                        <AddContactCard
                          onAdd={handleAddContact}
                          onCancel={handleCancelAdd}
                        />
                      )}
                      
                      {/* Existing Contact Cards */}
                      {contactPersons.map((contact) => (
                        <ContactPersonCard
                          key={contact.id}
                          contact={contact}
                          onUpdate={handleUpdateContact}
                          onDelete={handleDeleteContact}
                          isEditing={editingContact?.id === contact.id}
                          onEdit={handleEditContact}
                          onCancelEdit={handleCancelEdit}
                        />
                      ))}
                    </div>

                    {/* Empty State */}
                    {contactPersons.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">暫無聯繫人</h3>
                        <p className="text-gray-600">點擊上方按鈕添加您的第一個聯繫人</p>
                      </div>
                    )}

                  </div>
                )}

                {/* Delivery Address Tab */}
                {activeTab === 'delivery' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">送貨地址管理</h3>
                        <p className="text-gray-600">管理您的送貨地址和聯絡人信息</p>
                      </div>
                      <button
                        onClick={() => setIsAddingDeliveryAddress(true)}
                        className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加送貨地址
                      </button>
                    </div>

                    {/* Delivery Addresses List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Add Delivery Address Card */}
                      {isAddingDeliveryAddress && (
                        <AddDeliveryAddressCard
                          onAdd={handleAddDeliveryAddress}
                          onCancel={handleCancelAddDeliveryAddress}
                        />
                      )}
                      
                      {/* Existing Delivery Address Cards */}
                      {deliveryAddresses.map((address) => (
                        <DeliveryAddressCard
                          key={address.id}
                          address={address}
                          onUpdate={handleUpdateDeliveryAddress}
                          onDelete={handleDeleteDeliveryAddress}
                          onSetDefault={handleSetDefaultDeliveryAddress}
                          isEditing={editingDeliveryAddress === address.id}
                          onEdit={() => handleEditDeliveryAddress(address.id)}
                          onCancelEdit={handleCancelEditDeliveryAddress}
                        />
                      ))}
                    </div>

                    {/* Empty State */}
                    {deliveryAddresses.length === 0 && (
                      <div className="text-center py-12">
                        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">暫無送貨地址</h3>
                        <p className="text-gray-600">點擊上方按鈕添加您的第一個送貨地址</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'banking' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">銀行詳情</h3>
                        <p className="text-gray-600">管理您的銀行賬戶和支付信息</p>
                      </div>
                      <button
                        onClick={() => setIsEditingBankDetails(!isEditingBankDetails)}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center ${
                          isEditingBankDetails
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isEditingBankDetails ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            取消
                          </>
                        ) : (
                          <>
                                                         <Edit3 className="h-4 w-4 mr-2" />
                            編輯
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bank Name */}
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                            <Building className="h-4 w-4 mr-2 text-blue-600" />
                            銀行名稱
                          </label>
                          {isEditingBankDetails ? (
                            <input
                              type="text"
                              value={bankFormData.bankName}
                              onChange={(e) => setBankFormData(prev => ({ ...prev, bankName: e.target.value }))}
                              placeholder="例如：匯豐銀行"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                              {user.bankDetails?.bankName || '未設置'}
                            </div>
                          )}
                        </div>

                        {/* Account Number */}
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                            <Hash className="h-4 w-4 mr-2 text-blue-600" />
                            賬戶號碼
                          </label>
                          {isEditingBankDetails ? (
                            <input
                              type="text"
                              value={bankFormData.accountNumber}
                              onChange={(e) => setBankFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                              placeholder="例如：123-456789-001"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                              {user.bankDetails?.accountNumber || '未設置'}
                            </div>
                          )}
                        </div>

                        {/* Account Holder Name */}
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-600" />
                            賬戶持有人姓名
                          </label>
                          {isEditingBankDetails ? (
                            <input
                              type="text"
                              value={bankFormData.accountHolderName}
                              onChange={(e) => setBankFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                              placeholder="例如：張三"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                              {user.bankDetails?.bankName || '未設置'}
                            </div>
                          )}
                        </div>

                        {/* Branch Code */}
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                            分行代碼
                          </label>
                          {isEditingBankDetails ? (
                            <input
                              type="text"
                              value={bankFormData.branchCode}
                              onChange={(e) => setBankFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                              placeholder="例如：001"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                              {user.bankDetails?.branchCode || '未設置'}
                            </div>
                          )}
                        </div>

                        {/* FPS ID */}
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                            <Smartphone className="h-4 w-4 mr-2 text-blue-600" />
                            FPS ID
                          </label>
                          {isEditingBankDetails ? (
                            <input
                              type="text"
                              value={bankFormData.fpsId}
                              onChange={(e) => setBankFormData(prev => ({ ...prev, fpsId: e.target.value }))}
                              placeholder="例如：12345678"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                              {user.bankDetails?.fpsId || '未設置'}
                            </div>
                            )}
                          </div>

                        {/* PayMe ID */}
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                            PayMe ID
                          </label>
                          {isEditingBankDetails ? (
                            <input
                              type="text"
                              value={bankFormData.paymeId}
                              onChange={(e) => setBankFormData(prev => ({ ...prev, paymeId: e.target.value }))}
                              placeholder="例如：payme123456"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                              {user.bankDetails?.paymeId || '未設置'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      {isEditingBankDetails && (
                        <div className="mt-8 flex justify-end">
                          <button
                            onClick={handleSaveBankDetails}
                            className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            保存銀行詳情
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">文件管理</h3>
                        <p className="text-gray-600">管理您的公司驗證文件</p>
                      </div>
                    </div>

                    {/* Verification Status */}
                    {user?.verificationStatus && (
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">驗證狀態</h4>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.verificationStatus === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : user.verificationStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : user.verificationStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.verificationStatus === 'approved' && '已批准'}
                            {user.verificationStatus === 'rejected' && '已拒絕'}
                            {user.verificationStatus === 'pending' && '審核中'}
                            {user.verificationStatus === 'not_submitted' && '未提交'}
                          </div>
                        </div>
                        
                        {user.verificationStatus === 'approved' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 text-green-800">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">驗證成功</span>
                            </div>
                            <p className="text-green-700 text-sm mt-1">
                              您的公司已通過驗證，可以正常使用所有功能
                            </p>
                          </div>
                        )}

                        {user.verificationStatus === 'rejected' && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 text-red-800">
                              <AlertCircle className="h-5 w-5" />
                              <span className="font-medium">驗證被拒絕</span>
                            </div>
                            <p className="text-red-700 text-sm mt-1">
                              請檢查您的文件並重新提交
                            </p>
                          </div>
                        )}

                        {user.verificationStatus === 'pending' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 text-yellow-800">
                              <Clock className="h-5 w-5" />
                              <span className="font-medium">審核中</span>
                            </div>
                            <p className="text-yellow-700 text-sm mt-1">
                              您的文件正在審核中，請耐心等待
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Document Upload Section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-6">上傳驗證文件</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Business Registration (BR) */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors duration-200">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-2">商業登記文件 (BR)</h5>
                            <p className="text-gray-600 text-sm mb-4">上傳您的商業登記證書</p>
                            
                            {uploadedFiles.businessRegistration ? (
                              <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>文件已上傳</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveFile('businessRegistration')}
                                  className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm"
                                >
                                  移除文件
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect('businessRegistration')}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                              >
                                {uploadingFiles.businessRegistration ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>上傳中...</span>
                                  </div>
                                ) : (
                                  '選擇文件'
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Company Registration (CR) */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors duration-200">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-8 w-8 text-green-600" />
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-2">公司註冊文件 (CR)</h5>
                            <p className="text-gray-600 text-sm mb-4">上傳您的公司註冊證書</p>
                            
                            {uploadedFiles.companyRegistration ? (
                              <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>文件已上傳</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveFile('companyRegistration')}
                                  className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm"
                                >
                                  移除文件
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect('companyRegistration')}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                              >
                                {uploadingFiles.companyRegistration ? (
                                  <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>上傳中...</span>
                                  </div>
                                ) : (
                                  '選擇文件'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Upload Progress */}
                      {(uploadingFiles.businessRegistration || uploadingFiles.companyRegistration) && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-blue-800">
                            <Upload className="h-5 w-5" />
                            <span className="font-medium">文件上傳中...</span>
                          </div>
                          <p className="text-blue-700 text-sm mt-1">
                            請勿關閉頁面，上傳完成後會自動保存
                          </p>
                        </div>
                      )}

                      {/* Submission Status */}
                      {user?.verificationStatus === 'not_submitted' && 
                       (uploadedFiles.businessRegistration || uploadedFiles.companyRegistration) && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-yellow-800">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">準備提交驗證</span>
                          </div>
                          <p className="text-yellow-700 text-sm mt-1">
                            您已上傳驗證文件，請等待管理員審核
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                      ref={(el) => fileInputRefs.current.businessRegistration = el}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('businessRegistration', e)}
                      className="hidden"
                    />
                    <input
                      ref={(el) => fileInputRefs.current.companyRegistration = el}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('companyRegistration', e)}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}