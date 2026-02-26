
import { UserProfile, ScanResult, FileRecord, UserMessage } from '../types';
import { dbService } from './dbService';

// Create a cross-tab communication channel for real-time updates
const adminSignalChannel = new BroadcastChannel('admin_signals');

export const storageService = {
  // User Management
  saveUser: async (profile: UserProfile) => {
    await dbService.saveUser(profile);
  },

  findUser: async (email: string): Promise<UserProfile | undefined> => {
    return await dbService.getUser(email);
  },

  // Scan History Management
  saveScanResult: async (email: string, result: ScanResult, files?: File[]) => {
    await dbService.saveScan(email, result);
    
    if (files && files.length > 0) {
      for (const file of files) {
        const fileRecord: FileRecord = {
          id: `file-${Math.random().toString(36).substr(2, 9)}`,
          scanId: result.id,
          name: file.name,
          size: file.size,
          type: file.type,
          data: file
        };
        await dbService.saveFile(fileRecord);
      }
    }
  },

  getUserScanHistory: async (email: string): Promise<ScanResult[]> => {
    return await dbService.getScans(email);
  },

  getLatestScan: async (email: string): Promise<ScanResult | null> => {
    const history = await dbService.getScans(email);
    return history.length > 0 ? history[0] : null;
  },

  getScanFiles: async (scanId: string): Promise<FileRecord[]> => {
    return await dbService.getFilesByScanId(scanId);
  },

  // Messaging System
  sendMessage: async (message: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => {
    const msg: UserMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Persist to IndexedDB
    const saved = await dbService.saveMessage(msg);
    
    // Broadcast signal for real-time delivery to Admin Panel
    adminSignalChannel.postMessage({ type: 'NEW_MESSAGE', data: msg });
    
    return saved;
  },

  getAdminMessages: async (): Promise<UserMessage[]> => {
    return await dbService.getAllMessages();
  },

  acknowledgeMessage: async (id: string) => {
    return await dbService.markMessageRead(id);
  },

  // Real-time listener registration
  subscribeToSignals: (callback: (payload: any) => void) => {
    const handler = (event: MessageEvent) => callback(event.data);
    adminSignalChannel.addEventListener('message', handler);
    return () => adminSignalChannel.removeEventListener('message', handler);
  }
};
