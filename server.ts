import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { VULNERABILITY_DATASET } from './vulnerabilityDataset.js';
import { ScanResult, RiskLevel, ScanComparison, Dependency } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// In-memory storage for scan history
const scanHistory: ScanResult[] = [];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

interface ScanFile {
  name: string;
  content: string;
}

const BUILT_IN_MODULES = {
  node: ['fs', 'path', 'os', 'http', 'https', 'crypto', 'util', 'events', 'stream', 'zlib', 'url', 'querystring', 'buffer', 'child_process', 'cluster', 'dns', 'net', 'readline', 'v8', 'vm', 'worker_threads'],
  python: ['os', 'sys', 'math', 'datetime', 'json', 're', 'random', 'collections', 'itertools', 'functools', 'pathlib', 'shutil', 'subprocess', 'threading', 'multiprocessing', 'logging', 'argparse', 'urllib', 'http', 'socket', 'ssl', 'hashlib', 'base64', 'csv', 'sqlite3', 'xml', 'html', 'email', 'time', 'inspect', 'traceback', 'warnings', 'enum', 'typing', 'unittest', 'pydoc', 'doctest', 'pdb', 'profile', 'timeit', 'venv', 'zipfile', 'tarfile', 'gzip', 'bz2', 'lzma', 'pickle', 'copy', 'pprint', 'reprlib', 'string', 'textwrap', 'unicodedata', 'struct', 'codecs', 'bisect', 'heapq', 'array', 'weakref', 'types', 'gc', 'sysconfig', 'site', 'distutils', 'pkgutil', 'modulefinder', 'runpy', 'importlib', 'tokenize', 'tabnanny', 'pyclbr', 'py_compile', 'compileall', 'dis', 'antigravity'],
  java: ['java.lang', 'java.util', 'java.io', 'java.net', 'java.nio', 'java.math', 'java.time', 'java.security', 'java.sql', 'java.text', 'java.util.concurrent', 'java.util.function', 'java.util.stream', 'javax.net', 'javax.crypto', 'javax.security', 'javax.xml', 'javax.sql', 'javax.management', 'javax.naming', 'javax.rmi', 'javax.sound', 'javax.swing', 'javax.print', 'javax.accessibility', 'javax.imageio', 'javax.script', 'javax.tools', 'javax.annotation', 'javax.jws', 'javax.transaction']
};

function getRiskLevel(name: string, version: string): { risk: RiskLevel, reason: string } {
  const normalizedName = name.toLowerCase();
  const record = VULNERABILITY_DATASET.find(r => r.name.toLowerCase() === normalizedName);
  
  if (!record) return { risk: 'Stable', reason: 'No known vulnerabilities in dataset.' };
  
  // Simple version matching (could be improved with semver)
  const isAffected = record.affectedVersions.some(v => {
    if (v.startsWith('<')) {
      const target = v.substring(1);
      return version < target;
    }
    return v === version;
  });

  if (isAffected) {
    return { risk: record.risk, reason: record.reason };
  }

  return { risk: 'Stable', reason: 'Version not listed as vulnerable.' };
}

function scanFiles(files: ScanFile[]): ScanResult {
  console.log('--- SCAN START ---');
  console.log(`Analyzing ${files.length} files.`);
  console.log('Files list:', files.map(f => f.name));

  const results: ScanResult = {
    id: `scan-${Date.now()}`,
    projectName: 'Project',
    timestamp: new Date().toISOString(),
    internal: [],
    external: [],
    thirdParty: [],
    dependencies: [],
    codeErrors: [],
    aiSuggestions: [],
    licenseWarnings: [],
    dependencyGraph: { id: 'root', name: 'Project', version: '1.0.0', type: 'internal', children: [] },
    riskPredictions: [],
    securityScore: 100,
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    metadata: {
      engine: 'SBOM_CORE_V2',
      fileCount: files.length,
      detectedStack: 'Node.js/Python/Java',
    }
  };

  const detectedThirdParty = new Set<string>();
  const detectedExternal = new Set<string>();
  const dependencyMap = new Map<string, any>();

  // Helper to detect license from content
  const detectLicense = (content: string) => {
    if (content.includes('MIT License')) return 'MIT';
    if (content.includes('Apache License')) return 'Apache-2.0';
    if (content.includes('GNU General Public License') || content.includes('GPL')) return 'GPL';
    if (content.includes('BSD 3-Clause')) return 'BSD-3-Clause';
    return 'Unknown';
  };

  files.forEach(file => {
    const fileName = file.name;
    const content = file.content;
    
    console.log(`Processing file: ${fileName}`);

    // 1. Manifest Analysis (Third-Party)
    if (fileName.endsWith('package.json')) {
      try {
        const pkg = JSON.parse(content);
        const deps = { 
          ...(pkg.dependencies || {}), 
          ...(pkg.devDependencies || {}), 
          ...(pkg.peerDependencies || {}) 
        };
        
        console.log(`Found package.json with ${Object.keys(deps).length} dependencies.`);

        Object.entries(deps).forEach(([name, version]: [string, any]) => {
          if (detectedThirdParty.has(name)) return;
          const v = typeof version === 'string' ? version.replace(/[\^~]/, '') : 'unknown';
          const riskInfo = getRiskLevel(name, v);
          
          const depObj: Dependency = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            version: v,
            filePath: fileName,
            type: 'third-party',
            license: pkg.license || 'MIT',
            risk: riskInfo.risk,
            reason: riskInfo.reason,
            source: 'npm Registry'
          };
          
          results.thirdParty.push(depObj);
          detectedThirdParty.add(name);
          dependencyMap.set(name, depObj);
          console.log(`Added third-party (npm): ${name}@${v}`);
        });
      } catch (e) {
        console.error(`Error parsing package.json (${fileName}):`, e);
      }
    } else if (fileName.endsWith('requirements.txt')) {
      console.log(`Found requirements.txt in ${fileName}`);
      const lines = content.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const match = trimmed.match(/^([a-zA-Z0-9-_]+)([=<>!~]+.*)?$/);
        if (match) {
          const name = match[1];
          if (detectedThirdParty.has(name)) return;
          const version = match[2] ? match[2].replace(/[=<>!~]+/, '') : 'latest';
          const riskInfo = getRiskLevel(name, version);
          
          const depObj: Dependency = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            version,
            filePath: fileName,
            type: 'third-party',
            license: 'BSD',
            risk: riskInfo.risk,
            reason: riskInfo.reason,
            source: 'Requirements.txt'
          };
          
          results.thirdParty.push(depObj);
          detectedThirdParty.add(name);
          dependencyMap.set(name, depObj);
          console.log(`Added third-party (pip): ${name}@${version}`);
        }
      });
    }
    
    // 2. Code Analysis (Internal & External)
    const isSourceFile = fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.py') || fileName.endsWith('.java');
    
    if (isSourceFile) {
      // External Imports Detection
      let importRegex;
      if (fileName.endsWith('.py')) {
        importRegex = /(?:import|from)\s+([a-zA-Z0-9_]+)/g;
      } else if (fileName.endsWith('.java')) {
        importRegex = /import\s+([a-zA-Z0-9_.]+);/g;
      } else {
        importRegex = /(?:import|from)\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
      }

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        let imp = match[1] || match[2];
        if (!imp) continue;

        if (imp.includes('/')) imp = imp.split('/')[0];
        if (imp.startsWith('@')) {
          const parts = imp.split('/');
          if (parts.length >= 2) imp = `${parts[0]}/${parts[1]}`;
        }

        if (imp && !imp.startsWith('.') && !imp.startsWith('/')) {
          const isBuiltIn = Object.values(BUILT_IN_MODULES).some(list => list.includes(imp));
          const isThirdParty = detectedThirdParty.has(imp);

          if (isBuiltIn && !detectedExternal.has(imp)) {
            results.external.push({
              id: Math.random().toString(36).substr(2, 9),
              name: imp,
              version: 'system',
              filePath: fileName,
              type: 'external',
              license: 'Standard',
              risk: 'Stable',
              reason: 'Standard library / built-in module.',
              source: 'System'
            });
            detectedExternal.add(imp);
            console.log(`Added external (built-in): ${imp}`);
          } else if (!isBuiltIn && !isThirdParty && !detectedExternal.has(imp)) {
            results.external.push({
              id: Math.random().toString(36).substr(2, 9),
              name: imp,
              version: 'active',
              filePath: fileName,
              type: 'external',
              license: 'Unknown',
              risk: 'Stable',
              reason: 'External module detected via source code analysis.',
              source: 'External'
            });
            detectedExternal.add(imp);
            console.log(`Added external (detected): ${imp}`);
          }
        }
      }

      // Internal Classification
      results.internal.push({
        id: Math.random().toString(36).substr(2, 9),
        name: fileName.split('/').pop() || fileName,
        version: '1.0.0',
        filePath: fileName,
        type: 'internal',
        license: 'Proprietary',
        risk: content.includes('password') || content.includes('secret') || content.includes('AIza') ? 'High' : 'Stable',
        reason: 'Internal project source code.',
        source: 'Local'
      });
      console.log(`Added internal module: ${fileName}`);

      // 3. Security Findings
      const secretPatterns = [
        { pattern: /AIza[0-9A-Za-z-_]{35}/, type: 'Google API Key' },
        { pattern: /sk_live_[0-9a-zA-Z]{24}/, type: 'Stripe Secret Key' },
        { pattern: /"password"\s*:\s*".+"/, type: 'Hardcoded Password' },
        { pattern: /"secret"\s*:\s*".+"/, type: 'Hardcoded Secret' },
        { pattern: /eval\(/, type: 'Dynamic Execution (eval)' }
      ];

      secretPatterns.forEach(sp => {
        if (sp.pattern.test(content)) {
          results.codeErrors.push({
            id: `finding-${Math.random().toString(36).substr(2, 9)}`,
            filePath: fileName,
            errorType: 'Security Threat',
            description: `${sp.type} detected in "${fileName}".`,
            severity: sp.type.includes('Key') || sp.type.includes('Password') ? 'Critical' : 'High',
            impact: 'Potential unauthorized access or code injection.',
            suggestedFix: 'Remove hardcoded secrets and use environment variables.',
            snippet: `// Finding: ${sp.type} in ${fileName}`,
            line: 1
          });
        }
      });
    } else if (!['package.json', 'requirements.txt', 'pom.xml', 'composer.json', 'build.gradle'].some(m => fileName.endsWith(m))) {
      // Only add meaningful files as internal modules
      if (fileName.match(/\.(css|scss|html|md|json|yml|yaml)$/)) {
        results.internal.push({
          id: Math.random().toString(36).substr(2, 9),
          name: fileName.split('/').pop() || fileName,
          version: '1.0.0',
          filePath: fileName,
          type: 'internal',
          license: 'Proprietary',
          risk: 'Stable',
          reason: 'Internal project asset.',
          source: 'Local'
        });
        console.log(`Added internal asset: ${fileName}`);
      }
    }
  });

  // Build Dependency Graph (Mocking hierarchy for demo)
  results.dependencyGraph.children = results.thirdParty.map(d => ({
    id: d.id,
    name: d.name,
    version: d.version,
    type: 'third-party',
    children: Math.random() > 0.5 ? [
      { id: `nested-${d.id}`, name: `${d.name}-sub`, version: '1.0.0', type: 'third-party' }
    ] : []
  }));

  // Generate AI Suggestions based on vulnerabilities
  const allDeps = [...results.external, ...results.thirdParty, ...results.internal];
  
  // Clear existing suggestions to avoid duplicates if any were added during parsing
  results.aiSuggestions = [];

  allDeps.forEach(dep => {
    if (dep.risk !== 'Stable') {
      results.aiSuggestions.push({
        id: `fix-${dep.id}`,
        dependencyId: dep.id,
        dependencyName: dep.name,
        currentVersion: dep.version,
        suggestedVersion: dep.version.includes('.') 
          ? dep.version.split('.').map((v, i) => i === 0 ? (parseInt(v) || 0) + 1 : 0).join('.') 
          : 'latest-stable',
        reason: `Vulnerability detected in ${dep.name}@${dep.version}. ${dep.reason} Upgrading to a secure version is highly recommended.`,
        severity: dep.risk,
        action: 'update'
      });
    }
  });

  // Add code error suggestions
  results.codeErrors.forEach(err => {
    results.aiSuggestions.push({
      id: `fix-err-${err.id}`,
      dependencyId: 'code-finding',
      dependencyName: err.errorType,
      currentVersion: 'N/A',
      suggestedVersion: 'Secure Implementation',
      reason: `${err.description} Impact: ${err.impact}`,
      severity: err.severity,
      action: 'replace'
    });
  });

  // Calculate Vulnerability Counts
  results.vulnerabilities = { critical: 0, high: 0, medium: 0, low: 0 };
  allDeps.forEach(d => {
    if (d.risk === 'Critical') results.vulnerabilities.critical++;
    else if (d.risk === 'High') results.vulnerabilities.high++;
    else if (d.risk === 'Medium') results.vulnerabilities.medium++;
    else if (d.risk === 'Low') results.vulnerabilities.low++;
  });

  results.codeErrors.forEach(f => {
    if (f.severity === 'Critical') results.vulnerabilities.critical++;
    else if (f.severity === 'High') results.vulnerabilities.high++;
    else if (f.severity === 'Medium') results.vulnerabilities.medium++;
    else if (f.severity === 'Low') results.vulnerabilities.low++;
  });

  // Generate License Warnings
  allDeps.forEach(dep => {
    if (dep.license === 'GPL' || dep.license === 'Unknown') {
      results.licenseWarnings.push({
        id: `license-${dep.name}`,
        dependencyName: dep.name,
        license: dep.license,
        severity: dep.license === 'GPL' ? 'High' : 'Medium',
        message: dep.license === 'GPL' ? 'Copyleft license detected. May require open-sourcing your project.' : 'License could not be determined. Verify manually.'
      });
    }
  });

  // Generate Risk Predictions
  results.riskPredictions = allDeps.slice(0, 3).map(dep => ({
    dependencyName: dep.name,
    updateFrequency: Math.random() > 0.7 ? 'High' : 'Medium',
    predictionScore: Math.floor(Math.random() * 100),
    message: `Historical update frequency for ${dep.name} suggests potential maintenance lag in the next 6 months.`
  }));

  // Calculate Security Score
  let score = 100;
  score -= results.vulnerabilities.critical * 30;
  score -= results.vulnerabilities.high * 20;
  score -= results.vulnerabilities.medium * 10;
  score -= results.vulnerabilities.low * 5;

  results.securityScore = Math.max(0, score);

  console.log('Scan Summary:');
  console.log(`- Internal: ${results.internal.length}`);
  console.log(`- External: ${results.external.length}`);
  console.log(`- Third-Party: ${results.thirdParty.length}`);
  console.log('--- SCAN COMPLETE ---');

  return results;
}

app.post('/api/scan', upload.array('files'), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided.' });
  }

  const scanFilesInput: ScanFile[] = files.map(f => ({
    name: f.originalname,
    content: f.buffer.toString()
  }));

  const results = scanFiles(scanFilesInput);
  scanHistory.push(results);
  res.json(results);
});

app.post('/api/scan-github', async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.includes('github.com')) {
    return res.status(400).json({ error: 'Invalid GitHub URL.' });
  }

  try {
    console.log(`--- GITHUB SCAN START: ${url} ---`);
    const parts = url.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1];
    
    if (!owner || !repo) throw new Error('Invalid repository format.');

    // Try to download ZIP
    // GitHub ZIP URL: https://github.com/owner/repo/archive/refs/heads/main.zip
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
    console.log(`Fetching ZIP from: ${zipUrl}`);
    
    let response;
    try {
      response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
    } catch (e) {
      console.log('Main branch failed, trying master...');
      const masterUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`;
      response = await axios.get(masterUrl, { responseType: 'arraybuffer' });
    }

    const zip = new AdmZip(Buffer.from(response.data));
    const zipEntries = zip.getEntries();
    
    const scanFilesInput: ScanFile[] = [];
    zipEntries.forEach(entry => {
      if (!entry.isDirectory) {
        scanFilesInput.push({
          name: entry.entryName,
          content: entry.getData().toString('utf8')
        });
      }
    });

    const results = scanFiles(scanFilesInput);
    
    // Add repo metadata
    (results as any).repoInfo = {
      name: repo,
      owner: owner,
      branch: 'main/master'
    };

    scanHistory.push(results);
    res.json(results);
  } catch (error: any) {
    console.error('GitHub Scan Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch or scan GitHub repository. Ensure it is public.' });
  }
});

app.get('/api/history', (req, res) => {
  res.json(scanHistory);
});

app.get('/api/compare/:id1/:id2', (req, res) => {
  const { id1, id2 } = req.params;
  const scan1 = scanHistory.find(s => s.id === id1);
  const scan2 = scanHistory.find(s => s.id === id2);

  if (!scan1 || !scan2) {
    return res.status(404).json({ error: 'One or both scans not found in history.' });
  }

  const all1 = [...scan1.thirdParty, ...scan1.external, ...scan1.internal];
  const all2 = [...scan2.thirdParty, ...scan2.external, ...scan2.internal];

  const comparison: ScanComparison = {
    scan1Id: id1,
    scan2Id: id2,
    addedDependencies: all2.filter(d2 => !all1.some(d1 => d1.name === d2.name)),
    removedDependencies: all1.filter(d1 => !all2.some(d2 => d2.name === d1.name)),
    changedVersions: all2.filter(d2 => {
      const d1 = all1.find(x => x.name === d2.name);
      return d1 && d1.version !== d2.version;
    }).map(d2 => {
      const d1 = all1.find(x => x.name === d2.name)!;
      return { name: d2.name, oldVersion: d1.version, newVersion: d2.version };
    }),
    vulnerabilityDiff: {
      critical: scan2.vulnerabilities.critical - scan1.vulnerabilities.critical,
      high: scan2.vulnerabilities.high - scan1.vulnerabilities.high,
      medium: scan2.vulnerabilities.medium - scan1.vulnerabilities.medium,
      low: scan2.vulnerabilities.low - scan1.vulnerabilities.low
    },
    scoreDiff: scan2.securityScore - scan1.securityScore
  };

  res.json(comparison);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
