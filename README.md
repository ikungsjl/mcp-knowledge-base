# MCP 知识库服务器

这是一个基于 Model Context Protocol (MCP) 的知识库服务器，可以处理本地文档并根据文档内容回答问题。

## 功能特性

- 支持多种文档格式：PDF、DOCX、TXT、HTML
- 自动文档索引和搜索
- 基于相似度的文档检索
- 完整的 MCP 协议支持
- 中文文档处理支持

## 安装

1. 克隆项目并安装依赖：

```bash
npm install
```

2. 构建项目：

```bash
npm run build
```

## 使用方法

### 1. 启动服务器

```bash
npm start
```

### 2. 在 MCP 客户端中配置

在你的 MCP 客户端配置文件中添加：

```json
{
  "mcpServers": {
    "knowledge-base": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

### 3. 可用的工具

#### 添加文档
- `add_document`: 添加单个文档到知识库
- `add_directory`: 添加目录中的所有文档到知识库

#### 查询知识库
- `query_knowledge_base`: 查询知识库并获取答案

#### 管理文档
- `list_documents`: 列出所有文档
- `get_document`: 获取特定文档信息
- `remove_document`: 移除文档
- `clear_knowledge_base`: 清空知识库
- `get_stats`: 获取统计信息

## 配置

服务器会自动创建以下目录：
- `documents/`: 存储文档文件
- `index/`: 存储索引数据

## 开发

```bash
# 开发模式
npm run dev

# 测试
npm test
```

## 项目结构

```
src/
├── types.ts              # 类型定义
├── document-processor.ts # 文档处理器
├── knowledge-base.ts     # 知识库核心
├── mcp-server.ts         # MCP 服务器
└── index.ts             # 入口文件
```

## 许可证

MIT 