import React from 'react';
import { X, User, Package, ShoppingCart, FileText, Building, Mail, Phone, MapPin, Calendar, DollarSign, Eye } from 'lucide-react';

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
}

export default function ActivityDetailsModal({ isOpen, onClose, activity }: ActivityDetailsModalProps) {
  if (!isOpen || !activity) return null;

  const renderUserDetails = (userData: any) => {
    if (!userData) return <p className="text-gray-500">No user data available</p>;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Company</p>
                <p className="text-lg font-semibold text-gray-900">{userData.company || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">{userData.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-sm text-gray-900">{userData.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-sm text-gray-900">{userData.location || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Joined Date</p>
                <p className="text-sm text-gray-900">{userData.joinedDate ? new Date(userData.joinedDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Total Offers</p>
                <p className="text-sm text-gray-900">{userData.totalOffers || 0}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Total Purchases</p>
                <p className="text-sm text-gray-900">{userData.totalPurchases || 0}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Verification Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  userData.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  userData.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  userData.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userData.verificationStatus || 'Not Submitted'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {userData.industry && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Business Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Industry:</span> {userData.industry}</div>
              <div><span className="font-medium">Company Size:</span> {userData.companySize || 'N/A'}</div>
              <div><span className="font-medium">Business Type:</span> {userData.businessType || 'N/A'}</div>
              <div><span className="font-medium">BR Number:</span> {userData.brNumber || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOfferDetails = (offerData: any) => {
    if (!offerData) return <p className="text-gray-500">No offer data available</p>;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Title</p>
              <p className="text-lg font-semibold text-gray-900">{offerData.title || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="text-sm text-gray-900">{offerData.description || 'N/A'}</p>
            </div>

            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Price</p>
                <p className="text-lg font-semibold text-green-600">HK${offerData.price || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Quantity</p>
                <p className="text-sm text-gray-900">{offerData.quantity || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Supplier</p>
                <p className="text-sm text-gray-900">{offerData.supplierName || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Created Date</p>
                <p className="text-sm text-gray-900">{offerData.createdAt ? new Date(offerData.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  offerData.status === 'active' ? 'bg-green-100 text-green-800' :
                  offerData.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                  offerData.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {offerData.status || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Category</p>
                <p className="text-sm text-gray-900">{offerData.category || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {offerData.images && offerData.images.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {offerData.images.slice(0, 4).map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`Offer image ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPurchaseDetails = (purchaseData: any) => {
    if (!purchaseData) return <p className="text-gray-500">No purchase data available</p>;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Purchase ID</p>
              <p className="text-sm font-mono text-gray-900">{purchaseData.id || 'N/A'}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Amount</p>
                <p className="text-lg font-semibold text-yellow-600">HK${purchaseData.amount || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Quantity</p>
                <p className="text-sm text-gray-900">{purchaseData.quantity || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Buyer</p>
                <p className="text-sm text-gray-900">{purchaseData.buyerName || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Seller</p>
                <p className="text-sm text-gray-900">{purchaseData.sellerName || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Purchase Date</p>
                <p className="text-sm text-gray-900">{purchaseData.createdAt ? new Date(purchaseData.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  purchaseData.status === 'approved' ? 'bg-green-100 text-green-800' :
                  purchaseData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  purchaseData.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {purchaseData.status || 'Unknown'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Offer Title</p>
              <p className="text-sm text-gray-900">{purchaseData.offerTitle || 'N/A'}</p>
            </div>
          </div>
        </div>

        {purchaseData.deliveryDetails && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Contact Person:</span> {purchaseData.deliveryDetails.contactPersonName || 'N/A'}</div>
              <div><span className="font-medium">Phone:</span> {purchaseData.deliveryDetails.contactPersonPhone || 'N/A'}</div>
              <div className="md:col-span-2"><span className="font-medium">Address:</span> {purchaseData.deliveryDetails.address1 || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'user':
        return <User className="h-6 w-6 text-blue-600" />;
      case 'offer':
        return <Package className="h-6 w-6 text-green-600" />;
      case 'transaction':
        return <ShoppingCart className="h-6 w-6 text-yellow-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'user':
        return 'blue';
      case 'offer':
        return 'green';
      case 'transaction':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const color = getActivityColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-${color}-100 rounded-full`}>
              {getActivityIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activity.title}</h2>
              <p className="text-sm text-gray-600">{activity.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Activity ID: {activity.id}</span>
              <span>{new Date(activity.timestamp).toLocaleString()}</span>
            </div>
            {activity.status && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                  activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  activity.status === 'pending_review' ? 'bg-orange-100 text-orange-800' :
                  activity.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            {activity.type === 'user' && renderUserDetails(activity.userData)}
            {activity.type === 'offer' && renderOfferDetails(activity.offerData)}
            {activity.type === 'transaction' && renderPurchaseDetails(activity.purchaseData)}
            {!['user', 'offer', 'transaction'].includes(activity.type) && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No detailed data available for this activity type.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
