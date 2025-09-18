// 设置官方管理员账户脚本
// 这个脚本用于创建新的官方管理员账户: support@clearlot.app

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase 配置 (请确保与您的项目配置一致)
const firebaseConfig = {
  // 这里需要您的 Firebase 配置
  // 请从 src/config/firebase.ts 复制配置
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 官方管理员凭据
const OFFICIAL_ADMIN_EMAIL = 'support@clearlot.app';
const OFFICIAL_ADMIN_PASSWORD = 'cl777888';

async function createOfficialAdmin() {
  try {
    console.log('🚀 开始创建官方管理员账户...');
    
    // 检查账户是否已存在
    try {
      await signInWithEmailAndPassword(auth, OFFICIAL_ADMIN_EMAIL, OFFICIAL_ADMIN_PASSWORD);
      console.log('✅ 官方管理员账户已存在');
      return;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 创建新的官方管理员账户...');
      } else {
        throw error;
      }
    }
    
    // 创建新用户
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      OFFICIAL_ADMIN_EMAIL, 
      OFFICIAL_ADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    console.log('✅ 用户创建成功:', user.uid);
    
    // 在 Firestore 中创建用户文档
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
    
  } catch (error) {
    console.error('❌ 创建官方管理员账户失败:', error);
    throw error;
  }
}

// 运行脚本
createOfficialAdmin()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
