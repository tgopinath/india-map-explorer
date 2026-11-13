// Captures the screenshots used on the portfolio card: node tools/shots.mjs
// Phones: 600-wide JPEGs in prototype/shots. Desktop: 1440x900 in prototype/shots-desktop/web.jpg.
// Shoots the live site by default; BASE=http://localhost:3000 node tools/shots.mjs for a dev server.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'prototype', 'shots');
const DESK = path.join(ROOT, 'prototype', 'shots-desktop');
const BASE = (process.env.BASE || 'https://india-map-explorer-two.vercel.app').replace(/\/$/, '');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(DESK, { recursive: true });
const tmp = fs.mkdtempSync(path.join(ROOT, '.shots-'));
const dbg = 6700 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${dbg}`, `--user-data-dir=${tmp}/profile`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try { const p = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  const phone = () => send('Emulation.setDeviceMetricsOverride', { width: 390, height: 849, deviceScaleFactor: 2, mobile: true });
  const desktop = () => send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  let cleared = false;
  const grab = async (route, out, { wait = 6000, js, width = 600 } = {}) => {
    if (!cleared) { await send('Page.navigate', { url: BASE + '/' }); await sleep(2000); await send('Runtime.evaluate', { expression: 'localStorage.clear()' }); cleared = true; }
    await send('Page.navigate', { url: BASE + route }); await sleep(wait);
    if (js) { await send('Runtime.evaluate', { expression: js, awaitPromise: true }); await sleep(1500); }
    const s = await send('Page.captureScreenshot', { format: 'png' });
    const png = path.join(tmp, path.basename(out) + '.png');
    fs.writeFileSync(png, Buffer.from(s.result.data, 'base64'));
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', '--resampleWidth', String(width), png, '--out', out], { stdio: 'pipe' });
  };
  await phone();
  await grab('/', path.join(SHOTS, 'home.jpg'));
  await grab('/explore', path.join(SHOTS, 'explore.jpg'), { wait: 7000 });
  await grab('/districts/tamil-nadu', path.join(SHOTS, 'districts.jpg'), { wait: 9000 });
  await grab('/puzzle/tamil-nadu', path.join(SHOTS, 'puzzle.jpg'), { wait: 9000 });
  await grab('/quiz', path.join(SHOTS, 'quiz.jpg'));
  await desktop();
  await grab('/explore', path.join(DESK, 'web.jpg'), { wait: 7000, width: 1440 });
  console.log('captured', fs.readdirSync(SHOTS).join(', '), '+ shots-desktop/web.jpg');
  ws.close();
} finally {
  const exited = new Promise(r => chrome.once('exit', r));
  chrome.kill();
  await Promise.race([exited, sleep(5000)]);
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
