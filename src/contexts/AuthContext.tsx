import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, RegisterData } from '../types';
import { auth } from '../config/firebase';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  updateUserData 
} from '../services/firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitialized: boolean;
  addToWatchlist: (offerId: string) => void;
  removeFromWatchlist: (offerId: string) => void;
  removeMultipleFromWatchlist: (offerIds: string[]) => void;
  removeSoldOutOffers: (offerIds: string[]) => void;
  isInWatchlist: (offerId: string) => boolean;
  addPurchase: (purchaseId: string) => void;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('❌ useAuth called outside AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('🔐 AuthProvider: Initializing...');

  useEffect(() => {
    console.log('🔐 AuthProvider: Setting up auth state listener...');
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔐 AuthProvider: Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await getCurrentUser();
          if (userData) {
            console.log('🔐 AuthProvider: User data loaded:', userData.id);
            setUser(userData);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const userData = await loginUser(credentials);
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const userData = await registerUser(data);
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    
    try {
      await updateUserData(user.id, updates);
      setUser({ ...user, ...updates });
    } catch (error: any) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const addToWatchlist = async (offerId: string) => {
    if (!user) return;
    
    // Check if offer is already in watchlist to prevent duplicates
    if (user.watchlist && user.watchlist.includes(offerId)) {
      console.log('Offer already in watchlist, skipping add');
      return;
    }
    
    // Check if user is trying to add their own offer to watchlist
    try {
      const { getOffers } = await import('../services/firebaseService');
      const offers = await getOffers();
      const offer = offers.find(o => o.id === offerId);
      if (offer && offer.supplierId === user.id) {
        console.log('Cannot add own offer to watchlist');
        return;
      }
    } catch (error) {
      console.error('Error checking offer ownership:', error);
      return;
    }
    
    try {
      const updatedWatchlist = [...(user.watchlist || []), offerId];
      await updateUser({ watchlist: updatedWatchlist });
      
      // Send watchlist added notification
      try {
        const { notificationService } = await import('../services/notificationService');
        // Get offer title for notification
        const { getOffers } = await import('../services/firebaseService');
        const offers = await getOffers();
        const offer = offers.find(o => o.id === offerId);
        if (offer) {
          await notificationService.triggerWatchlistAdded(user.id, offer.title, offerId);
          console.log('Watchlist added notification sent');
        }
      } catch (notificationError) {
        console.log('Could not send watchlist added notification:', notificationError);
      }
    } catch (error) {
      console.error('Add to watchlist error:', error);
    }
  };

  const removeFromWatchlist = async (offerId: string) => {
    if (!user) return;
    
    try {
      const updatedWatchlist = (user.watchlist || []).filter(id => id !== offerId);
      await updateUser({ watchlist: updatedWatchlist });
    } catch (error) {
      console.error('Remove from watchlist error:', error);
    }
  };

  // Remove multiple offers from watchlist (for system operations)
  const removeMultipleFromWatchlist = async (offerIds: string[]) => {
    if (!user) return;
    
    try {
      const updatedWatchlist = (user.watchlist || []).filter(id => !offerIds.includes(id));
      await updateUser({ watchlist: updatedWatchlist });
    } catch (error) {
      console.error('Remove multiple from watchlist error:', error);
    }
  };

  // Remove sold out offers from watchlist (for real-time cleanup)
  const removeSoldOutOffers = async (offerIds: string[]) => {
    if (!user) return;
    
    try {
      const updatedWatchlist = (user.watchlist || []).filter(id => !offerIds.includes(id));
      if (updatedWatchlist.length !== (user.watchlist || []).length) {
        console.log(`Removing ${(user.watchlist || []).length - updatedWatchlist.length} sold out offers from user watchlist`);
        await updateUser({ watchlist: updatedWatchlist });
      }
    } catch (error) {
      console.error('Remove sold out offers error:', error);
    }
  };

  const isInWatchlist = (offerId: string): boolean => {
    return (user?.watchlist || []).includes(offerId);
  };

  const addPurchase = async (purchaseId: string) => {
    if (!user) return;
    
    try {
      const updatedPurchaseHistory = [...(user.purchaseHistory || []), purchaseId];
      await updateUser({ purchaseHistory: updatedPurchaseHistory });
    } catch (error) {
      console.error('Add purchase error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isInitialized,
    addToWatchlist,
    removeFromWatchlist,
    removeMultipleFromWatchlist,
    removeSoldOutOffers,
    isInWatchlist,
    addPurchase,
    updateUser
  };

  console.log('🔐 AuthProvider: Rendering with user:', user ? user.id : 'null', 'isLoading:', isLoading);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};