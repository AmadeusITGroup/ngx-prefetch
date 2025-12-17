const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const DIST_DIR = path.join(__dirname, '../../dist/browser');

// Mime types mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url, true);
  let filePath = path.join(DIST_DIR, parsedUrl.pathname);

  // Default to index.html for root or SPA fallback (simplified for now)
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/prefetch.html') {
    filePath = path.join(DIST_DIR, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  } else if (!fs.existsSync(filePath) && !parsedUrl.pathname.includes('.')) {
    // Very basic fallback for SPA routes if we needed it, but mostly testing prefetch mechanics
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      // Special handling for prefetch.html to propagate query params to the script
      if (path.basename(filePath) === 'prefetch.html' && parsedUrl.query.replace === 'true') {
        let htmlContent = content.toString();
        // Inject query params into the script source
        // Uses regex to be robust against attribute order or quotes
        const search = parsedUrl.search; // includes ?
        const regex = /src=["']ngxPrefetch\.js["']/;

        if (regex.test(htmlContent)) {
          console.log('Server: Injecting query params into ngxPrefetch.js script tag');
          htmlContent = htmlContent.replace(regex, `src="ngxPrefetch.js${search}"`);
        } else {
          console.log('Server: ngxPrefetch.js script tag NOT FOUND. Injecting new script tag.');
          htmlContent = htmlContent.replace('</body>', `<script src="ngxPrefetch.js${search}"></script></body>`);
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent, 'utf-8');
        return;
      }

      // Special handling for ngxPrefetch.js to simulate server-side replacements
      if (path.basename(filePath) === 'ngxPrefetch.js') {
        let jsContent = content.toString();

        // Replacement Logic based on Query Params or hardcoded logic for specific tests
        // In a real scenario, this might depend on the request headers or cookies.
        // specific query param to trigger replacement logic: ?replace=true

        if (parsedUrl.query.replace === 'true') {
          console.log('Replacing content with params:', parsedUrl.query);
          // Replace DYNAMIC_CONTENT_PATH
          if (parsedUrl.query.dynamicPath) {
            const dynamicPath = parsedUrl.query.dynamicPath;
            console.log('Replacing DYNAMIC_CONTENT_PATH with', dynamicPath);
            jsContent = jsContent.replace('{DYNAMIC_CONTENT_PATH}', dynamicPath);
          }

          // Replace LANG
          if (parsedUrl.query.lang) {
            console.log('Replacing LANG with', parsedUrl.query.lang);
            jsContent = jsContent.replace('{LANG}', parsedUrl.query.lang);
          }

          // Replace DYNAMIC_CONTENT_FILES
          if (parsedUrl.query.dynamicFiles) {
            // The query param might be URL encoded, though usually browsers handle it.
            // We need to pass a JSON structure.
            console.log('Replacing DYNAMIC_CONTENT_FILES with', parsedUrl.query.dynamicFiles);
            jsContent = jsContent.replace('{DYNAMIC_CONTENT_FILES}', parsedUrl.query.dynamicFiles);
          }
        }

        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(jsContent, 'utf-8');
      } else {
        // Add cache headers to help testing cache behavior
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        });
        res.end(content, 'utf-8');
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
  console.log(`Serving files from ${DIST_DIR}`);
});
