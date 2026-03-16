import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mock vulnerability database for risk calculation
const VULNERABILITY_DB: Record<string, { risk: string; reason: string }> = {
  'lodash': { risk: 'High', reason: 'Prototype Pollution vulnerability in versions < 4.17.21' },
  'axios': { risk: 'Medium', reason: 'Server-Side Request Forgery (SSRF) in specific configurations' },
  'express': { risk: 'Low', reason: 'Information disclosure if not configured with security headers' },
  'react': { risk: 'Stable', reason: 'No known critical vulnerabilities in current stable branch' },
  'jquery': { risk: 'High', reason: 'Cross-site Scripting (XSS) vulnerabilities in older versions' },
};

app.post('/api/scan', upload.array('files'), (req, res) => {
  const files = req.files as Express.Multer.File[];
  
  console.log('--- SCAN START ---');
  console.log(`Received ${files?.length || 0} files for analysis.`);

  const results = {
    internal: [] as any[],
    external: [] as any[],
    thirdParty: [] as any[]
  };

  if (!files || files.length === 0) {
    console.log('No files received.');
    return res.json(results);
  }

  files.forEach(file => {
    const fileName = file.originalname;
    const content = file.buffer.toString();
    
    // Heuristic Classification
    if (fileName === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
        
        Object.entries(deps).forEach(([name, version]: [string, any]) => {
          const v = typeof version === 'string' ? version.replace(/[\^~]/, '') : 'unknown';
          const dbMatch = VULNERABILITY_DB[name.toLowerCase()];
          
          results.external.push({
            name,
            version: v,
            file: fileName,
            riskLevel: dbMatch ? dbMatch.risk : 'Stable',
            reason: dbMatch ? dbMatch.reason : 'No known vulnerabilities found.'
          });
        });
      } catch (e) {
        console.error('Error parsing package.json:', e);
      }
    } else if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      // Check for Third-Party imports (e.g. CDN or absolute URLs)
      const cdnRegex = /(https?:\/\/[^\s"']+)/g;
      const matches = content.match(cdnRegex);
      
      if (matches) {
        matches.forEach(url => {
          results.thirdParty.push({
            name: path.basename(url),
            version: 'remote',
            file: fileName,
            riskLevel: url.includes('unpkg.com') || url.includes('cdnjs.cloudflare.com') ? 'Low' : 'Medium',
            reason: 'External resource loaded via CDN.'
          });
        });
      }

      // Classify as Internal
      results.internal.push({
        name: fileName,
        version: '1.0.0',
        file: fileName,
        riskLevel: content.includes('password') || content.includes('secret') ? 'High' : 'Stable',
        reason: content.includes('password') ? 'Hardcoded credentials detected.' : 'Proprietary source code.'
      });
    } else {
      // Generic internal file
      results.internal.push({
        name: fileName,
        version: '1.0.0',
        file: fileName,
        riskLevel: 'Stable',
        reason: 'Internal asset.'
      });
    }
  });

  console.log('Scan Results Summary:');
  console.log(`- Internal: ${results.internal.length}`);
  console.log(`- External: ${results.external.length}`);
  console.log(`- Third-Party: ${results.thirdParty.length}`);
  console.log('--- SCAN COMPLETE ---');

  res.json(results);
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
