
import { Project, Dependency, Notification, UserProfile } from './types';

export const mockUser: UserProfile = {
  name: 'Madhan',
  username: 'madhan',
  email: 'madhan@gmail.com',
  phone: '+91 98765 43210',
  location: 'Chennai, India',
  about: 'Cyber-Security Researcher & SBOM Architect. Expert in automated supply chain analysis and dependency vulnerability mapping.'
};

export const mockProjects: Project[] = [
  {
    id: 'prj-001',
    name: 'Core Payment Gateway',
    lastScan: '2024-05-15 14:30',
    vulnerabilities: { critical: 2, high: 5, medium: 12, low: 24 },
    dependencyCount: 142
  },
  {
    id: 'prj-002',
    name: 'Customer Portal V2',
    lastScan: '2024-05-14 09:15',
    vulnerabilities: { critical: 0, high: 1, medium: 4, low: 18 },
    dependencyCount: 89
  }
];

export const mockDependencies: Dependency[] = [
  { id: '1', name: '@internal/auth-bridge', version: '2.4.1', license: 'Proprietary', risk: 'Stable', source: 'Internal Git', type: 'internal' },
  { id: '2', name: 'react', version: '19.0.0', license: 'MIT', risk: 'Low', source: 'npmjs.com', type: 'external' },
  { id: '3', name: 'lodash', version: '4.17.21', license: 'MIT', risk: 'Critical', reason: 'CVE-2023-4527: Prototype Pollution vulnerability detected in deepClone.', source: 'npmjs.com', type: 'third-party' },
  { id: '4', name: 'axios', version: '1.6.0', license: 'MIT', risk: 'Low', source: 'npmjs.com', type: 'external' },
  { id: '5', name: '@internal/logging-service', version: '1.0.5', license: 'Proprietary', risk: 'Stable', source: 'Internal Git', type: 'internal' },
  { id: '6', name: 'event-stream', version: '3.3.6', license: 'MIT', risk: 'Critical', reason: 'Malicious injection: Flatmap-stream backdoor detected in version metadata.', source: 'npmjs.com', type: 'third-party' },
  { id: '7', name: 'protobufjs', version: '6.11.3', license: 'BSD-3-Clause', risk: 'High', reason: 'End of Life: This version is no longer supported and contains unpatched bugs.', source: 'npmjs.com', type: 'third-party' },
  { id: '8', name: 'moment', version: '2.29.4', license: 'MIT', risk: 'Medium', reason: 'Known vulnerabilities in date parsing logic under specific locales.', source: 'npmjs.com', type: 'external' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Critical Injection', message: 'Malware signature "TR-XRAY-09" detected in project "Mobile Auth".', type: 'security', timestamp: '2 mins ago', read: false },
  { id: 'n2', title: 'Scan Completed', message: 'Core Gateway scan finished with 142 dependencies mapped.', type: 'success', timestamp: '1 hour ago', read: false },
  { id: 'n3', title: 'Vulnerability Warning', message: 'New high-risk CVE detected in "lodash". Update required.', type: 'error', timestamp: '5 hours ago', read: true },
];
