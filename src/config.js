// 模板仓库地址
export const TEMPLATE_REPO = 'vast-universe/expo-template-rn';

// 三方库配置
export const LIBRARIES = {
  redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist', '@react-native-async-storage/async-storage'],
  axios: ['axios'],
  i18n: ['i18next', 'react-i18next'],
  toast: ['react-native-toast-message'],
  form: ['react-hook-form', 'zod', '@hookform/resolvers'],
  ui_rneui: ['@rneui/themed', '@rneui/base'],
  ui_tamagui: ['tamagui', '@tamagui/config'],
  ui_nativewind: [],
};

// feature 模块映射
export const FEATURES = {
  redux: { name: 'feature-redux', dest: 'store' },
  axios: { name: 'feature-axios', dest: 'services' },
  i18n: { name: 'feature-i18n', dest: 'lib/i18n' },
  toast: { name: 'feature-toast', dest: 'lib/toast' },
  form: { name: 'feature-form', dest: 'lib/form' },
  ui_nativewind: { name: 'feature-nativewind', dest: '.' },
};

// 默认配置
export const DEFAULTS = {
  projectName: 'my-app',
  stateLib: 'redux',
  extraLibs: ['axios', 'lint'],
  uiLib: 'ui_nativewind',
};
