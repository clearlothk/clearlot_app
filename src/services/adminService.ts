import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthUser, AdminLoginCredentials } from '../types';

// Admin login function
export const adminLogin = async (credentials: AdminLoginCredentials): Promise<AuthUser> => {
  try {
    // First, authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      credentials.email, 
      credentials.password
    );

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('用戶資料不存在');
    }

    const userData = userDoc.data() as AuthUser;

    // Check if user is admin
    if (!userData.isAdmin) {
      // Sign out the user if they're not admin
      await firebaseSignOut(auth);
      throw new Error('您沒有管理員權限');
    }

    return {
      id: userCredential.user.uid,
      ...userData
    };
  } catch (error: any) {
    console.error('Admin login error:', error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('找不到此電子郵件的帳戶');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('密碼錯誤');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('無效的電子郵件地址');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('嘗試次數過多。請稍後再試');
    } else if (error.message === '您沒有管理員權限') {
      throw new Error('您沒有管理員權限');
    } else {
      throw new Error('登入失敗。請重試');
    }
  }
};

// Admin logout function
export const adminLogout = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Admin logout error:', error);
    throw new Error('登出失敗。請重試');
  }
};

// Check if current user is admin
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data() as AuthUser;
    return userData.isAdmin === true;
  } catch (error) {
    console.error('Check admin status error:', error);
    return false;
  }
};

// Update user admin status (for super admin use)
export const updateUserAdminStatus = async (
  userId: string, 
  isAdmin: boolean
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isAdmin: isAdmin
    });
  } catch (error) {
    console.error('Update admin status error:', error);
    throw new Error('更新管理員狀態失敗');
  }
};

// Get ClearLot admin user ID
export const getClearLotAdminId = async (): Promise<string | null> => {
  try {
    // Query users collection to find admin user
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isAdmin', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Return the first admin user's ID
      const adminDoc = querySnapshot.docs[0];
      return adminDoc.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting ClearLot admin ID:', error);
    return null;
  }
}; 