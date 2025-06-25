#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

// 创建测试文档
const testDocPath = path.join(process.cwd(), 'test-document.txt');
const testContent = `这是一个测试文档。

人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。

该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大，可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。

人工智能可以对人的意识、思维的信息过程的模拟。人工智能不是人的智能，但能像人那样思考、也可能超过人的智能。`;

writeFileSync(testDocPath, testContent, 'utf-8');

console.log('🚀 启动MCP知识库服务器测试...\n');

// 启动MCP服务器
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverReady = false;
let testResults = [];

// 监听服务器输出
server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('服务器输出:', output);
  
  if (output.includes('知识库MCP服务器已启动')) {
    serverReady = true;
    console.log('✅ 服务器启动成功！');
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('服务器错误:', output);
  
  if (output.includes('知识库MCP服务器已启动')) {
    serverReady = true;
    console.log('✅ 服务器启动成功！');
  }
});

// 模拟MCP客户端请求
function sendMCPRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}

// 测试流程
setTimeout(() => {
  if (!serverReady) {
    console.log('❌ 服务器启动超时');
    cleanup();
    return;
  }
  
  console.log('\n📋 开始测试MCP服务器功能...\n');
  
  // 测试1: 添加文档
  console.log('1️⃣ 测试添加文档...');
  sendMCPRequest('tools/call', {
    name: 'add_document',
    arguments: {
      file_path: testDocPath
    }
  });
  
  // 测试2: 查询知识库
  setTimeout(() => {
    console.log('\n2️⃣ 测试查询知识库...');
    sendMCPRequest('tools/call', {
      name: 'query_knowledge_base',
      arguments: {
        question: '什么是人工智能？'
      }
    });
  }, 2000);
  
  // 测试3: 获取统计信息
  setTimeout(() => {
    console.log('\n3️⃣ 测试获取统计信息...');
    sendMCPRequest('tools/call', {
      name: 'get_stats',
      arguments: {}
    });
  }, 4000);
  
  // 测试4: 列出文档
  setTimeout(() => {
    console.log('\n4️⃣ 测试列出文档...');
    sendMCPRequest('tools/call', {
      name: 'list_documents',
      arguments: {}
    });
  }, 6000);
  
  // 清理
  setTimeout(() => {
    console.log('\n🧹 清理测试文件...');
    cleanup();
  }, 8000);
  
}, 3000);

function cleanup() {
  try {
    unlinkSync(testDocPath);
    console.log('✅ 测试文件已清理');
  } catch (error) {
    console.log('⚠️ 清理测试文件失败:', error.message);
  }
  
  server.kill();
  console.log('✅ 服务器已停止');
  process.exit(0);
}

// 处理进程退出
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup); 