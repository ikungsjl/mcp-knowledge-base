import fs from 'fs-extra';
import path from 'path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { Document, DocumentProcessingResult } from './types.js';

export class DocumentProcessor {
  private supportedFormats = ['.pdf', '.docx', '.txt', '.html', '.htm'];

  async processDocument(filePath: string): Promise<DocumentProcessingResult> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      if (!this.supportedFormats.includes(ext)) {
        return {
          success: false,
          error: `不支持的文件格式: ${ext}`
        };
      }

      const content = await this.extractContent(filePath, ext);
      const title = this.extractTitle(filePath, content);
      
      const document: Document = {
        id: this.generateDocumentId(filePath),
        title,
        content,
        filePath,
        fileType: ext.slice(1) as Document['fileType'],
        metadata: await this.extractMetadata(filePath),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        document
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private async extractContent(filePath: string, ext: string): Promise<string> {
    switch (ext) {
      case '.pdf':
        return await this.extractPdfContent(filePath);
      case '.docx':
        return await this.extractDocxContent(filePath);
      case '.txt':
        return await this.extractTxtContent(filePath);
      case '.html':
      case '.htm':
        return await this.extractHtmlContent(filePath);
      default:
        throw new Error(`不支持的文件格式: ${ext}`);
    }
  }

  private async extractPdfContent(filePath: string): Promise<string> {
    try {
      // 动态导入pdf-parse以避免启动时的错误
      const pdf = await import('pdf-parse');
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf.default(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async extractDocxContent(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async extractTxtContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`TXT文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async extractHtmlContent(filePath: string): Promise<string> {
    try {
      const html = await fs.readFile(filePath, 'utf-8');
      const $ = cheerio.load(html);
      
      // 移除脚本和样式标签
      $('script, style').remove();
      
      // 提取文本内容
      return $('body').text().trim();
    } catch (error) {
      throw new Error(`HTML解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private extractTitle(filePath: string, content: string): string {
    // 尝试从文件名提取标题
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 如果内容不为空，尝试从内容的第一行提取标题
    if (content.trim()) {
      const firstLine = content.split('\n')[0].trim();
      if (firstLine.length > 0 && firstLine.length < 100) {
        return firstLine;
      }
    }
    
    return fileName;
  }

  private generateDocumentId(filePath: string): string {
    const hash = createHash('md5').update(filePath).digest('hex');
    return hash.substring(0, 8);
  }

  private async extractMetadata(filePath: string): Promise<Record<string, any>> {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      path: filePath
    };
  }

  async processDirectory(dirPath: string): Promise<Document[]> {
    const documents: Document[] = [];
    
    const files = await this.findDocumentFiles(dirPath);
    
    for (const file of files) {
      const result = await this.processDocument(file);
      if (result.success && result.document) {
        documents.push(result.document);
      } else {
        console.warn(`处理文档失败: ${file} - ${result.error}`);
      }
    }
    
    return documents;
  }

  private async findDocumentFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        const subFiles = await this.findDocumentFiles(fullPath);
        files.push(...subFiles);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (this.supportedFormats.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }
} 