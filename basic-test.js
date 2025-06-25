#!/usr/bin/env node

import { writeFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

console.log('🧪 开始基础功能测试...\n');

// 测试1: 检查编译文件
console.log('1️⃣ 检查编译文件...');
const distFiles = [
  'dist/index.js',
  'dist/mcp-server.js',
  'dist/knowledge-base.js',
  'dist/document-processor.js',
  'dist/types.js'
];

let allFilesExist = true;
distFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`   ✅ ${file} 存在`);
  } else {
    console.log(`   ❌ ${file} 不存在`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ 编译文件不完整，请重新运行 npm run build');
  process.exit(1);
}

// 测试2: 检查配置文件
console.log('\n2️⃣ 检查配置文件...');
const configFiles = [
  'package.json',
  'tsconfig.json',
  'README.md',
  'modelscope.json'
];

configFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`   ✅ ${file} 存在`);
  } else {
    console.log(`   ❌ ${file} 不存在`);
  }
});

// 测试3: 检查依赖
console.log('\n3️⃣ 检查依赖...');
const nodeModulesExists = existsSync('node_modules');
if (nodeModulesExists) {
  console.log('   ✅ node_modules 存在');
  
  // 检查关键依赖
  const keyDeps = [
    'node_modules/@modelcontextprotocol/sdk',
    'node_modules/pdf-parse',
    'node_modules/mammoth',
    'node_modules/cheerio'
  ];
  
  keyDeps.forEach(dep => {
    if (existsSync(dep)) {
      console.log(`   ✅ ${dep.split('/').pop()} 依赖存在`);
    } else {
      console.log(`   ❌ ${dep.split('/').pop()} 依赖缺失`);
    }
  });
} else {
  console.log('   ❌ node_modules 不存在，请运行 npm install');
}

// 测试4: 创建测试文档并测试基本功能
console.log('\n4️⃣ 测试基本文件操作...');
const testDocPath = path.join(process.cwd(), 'test-document.txt');
const testContent = `这是一个测试文档。

人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。

该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。`;

try {
  writeFileSync(testDocPath, testContent, 'utf-8');
  console.log('   ✅ 测试文档创建成功');
  
  // 检查文件内容
  const fs = await import('fs');
  const content = fs.readFileSync(testDocPath, 'utf-8');
  if (content.includes('人工智能')) {
    console.log('   ✅ 文档内容正确');
  } else {
    console.log('   ❌ 文档内容不正确');
  }
  
  // 清理
  unlinkSync(testDocPath);
  console.log('   ✅ 测试文档清理成功');
  
} catch (error) {
  console.log('   ❌ 文件操作失败:', error.message);
}

// 测试5: 检查目录结构
console.log('\n5️⃣ 检查项目结构...');
const projectStructure = [
  'src/',
  'src/types.ts',
  'src/document-processor.ts',
  'src/knowledge-base.ts',
  'src/mcp-server.ts',
  'src/index.ts'
];

projectStructure.forEach(item => {
  if (existsSync(item)) {
    console.log(`   ✅ ${item} 存在`);
  } else {
    console.log(`   ❌ ${item} 不存在`);
  }
});

console.log('\n🎉 基础测试完成！');
console.log('\n📋 下一步测试建议:');
console.log('1. 运行 npm start 启动服务器');
console.log('2. 使用MCP客户端连接测试');
console.log('3. 添加实际文档进行功能测试'); 