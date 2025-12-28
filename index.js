#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import degit from 'degit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模板仓库地址
const TEMPLATE_REPO = 'vast-universe/expo-template-rn';

// 三方库配置
const LIBRARIES = {
  redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist', '@react-native-async-storage/async-storage'],
  axios: ['axios'],
  i18n: ['i18next', 'react-i18next'],
  toast: ['react-native-toast-message'],
  ui_rneui: ['@rneui/themed', '@rneui/base'],
  ui_tamagui: ['tamagui', '@tamagui/config'],
  ui_nativewind: [], // 使用 npx expo install 安装
};

// feature 模块映射
const FEATURES = {
  redux: { name: 'feature-redux', dest: 'store' },
  axios: { name: 'feature-axios', dest: 'api' },
  i18n: { name: 'feature-i18n', dest: 'i18n' },
  toast: { name: 'feature-toast', dest: 'utils/toast' },
  ui_nativewind: { name: 'feature-nativewind', dest: '.' },
};

async function main() {
  console.log(chalk.cyan.bold('\n🚀 Create RN App - Expo 项目增强脚手架\n'));

  program
    .name('create-rn-app')
    .description('基于 create-expo-app 创建项目并扩展三方库')
    .argument('[project-name]', '项目名称')
    .option('-y, --yes', '使用默认配置，跳过交互')
    .action(async (projectName, options) => {
      try {
        await createProject(projectName, options.yes);
      } catch (error) {
        console.error(chalk.red('❌ 失败:'), error.message);
        process.exit(1);
      }
    });

  program.parse();
}

async function createProject(initialName, useDefaults = false) {
  // 默认配置
  const defaults = {
    projectName: initialName || 'my-app',
    stateLib: 'redux',
    extraLibs: ['axios', 'lint'],
    uiLib: 'ui_nativewind',
  };

  let projectName, stateLib, extraLibs, uiLib;

  if (useDefaults) {
    // 使用默认配置
    projectName = defaults.projectName;
    stateLib = defaults.stateLib;
    extraLibs = defaults.extraLibs;
    uiLib = defaults.uiLib;
    console.log(chalk.gray('使用默认配置...'));
  } else {
    // 1. 获取项目名
    const nameAnswer = initialName
      ? { projectName: initialName }
      : await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: '项目名称:',
            default: 'my-app',
          },
        ]);
    projectName = nameAnswer.projectName;

    // 2. 选择状态管理
    const stateAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'stateLib',
        message: '状态管理:',
        default: 'redux',
        choices: [
          { name: 'Redux Toolkit (推荐)', value: 'redux' },
          { name: '不需要', value: 'none' },
        ],
      },
    ]);
    stateLib = stateAnswer.stateLib;

    // 3. 选择其他库
    const extraAnswer = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'extraLibs',
        message: '选择其他库 (空格选择):',
        choices: [
          { name: 'Axios - HTTP 请求', value: 'axios' },
          { name: 'i18next - 国际化', value: 'i18n' },
          { name: 'Toast - 消息提示', value: 'toast' },
          { name: 'Husky + Prettier - 代码规范', value: 'lint', checked: true },
        ],
      },
    ]);
    extraLibs = extraAnswer.extraLibs;

    // 4. 选择 UI 库
    const uiAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'uiLib',
        message: 'UI 库:',
        default: 'ui_nativewind',
        choices: [
          { name: 'NativeWind (Tailwind) (推荐)', value: 'ui_nativewind' },
          { name: 'React Native Elements', value: 'ui_rneui' },
          { name: 'Tamagui', value: 'ui_tamagui' },
          { name: '不需要', value: 'none' },
        ],
      },
    ]);
    uiLib = uiAnswer.uiLib;
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // 5. 执行 create-expo-app
  console.log(chalk.cyan('\n正在调用 create-expo-app...\n'));
  try {
    execSync(`npx create-expo-app@latest ${projectName}`, {
      stdio: 'inherit',
    });
    console.log('');
  } catch (error) {
    throw new Error('Expo 项目创建失败');
  }

  const spinner = ora();

  // 6. 执行 reset-project 重置项目（自动回答 Y，保留到 app-example）
  spinner.start('正在重置项目...');
  try {
    execSync('echo Y | npm run reset-project', { cwd: targetDir, stdio: 'pipe', shell: true });
    spinner.succeed('项目重置完成');
  } catch (error) {
    spinner.warn('reset-project 未执行，可能模板不支持');
  }

  // 7. 收集要安装的依赖和 feature
  const depsToInstall = [];
  const featuresToCopy = [];

  if (stateLib !== 'none') {
    depsToInstall.push(...LIBRARIES[stateLib]);
    featuresToCopy.push(FEATURES[stateLib]);
  }

  extraLibs.forEach((lib) => {
    if (LIBRARIES[lib]) {
      LIBRARIES[lib].forEach((dep) => {
        if (!depsToInstall.includes(dep)) {
          depsToInstall.push(dep);
        }
      });
    }
    if (FEATURES[lib]) featuresToCopy.push(FEATURES[lib]);
  });

  if (uiLib !== 'none') {
    depsToInstall.push(...LIBRARIES[uiLib]);
    if (FEATURES[uiLib]) featuresToCopy.push(FEATURES[uiLib]);
  }

  // 8. 安装依赖
  if (depsToInstall.length > 0) {
    spinner.start('正在安装依赖...');
    try {
      // 如果包名已包含版本号，不再添加 @latest
      const depsStr = depsToInstall.map((d) => (d.includes('@') && !d.startsWith('@') ? d : `${d}@latest`)).join(' ');
      execSync(`npm install ${depsStr}`, { cwd: targetDir, stdio: 'pipe' });
      spinner.succeed('依赖安装完成');
    } catch (error) {
      spinner.fail('部分库安装失败，请手动安装');
    }
  }

  // 8.1 NativeWind 特殊安装（使用 npx expo install）
  if (uiLib === 'ui_nativewind') {
    // 先添加 overrides 到 package.json（必须在安装前）
    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = await fs.readJson(pkgPath);
    pkg.overrides = {
      ...pkg.overrides,
      lightningcss: '1.30.1',
    };
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    spinner.start('正在安装 NativeWind...');
    try {
      execSync('npx expo install nativewind@preview react-native-css react-native-reanimated react-native-safe-area-context', {
        cwd: targetDir,
        stdio: 'pipe',
      });
      execSync('npx expo install --dev tailwindcss @tailwindcss/postcss postcss', {
        cwd: targetDir,
        stdio: 'pipe',
      });
      // 安装 cn + cva 工具链
      execSync('npm install clsx tailwind-merge class-variance-authority', {
        cwd: targetDir,
        stdio: 'pipe',
      });
      spinner.succeed('NativeWind 安装完成');
    } catch (error) {
      spinner.fail('NativeWind 安装失败，请手动安装');
    }
  }

  // 9. 复制 feature 模块
  if (featuresToCopy.length > 0) {
    spinner.start('正在注入配置和示例代码...');
    for (const feature of featuresToCopy) {
      await copyFeature(feature.name, targetDir, feature.dest);
    }
    spinner.succeed('配置注入完成');
  }

  // 9.1 如果选了 axios，复制 .env 文件
  if (extraLibs.includes('axios')) {
    const localEnvPath = path.join(__dirname, '../expo-template-rn/features/feature-env/.env.example');
    if (await fs.pathExists(localEnvPath)) {
      await fs.copy(localEnvPath, path.join(targetDir, '.env'));
    }
  }

  // 9.2 如果选了 lint，配置 Husky + Prettier
  if (extraLibs.includes('lint')) {
    spinner.start('正在配置代码规范...');
    try {
      // 安装依赖
      execSync('npm install -D prettier husky lint-staged', { cwd: targetDir, stdio: 'pipe' });

      // 复制配置文件
      const lintPath = path.join(__dirname, '../expo-template-rn/features/feature-lint');
      if (await fs.pathExists(lintPath)) {
        await fs.copy(path.join(lintPath, '.prettierrc'), path.join(targetDir, '.prettierrc'));
        await fs.copy(path.join(lintPath, '.prettierignore'), path.join(targetDir, '.prettierignore'));
        await fs.copy(path.join(lintPath, '.lintstagedrc.js'), path.join(targetDir, '.lintstagedrc.js'));
      }

      // 初始化 husky
      execSync('npx husky init', { cwd: targetDir, stdio: 'pipe' });

      // 创建 pre-commit hook
      const preCommitPath = path.join(targetDir, '.husky/pre-commit');
      await fs.writeFile(preCommitPath, 'npx lint-staged\n');

      // 添加 format script 到 package.json
      const pkgPath = path.join(targetDir, 'package.json');
      const pkg = await fs.readJson(pkgPath);
      pkg.scripts = {
        ...pkg.scripts,
        format: 'prettier --write "**/*.{js,jsx,ts,tsx,json,md}"',
      };
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });

      spinner.succeed('代码规范配置完成');
    } catch (error) {
      spinner.fail('代码规范配置失败，请手动配置');
    }
  }

  // 10. 配置入口文件
  spinner.start('正在配置入口文件...');
  await configureEntryFile(targetDir, stateLib, extraLibs, uiLib);
  spinner.succeed('入口文件配置完成');

  // 11. 输出结果
  console.log(chalk.green.bold('\n✅ 项目创建成功!\n'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white('  npm start\n'));

  if (depsToInstall.length > 0) {
    console.log(chalk.cyan('已安装:'));
    depsToInstall.forEach((dep) => console.log(chalk.white(`  • ${dep}`)));
    console.log('');
  }
}

async function copyFeature(featureName, targetDir, destDir) {
  const destPath = path.join(targetDir, destDir);
  await fs.ensureDir(destPath);

  // 1. 优先从本地模板复制（开发时使用）
  const localTemplatePath = path.join(__dirname, `../expo-template-rn/features/${featureName}`);
  if (await fs.pathExists(localTemplatePath)) {
    await fs.copy(localTemplatePath, destPath, { overwrite: true });
    return;
  }

  // 2. 从远程 git 仓库拉取
  const emitter = degit(`${TEMPLATE_REPO}/features/${featureName}`, {
    cache: false,
    force: true,
  });
  const tempDir = path.join(targetDir, '.temp-feature');
  await emitter.clone(tempDir);
  await fs.copy(tempDir, destPath, { overwrite: true });
  await fs.remove(tempDir);
}

async function configureEntryFile(targetDir, stateLib, extraLibs, uiLib) {
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
    imports.push(`import '@/i18n';`);
  }

  // Toast
  if (extraLibs.includes('toast')) {
    imports.push(`import { Toast } from '@/utils/toast';`);
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

  // Redux: 包裹 Provider
  if (stateLib === 'redux') {
    // 匹配 return <Stack />; 或 return (\n...\n);
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
  }

  // Toast: 在最外层添加 Toast
  if (extraLibs.includes('toast')) {
    // 在 return 的 JSX 最后添加 Toast
    content = content.replace(
      /(<\/Provider>|<\/PersistGate>|<Stack\s*\/>)(\s*\);?\s*$)/m,
      (match, tag, ending) => {
        if (tag === '<Stack />') {
          return `<>\n        <Stack />\n        <Toast />\n      </>${ending}`;
        }
        return `${tag}\n      <Toast />${ending}`;
      }
    );
    // 如果没有 Redux，直接包裹
    if (stateLib === 'none') {
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
  }

  await fs.writeFile(layoutPath, content);

  // NativeWind - 替换 index.tsx 展示示例
  if (uiLib === 'ui_nativewind') {
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
}

main();
