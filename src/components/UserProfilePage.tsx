import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserById, getOffersByUserId } from '../services/firebaseService';
import { AuthUser, Offer } from '../types';
import { 
  Store, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  Heart,
  Eye,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<AuthUser | null>(null);
  const [userOffers, setUserOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'offers'>('profile');

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserOffers();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await getUserById(userId!);
      if (user) {
        setProfileUser(user);
      } else {
        setError('用戶不存在');
      }
    } catch (err: any) {
      setError(err.message || '獲取用戶資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOffers = async () => {
    try {
      if (userId) {
        const offers = await getOffersByUserId(userId);
        setUserOffers(offers);
      }
    } catch (err: any) {
      console.error('獲取用戶優惠失敗:', err);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入用戶資料中...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-6">{error || '用戶不存在'}</p>
          <button
            onClick={() => navigate('/hk/marketplace')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            返回市場
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/hk/marketplace')}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <TrendingUp className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">用戶資料</h1>
            </div>
            {isOwnProfile && (
              <Link
                to="/hk/company-settings"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                編輯資料
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {profileUser.companyLogo ? (
                <img
                  src={profileUser.companyLogo}
                  alt={profileUser.company}
                  className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                  {profileUser.company.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{profileUser.company}</h2>
                {profileUser.isVerified && (
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    已認證
                  </div>
                )}
              </div>
              
              {profileUser.name && (
                <p className="text-lg text-gray-600 mb-2">負責人: {profileUser.name}</p>
              )}
              
              <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {profileUser.email}
                </div>
                {profileUser.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {profileUser.phone}
                  </div>
                )}
                {profileUser.address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profileUser.address}
                  </div>
                )}
              </div>

              {profileUser.industry && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Building className="h-4 w-4 mr-1" />
                    {profileUser.industry}
                  </span>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                <Calendar className="h-4 w-4 inline mr-1" />
                加入時間: {new Date(profileUser.joinedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              公司資料
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === 'offers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              優惠商品 ({userOffers.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">詳細資料</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Company Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  公司資訊
                </h4>
                <div className="space-y-3">
                  {profileUser.businessType && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">業務類型:</span>
                      <p className="text-gray-900">{profileUser.businessType}</p>
                    </div>
                  )}
                  {profileUser.companySize && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">公司規模:</span>
                      <p className="text-gray-900">{profileUser.companySize}</p>
                    </div>
                  )}
                  {profileUser.brNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">商業登記號:</span>
                      <p className="text-gray-900 font-mono">{profileUser.brNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  聯絡資訊
                </h4>
                <div className="space-y-3">
                  {profileUser.website && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">網站:</span>
                      <a 
                        href={profileUser.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {profileUser.website}
                      </a>
                    </div>
                  )}
                  {profileUser.socialMedia && Object.values(profileUser.socialMedia).some(Boolean) && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">社交媒體:</span>
                      <div className="flex space-x-2 mt-1">
                        {profileUser.socialMedia.facebook && (
                          <a href={profileUser.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            Facebook
                          </a>
                        )}
                        {profileUser.socialMedia.instagram && (
                          <a href={profileUser.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
                            Instagram
                          </a>
                        )}
                        {profileUser.socialMedia.linkedin && (
                          <a href={profileUser.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Persons */}
            {profileUser.contactPersons && profileUser.contactPersons.length > 0 && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">聯絡人</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileUser.contactPersons.map((person, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        {person.photo ? (
                          <img
                            src={person.photo}
                            alt={person.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {person.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.title}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">{person.email}</p>
                        <p className="text-gray-600">{person.phone}</p>
                        {person.department && (
                          <p className="text-gray-600">部門: {person.department}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">優惠商品</h3>
            
            {userOffers.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">暫無優惠商品</h4>
                <p className="text-gray-600">此用戶尚未上傳任何優惠商品</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userOffers.map((offer) => (
                  <div key={offer.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Image */}
                    <div className="relative h-48">
                      {offer.images && offer.images.length > 0 ? (
                        <img
                          src={offer.images[0]}
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-lg">
                          -{Math.round(((offer.originalPrice - offer.currentPrice) / offer.originalPrice) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                        {offer.title}
                      </h4>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          ${offer.currentPrice.toLocaleString()}
                        </span>
                        <span className="text-sm line-through text-gray-500">
                          ${offer.originalPrice.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          <span>{offer.quantity.toLocaleString()} {offer.unit}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{offer.location}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/hk/marketplace?offer=${offer.id}`)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                      >
                        查看詳情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 