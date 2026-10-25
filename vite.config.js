import { defineConfig } from 'vite';
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const libraryDir = path.join(projectDir, 'models');

function localModelLibrary() {
  return {
    name: 'local-model-library',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname === '/api/models' && req.method === 'GET') {
          try {
            await mkdir(libraryDir, { recursive: true });
            const files = await readdir(libraryDir);
            const models = await Promise.all(files.filter(name => name.toLowerCase().endsWith('.glb')).map(async name => ({
              id: name,
              name: name.replace(/\.glb$/i, ''),
              size: (await stat(path.join(libraryDir, name))).size,
            })));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(models));
          } catch (error) { next(error); }
          return;
        }
        if (url.pathname.startsWith('/api/models/') && req.method === 'DELETE') {
          const decoded = decodeURIComponent(url.pathname.slice('/api/models/'.length));
          const filename = path.basename(decoded);
          if (!filename.toLowerCase().endsWith('.glb') || filename !== decoded || filename.includes('..')) {
            res.statusCode = 400; res.end(JSON.stringify({ error: 'Please use a valid .glb filename.' })); return;
          }
          try {
            await unlink(path.join(libraryDir, filename));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ id: filename, deleted: true }));
          } catch (error) {
            if (error.code === 'ENOENT') { res.statusCode = 404; res.end(JSON.stringify({ error: 'Model was not found in the library.' })); }
            else next(error);
          }
          return;
        }
        if (url.pathname.startsWith('/api/models/') && req.method === 'PUT') {
          const decoded = decodeURIComponent(url.pathname.slice('/api/models/'.length));
          const filename = path.basename(decoded);
          if (!filename.toLowerCase().endsWith('.glb') || filename !== decoded || filename.includes('..')) {
            res.statusCode = 400; res.end(JSON.stringify({ error: 'Please use a valid .glb filename.' })); return;
          }
          try {
            await mkdir(libraryDir, { recursive: true });
            const chunks = []; let bytes = 0;
            for await (const chunk of req) { bytes += chunk.length; if (bytes > 500 * 1024 * 1024) { res.statusCode = 413; res.end(JSON.stringify({ error: 'Model is larger than the 500 MB limit.' })); return; } chunks.push(chunk); }
            if (!bytes) { res.statusCode = 400; res.end(JSON.stringify({ error: 'The uploaded file is empty.' })); return; }
            await writeFile(path.join(libraryDir, filename), Buffer.concat(chunks));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ id: filename, name: filename.replace(/\.glb$/i, ''), size: bytes }));
          } catch (error) { next(error); }
          return;
        }
        if (url.pathname.startsWith('/models/')) {
          const id = decodeURIComponent(url.pathname.slice('/models/'.length));
          const filename = path.basename(id);
          if (filename !== id || !filename.toLowerCase().endsWith('.glb')) { res.statusCode = 400; res.end('Invalid model name'); return; }
          try {
            const data = await (await import('node:fs/promises')).readFile(path.join(libraryDir, filename));
            res.setHeader('Content-Type', 'model/gltf-binary');
            res.setHeader('Cache-Control', 'no-store');
            res.end(data);
          } catch { res.statusCode = 404; res.end('Model not found'); }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [localModelLibrary()] });
