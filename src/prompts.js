import inquirer from 'inquirer';
import chalk from 'chalk';
import { DEFAULTS } from './config.js';

/**
 * 获取用户配置（交互式或默认）
 */
export async function getProjectConfig(initialName, useDefaults = false) {
  if (useDefaults) {
    console.log(chalk.gray('使用默认配置...'));
    return {
      projectName: initialName || DEFAULTS.projectName,
      stateLib: DEFAULTS.stateLib,
      extraLibs: DEFAULTS.extraLibs,
      uiLib: DEFAULTS.uiLib,
    };
  }

  // 1. 获取项目名
  const nameAnswer = initialName
    ? { projectName: initialName }
    : await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '项目名称:',
          default: DEFAULTS.projectName,
        },
      ]);

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

  return {
    projectName: nameAnswer.projectName,
    stateLib: stateAnswer.stateLib,
    extraLibs: extraAnswer.extraLibs,
    uiLib: uiAnswer.uiLib,
  };
}
