// Debug utility for email verification issues
import { auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const debugEmailVerification = async (userId?: string) => {
  console.log('🔍 Email Verification Debug Info:');
  
  // Check Firebase Auth user
  const currentUser = auth.currentUser;
  console.log('📧 Firebase Auth User:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : 'No user signed in');
  
  // Check Firestore user data
  if (userId || currentUser) {
    const uid = userId || currentUser!.uid;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('🗄️ Firestore User Data:', {
          id: uid,
          email: userData.email,
          emailVerified: userData.emailVerified,
          status: userData.status,
          isVerified: userData.isVerified
        });
      } else {
        console.log('❌ No user document found in Firestore for ID:', uid);
      }
    } catch (error) {
      console.error('❌ Error fetching user data from Firestore:', error);
    }
  }
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  console.log('🔗 URL Parameters:', {
    oobCode: urlParams.get('oobCode'),
    mode: urlParams.get('mode'),
    apiKey: urlParams.get('apiKey'),
    continueUrl: urlParams.get('continueUrl')
  });
  
  // Check current path
  console.log('📍 Current Path:', window.location.pathname);
  console.log('🔗 Full URL:', window.location.href);
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugEmailVerification = debugEmailVerification;
}

