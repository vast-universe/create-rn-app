# create-rn-app

基于 `create-expo-app@latest` 的增强脚手架 CLI

## 使用方式

### 方式一：npx 直接使用（发布后）

```bash
npx create-rn-app my-app
```

### 方式二：本地开发测试

```bash
# 1. 克隆仓库
git clone https://github.com/vast-universe/create-rn-app.git
cd create-rn-app

# 2. 安装依赖
npm install

# 3. 链接到全局
npm link

# 4. 使用
create-rn-app my-app

# 或直接运行
node index.js my-app
```

## 交互流程

```
🚀 Create RN App - Expo 项目增强脚手架

? 项目名称: my-app
? 状态管理: Redux Toolkit (推荐)
? 选择其他库: Axios - HTTP 请求, i18next - 国际化
? UI 库: NativeWind (Tailwind) (推荐)
```

## 功能特性

- ✅ 基于 `create-expo-app@latest`，自动执行 `reset-project`
- ✅ Redux Toolkit + redux-persist + AsyncStorage 持久化
- ✅ Axios 封装（拦截器、Token 注入、请求取消、useRequest Hook）
- ✅ i18next 国际化（中/英）
- ✅ NativeWind v5（Tailwind CSS for RN）
- ✅ 自动配置 `_layout.tsx`（Provider 包裹、imports）
- ✅ 自动配置 `tsconfig.json`（添加 nativewind-env.d.ts）

## 生成的项目结构

```
my-app/
├── app/
│   ├── _layout.tsx        # 自动配置 Provider、imports
│   └── index.tsx          # NativeWind 示例
├── store/                 # Redux Toolkit
│   ├── index.ts
│   ├── hooks.ts
│   └── slices/
│       ├── rootReducer.ts
│       └── auth/
├── api/                   # Axios
│   ├── index.ts
│   ├── request.ts
│   ├── hooks/
│   │   └── useRequest.ts
│   └── services/
│       ├── auth.service.ts
│       └── user.service.ts
├── i18n/                  # i18next
│   ├── index.ts
│   └── locales/
│       ├── zh.ts
│       └── en.ts
├── global.css             # NativeWind
├── metro.config.js
├── postcss.config.mjs
├── nativewind-env.d.ts
└── ...
```

## 使用示例

### Redux 状态管理

```tsx
import { useAppSelector, useAppDispatch, setToken, logout } from '@/store';

export default function Profile() {
  const token = useAppSelector((s) => s.auth.token);
  const dispatch = useAppDispatch();

  const handleLogin = () => dispatch(setToken('xxx'));
  const handleLogout = () => dispatch(logout());

  return (
    <View>
      <Text>{token ? '已登录' : '未登录'}</Text>
      <Button title="登录" onPress={handleLogin} />
      <Button title="退出" onPress={handleLogout} />
    </View>
  );
}
```

### Axios 请求

```tsx
import { authService, userService } from '@/api';

// 登录
const login = async () => {
  const res = await authService.login({ email: 'test@test.com', password: '123456' });
  console.log(res.token);
};

// 获取用户
const getUser = async () => {
  const user = await userService.getProfile();
  console.log(user);
};
```

### useRequest Hook（自动取消请求）

```tsx
import { useRequest } from '@/api';

export default function UserList() {
  // 自动请求，页面卸载时自动取消
  const { data, loading, error } = useRequest<User[]>('/users');

  // 手动请求
  const { data, run, cancel } = useRequest<User>('/user/1', {}, { manual: true });

  return loading ? <Text>加载中...</Text> : <Text>{data?.name}</Text>;
}
```

### i18n 国际化

```tsx
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';

export default function Settings() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('common.confirm')}</Text>
      <Button title="切换中文" onPress={() => changeLanguage('zh')} />
      <Button title="Switch English" onPress={() => changeLanguage('en')} />
    </View>
  );
}
```

### NativeWind

```tsx
import { View, Text } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to NativeWind!
      </Text>
    </View>
  );
}
```

## 自动配置

CLI 会自动完成以下配置：

1. `_layout.tsx` - 添加 imports 和 Redux Provider 包裹
2. `index.tsx` - NativeWind 示例代码
3. `package.json` - 添加 `overrides.lightningcss: "1.30.1"`
4. `tsconfig.json` - 添加 `nativewind-env.d.ts` 到 include

## 发布

### 发布 CLI

```bash
# 修改 package.json 中的 name（如需要）
npm publish
```

### 发布模板仓库

```bash
cd expo-template-rn
git init
git add .
git commit -m "init"
git remote add origin https://github.com/vast-universe/expo-template-rn.git
git push -u origin main
```

## License

MIT
# create-rn-app
