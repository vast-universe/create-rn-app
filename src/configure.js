import fs from 'fs-extra';
import path from 'path';

/**
 * 配置入口文件 app/_layout.tsx
 */
export async function configureEntryFile(targetDir, stateLib, extraLibs, uiLib) {
  const layoutPath = path.join(targetDir, 'app/_layout.tsx');

  if (!(await fs.pathExists(layoutPath))) {
    return;
  }

  let content = await fs.readFile(layoutPath, 'utf-8');
  const imports = [];

  // Redux
  if (stateLib === 'redux') {
    imports.push(`import { Provider } from 'react-redux';`);
    imports.push(`import { PersistGate } from 'redux-persist/integration/react';`);
    imports.push(`import { store, persistor } from '@/store';`);
  }

  // i18n
  if (extraLibs.includes('i18n')) {
    imports.push(`import '@/lib/i18n';`);
  }

  // Toast
  if (extraLibs.includes('toast')) {
    imports.push(`import { Toast } from '@/lib/toast';`);
  }

  // NativeWind - 导入 global.css
  if (uiLib === 'ui_nativewind') {
    imports.push(`import '../global.css';`);
  }

  // 添加 imports 到文件顶部
  if (imports.length > 0) {
    const importStr = imports.join('\n') + '\n';
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex !== -1) {
      content = content.slice(0, firstImportIndex) + importStr + content.slice(firstImportIndex);
    }
  }

  // Redux + Toast: 一起处理，生成正确的嵌套结构
  if (stateLib === 'redux' && extraLibs.includes('toast')) {
    content = content.replace(
      /return\s*(<[^;]+);/,
      `return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        $1
        <Toast />
      </PersistGate>
    </Provider>
  );`
    );
  } else if (stateLib === 'redux') {
    // 只有 Redux，没有 Toast
    content = content.replace(
      /return\s*(<[^;]+);/,
      `return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        $1
      </PersistGate>
    </Provider>
  );`
    );
  } else if (extraLibs.includes('toast')) {
    // 只有 Toast，没有 Redux
    content = content.replace(
      /return\s*(<Stack\s*\/>);/,
      `return (
    <>
      <Stack />
      <Toast />
    </>
  );`
    );
  }

  await fs.writeFile(layoutPath, content);

  // NativeWind - 配置额外文件
  if (uiLib === 'ui_nativewind') {
    await configureNativeWind(targetDir);
  }
}

/**
 * 配置 NativeWind 相关文件
 */
async function configureNativeWind(targetDir) {
  // 替换 index.tsx 展示示例
  const indexPath = path.join(targetDir, 'app/index.tsx');
  const indexContent = `import { View, Text } from 'react-native';
import { Button } from '@/components';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <Text className="text-xl font-bold text-gray-800">
        Welcome to NativeWind!
      </Text>
      <View className="flex-row gap-2">
        <Button variant="primary" onPress={() => console.log('Primary')}>
          Primary
        </Button>
        <Button variant="outline" onPress={() => console.log('Outline')}>
          Outline
        </Button>
      </View>
      <Button variant="ghost" size="sm">
        Ghost Button
      </Button>
    </View>
  );
}
`;
  await fs.writeFile(indexPath, indexContent);

  // 更新 tsconfig.json 添加 nativewind-env.d.ts
  const tsconfigPath = path.join(targetDir, 'tsconfig.json');
  if (await fs.pathExists(tsconfigPath)) {
    const tsconfig = await fs.readJson(tsconfigPath);
    if (!tsconfig.include) {
      tsconfig.include = [];
    }
    if (!tsconfig.include.includes('nativewind-env.d.ts')) {
      tsconfig.include.push('nativewind-env.d.ts');
    }
    await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
  }
}
