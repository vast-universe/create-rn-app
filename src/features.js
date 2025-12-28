import fs from 'fs-extra';
import path from 'path';
import degit from 'degit';
import { TEMPLATE_REPO, FEATURES } from './config.js';

/**
 * 收集要复制的 feature 模块
 */
export function collectFeatures(stateLib, extraLibs, uiLib) {
  const features = [];

  if (stateLib !== 'none' && FEATURES[stateLib]) {
    features.push(FEATURES[stateLib]);
  }

  extraLibs.forEach((lib) => {
    if (FEATURES[lib]) features.push(FEATURES[lib]);
  });

  if (uiLib !== 'none' && FEATURES[uiLib]) {
    features.push(FEATURES[uiLib]);
  }

  return features;
}

/**
 * 复制单个 feature 模块
 */
export async function copyFeature(featureName, targetDir, destDir, templateDir) {
  const destPath = path.join(targetDir, destDir);
  await fs.ensureDir(destPath);

  // 1. 优先从本地模板复制（开发时使用）
  const localTemplatePath = path.join(templateDir, `features/${featureName}`);
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

/**
 * 复制所有 feature 模块
 */
export async function copyAllFeatures(features, targetDir, templateDir) {
  for (const feature of features) {
    await copyFeature(feature.name, targetDir, feature.dest, templateDir);
  }
}

/**
 * 复制 .env 文件
 */
export async function copyEnvFile(targetDir, templateDir) {
  const localEnvPath = path.join(templateDir, 'features/feature-env/.env.example');
  if (await fs.pathExists(localEnvPath)) {
    await fs.copy(localEnvPath, path.join(targetDir, '.env'));
  }
}
