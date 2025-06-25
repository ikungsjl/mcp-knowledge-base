import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { KnowledgeBase } from './knowledge-base.js';
import { KnowledgeBaseConfig } from './types.js';
import path from 'path';

class KnowledgeBaseMCPServer {
  private server: Server;
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.server = new Server(
      {
        name: 'knowledge-base-server',
        version: '1.0.0',
        capabilities: {
          tools: {},
        },
      }
    );

    // 初始化知识库
    const config: KnowledgeBaseConfig = {
      documentsPath: path.join(process.cwd(), 'documents'),
      indexPath: path.join(process.cwd(), 'index'),
      supportedFormats: ['.pdf', '.docx', '.txt', '.html', '.htm'],
      maxSearchResults: 5,
      similarityThreshold: 0.1
    };

    this.knowledgeBase = new KnowledgeBase(config);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 添加文档到知识库
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add_document',
            description: '添加单个文档到知识库',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: '文档文件路径'
                }
              },
              required: ['file_path']
            }
          },
          {
            name: 'add_directory',
            description: '添加目录中的所有文档到知识库',
            inputSchema: {
              type: 'object',
              properties: {
                directory_path: {
                  type: 'string',
                  description: '目录路径'
                }
              },
              required: ['directory_path']
            }
          },
          {
            name: 'query_knowledge_base',
            description: '查询知识库',
            inputSchema: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description: '查询问题'
                },
                max_results: {
                  type: 'number',
                  description: '最大返回结果数',
                  default: 5
                },
                threshold: {
                  type: 'number',
                  description: '相似度阈值',
                  default: 0.1
                }
              },
              required: ['question']
            }
          },
          {
            name: 'list_documents',
            description: '列出知识库中的所有文档',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_document',
            description: '获取特定文档信息',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: '文档ID'
                }
              },
              required: ['document_id']
            }
          },
          {
            name: 'remove_document',
            description: '从知识库中移除文档',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: '文档ID'
                }
              },
              required: ['document_id']
            }
          },
          {
            name: 'clear_knowledge_base',
            description: '清空知识库',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_stats',
            description: '获取知识库统计信息',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ] as Tool[]
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add_document': {
            const { file_path } = args as { file_path: string };
            const success = await this.knowledgeBase.addDocument(file_path);
            return {
              content: [
                {
                  type: 'text',
                  text: success 
                    ? `文档 "${file_path}" 已成功添加到知识库`
                    : `添加文档 "${file_path}" 失败`
                }
              ]
            };
          }

          case 'add_directory': {
            const { directory_path } = args as { directory_path: string };
            const count = await this.knowledgeBase.addDirectory(directory_path);
            return {
              content: [
                {
                  type: 'text',
                  text: `已从目录 "${directory_path}" 添加了 ${count} 个文档到知识库`
                }
              ]
            };
          }

          case 'query_knowledge_base': {
            const { question, max_results, threshold } = args as {
              question: string;
              max_results?: number;
              threshold?: number;
            };
            
            const response = await this.knowledgeBase.query({
              question,
              maxResults: max_results,
              threshold
            });

            let resultText = `问题: ${question}\n\n答案: ${response.answer}\n\n置信度: ${(response.confidence * 100).toFixed(1)}%\n\n来源:\n`;
            
            response.sources.forEach((source, index) => {
              resultText += `${index + 1}. ${source.document.title} (相似度: ${(source.score * 100).toFixed(1)}%)\n`;
              resultText += `   片段: ${source.snippet}\n\n`;
            });

            return {
              content: [
                {
                  type: 'text',
                  text: resultText
                }
              ]
            };
          }

          case 'list_documents': {
            const documents = await this.knowledgeBase.getAllDocuments();
            let resultText = `知识库中共有 ${documents.length} 个文档:\n\n`;
            
            documents.forEach((doc, index) => {
              resultText += `${index + 1}. ${doc.title} (ID: ${doc.id})\n`;
              resultText += `   类型: ${doc.fileType}\n`;
              resultText += `   路径: ${doc.filePath}\n`;
              resultText += `   创建时间: ${doc.createdAt.toLocaleString()}\n\n`;
            });

            return {
              content: [
                {
                  type: 'text',
                  text: resultText
                }
              ]
            };
          }

          case 'get_document': {
            const { document_id } = args as { document_id: string };
            const document = await this.knowledgeBase.getDocument(document_id);
            
            if (!document) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `未找到ID为 "${document_id}" 的文档`
                  }
                ]
              };
            }

            const resultText = `文档信息:\n\n标题: ${document.title}\nID: ${document.id}\n类型: ${document.fileType}\n路径: ${document.filePath}\n创建时间: ${document.createdAt.toLocaleString()}\n更新时间: ${document.updatedAt.toLocaleString()}\n\n内容预览:\n${document.content.substring(0, 500)}...`;

            return {
              content: [
                {
                  type: 'text',
                  text: resultText
                }
              ]
            };
          }

          case 'remove_document': {
            const { document_id } = args as { document_id: string };
            const success = await this.knowledgeBase.removeDocument(document_id);
            
            return {
              content: [
                {
                  type: 'text',
                  text: success 
                    ? `文档 "${document_id}" 已从知识库中移除`
                    : `移除文档 "${document_id}" 失败，可能不存在`
                }
              ]
            };
          }

          case 'clear_knowledge_base': {
            await this.knowledgeBase.clear();
            return {
              content: [
                {
                  type: 'text',
                  text: '知识库已清空'
                }
              ]
            };
          }

          case 'get_stats': {
            const stats = this.knowledgeBase.getStats();
            const resultText = `知识库统计信息:\n\n总文档数: ${stats.totalDocuments}\n支持格式: ${stats.supportedFormats.join(', ')}\n最大搜索结果数: ${stats.maxSearchResults}\n相似度阈值: ${stats.similarityThreshold}`;

            return {
              content: [
                {
                  type: 'text',
                  text: resultText
                }
              ]
            };
          }

          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`
            }
          ]
        };
      }
    });
  }

  async run() {
    // 初始化知识库
    await this.knowledgeBase.initialize();
    
    // 启动服务器
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('知识库MCP服务器已启动');
  }
}

// 启动服务器
const server = new KnowledgeBaseMCPServer();
server.run().catch(console.error); 