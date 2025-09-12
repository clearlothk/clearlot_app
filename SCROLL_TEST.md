# 自动滚动功能测试指南

## 功能说明
现在当您点击导航链接跳转到新页面时，页面会自动平滑滚动到顶部，而不是停留在当前位置。

## 测试步骤

### 1. 准备测试环境
```bash
# 确保开发服务器正在运行
npm run dev

# 访问应用
http://localhost:5173
```

### 2. 测试自动滚动功能

#### 方法一：使用Quick Links
1. 在首页向下滚动到页面中间或底部
2. 点击Footer中的任意Quick Link（如"Browse Offers"）
3. 观察页面是否自动平滑滚动到顶部
4. 重复测试其他Quick Links

#### 方法二：使用主导航栏
1. 在任意页面向下滚动
2. 点击顶部导航栏中的任意链接（如"Analytics"、"Upload Offer"等）
3. 观察页面是否自动滚动到顶部

#### 方法三：使用浏览器前进/后退
1. 在页面中向下滚动
2. 点击浏览器的前进或后退按钮
3. 观察页面是否自动滚动到顶部

### 3. 验证功能特点

✅ **平滑滚动**: 页面滚动应该是平滑的，不是瞬间跳转  
✅ **所有页面**: 所有页面切换都应该触发自动滚动  
✅ **前进后退**: 浏览器前进/后退按钮也应该触发自动滚动  
✅ **性能良好**: 滚动动画应该流畅，不影响页面性能  

## 技术实现

### ScrollToTop组件
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 平滑滚动到页面顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
}
```

### 工作原理
1. 组件监听`pathname`的变化
2. 当路由发生变化时，触发`useEffect`
3. 使用`window.scrollTo`平滑滚动到页面顶部
4. `behavior: 'smooth'`确保滚动动画平滑

## 故障排除

如果自动滚动功能不工作：

1. **检查控制台错误**: 打开浏览器开发者工具查看是否有错误
2. **验证组件导入**: 确保`ScrollToTop`组件已正确导入到`App.tsx`
3. **检查路由配置**: 确保`ScrollToTop`组件在`Router`内部
4. **浏览器兼容性**: 确保浏览器支持`scrollTo`的`behavior: 'smooth'`选项

## 浏览器兼容性

- ✅ Chrome 61+
- ✅ Firefox 36+
- ✅ Safari 15.4+
- ✅ Edge 79+

对于不支持`behavior: 'smooth'`的旧浏览器，会自动回退到即时滚动。

## 自定义选项

如果需要调整滚动行为，可以修改`ScrollToTop.tsx`：

```typescript
// 即时滚动（无动画）
window.scrollTo(0, 0);

// 自定义滚动位置
window.scrollTo({
  top: 100, // 滚动到距离顶部100px的位置
  behavior: 'smooth'
});
``` 