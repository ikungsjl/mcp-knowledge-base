import fs from 'fs-extra';
import path from 'path';
import { Document, SearchResult, KnowledgeBaseConfig, QueryRequest, QueryResponse } from './types.js';
import { DocumentProcessor } from './document-processor.js';

export class KnowledgeBase {
  private documents: Map<string, Document> = new Map();
  private config: KnowledgeBaseConfig;
  private processor: DocumentProcessor;

  constructor(config: KnowledgeBaseConfig) {
    this.config = config;
    this.processor = new DocumentProcessor();
  }

  async initialize(): Promise<void> {
    // 确保目录存在
    await fs.ensureDir(this.config.documentsPath);
    await fs.ensureDir(this.config.indexPath);
    
    // 加载现有索引
    await this.loadIndex();
  }

  async addDocument(filePath: string): Promise<boolean> {
    const result = await this.processor.processDocument(filePath);
    
    if (result.success && result.document) {
      this.documents.set(result.document.id, result.document);
      await this.saveIndex();
      return true;
    }
    
    return false;
  }

  async addDirectory(dirPath: string): Promise<number> {
    const documents = await this.processor.processDirectory(dirPath);
    
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
    
    await this.saveIndex();
    return documents.length;
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    const { question, maxResults = this.config.maxSearchResults, threshold = this.config.similarityThreshold } = request;
    
    // 简单的关键词搜索实现
    const results = this.searchDocuments(question, maxResults, threshold);
    
    // 生成答案
    const answer = this.generateAnswer(question, results);
    
    return {
      answer,
      sources: results,
      confidence: this.calculateConfidence(results)
    };
  }

  private searchDocuments(query: string, maxResults: number, threshold: number): SearchResult[] {
    const queryTerms = this.tokenize(query.toLowerCase());
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      const score = this.calculateSimilarity(queryTerms, doc.content.toLowerCase());
      
      if (score >= threshold) {
        const snippet = this.extractSnippet(doc.content, queryTerms);
        results.push({
          document: doc,
          score,
          snippet
        });
      }
    }

    // 按相似度排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, maxResults);
  }

  private tokenize(text: string): string[] {
    // 简单的分词实现
    return text
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  private calculateSimilarity(queryTerms: string[], content: string): number {
    let score = 0;
    const contentTerms = this.tokenize(content);
    
    for (const queryTerm of queryTerms) {
      const termCount = contentTerms.filter(term => term.includes(queryTerm) || queryTerm.includes(term)).length;
      score += termCount / contentTerms.length;
    }
    
    return score / queryTerms.length;
  }

  private extractSnippet(content: string, queryTerms: string[], maxLength: number = 200): string {
    // 找到包含最多查询词的段落
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    let bestParagraph = '';
    let bestScore = 0;

    for (const paragraph of paragraphs) {
      const score = queryTerms.reduce((acc, term) => {
        return acc + (paragraph.toLowerCase().includes(term) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestParagraph = paragraph;
      }
    }

    // 截取片段
    if (bestParagraph.length > maxLength) {
      return bestParagraph.substring(0, maxLength) + '...';
    }

    return bestParagraph;
  }

  private generateAnswer(question: string, results: SearchResult[]): string {
    if (results.length === 0) {
      return '抱歉，我在知识库中没有找到相关信息。';
    }

    // 简单的答案生成
    const topResult = results[0];
    const relevantContent = topResult.snippet;
    
    return `根据文档"${topResult.document.title}"，${relevantContent}`;
  }

  private calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    return Math.min(avgScore, 1.0);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async removeDocument(id: string): Promise<boolean> {
    const deleted = this.documents.delete(id);
    if (deleted) {
      await this.saveIndex();
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.documents.clear();
    await this.saveIndex();
  }

  private async saveIndex(): Promise<void> {
    const indexPath = path.join(this.config.indexPath, 'documents.json');
    const documentsArray = Array.from(this.documents.values());
    
    await fs.writeJson(indexPath, documentsArray, { spaces: 2 });
  }

  private async loadIndex(): Promise<void> {
    const indexPath = path.join(this.config.indexPath, 'documents.json');
    
    try {
      if (await fs.pathExists(indexPath)) {
        const documentsArray = await fs.readJson(indexPath);
        
        for (const doc of documentsArray) {
          // 恢复日期对象
          doc.createdAt = new Date(doc.createdAt);
          doc.updatedAt = new Date(doc.updatedAt);
          this.documents.set(doc.id, doc);
        }
      }
    } catch (error) {
      console.warn('加载索引失败:', error);
    }
  }

  getStats() {
    return {
      totalDocuments: this.documents.size,
      supportedFormats: this.config.supportedFormats,
      maxSearchResults: this.config.maxSearchResults,
      similarityThreshold: this.config.similarityThreshold
    };
  }
} 