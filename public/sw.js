importScripts('/scramjet/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

const OWN_PATHS = ['/scramjet/scramjet.', '/baremux/', '/epoxy/', '/wisp'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const reqUrl = event.request.url || '';
  if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) return;

  const url = new URL(reqUrl);
  if (OWN_PATHS.some((p) => url.pathname.startsWith(p))) return;

  event.respondWith(
    (async () => {
      try {
        if (reqUrl.includes('party.krillion.io') && reqUrl.includes('activity')) {
          return new Response('data: {}\n\n', {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        await scramjet.loadConfig();
        if (scramjet.route(event)) {
          const res = await scramjet.fetch(event);
          const headers = new Headers(res.headers);
          headers.delete('Content-Security-Policy');
          headers.delete('Content-Security-Policy-Report-Only');
          headers.delete('X-Frame-Options');

          if (event.request.mode === 'navigate') {
            headers.set('Content-Type', 'text/html; charset=utf-8');
            let html = await res.text();
            html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
            return new Response(html, { status: res.status, statusText: res.statusText, headers });
          }

          if (
            event.request.destination === 'script' ||
            reqUrl.includes('.js') ||
            reqUrl.includes('.mjs')
          ) {
            headers.set('Content-Type', 'application/javascript; charset=utf-8');
          }

          return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
        }
      } catch {
        return new Response('', { status: 204 });
      }
      return fetch(event.request);
    })()
  );
});
