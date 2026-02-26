import { Dependency, RiskLevel, ScanResult, CodeError } from '../types';

/**
 * Deterministic Analysis Engine V7.0
 * Implements strict manifest extraction, asset classification, and CVE mapping.
 */

// Mock Vulnerability Database for deterministic matching
const VULNERABILITY_DB: Record<string, { severity: RiskLevel; reason: string; impact: string; fix: string }> = {
  'lodash': {
    severity: 'High',
    reason: 'Prototype Pollution vulnerability (CVE-2020-8203) in versions < 4.17.21.',
    impact: 'Remote code execution or denial of service.',
    fix: 'Upgrade to lodash@4.17.21 or higher.'
  },
  'axios': {
    severity: 'Medium',
    reason: 'Server-Side Request Forgery (SSRF) in specific configurations.',
    impact: 'Information disclosure from internal network.',
    fix: 'Upgrade to axios@1.6.0+ and validate URLs.'
  },
  'express': {
    severity: 'Low',
    reason: 'Open redirect vulnerability in older middleware patterns.',
    impact: 'Phishing attacks targeting end users.',
    fix: 'Ensure express@4.18.2+ and use secure redirect logic.'
  },
  'react': {
    severity: 'Stable',
    reason: 'No known high-impact vulnerabilities in current stable branch.',
    impact: 'Low operational risk.',
    fix: 'Keep updated with latest minor releases.'
  }
};

const getStringHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getRiskLevel = (name: string, version: string): { risk: RiskLevel; reason: string; impact: string; fix: string } => {
  const lowerName = name.toLowerCase();
  
  // 1. Check Vulnerability DB
  const knownVuln = VULNERABILITY_DB[lowerName];
  if (knownVuln) {
    return {
      risk: knownVuln.severity,
      reason: knownVuln.reason,
      impact: knownVuln.impact,
      fix: knownVuln.fix
    };
  }

  // 2. Heuristic checks
  if (version.startsWith('0.') || version.includes('beta') || version.includes('alpha')) {
    return {
      risk: 'Medium',
      reason: 'Experimental or pre-release version detected.',
      impact: 'Unpredictable behavior and potential unpatched bugs.',
      fix: 'Migrate to a stable (v1.0.0+) release.'
    };
  }

  if (lowerName.includes('legacy') || lowerName.includes('deprecated') || lowerName.includes('old')) {
    return {
      risk: 'High',
      reason: 'Component explicitly marked as legacy or deprecated.',
      impact: 'Lack of security patches and maintenance.',
      fix: 'Replace with a modern alternative.'
    };
  }

  return {
    risk: 'Stable',
    reason: 'No immediate threats detected in component signature.',
    impact: 'Minimal risk.',
    fix: 'Standard dependency rotation.'
  };
};

export const analyzeFiles = async (files: File[]): Promise<ScanResult> => {
  const timestamp = new Date().toLocaleString();
  const projectName = files.length > 0 ? files[0].name.split('.')[0] : 'Untitled_Project';
  
  const dependencies: Dependency[] = [];
  const codeErrors: CodeError[] = [];

  // 1. Manifest Extraction (package.json)
  const packageJsonFile = files.find(f => f.name === 'package.json');
  if (packageJsonFile) {
    try {
      const content = await packageJsonFile.text();
      const pkg = JSON.parse(content);

      const processCategory = (deps: any, categoryLabel: string) => {
        if (!deps) return;
        Object.entries(deps).forEach(([name, version]) => {
          const cleanVersion = (version as string).replace(/[^0-9.]/g, '') || 'latest';
          const hash = getStringHash(name + cleanVersion + categoryLabel);
          const { risk, reason, impact, fix } = getRiskLevel(name, cleanVersion);

          dependencies.push({
            id: `dep-${hash}`,
            name,
            version: cleanVersion,
            license: categoryLabel === 'Production' ? 'MIT/Apache' : 'Dev-Only',
            risk,
            reason,
            impact,
            suggestedFix: fix,
            source: 'npm Registry',
            type: 'third-party'
          });
        });
      };

      processCategory(pkg.dependencies, 'Production');
      processCategory(pkg.devDependencies, 'Development');
      processCategory(pkg.peerDependencies, 'Peer');

    } catch (e) {
      console.error("MANIFEST_PARSE_ERROR", e);
    }
  }

  // 2. Source Code & Asset Analysis
  for (const file of files) {
    if (file.name === 'package.json' || file.name === 'package-lock.json') continue;

    const lowerName = file.name.toLowerCase();
    const hash = getStringHash(file.name);
    
    // Classification Logic
    let type: 'internal' | 'external' | 'third-party' = 'internal';
    let source = 'Source Root';
    
    if (lowerName.includes('.min.js') || lowerName.includes('cdn') || lowerName.includes('lib/')) {
      type = 'external';
      source = 'External Asset';
    } else if (lowerName.endsWith('.ts') || lowerName.endsWith('.tsx') || lowerName.endsWith('.js')) {
      type = 'internal';
      source = 'Local Source';
    }

    const { risk, reason, impact, fix } = getRiskLevel(file.name, '1.0.0');

    dependencies.push({
      id: `asset-${hash}`,
      name: file.name,
      version: 'Local',
      license: type === 'internal' ? 'Proprietary' : 'OSS',
      risk,
      reason,
      impact,
      suggestedFix: fix,
      source,
      type,
      filePath: file.name
    });

    // 3. Static Analysis for Secrets
    const content = await file.text();
    const secretPatterns = [
      { pattern: /AIza[0-9A-Za-z-_]{35}/, type: 'Google API Key' },
      { pattern: /sk_live_[0-9a-zA-Z]{24}/, type: 'Stripe Secret Key' },
      { pattern: /"password"\s*:\s*".+"/, type: 'Hardcoded Password' },
      { pattern: /"secret"\s*:\s*".+"/, type: 'Hardcoded Secret' }
    ];

    secretPatterns.forEach(sp => {
      if (sp.pattern.test(content)) {
        codeErrors.push({
          id: `vuln-${hash}-${sp.type.replace(/\s+/g, '-')}`,
          filePath: file.name,
          line: 1,
          errorType: 'Sensitive Exposure',
          description: `${sp.type} detected in "${file.name}".`,
          impact: 'Potential unauthorized access to cloud resources or user data.',
          suggestedFix: 'Use environment variables or a secret manager.',
          severity: 'Critical',
          snippet: `// Finding: ${sp.type} in ${file.name}`
        });
      }
    });
  }

  const vulnerabilities = {
    critical: dependencies.filter(d => d.risk === 'Critical').length + codeErrors.filter(e => e.severity === 'Critical').length,
    high: dependencies.filter(d => d.risk === 'High').length + codeErrors.filter(e => e.severity === 'High').length,
    medium: dependencies.filter(d => d.risk === 'Medium').length + codeErrors.filter(e => e.severity === 'Medium').length,
    low: dependencies.filter(d => d.risk === 'Low').length + codeErrors.filter(e => e.severity === 'Low').length
  };

  return {
    id: `audit-${getStringHash(projectName + timestamp)}`,
    projectName,
    timestamp,
    vulnerabilities,
    dependencies,
    codeErrors,
    metadata: {
      engine: 'SBOM_DETERMINISTIC_V7',
      fileCount: files.length,
      detectedStack: dependencies.some(d => d.name.toLowerCase().includes('react')) ? 'React' : 'Native',
      totalSize: `${(files.reduce((a, f) => a + f.size, 0) / 1024).toFixed(2)} KB`
    }
  };
};
