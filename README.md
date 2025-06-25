# MCP 知识库服务器

这是一个基于 Model Context Protocol (MCP) 的知识库服务器，可以处理本地文档并根据文档内容回答问题。

## 功能特性

- 支持多种文档格式：PDF、DOCX、TXT、HTML
- 自动文档索引和搜索
- 基于相似度的文档检索
- 完整的 MCP 协议支持
- 中文文档处理支持

## ModelScope MCP 服务配置

```json
{
  "name": "mcp-knowledge-base",
  "version": "1.0.0",
  "description": "基于本地文档的知识库问答MCP服务器",
  "author": "yjy",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/ikungsjl/mcp-knowledge-base.git"
  },
  "keywords": ["mcp", "knowledge-base", "document-processing", "qa"],
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "natural": "^6.10.4",
    "fs-extra": "^11.2.0",
    "glob": "^10.3.10"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/fs-extra": "^11.0.4",
    "@types/natural": "^5.1.5",
    "@types/pdf-parse": "^1.1.4",
    "typescript": "^5.3.0",
    "tsx": "^4.6.0"
  },
  "mcp": {
    "server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    },
    "tools": [
      {
        "name": "add_document",
        "description": "添加单个文档到知识库",
        "inputSchema": {
          "type": "object",
          "properties": {
            "file_path": {
              "type": "string",
              "description": "文档文件路径"
            }
          },
          "required": ["file_path"]
        }
      },
      {
        "name": "add_directory",
        "description": "添加目录中的所有文档到知识库",
        "inputSchema": {
          "type": "object",
          "properties": {
            "directory_path": {
              "type": "string",
              "description": "目录路径"
            }
          },
          "required": ["directory_path"]
        }
      },
      {
        "name": "query_knowledge_base",
        "description": "查询知识库",
        "inputSchema": {
          "type": "object",
          "properties": {
            "question": {
              "type": "string",
              "description": "查询问题"
            },
            "max_results": {
              "type": "number",
              "description": "最大返回结果数",
              "default": 5
            },
            "threshold": {
              "type": "number",
              "description": "相似度阈值",
              "default": 0.1
            }
          },
          "required": ["question"]
        }
      },
      {
        "name": "list_documents",
        "description": "列出知识库中的所有文档",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      },
      {
        "name": "get_document",
        "description": "获取特定文档信息",
        "inputSchema": {
          "type": "object",
          "properties": {
            "document_id": {
              "type": "string",
              "description": "文档ID"
            }
          },
          "required": ["document_id"]
        }
      },
      {
        "name": "remove_document",
        "description": "从知识库中移除文档",
        "inputSchema": {
          "type": "object",
          "properties": {
            "document_id": {
              "type": "string",
              "description": "文档ID"
            }
          },
          "required": ["document_id"]
        }
      },
      {
        "name": "clear_knowledge_base",
        "description": "清空知识库",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      },
      {
        "name": "get_stats",
        "description": "获取知识库统计信息",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      }
    ]
  }
}
```

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
