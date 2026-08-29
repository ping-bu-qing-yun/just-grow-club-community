#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getAutomationConfig } = require('../utils/devAutomationConfig');

function findProjectLocalStorageFiles(rootDir, projectPath) {
  const matches = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const localDataDir = path.join(rootDir, entry.name, 'WeappLocalData');
    if (!fs.existsSync(localDataDir)) {
      continue;
    }

    const names = fs.readdirSync(localDataDir).filter((name) => name.startsWith('localstorage_') && name.endsWith('.json'));
    for (const name of names) {
      const filePath = path.join(localDataDir, name);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.projectid === projectPath || data.projectpath === projectPath) {
          matches.push(filePath);
        }
      } catch (error) {
        continue;
      }
    }
  }

  return matches;
}

function findProjectLocalStorageFile(rootDir, projectPath, modeName) {
  const matches = findProjectLocalStorageFiles(rootDir, projectPath);
  if (matches.length === 0) {
    return '';
  }

  if (!modeName) {
    return matches[0];
  }

  const preferred = matches.find((filePath) => {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const condition = data.condiction || data.condition || {};
      const weapp = condition.weapp || condition.miniprogram || {};
      const list = Array.isArray(weapp.list) ? weapp.list : [];
      return list.some((item) => item && item.name === modeName);
    } catch (error) {
      return false;
    }
  });

  return preferred || matches[0];
}

function setCompileMode({ filePath, modeName }) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const condition = data.condiction || data.condition || {};
  const weapp = condition.weapp || condition.miniprogram || { current: -1, list: [] };
  const list = Array.isArray(weapp.list) ? weapp.list : [];
  const index = list.findIndex((item) => item && item.name === modeName);

  if (index < 0) {
    throw new Error(`compile mode not found: ${modeName}`);
  }

  weapp.current = index;
  condition.weapp = weapp;
  data.condiction = condition;
  fs.writeFileSync(filePath, JSON.stringify(data));

  return {
    filePath,
    modeName,
    current: index
  };
}

function main() {
  const { projectPath, defaultCompileModeName } = getAutomationConfig();
  const modeName = process.argv[2] || defaultCompileModeName;
  const rootDir = path.join(process.env.HOME, 'Library/Application Support/微信开发者工具');
  const filePath = findProjectLocalStorageFile(rootDir, projectPath, modeName);

  if (!filePath) {
    throw new Error(`localstorage file not found for project: ${projectPath}`);
  }

  const result = setCompileMode({ filePath, modeName });
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[wechat-set-compile-mode] ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  findProjectLocalStorageFiles,
  findProjectLocalStorageFile,
  setCompileMode
};
