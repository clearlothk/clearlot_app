// Setup Admin User Script
// Run this script to create the admin user: node setup-admin.js

const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} = require('firebase/auth');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC2wNgiEcYAHbdz_6KAe-t52yvAlM6DLh4",
  authDomain: "clearlot-65916.firebaseapp.com",
  projectId: "clearlot-65916",
  storageBucket: "clearlot-65916.firebasestorage.app",
  messagingSenderId: "599899772543",
  appId: "1:599899772543:web:d2cbe4137180be0866914a",
  measurementId: "G-E2ZJZM4L53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const ADMIN_EMAIL = 'admin@clearlot.com';
const ADMIN_PASSWORD = '123456';

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    
    // First, check if admin user already exists
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin user already exists');
      return;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Admin user not found, creating new admin user...');
      } else {
        console.error('❌ Error checking admin user:', error.message);
        return;
      }
    }

    // Create the admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;

    // Create admin user document in Firestore
    const adminUserData = {
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
    console.log('🎯 You can now login to the admin panel!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('📧 Admin user already exists in Firebase Auth');
      
      // Try to sign in to get the user ID
      try {
        const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        const user = userCredential.user;
        
        // Check if admin document exists in Firestore
        const adminDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!adminDoc.exists()) {
          // Create admin document in Firestore
          const adminUserData = {
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
        console.error('❌ Error signing in admin user:', signInError.message);
      }
    }
  }
}

// Run the setup
createAdminUser().then(() => {
  console.log('🎉 Setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
}); 