export interface Document {
  id: string;
  title: string;
  content: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'html';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  document: Document;
  score: number;
  snippet: string;
}

export interface KnowledgeBaseConfig {
  documentsPath: string;
  indexPath: string;
  supportedFormats: string[];
  maxSearchResults: number;
  similarityThreshold: number;
}

export interface QueryRequest {
  question: string;
  maxResults?: number;
  threshold?: number;
}

export interface QueryResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
}

export interface DocumentProcessingResult {
  success: boolean;
  document?: Document;
  error?: string;
} 