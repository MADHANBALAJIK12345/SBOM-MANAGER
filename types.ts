
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Stable';

export interface CodeError {
  id: string;
  filePath: string;
  line: number;
  errorType: string;
  description: string;
  impact: string;
  suggestedFix: string;
  severity: RiskLevel;
  snippet: string;
}

export interface Dependency {
  id: string;
  name: string;
  version: string;
  license: string;
  risk: RiskLevel;
  reason?: string;
  impact?: string;
  suggestedFix?: string;
  source: string;
  type: 'internal' | 'external' | 'third-party';
  filePath?: string;
}

export interface FileRecord {
  id: string;
  scanId: string;
  name: string;
  size: number;
  type: string;
  data: Blob;
}

export interface Project {
  id: string;
  name: string;
  lastScan: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  dependencyCount: number;
}

export interface ScanResult {
  id: string;
  projectName: string;
  timestamp: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  dependencies: Dependency[];
  codeErrors: CodeError[];
  metadata: {
    engine: string;
    fileCount: number;
    detectedStack: string;
    totalSize?: string;
  };
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  location?: string;
  about?: string;
  role?: 'user' | 'admin';
  registerNumber?: string;
  department?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  timestamp: string;
  read: boolean;
}

export interface UserMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
}
