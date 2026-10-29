// Éditeur local du portfolio — lance un petit serveur sur http://localhost:4321
// Lit les galeries dans les pages HTML, les réécrit quand on modifie, et publie via git.
// Aucun module npm requis : uniquement Node.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const PORT = 4321;
const ROOT = path.resolve(__dirname, '..');           // dossier du site
const UI = path.join(__dirname, 'public');
const BACKUPS = path.join(__dirname, 'backups');

const PAGES = {
  d2: { file: 'digital-2d.html', kind: 'years', label: 'Digital 2D', dir: 'images/Digital2d' },
  d3: { file: 'digital-3d.html', kind: 'projects', label: 'Digital 3D', dir: 'images/Digital3d' },
  tr: { file: 'traditional.html', kind: 'flat', label: 'Traditional', dir: 'images/Traditional' },
};

// ── Petits utilitaires HTML ────────────────────────────────────────────────
const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (tag, name) => { const m = tag.match(new RegExp('\\s' + name + '="([^"]*)"')); return m ? decode(m[1]) : null; };

// Renvoie l'index juste après le </div> qui ferme le <div> ouvert à `start`
function closeDiv(html, start) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  throw new Error('Balise <div> non fermée');
}

function contentRange(html) {
  const start = html.indexOf('<div class="content">');
  if (start < 0) throw new Error('Bloc <div class="content"> introuvable');
  return [start, closeDiv(html, start)];
}

function parseThumbs(chunk) {
  const items = [];
  const re = /<div class="thumb"/g;
  let m;
  while ((m = re.exec(chunk))) {
    const end = closeDiv(chunk, m.index);
    const block = chunk.slice(m.index, end);
    const open = block.slice(0, block.indexOf('>') + 1);
    const bg = block.match(/data-bg="([^"]*)"/);
    const label = block.match(/class="thumb-label">([\s\S]*?)<\//);
    const images = attr(open, 'data-images');
    items.push({
      title: attr(open, 'data-title') ?? (label ? decode(label[1]) : ''),
      year: attr(open, 'data-year'),
      src: bg ? decode(bg[1]) : '',
      images: images ? images.split(',').map(s => s.trim()).filter(Boolean) : null,
    });
    re.lastIndex = end;
  }
  return items;
}

function readGallery(key) {
  const page = PAGES[key];
  const html = fs.readFileSync(path.join(ROOT, page.file), 'utf8');
  const [s, e] = contentRange(html);
  const content = html.slice(s, e);
  if (page.kind === 'flat') {
    const strip = content.match(/<div class="thumb-strip([^"]*)"/);
    return { key, kind: page.kind, stripClass: strip ? strip[1] : ' reveal in', groups: [{ year: null, items: parseThumbs(content) }] };
  }
  const groups = [];
  const re = /<div class="year-block([^"]*)"/g;
  let m;
  while ((m = re.exec(content))) {
    const end = closeDiv(content, m.index);
    const block = content.slice(m.index, end);
    const y = block.match(/class="year-heading">([^<]*)</);
    groups.push({ year: y ? y[1].trim() : '', cls: m[1], items: parseThumbs(block) });
    re.lastIndex = end;
  }
  return { key, kind: page.kind, groups };
}

// ── Génération du HTML des galeries (même balisage que les pages actuelles) ──
function thumbHtml(kind, it, indent) {
  const title = escAttr(it.title), label = escText(it.title);
  if (kind === 'flat')
    return `${indent}<div class="thumb" data-title="${title}"><div class="thumb-img" data-bg="${escAttr(it.src)}"></div><div class="thumb-ov"></div><div class="thumb-label">${label}</div></div>`;
  if (kind === 'projects') {
    const imgs = (it.images && it.images.length ? it.images : [it.src]).map(escAttr).join(',');
    return `${indent}<div class="thumb" data-title="${title}" data-year="${escAttr(it.year)}" data-images="${imgs}">\n` +
      `${indent}  <div class="thumb-img" data-bg="${escAttr(it.src)}"></div>\n` +
      `${indent}  <div class="thumb-ov"></div><span class="thumb-label">${label}</span>\n` +
      `${indent}</div>`;
  }
  return `${indent}<div class="thumb" data-title="${title}" data-year="${escAttr(it.year)}"><div class="thumb-img" data-bg="${escAttr(it.src)}"></div><div class="thumb-ov"></div><span class="thumb-label">${label}</span></div>`;
}

function writeGallery(key, data) {
  const page = PAGES[key];
  const file = path.join(ROOT, page.file);
  const html = fs.readFileSync(file, 'utf8');
  const [s, e] = contentRange(html);
  // ignore les images encore en cours d'import
  data.groups.forEach(g => { g.items = g.items.filter(it => it.src); });
  let out = '<div class="content">\n';
  if (page.kind === 'flat') {
    out += `    <div class="thumb-strip${data.stripClass || ' reveal in'}">\n\n`;
    out += data.groups[0].items.map(it => thumbHtml('flat', it, '      ')).join('\n');
    out += '\n\n    </div>\n  </div>';
  } else {
    const groups = data.groups.filter(g => g.items.length).sort((a, b) => String(b.year).localeCompare(String(a.year)));
    out += groups.map(g =>
      `\n    <!-- ${g.year} -->\n` +
      `    <div class="year-block${g.cls || ' reveal in'}">\n` +
      `      <h2 class="year-heading">${escText(g.year)}</h2>\n` +
      `      <div class="thumb-strip">\n` +
      g.items.map(it => thumbHtml(page.kind, it, '        ')).join('\n') +
      `\n      </div>\n    </div>\n`).join('');
    out += '\n  </div>';
  }
  save(page.file, html.slice(0, s) + out + html.slice(e));
}

// ── Page d'accueil (index.html) et photo de profil ──────────────────────────
const CATS_RE = /(?:[ \t]*const D2 = [^\n]*\n)?([ \t]*)const CATS = \{([\s\S]*?)\n[ \t]*\};/;

function readHome() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const base = html.match(/const BASE = '([^']*)'/);
  const hero = html.match(/<section id="stage"[^>]*>\s*<img src="([^"]*)" alt="([^"]*)"/);
  const photo = html.match(/<img src="([^"]*)" alt="[^"]*" class="sc-photo">/);
  const cats = {};
  const m = html.match(CATS_RE);
  if (m) {
    // Évalue les constantes D2/D3E… pour obtenir des chemins complets
    const consts = {};
    const decl = html.match(/const (D2 = [^\n]*);/);
    if (decl) decl[1].split(/,\s*(?=[A-Z0-9]+ =)/).forEach(p => { const [k, v] = p.split(/\s*=\s*/); consts[k.trim()] = v.trim().slice(1, -1); });
    for (const line of m[2].split('\n')) {
      const lm = line.match(/^\s*(\w+):\s*\[(.*)\],?\s*$/);
      if (!lm) continue;
      cats[lm[1]] = lm[2].split(/,\s*(?=(?:[A-Z0-9]+\s*\+\s*)?')/).map(x => {
        const pm = x.trim().match(/^(?:([A-Z0-9]+)\s*\+\s*)?'([^']*)'$/);
        return pm ? (pm[1] ? consts[pm[1]] || '' : '') + pm[2] : null;
      }).filter(Boolean);
    }
  }
  return {
    hero: base ? base[1] : (hero ? hero[1] : ''),
    heroAlt: hero ? decode(hero[2]) : '',
    photo: photo ? photo[1] : '',
    cats,
  };
}

function writeHome(d) {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const js = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  html = html.replace(/(<section id="stage"[^>]*>\s*<img src=")[^"]*(" alt=")[^"]*(")/, (_, a, b, c) => a + escAttr(d.hero) + b + escAttr(d.heroAlt) + c);
  html = html.replace(/(createPaint\(document\.getElementById\('intro-paint'\), ')[^']*(')/, (_, a, b) => a + js(d.hero) + b);
  html = html.replace(/(const BASE = ')[^']*(')/, (_, a, b) => a + js(d.hero) + b);
  if (d.photo) html = html.replace(/(<img src=")[^"]*(" alt="[^"]*" class="sc-photo">)/, (_, a, b) => a + escAttr(d.photo) + b);
  html = html.replace(CATS_RE, (_, ind) => {
    const body = ['d2', 'd3', 'tr'].map(k => `${ind}  ${k}: [${(d.cats[k] || []).map(u => `'${js(u)}'`).join(', ')}]`).join(',\n');
    return `${ind}const CATS = {\n${body}\n${ind}};`;
  });
  save('index.html', html);
  if (d.photo) {
    const about = fs.readFileSync(path.join(ROOT, 'about.html'), 'utf8');
    save('about.html', about.replace(/(<img class="ab-photo" src=")[^"]*(")/, (_, a, b) => a + escAttr(d.photo) + b));
  }
}

// Sauvegarde avec copie de secours (les 30 dernières par fichier)
function save(rel, content) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  if (before === content) return;
  fs.mkdirSync(BACKUPS, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(BACKUPS, `${stamp}__${rel}`), before);
  const old = fs.readdirSync(BACKUPS).filter(f => f.endsWith('__' + rel)).sort();
  old.slice(0, Math.max(0, old.length - 30)).forEach(f => fs.unlinkSync(path.join(BACKUPS, f)));
  fs.writeFileSync(file, content);
}

// ── Images ──────────────────────────────────────────────────────────────────
const IMG_EXT = /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i;

// Chemin relatif sûr, obligatoirement dans images/
function safeImagesPath(rel) {
  const abs = path.resolve(ROOT, rel);
  const imagesRoot = path.join(ROOT, 'images');
  if (abs !== imagesRoot && !abs.startsWith(imagesRoot + path.sep)) throw new Error('Chemin interdit : ' + rel);
  return abs;
}

function cleanName(name) {
  return name.normalize('NFC').replace(/[\\/:*?"<>|#%]/g, '').replace(/\s+/g, ' ').trim() || 'image';
}

function uniquePath(dir, name) {
  const ext = path.extname(name), stem = path.basename(name, ext);
  let candidate = name, i = 2;
  while (fs.existsSync(path.join(dir, candidate))) candidate = `${stem}-${i++}${ext}`;
  return path.join(dir, candidate);
}

function listImages() {
  const out = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (IMG_EXT.test(e.name) && !/\.hei[cf]$/i.test(e.name)) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  };
  walk(path.join(ROOT, 'images'));
  return out.sort();
}

// Conversion HEIC → JPG, rotation EXIF, réduction des images trop grandes (via Python/Pillow)
function processImage(abs) {
  return new Promise(resolve => {
    execFile('python', [path.join(__dirname, 'process_image.py'), abs], { timeout: 120000, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } }, (err, stdout) => {
      const out = (stdout || '').trim().split('\n').pop();
      resolve(!err && out && fs.existsSync(out) ? out : abs);
    });
  });
}

// ── Git ─────────────────────────────────────────────────────────────────────
function git(args) {
  return new Promise(resolve => {
    execFile('git', args, { cwd: ROOT, maxBuffer: 1 << 24 }, (err, stdout, stderr) =>
      resolve({ ok: !err, out: (stdout + stderr).trim() }));
  });
}
// uniquement les pages à la racine et le dossier images (jamais l'éditeur lui-même)
const SITE_PATHS = ['--', ':(glob)*.html', 'images'];

async function gitStatus() {
  const r = await git(['status', '--porcelain', '-uall', ...SITE_PATHS]);
  return r.out ? r.out.split('\n').filter(Boolean) : [];
}

async function publish(message) {
  const changes = await gitStatus();
  if (!changes.length) return { ok: true, out: 'Rien à publier : le site en ligne est déjà à jour.' };
  let r = await git(['add', '-A', ...SITE_PATHS]);
  if (!r.ok) return r;
  r = await git(['commit', '-m', message || 'Mise à jour du portfolio (éditeur)']);
  if (!r.ok) return r;
  const push = await git(['push']);
  return { ok: push.ok, out: push.ok ? `Publié ✓ (${changes.length} fichier(s)). Le site se met à jour d'ici une minute.` : push.out };
}

// ── Serveur HTTP ────────────────────────────────────────────────────────────
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.ico': 'image/x-icon' };

function sendFile(res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Introuvable'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}
const json = (res, code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
const body = req => new Promise((ok, ko) => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); req.on('error', ko); });

async function api(req, res, url) {
  const route = url.pathname.slice(5);
  if (req.method === 'GET' && route === 'state') {
    const galleries = {};
    for (const k of Object.keys(PAGES)) galleries[k] = readGallery(k);
    const cname = path.join(ROOT, 'CNAME');
    const domain = fs.existsSync(cname) ? fs.readFileSync(cname, 'utf8').trim() : '';
    return json(res, 200, { galleries, home: readHome(), domain, changes: (await gitStatus()).length });
  }
  if (req.method === 'GET' && route === 'images') return json(res, 200, listImages());
  if (req.method === 'GET' && route === 'status') return json(res, 200, { changes: await gitStatus() });
  if (req.method === 'POST' && route === 'gallery') {
    const d = JSON.parse(await body(req));
    if (!PAGES[d.key]) throw new Error('Page inconnue');
    writeGallery(d.key, d);
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && route === 'home') {
    writeHome(JSON.parse(await body(req)));
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && route === 'upload') {
    const dirRel = url.searchParams.get('dir');
    const dir = safeImagesPath(dirRel);
    const name = cleanName(url.searchParams.get('name') || 'image.jpg');
    if (!IMG_EXT.test(name)) throw new Error('Format non pris en charge : ' + name);
    fs.mkdirSync(dir, { recursive: true });
    const target = uniquePath(dir, name);
    fs.writeFileSync(target, await body(req));
    const final = await processImage(target);
    return json(res, 200, { path: path.relative(ROOT, final).split(path.sep).join('/') });
  }
  if (req.method === 'POST' && route === 'publish') {
    const d = JSON.parse((await body(req)) || '{}');
    return json(res, 200, await publish(d.message));
  }
  json(res, 404, { error: 'Route inconnue' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname.startsWith('/site/')) {
      const file = path.resolve(ROOT, decodeURIComponent(url.pathname.slice(6)) || 'index.html');
      if (!file.startsWith(ROOT) || file.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
      return sendFile(res, file);
    }
    const file = path.resolve(UI, decodeURIComponent(url.pathname.slice(1)) || 'index.html');
    if (!file.startsWith(UI)) { res.writeHead(403); return res.end(); }
    sendFile(res, file);
  } catch (e) {
    console.error(e);
    json(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const link = `http://localhost:${PORT}`;
  console.log(`\n  Éditeur du portfolio ouvert sur ${link}\n  (ferme cette fenêtre pour arrêter l'éditeur)\n`);
  if (!process.argv.includes('--no-open')) spawn('cmd', ['/c', 'start', '', link], { detached: true, stdio: 'ignore' }).unref();
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log('  L\'éditeur tourne déjà — ouverture dans le navigateur.');
    spawn('cmd', ['/c', 'start', '', `http://localhost:${PORT}`], { detached: true, stdio: 'ignore' }).unref();
    setTimeout(() => process.exit(0), 500);
  } else throw e;
});
