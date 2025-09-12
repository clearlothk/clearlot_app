import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthUser } from '../types';

// Admin credentials
const ADMIN_EMAIL = 'admin@clearlot.com';
const ADMIN_PASSWORD = '123456';

// Create admin user function
export const createAdminUser = async (): Promise<void> => {
  try {
    console.log('Creating admin user...');
    
    // First, check if admin user already exists
    try {
      const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('Admin user already exists');
      return;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        console.log('Admin user not found, creating new admin user...');
      } else {
        console.error('Error checking admin user:', error);
        return;
      }
    }

    // Create the admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;

    // Create admin user document in Firestore
    const adminUserData: AuthUser = {
      id: user.uid,
      email: ADMIN_EMAIL,
      company: 'ClearLot Admin',
      isVerified: true,
      isAdmin: true, // This is the key field for admin access
      joinedDate: new Date().toISOString(),
      watchlist: [],
      purchaseHistory: []
    };

    // Save to Firestore
    await setDoc(doc(db, 'users', user.uid), adminUserData);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🆔 User ID:', user.uid);
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists in Firebase Auth');
      
      // Try to sign in to get the user ID
      try {
        const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        const user = userCredential.user;
        
        // Check if admin document exists in Firestore
        const adminDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!adminDoc.exists()) {
          // Create admin document in Firestore
          const adminUserData: AuthUser = {
            id: user.uid,
            email: ADMIN_EMAIL,
            company: 'ClearLot Admin',
            isVerified: true,
            isAdmin: true,
            joinedDate: new Date().toISOString(),
            watchlist: [],
            purchaseHistory: []
          };
          
          await setDoc(doc(db, 'users', user.uid), adminUserData);
          console.log('✅ Admin Firestore document created successfully!');
        } else {
          // Update existing document to ensure admin status
          await setDoc(doc(db, 'users', user.uid), {
            isAdmin: true
          }, { merge: true });
          console.log('✅ Admin status updated in Firestore!');
        }
      } catch (signInError) {
        console.error('❌ Error signing in admin user:', signInError);
      }
    }
  }
};

// Function to verify admin user exists
export const verifyAdminUser = async (): Promise<boolean> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;
    
    const adminDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (adminDoc.exists()) {
      const userData = adminDoc.data() as AuthUser;
      return userData.isAdmin === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying admin user:', error);
    return false;
  }
};

// Export admin credentials for reference
export const ADMIN_CREDENTIALS = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD
}; 