// 在浏览器控制台中运行此代码来创建官方管理员账户
// 请确保您已经登录到 Firebase 项目

async function createOfficialAdminAccount() {
  try {
    console.log('🚀 开始创建官方管理员账户...');
    
    // 导入必要的 Firebase 函数
    const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // 获取 Firebase 实例（假设已经在全局可用）
    const auth = window.auth;
    const db = window.db;
    
    if (!auth || !db) {
      console.error('❌ Firebase 实例未找到');
      console.log('💡 请确保您已经正确初始化了 Firebase');
      return;
    }
    
    const OFFICIAL_ADMIN_EMAIL = 'support@clearlot.app';
    const OFFICIAL_ADMIN_PASSWORD = 'cl777888';
    
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
    
    // 自动登录
    console.log('🔄 正在自动登录...');
    await signInWithEmailAndPassword(auth, OFFICIAL_ADMIN_EMAIL, OFFICIAL_ADMIN_PASSWORD);
    console.log('✅ 登录成功！');
    
  } catch (error) {
    console.error('❌ 创建官方管理员账户失败:', error);
    console.log('💡 可能的解决方案:');
    console.log('1. 检查 Firebase 配置是否正确');
    console.log('2. 确保有创建用户的权限');
    console.log('3. 检查网络连接');
  }
}

// 运行函数
createOfficialAdminAccount();
