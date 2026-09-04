import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function fixFetchPlugin(): Plugin {
  return {
    name: 'vite-plugin-fix-fetch',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            injectTo: 'head-prepend',
            children: `(function() {
  window.addEventListener('error', function(e) {
    var msg = (e && (e.message || (e.error && e.error.message))) || '';
    if (typeof msg === 'string' && msg.indexOf('fetch') !== -1 && msg.indexOf('getter') !== -1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return true;
    }
  }, true);
  var origOnError = window.onerror;
  window.onerror = function(msg, url, line, col, err) {
    var str = String(msg || (err && err.message) || '');
    if (str.indexOf('fetch') !== -1 && str.indexOf('getter') !== -1) {
      return true;
    }
    if (typeof origOnError === 'function') {
      return origOnError.apply(this, arguments);
    }
  };
  try {
    var curFetch = window.fetch;
    var setProperty = function(target) {
      if (!target) return false;
      try {
        Object.defineProperty(target, 'fetch', {
          get: function() { return curFetch; },
          set: function(v) { curFetch = v; },
          configurable: true,
          enumerable: true
        });
        return true;
      } catch(err) {
        return false;
      }
    };
    setProperty(window);
    try { setProperty(Object.getPrototypeOf(window)); } catch(e) {}
    if (typeof Window !== 'undefined' && Window.prototype) {
      try { setProperty(Window.prototype); } catch(e) {}
    }
  } catch(e) {}
})();`
          }
        ];
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [fixFetchPlugin(), react(), tailwindcss(), aistudioMediaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
