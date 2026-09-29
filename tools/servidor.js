/**
 * ============================================================================
 * PROJECTE: Motor Educatiu Step Quiz (Vanilla JS)
 * FITXER: tools/servidor.js
 * ROL: Servidor web mínim per provar el projecte a l'ordinador o al Codespace.
 *      Les activitats són mòduls ES (<script type="module">) i el navegador no
 *      els carrega si s'obre l'HTML amb doble clic (file://): cal un servidor.
 * ÚS (des de l'arrel del repositori):
 *      node tools/servidor.js          → http://localhost:8000
 *      node tools/servidor.js 8080     → un altre port
 *      Per aturar-lo: Ctrl+C
 * DEPENDÈNCIES: cap (només Node).
 * ============================================================================
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8000;
const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
};

http.createServer((req, res) => {
    let rel;
    try {
        rel = decodeURIComponent(req.url.split(/[?#]/)[0]);
    } catch {
        res.writeHead(400).end('Adreça incorrecta');
        return;
    }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, rel);
    // Només fitxers de dins del repositori
    if (!file.startsWith(ROOT + path.sep)) {
        res.writeHead(403).end('Prohibit');
        return;
    }
    fs.readFile(file, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`No existeix: ${rel}`);
            return;
        }
        const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
        // Sense memòria cau: cada canvi es veu en tornar a carregar la pàgina
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(data);
    });
}).listen(PORT, () => {
    console.log(`Step Quiz: http://localhost:${PORT}  (per aturar-lo: Ctrl+C)`);
});
