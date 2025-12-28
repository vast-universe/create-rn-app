# create-rn-app

基于 Expo 的企业级 React Native 脚手架 CLI。

## ✨ 特性

- 🚀 基于 `create-expo-app@latest`
- 📦 Redux Toolkit + 持久化
- 🌐 Axios + useRequest 自动取消
- 🌍 i18next 国际化
- 🎨 NativeWind v5 (Tailwind CSS)
- 🔧 cn + cva 组件变体
- 📢 Toast 消息提示
- 📝 表单验证 (react-hook-form + zod)
- 🔒 Husky + Prettier 代码规范
- ⚡ 环境变量支持

## 📦 使用

```bash
# 交互式创建
npx create-rn-app my-app

# 使用默认配置
npx create-rn-app my-app --yes
```

## 🎯 交互选项

```
? 项目名称: my-app
? 状态管理: Redux Toolkit (推荐)
? 选择其他库:
  ◉ Axios - HTTP 请求
  ◉ i18next - 国际化
  ◉ Toast - 消息提示
  ◉ Form - 表单验证
  ◉ Husky + Prettier - 代码规范
? UI 库: NativeWind (Tailwind)
```

## 📁 生成结构

```
my-app/
├── app/                # expo-router 页面
├── store/              # Redux 状态管理
├── services/           # API 服务层
├── lib/                # 第三方库封装
│   ├── i18n/           # 国际化
│   ├── form/           # 表单验证
│   └── toast/          # 消息提示
├── components/         # UI 组件
├── .env                # 环境变量
└── ...
```

## 🔧 本地开发

```bash
# 克隆仓库
git clone https://github.com/your-username/create-rn-app.git
cd create-rn-app

# 安装依赖
npm install

# 本地链接
npm link

# 测试
create-rn-app test-app --yes
```

## 📂 CLI 源码结构

```
create-rn-app/
├── index.js          # 主入口，流程控制
├── src/
│   ├── config.js     # 常量配置（模板仓库、依赖、feature 映射）
│   ├── prompts.js    # 交互式提示
│   ├── installer.js  # 依赖安装（Expo、npm、NativeWind、Lint）
│   ├── features.js   # Feature 模块复制
│   └── configure.js  # 入口文件配置（_layout.tsx、NativeWind）
└── package.json
```

## 📋 默认配置 (--yes)

- 状态管理：Redux Toolkit
- HTTP 请求：Axios
- 代码规范：Husky + Prettier
- UI 库：NativeWind

## 🔗 相关

- [expo-template-rn](https://github.com/your-username/expo-template-rn) - 模板仓库
- [Expo](https://expo.dev/)
- [NativeWind](https://www.nativewind.dev/)

## 📄 License

MIT
