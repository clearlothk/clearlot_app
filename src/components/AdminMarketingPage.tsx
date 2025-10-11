import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  Search,
  Filter,
  TrendingUp,
  UserPlus,
  Building2,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  Plus,
  Edit,
  DollarSign,
  LogOut
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface RecommendPartyData {
  partyCode: string;
  partyName: string;
  registeredAccounts: number;
  commissionRate: number; // Commission rate per account (e.g., 0.05 for 5%)
  totalCommission: number; // Total commission amount
  users: Array<{
    id: string;
    email: string;
    company: string;
    joinedDate: string;
    status: string;
  }>;
}

export default function AdminMarketingPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendParties, setRecommendParties] = useState<RecommendPartyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'accounts' | 'date'>('accounts');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedParty, setExpandedParty] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [newPartyData, setNewPartyData] = useState({
    partyCode: '',
    partyName: '',
    commissionRate: 0.05 // Default 5%
  });

  // Helper function to format date for display
  const formatDateRange = () => {
    if (!startDate && !endDate) return 'All Time';
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const end = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    }
    if (startDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return `From ${start}`;
    }
    if (endDate) {
      const end = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return `Until ${end}`;
    }
    return 'All Time';
  };

  // Helper function to check if date is within range
  const isDateInRange = (dateString: string) => {
    if (!startDate && !endDate) return true;
    
    const userDate = new Date(dateString);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      return userDate >= start && userDate <= end;
    }
    if (start) {
      return userDate >= start;
    }
    if (end) {
      return userDate <= end;
    }
    return true;
  };

  // Reusable function to fetch recommend party data
  const fetchRecommendPartyData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Get recommend parties from Firestore
      const partiesRef = collection(db, 'recommendParties');
      const partiesSnapshot = await getDocs(partiesRef);
      
      const parties = partiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Get all users with recommendedParty field
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('joinedDate', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Group users by recommendedParty and calculate totals
      const partyMap = new Map<string, RecommendPartyData>();
      
      // Initialize parties from Firestore
      parties.forEach(party => {
        partyMap.set(party.partyCode, {
          partyCode: party.partyCode,
          partyName: party.partyName,
          registeredAccounts: 0,
          commissionRate: party.commissionRate || 0.05,
          totalCommission: 0,
          users: []
        });
      });
      
      // Count users for each party with date range filtering
      users.forEach(user => {
        if (user.recommendedParty && user.recommendedParty.trim() !== '') {
          const partyCode = user.recommendedParty;
          
          // Check if user joined within the selected date range
          if (!isDateInRange(user.joinedDate)) {
            return;
          }
          
          if (!partyMap.has(partyCode)) {
            // Create new party if not in Firestore
            partyMap.set(partyCode, {
              partyCode,
              partyName: `Party ${partyCode}`,
              registeredAccounts: 0,
              commissionRate: 0.05, // Default 5%
              totalCommission: 0,
              users: []
            });
          }
          
          const partyData = partyMap.get(partyCode)!;
          partyData.registeredAccounts++;
          partyData.users.push({
            id: user.id,
            email: user.email,
            company: user.company,
            joinedDate: user.joinedDate,
            status: user.status || 'active'
          });
        }
      });

      // Calculate total commission for each party
      partyMap.forEach(party => {
        party.totalCommission = party.registeredAccounts * party.commissionRate;
      });

      // Convert map to array and sort
      const partiesArray = Array.from(partyMap.values());
      setRecommendParties(partiesArray);
      
    } catch (error) {
      console.error('Error fetching recommend party data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Fetch recommend party data on initial load
  useEffect(() => {
    fetchRecommendPartyData();
  }, []);

  // Handle date range changes with smooth updates
  useEffect(() => {
    if (recommendParties.length > 0) {
      // If we already have data, just filter it without showing loading
      fetchRecommendPartyData(false);
    }
  }, [startDate, endDate]);

  // Filter and sort parties
  const filteredAndSortedParties = recommendParties
    .filter(party => 
      party.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.partyCode.includes(searchTerm)
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.partyName.localeCompare(b.partyName);
          break;
        case 'accounts':
          comparison = a.registeredAccounts - b.registeredAccounts;
          break;
        case 'date':
          const aLatestDate = Math.max(...a.users.map(u => new Date(u.joinedDate).getTime()));
          const bLatestDate = Math.max(...b.users.map(u => new Date(u.joinedDate).getTime()));
          comparison = aLatestDate - bLatestDate;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalRegisteredAccounts = recommendParties.reduce((sum, party) => sum + party.registeredAccounts, 0);
  const totalParties = recommendParties.length;

  const togglePartyExpansion = (partyCode: string) => {
    setExpandedParty(expandedParty === partyCode ? null : partyCode);
  };

  // Create new recommend party
  const handleCreateParty = async () => {
    try {
      if (!newPartyData.partyCode || !newPartyData.partyName) {
        alert('Please fill in party code and name');
        return;
      }

      // Check if party code already exists
      const existingParty = recommendParties.find(p => p.partyCode === newPartyData.partyCode);
      if (existingParty) {
        alert('Party code already exists');
        return;
      }

      // Add to Firestore
      await addDoc(collection(db, 'recommendParties'), {
        partyCode: newPartyData.partyCode,
        partyName: newPartyData.partyName,
        commissionRate: newPartyData.commissionRate,
        createdAt: new Date().toISOString()
      });

      // Reset form and close modal
      setNewPartyData({
        partyCode: '',
        partyName: '',
        commissionRate: 0.05
      });
      setShowCreateModal(false);

      // Refresh data without page reload
      await fetchRecommendPartyData();
    } catch (error) {
      console.error('Error creating recommend party:', error);
      alert('Failed to create recommend party');
    }
  };

  // Update commission rate
  const handleUpdateCommission = async (partyCode: string, newRate: number) => {
    try {
      // Find the party in Firestore and update
      const partiesRef = collection(db, 'recommendParties');
      const partiesSnapshot = await getDocs(partiesRef);
      
      let partyDocId = null;
      partiesSnapshot.docs.forEach(doc => {
        if (doc.data().partyCode === partyCode) {
          partyDocId = doc.id;
        }
      });

      if (partyDocId) {
        await updateDoc(doc(db, 'recommendParties', partyDocId), {
          commissionRate: newRate
        });
      } else {
        // If party doesn't exist in Firestore, create it
        await addDoc(collection(db, 'recommendParties'), {
          partyCode,
          partyName: recommendParties.find(p => p.partyCode === partyCode)?.partyName || `Party ${partyCode}`,
          commissionRate: newRate,
          createdAt: new Date().toISOString()
        });
      }

      setEditingCommission(null);
      
      // Update the local state immediately for better UX
      setRecommendParties(prevParties => 
        prevParties.map(party => 
          party.partyCode === partyCode 
            ? { 
                ...party, 
                commissionRate: newRate, 
                totalCommission: party.registeredAccounts * newRate 
              }
            : party
        )
      );
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission rate');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
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
              className="text-white lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
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
                  <MessageSquare className="h-5 w-5 group-hover:text-blue-600" />
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
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <TrendingUp className="h-5 w-5 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Handle logout
                navigate('/hk/admin/login');
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
                  <TrendingUp className="h-5 w-5" />
                </button>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Marketing - Recommend Parties</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Recommend Party</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
                  <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Recommend Parties</p>
                        <p className="text-3xl font-bold text-gray-900">{totalParties}</p>
                        <p className="text-sm text-green-600 mt-1">Active parties</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Registered Accounts</p>
                        <p className="text-3xl font-bold text-gray-900">{totalRegisteredAccounts}</p>
                        <p className="text-sm text-green-600 mt-1">From recommend parties</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Accounts per Party</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {totalParties > 0 ? Math.round(totalRegisteredAccounts / totalParties) : 0}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">Registration efficiency</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Commission</p>
                        <p className="text-3xl font-bold text-gray-900">
                          HK${recommendParties.reduce((sum, party) => sum + party.totalCommission, 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">All parties combined</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
                  <div className="flex flex-col gap-4">
                    {/* Search Bar */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search by party name or code..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Date Range and Sort Controls */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Date Range Filters */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex flex-col">
                          <label className="text-xs font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              setStartDate('');
                              setEndDate('');
                            }}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      
                      {/* Sort Controls */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'accounts' | 'date')}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="accounts">Sort by Accounts</option>
                          <option value="name">Sort by Name</option>
                          <option value="date">Sort by Latest Registration</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {sortOrder === 'asc' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommend Parties List */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recommend Parties</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {filteredAndSortedParties.length} of {totalParties} parties
                      {(startDate || endDate) && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {formatDateRange()}
                        </span>
                      )}
                    </p>
                  </div>

                  {filteredAndSortedParties.length === 0 ? (
                    <div className="p-8 text-center">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recommend parties found</h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search criteria.' : 
                         (startDate || endDate) ? `No users registered with recommend party codes in the selected date range (${formatDateRange()}).` :
                         'No users have registered with recommend party codes yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredAndSortedParties.map((party) => (
                        <div key={party.partyCode} className="p-4 md:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{party.partyName}</h4>
                                  <p className="text-sm text-gray-600">Code: {party.partyCode}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{party.registeredAccounts}</p>
                                <p className="text-sm text-gray-600">Registered Accounts</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center space-x-2">
                                  {editingCommission === party.partyCode ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="1"
                                        defaultValue={party.commissionRate}
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            const newRate = parseFloat((e.target as HTMLInputElement).value);
                                            if (newRate >= 0 && newRate <= 1) {
                                              handleUpdateCommission(party.partyCode, newRate);
                                            }
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const newRate = parseFloat(e.target.value);
                                          if (newRate >= 0 && newRate <= 1) {
                                            handleUpdateCommission(party.partyCode, newRate);
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => setEditingCommission(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {(party.commissionRate * 100).toFixed(1)}%
                                      </span>
                                      <button
                                        onClick={() => setEditingCommission(party.partyCode)}
                                        className="text-blue-600 hover:text-blue-700"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">Commission Rate</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">HK${party.totalCommission.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">Total Commission</p>
                              </div>
                              <button
                                onClick={() => togglePartyExpansion(party.partyCode)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View Details</span>
                                {expandedParty === party.partyCode ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedParty === party.partyCode && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h5 className="text-md font-semibold text-gray-900 mb-4">Registered Users</h5>
                              <div className="bg-gray-50 rounded-lg p-4">
                                {party.users.length === 0 ? (
                                  <p className="text-gray-600 text-center py-4">No users registered yet</p>
                                ) : (
                                  <div className="space-y-3">
                                    {party.users.map((user) => (
                                      <div key={user.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center space-x-4">
                                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-gray-600" />
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900">{user.company}</p>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-gray-600">
                                            Joined: {new Date(user.joinedDate).toLocaleDateString()}
                                          </p>
                                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            user.status === 'active' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {user.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create New Party Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Recommend Party</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Code
                </label>
                <input
                  type="text"
                  value={newPartyData.partyCode}
                  onChange={(e) => setNewPartyData({...newPartyData, partyCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 0002"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name
                </label>
                <input
                  type="text"
                  value={newPartyData.partyName}
                  onChange={(e) => setNewPartyData({...newPartyData, partyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. TechCorp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newPartyData.commissionRate * 100}
                  onChange={(e) => setNewPartyData({...newPartyData, commissionRate: parseFloat(e.target.value) / 100})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5.0"
                />
                <p className="text-xs text-gray-500 mt-1">Enter percentage, e.g. 5.0 means 5%</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateParty}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
