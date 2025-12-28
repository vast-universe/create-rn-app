#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';

import { getProjectConfig } from './src/prompts.js';
import {
  createExpoProject,
  resetProject,
  collectDependencies,
  installDependencies,
  installNativeWind,
  setupLint,
} from './src/installer.js';
import { collectFeatures, copyAllFeatures, copyEnvFile } from './src/features.js';
import { configureEntryFile } from './src/configure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, '../expo-template-rn');

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
  // 1. 获取用户配置
  const { projectName, stateLib, extraLibs, uiLib } = await getProjectConfig(
    initialName,
    useDefaults
  );

  const targetDir = path.resolve(process.cwd(), projectName);
  const spinner = ora();

  // 2. 执行 create-expo-app
  console.log(chalk.cyan('\n正在调用 create-expo-app...\n'));
  try {
    createExpoProject(projectName);
    console.log('');
  } catch (error) {
    throw new Error('Expo 项目创建失败');
  }

  // 3. 执行 reset-project
  spinner.start('正在重置项目...');
  try {
    resetProject(targetDir);
    spinner.succeed('项目重置完成');
  } catch (error) {
    spinner.warn('reset-project 未执行，可能模板不支持');
  }

  // 4. 收集并安装依赖
  const depsToInstall = collectDependencies(stateLib, extraLibs, uiLib);

  if (depsToInstall.length > 0) {
    spinner.start('正在安装依赖...');
    try {
      installDependencies(targetDir, depsToInstall);
      spinner.succeed('依赖安装完成');
    } catch (error) {
      spinner.fail('部分库安装失败，请手动安装');
    }
  }

  // 5. NativeWind 特殊安装
  if (uiLib === 'ui_nativewind') {
    spinner.start('正在安装 NativeWind...');
    try {
      await installNativeWind(targetDir);
      spinner.succeed('NativeWind 安装完成');
    } catch (error) {
      spinner.fail('NativeWind 安装失败，请手动安装');
    }
  }

  // 6. 复制 feature 模块
  const featuresToCopy = collectFeatures(stateLib, extraLibs, uiLib);

  if (featuresToCopy.length > 0) {
    spinner.start('正在注入配置和示例代码...');
    await copyAllFeatures(featuresToCopy, targetDir, TEMPLATE_DIR);
    spinner.succeed('配置注入完成');
  }

  // 7. 复制 .env 文件
  if (extraLibs.includes('axios')) {
    await copyEnvFile(targetDir, TEMPLATE_DIR);
  }

  // 8. 配置 Husky + Prettier
  if (extraLibs.includes('lint')) {
    spinner.start('正在配置代码规范...');
    try {
      await setupLint(targetDir, TEMPLATE_DIR);
      spinner.succeed('代码规范配置完成');
    } catch (error) {
      spinner.fail('代码规范配置失败，请手动配置');
    }
  }

  // 9. 配置入口文件
  spinner.start('正在配置入口文件...');
  await configureEntryFile(targetDir, stateLib, extraLibs, uiLib);
  spinner.succeed('入口文件配置完成');

  // 10. 输出结果
  console.log(chalk.green.bold('\n✅ 项目创建成功!\n'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white('  npm start\n'));

  if (depsToInstall.length > 0) {
    console.log(chalk.cyan('已安装:'));
    depsToInstall.forEach((dep) => console.log(chalk.white(`  • ${dep}`)));
    console.log('');
  }
}

main();
