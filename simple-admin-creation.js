// 简单的管理员账户创建脚本
// 在浏览器控制台中运行

// 首先，让我们检查 Firebase 是否可用
console.log('Firebase Auth:', window.auth);
console.log('Firebase DB:', window.db);

// 如果 Firebase 可用，运行以下代码
if (window.auth && window.db) {
  // 导入我们的服务函数
  import('./src/services/adminService.js').then(({ createOfficialAdmin }) => {
    console.log('🚀 开始创建官方管理员账户...');
    createOfficialAdmin()
      .then(() => {
        console.log('✅ 官方管理员账户创建成功！');
        console.log('📧 邮箱: support@clearlot.app');
        console.log('🔑 密码: cl777888');
        console.log('💡 现在可以使用这些凭据登录管理面板了');
      })
      .catch((error) => {
        console.error('❌ 创建失败:', error);
      });
  });
} else {
  console.error('❌ Firebase 未初始化');
  console.log('💡 请确保您已经正确设置了 Firebase 配置');
}
