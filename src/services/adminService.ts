import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
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

    // For admin users, automatically mark email as verified and update last login
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      emailVerified: true,
      status: 'active',
      lastLogin: new Date().toISOString()
    });

    console.log('✅ Admin login successful, email verification bypassed for admin user');

    return {
      id: userCredential.user.uid,
      ...userData,
      emailVerified: true, // Ensure admin is marked as verified
      status: 'active'
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

// Create official admin account
export const createOfficialAdmin = async (): Promise<void> => {
  try {
    const OFFICIAL_ADMIN_EMAIL = 'support@clearlot.app';
    const OFFICIAL_ADMIN_PASSWORD = 'cl777888';
    
    console.log('🚀 开始创建官方管理员账户...');
    
    // Check if account already exists
    try {
      await signInWithEmailAndPassword(auth, OFFICIAL_ADMIN_EMAIL, OFFICIAL_ADMIN_PASSWORD);
      console.log('✅ 官方管理员账户已存在');
      return;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 创建新的官方管理员账户...');
      } else {
        throw error;
      }
    }
    
    // Create new user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      OFFICIAL_ADMIN_EMAIL, 
      OFFICIAL_ADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    console.log('✅ 用户创建成功:', user.uid);
    
    // Create user document in Firestore
    const userData = {
      id: user.uid,
      email: OFFICIAL_ADMIN_EMAIL,
      name: 'ClearLot Support',
      company: 'ClearLot Platform',
      phone: '+852-XXXX-XXXX',
      location: 'Hong Kong',
      isAdmin: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: 'super_admin',
      permissions: [
        'user_management',
        'offer_management', 
        'transaction_management',
        'invoice_management',
        'message_management',
        'system_settings'
      ]
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ 用户文档创建成功');
    
    console.log('🎉 官方管理员账户创建完成!');
    console.log('📧 邮箱:', OFFICIAL_ADMIN_EMAIL);
    console.log('🔑 密码:', OFFICIAL_ADMIN_PASSWORD);
    console.log('🆔 用户ID:', user.uid);
    
  } catch (error: any) {
    console.error('❌ 创建官方管理员账户失败:', error);
    throw new Error('创建官方管理员账户失败: ' + error.message);
  }
}; 