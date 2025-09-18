// 创建官方管理员账户的浏览器脚本
// 在浏览器控制台中运行此脚本来创建新的官方管理员账户

// 导入必要的 Firebase 函数
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// 官方管理员凭据
const OFFICIAL_ADMIN_EMAIL = 'support@clearlot.app';
const OFFICIAL_ADMIN_PASSWORD = 'cl777888';

async function createOfficialAdmin() {
  try {
    console.log('🚀 开始创建官方管理员账户...');
    
    // 获取 Firebase 实例 (假设已经在全局可用)
    const auth = window.auth; // 或者从您的 Firebase 配置中获取
    const db = window.db;     // 或者从您的 Firebase 配置中获取
    
    if (!auth || !db) {
      throw new Error('Firebase 实例未找到。请确保 Firebase 已正确初始化。');
    }
    
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

// 导出函数供使用
window.createOfficialAdmin = createOfficialAdmin;

console.log('📋 官方管理员账户创建脚本已加载');
console.log('💡 使用方法: 在控制台中运行 createOfficialAdmin()');
