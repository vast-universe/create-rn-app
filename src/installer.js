import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { LIBRARIES } from './config.js';

/**
 * 创建 Expo 项目
 */
export function createExpoProject(projectName) {
  execSync(`npx create-expo-app@latest ${projectName}`, { stdio: 'inherit' });
}

/**
 * 重置项目
 */
export function resetProject(targetDir) {
  execSync('echo Y | npm run reset-project', {
    cwd: targetDir,
    stdio: 'pipe',
    shell: true,
  });
}

/**
 * 收集要安装的依赖
 */
export function collectDependencies(stateLib, extraLibs, uiLib) {
  const deps = [];

  if (stateLib !== 'none') {
    deps.push(...LIBRARIES[stateLib]);
  }

  extraLibs.forEach((lib) => {
    if (LIBRARIES[lib]) {
      LIBRARIES[lib].forEach((dep) => {
        if (!deps.includes(dep)) deps.push(dep);
      });
    }
  });

  if (uiLib !== 'none' && LIBRARIES[uiLib]) {
    deps.push(...LIBRARIES[uiLib]);
  }

  return deps;
}

/**
 * 安装 npm 依赖
 */
export function installDependencies(targetDir, deps) {
  const depsStr = deps
    .map((d) => (d.includes('@') && !d.startsWith('@') ? d : `${d}@latest`))
    .join(' ');
  execSync(`npm install ${depsStr}`, { cwd: targetDir, stdio: 'pipe' });
}

/**
 * 安装 NativeWind
 */
export async function installNativeWind(targetDir) {
  // 添加 overrides 到 package.json
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = await fs.readJson(pkgPath);
  pkg.overrides = { ...pkg.overrides, lightningcss: '1.30.1' };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // 安装 NativeWind 核心
  execSync(
    'npx expo install nativewind@preview react-native-css react-native-reanimated react-native-safe-area-context',
    { cwd: targetDir, stdio: 'pipe' }
  );

  // 安装开发依赖
  execSync('npx expo install --dev tailwindcss @tailwindcss/postcss postcss', {
    cwd: targetDir,
    stdio: 'pipe',
  });

  // 安装 cn + cva 工具链
  execSync('npm install clsx tailwind-merge class-variance-authority', {
    cwd: targetDir,
    stdio: 'pipe',
  });
}

/**
 * 配置 Husky + Prettier
 */
export async function setupLint(targetDir, templateDir) {
  // 安装依赖
  execSync('npm install -D prettier husky lint-staged', {
    cwd: targetDir,
    stdio: 'pipe',
  });

  // 复制配置文件
  const lintPath = path.join(templateDir, 'features/feature-lint');
  if (await fs.pathExists(lintPath)) {
    await fs.copy(path.join(lintPath, '.prettierrc'), path.join(targetDir, '.prettierrc'));
    await fs.copy(path.join(lintPath, '.prettierignore'), path.join(targetDir, '.prettierignore'));
    await fs.copy(path.join(lintPath, '.lintstagedrc.js'), path.join(targetDir, '.lintstagedrc.js'));
  }

  // 初始化 husky
  execSync('npx husky init', { cwd: targetDir, stdio: 'pipe' });

  // 创建 pre-commit hook
  await fs.writeFile(path.join(targetDir, '.husky/pre-commit'), 'npx lint-staged\n');

  // 添加 format script
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = await fs.readJson(pkgPath);
  pkg.scripts = {
    ...pkg.scripts,
    format: 'prettier --write "**/*.{js,jsx,ts,tsx,json,md}"',
  };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}
