#!/usr/bin/env node

import { KnowledgeBase } from './dist/knowledge-base.js';
import { DocumentProcessor } from './dist/document-processor.js';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

console.log('🧪 开始测试MCP知识库服务器组件...\n');

// 测试配置
const config = {
  documentsPath: path.join(process.cwd(), 'test-documents'),
  indexPath: path.join(process.cwd(), 'test-index'),
  supportedFormats: ['.pdf', '.docx', '.txt', '.html', '.htm'],
  maxSearchResults: 5,
  similarityThreshold: 0.1
};

async function runTests() {
  try {
    // 创建测试文档
    const testDocPath = path.join(process.cwd(), 'test-document.txt');
    const testContent = `这是一个测试文档。

人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。

该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大，可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。

人工智能可以对人的意识、思维的信息过程的模拟。人工智能不是人的智能，但能像人那样思考、也可能超过人的智能。`;

    writeFileSync(testDocPath, testContent, 'utf-8');
    console.log('✅ 测试文档创建成功');

    // 测试1: 文档处理器
    console.log('\n1️⃣ 测试文档处理器...');
    const processor = new DocumentProcessor();
    const result = await processor.processDocument(testDocPath);
    
    if (result.success && result.document) {
      console.log('✅ 文档处理成功');
      console.log(`   文档标题: ${result.document.title}`);
      console.log(`   文档ID: ${result.document.id}`);
      console.log(`   文档类型: ${result.document.fileType}`);
      console.log(`   内容长度: ${result.document.content.length} 字符`);
    } else {
      console.log('❌ 文档处理失败:', result.error);
      return;
    }

    // 测试2: 知识库
    console.log('\n2️⃣ 测试知识库...');
    const knowledgeBase = new KnowledgeBase(config);
    await knowledgeBase.initialize();
    console.log('✅ 知识库初始化成功');

    // 添加文档到知识库
    const addResult = await knowledgeBase.addDocument(testDocPath);
    if (addResult) {
      console.log('✅ 文档添加到知识库成功');
    } else {
      console.log('❌ 文档添加到知识库失败');
      return;
    }

    // 测试查询
    console.log('\n3️⃣ 测试知识库查询...');
    const queryResult = await knowledgeBase.query({
      question: '什么是人工智能？',
      maxResults: 3
    });

    console.log('✅ 查询成功');
    console.log(`   答案: ${queryResult.answer}`);
    console.log(`   置信度: ${(queryResult.confidence * 100).toFixed(1)}%`);
    console.log(`   找到 ${queryResult.sources.length} 个相关文档`);

    // 测试统计信息
    console.log('\n4️⃣ 测试统计信息...');
    const stats = knowledgeBase.getStats();
    console.log('✅ 统计信息获取成功');
    console.log(`   总文档数: ${stats.totalDocuments}`);
    console.log(`   支持格式: ${stats.supportedFormats.join(', ')}`);

    // 测试列出文档
    console.log('\n5️⃣ 测试列出文档...');
    const documents = await knowledgeBase.getAllDocuments();
    console.log('✅ 文档列表获取成功');
    console.log(`   文档数量: ${documents.length}`);
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.title} (${doc.fileType})`);
    });

    console.log('\n🎉 所有测试通过！MCP知识库服务器运行正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 清理测试文件
    try {
      unlinkSync(path.join(process.cwd(), 'test-document.txt'));
      console.log('\n🧹 测试文件已清理');
    } catch (error) {
      console.log('\n⚠️ 清理测试文件失败:', error.message);
    }
  }
}

runTests(); 