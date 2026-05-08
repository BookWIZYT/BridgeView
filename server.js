// ─── BridgeView Academy Standalone Proxy Server ──────────────────────────────
// Uses native Node.js http + fetch for maximum reliability
// Deployable on any free hosting platform

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const TARGET_ORIGIN = "https://nova2021.bookwizardart.workers.dev";
const PROXY_PATH = "/nova";

// ─── Injected Script ────────────────────────────────────────────────────────
function getInjectedScript(proxyOrigin) {
  return `<script data-bv-inject="true">
(function(){
  var P='${proxyOrigin}',T='${TARGET_ORIGIN}',BASE=P+'${PROXY_PATH}';
  var origTitle='BridgeView Academy \\u2014 Student Learning Portal';
  document.title=origTitle;
  var titleObs=new MutationObserver(function(){if(document.title!==origTitle)document.title=origTitle;});
  var tEl=document.querySelector('title');if(tEl)titleObs.observe(tEl,{childList:true,characterData:true,subtree:true});
  var fav=document.querySelector('link[rel~="icon"]');if(fav)fav.href=P+'/bridgeview-logo.png';
  else{var l=document.createElement('link');l.rel='icon';l.href=P+'/bridgeview-logo.png';document.head.appendChild(l);}
  function isTarget(u){if(!u||typeof u!=='string')return false;if(u.startsWith('data:')||u.startsWith('blob:')||u.startsWith('javascript:'))return false;if(u.startsWith(BASE)||u.startsWith(P+'/'))return false;try{var v=new URL(u,T);return v.origin===T;}catch(e){return false;}}
  function toProxy(u){if(!isTarget(u))return u;try{var v=new URL(u,T);return BASE+v.pathname+v.search+v.hash;}catch(e){return u;}}
  function rewriteEl(el){if(!el||!el.tagName)return;var tag=el.tagName.toUpperCase();var srcTags=['IMG','IFRAME','EMBED','VIDEO','SOURCE','SCRIPT','TRACK'];if(srcTags.indexOf(tag)!==-1){var v=el.getAttribute('src');if(v){var p=toProxy(v);if(p!==v)el.setAttribute('src',p);}}if(tag==='LINK'){var v2=el.getAttribute('href');if(v2){var p2=toProxy(v2);if(p2!==v2)el.setAttribute('href',p2);}}if(tag==='A'){var v3=el.getAttribute('href');if(v3&&v3.indexOf('javascript:')!==0&&v3.indexOf('#')!==0&&v3.indexOf('data:')!==0){var p3=toProxy(v3);if(p3!==v3)el.setAttribute('href',p3);}}if(tag==='FORM'){var v4=el.getAttribute('action');if(v4){var p4=toProxy(v4);if(p4!==v4)el.setAttribute('action',p4);}}}
  document.querySelectorAll('img[src],iframe[src],embed[src],video[src],source[src],script[src],link[href],a[href],form[action]').forEach(rewriteEl);
  var obs=new MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++){var added=mutations[i].addedNodes;for(var j=0;j<added.length;j++){var node=added[j];if(node.nodeType===1){rewriteEl(node);if(node.querySelectorAll){try{node.querySelectorAll('img,iframe,embed,video,source,script,link,a,form').forEach(rewriteEl);}catch(e){}}}}}});
  if(document.documentElement)obs.observe(document.documentElement,{childList:true,subtree:true});
  var _fetch=window.fetch;window.fetch=function(input,init){var url=typeof input==='string'?input:(input instanceof Request?input.url:'');var proxied=toProxy(url);if(proxied!==url){if(typeof input==='string')input=proxied;else if(input instanceof Request)input=new Request(proxied,input);}return _fetch.call(this,input,init);};
  var _xhrOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url){return _xhrOpen.call(this,method,toProxy(url));};
  document.addEventListener('error',function(e){var el=e.target;if(!el||!el.tagName)return;var tag=el.tagName.toUpperCase();var attr=(tag==='LINK')?'href':'src';var url=el.getAttribute(attr);if(url&&isTarget(url)){el.setAttribute(attr,toProxy(url));}},true);
  document.addEventListener('click',function(e){var el=e.target;while(el&&el.tagName!=='A')el=el.parentElement;if(!el||!el.href)return;var href=el.href;if(href.indexOf('javascript:')===0||href.indexOf('#')===0||href.indexOf('data:')===0)return;var proxied=toProxy(href);if(proxied!==href){e.preventDefault();e.stopPropagation();window.location.href=proxied;}},true);
  document.addEventListener('submit',function(e){var form=e.target;if(form&&form.action){var proxied=toProxy(form.action);if(proxied!==form.action)form.action=proxied;}},true);
  var _pushState=history.pushState,_replaceState=history.replaceState;
  history.pushState=function(state,title,url){if(url&&typeof url==='string')url=toProxy(url);return _pushState.call(this,state,title||origTitle,url);};
  history.replaceState=function(state,title,url){if(url&&typeof url==='string')url=toProxy(url);return _replaceState.call(this,state,title||origTitle,url);};
  var _windowOpen=window.open;window.open=function(url,target,features){if(url&&typeof url==='string')url=toProxy(url);return _windowOpen.call(this,url,target,features);};
  var _setItem=localStorage.setItem.bind(localStorage);localStorage.setItem=function(key,value){if(key==='banned'&&value==='true')return;return _setItem(key,value);};
  if(localStorage.getItem('banned')==='true')localStorage.removeItem('banned');
})();
</script>`;
}

// ─── HTML Rewriting ──────────────────────────────────────────────────────────
function rewriteHtml(html, proxyOrigin) {
  const script = getInjectedScript(proxyOrigin);
  const baseTag = `<base href="${proxyOrigin}${PROXY_PATH}/" target="_self">`;
  const headInject = `${baseTag}${script}`;

  let rewritten = html;

  // Rewrite absolute URLs
  rewritten = rewritten.replace(
    /((?:src|href|action)\s*=\s*["'])(https?:\/\/nova2021\.bookwizardart\.workers\.dev\/?[^"']*)(["'])/gi,
    (match, prefix, url, suffix) => {
      try { const u = new URL(url); return `${prefix}${PROXY_PATH}${u.pathname}${u.search}${u.hash}${suffix}`; } catch { return match; }
    }
  );

  // Rewrite protocol-relative URLs
  rewritten = rewritten.replace(
    /((?:src|href|action)\s*=\s*["'])(\/\/nova2021\.bookwizardart\.workers\.dev\/?[^"']*)(["'])/gi,
    (match, prefix, url, suffix) => {
      try { const u = new URL("https:" + url); return `${prefix}${PROXY_PATH}${u.pathname}${u.search}${u.hash}${suffix}`; } catch { return match; }
    }
  );

  // Rewrite url() in inline styles
  rewritten = rewritten.replace(
    /url\(\s*['"]?(https?:\/\/nova2021\.bookwizardart\.workers\.dev\/?[^)'"]*?)['"]?\s*\)/gi,
    (match, url) => {
      try { const u = new URL(url); return `url('${PROXY_PATH}${u.pathname}${u.search}')`; } catch { return match; }
    }
  );

  // Inject into <head>
  if (rewritten.includes("<head>")) {
    return rewritten.replace("<head>", `<head>${headInject}`);
  } else if (rewritten.includes("<HEAD>")) {
    return rewritten.replace("<HEAD>", `<HEAD>${headInject}`);
  } else {
    return `${headInject}${rewritten}`;
  }
}

// ─── CSS Rewriting ───────────────────────────────────────────────────────────
function rewriteCss(css) {
  let rewritten = css.replace(
    /url\(\s*['"]?(https?:\/\/nova2021\.bookwizardart\.workers\.dev\/?[^)'"]*?)['"]?\s*\)/gi,
    (match, url) => {
      try { const u = new URL(url); return `url('${PROXY_PATH}${u.pathname}${u.search}')`; } catch { return match; }
    }
  );
  return rewritten;
}

// ─── MIME types ──────────────────────────────────────────────────────────────
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// ─── Create HTTP Server ─────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // ── Nova Proxy Routes ──
    if (pathname === PROXY_PATH || pathname === PROXY_PATH + "/" || pathname.startsWith(PROXY_PATH + "/")) {
      await handleProxyRequest(req, res, url);
      return;
    }

    // ── Static file serving ──
    // Try _next/static first (Next.js build assets)
    if (pathname.startsWith("/_next/static/")) {
      const filePath = path.join(__dirname, ".next", "static", pathname.replace("/_next/static/", ""));
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        serveStaticFile(res, filePath);
        return;
      }
    }

    // Try public directory
    if (!pathname.includes("..")) {
      const publicPath = path.join(__dirname, "public", pathname);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        serveStaticFile(res, publicPath);
        return;
      }
    }

    // ── Main page (Next.js built HTML) ──
    const htmlPath = path.join(__dirname, ".next", "server", "app", "index.html");
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (err) {
    console.error("[Server] Error:", err.message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
    }
  }
});

// ─── Serve static file ──────────────────────────────────────────────────────
function serveStaticFile(res, filePath) {
  const mimeType = getMimeType(filePath);
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": mimeType,
    "Content-Length": stat.size,
    "Cache-Control": "public, max-age=3600",
  });
  fs.createReadStream(filePath).pipe(res);
}

// ─── Proxy Handler ──────────────────────────────────────────────────────────
async function handleProxyRequest(req, res, url) {
  // Detect correct protocol from reverse proxy headers
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proxyOrigin = `${proto}://${host}`;

  // Strip /nova prefix to get target path
  let targetPath = url.pathname;
  if (targetPath.startsWith(PROXY_PATH)) {
    targetPath = targetPath.slice(PROXY_PATH.length) || "/";
  }

  const targetUrl = new URL(targetPath + url.search, TARGET_ORIGIN).href;
  console.log(`[Proxy] ${req.method} ${targetUrl}`);

  try {
    // Collect request body if present
    const bodyChunks = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    const reqBody = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;

    // Build fetch headers
    const fetchHeaders = {
      "Host": new URL(TARGET_ORIGIN).host,
      "Origin": TARGET_ORIGIN,
      "Referer": TARGET_ORIGIN + "/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
    };

    if (req.headers.cookie) fetchHeaders["Cookie"] = req.headers.cookie;
    if (req.headers["content-type"]) fetchHeaders["Content-Type"] = req.headers["content-type"];

    const fetchOptions = {
      method: req.method,
      headers: fetchHeaders,
      redirect: "manual",
    };

    if (reqBody && reqBody.length > 0 && ["POST", "PUT", "PATCH"].includes(req.method)) {
      fetchOptions.body = reqBody;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;

    const targetResponse = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    // Handle redirects
    if (targetResponse.status >= 300 && targetResponse.status < 400) {
      const location = targetResponse.headers.get("location");
      if (location) {
        let redirectUrl = location;
        if (location.startsWith(TARGET_ORIGIN)) {
          try { const u = new URL(location); redirectUrl = proxyOrigin + PROXY_PATH + u.pathname + u.search; } catch {}
        } else if (location.startsWith("/") && !location.startsWith("//")) {
          redirectUrl = proxyOrigin + PROXY_PATH + location;
        }
        res.writeHead(targetResponse.status, { Location: redirectUrl });
        res.end();
        return;
      }
    }

    // Build response headers
    const skipHeaders = new Set([
      "transfer-encoding", "content-encoding", "content-length",
      "connection", "keep-alive", "alt-svc", "nel", "report-to",
      "strict-transport-security", "cf-ray", "server",
      "content-security-policy",
    ]);

    const responseHeaders = {};
    targetResponse.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders[key] = value.replace(/domain=[^;]+;?\s*/gi, "");
        } else {
          responseHeaders[key] = value;
        }
      }
    });
    responseHeaders["access-control-allow-origin"] = proxyOrigin;
    responseHeaders["access-control-allow-credentials"] = "true";
    responseHeaders["content-security-policy"] = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *; frame-ancestors *;";

    const contentType = targetResponse.headers.get("content-type") || "";
    const body = await targetResponse.arrayBuffer();

    // Rewrite HTML
    if (contentType.includes("text/html")) {
      try {
        let html = Buffer.from(body).toString("utf-8");
        html = rewriteHtml(html, proxyOrigin);
        const encoded = Buffer.from(html, "utf-8");
        responseHeaders["content-type"] = "text/html; charset=utf-8";
        responseHeaders["content-length"] = String(encoded.length);
        res.writeHead(targetResponse.status, responseHeaders);
        res.end(encoded);
        return;
      } catch (err) {
        console.error("[Proxy] HTML rewrite error:", err.message);
      }
    }

    // Rewrite CSS
    if (contentType.includes("text/css")) {
      try {
        let css = Buffer.from(body).toString("utf-8");
        css = rewriteCss(css);
        const encoded = Buffer.from(css, "utf-8");
        responseHeaders["content-type"] = "text/css; charset=utf-8";
        responseHeaders["content-length"] = String(encoded.length);
        res.writeHead(targetResponse.status, responseHeaders);
        res.end(encoded);
        return;
      } catch (err) {
        console.error("[Proxy] CSS rewrite error:", err.message);
      }
    }

    // Pass through everything else
    responseHeaders["content-length"] = String(body.byteLength);
    res.writeHead(targetResponse.status, responseHeaders);
    res.end(Buffer.from(body));

  } catch (err) {
    console.error("[Proxy] Error:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html><html><head><title>BridgeView Academy</title></head><body style="background:#081018;color:#eef4ff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>Connection Error</h2><p>Could not reach the learning portal.</p><button onclick="location.reload()" style="padding:12px 24px;border-radius:12px;border:none;background:#73d0ff;color:#03111a;font-weight:700;cursor:pointer;margin-top:16px">Retry</button></div></body></html>`);
    }
  }
}

// ─── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`BridgeView Academy Server running on port ${PORT}`);
  console.log(`  School platform: http://localhost:${PORT}/`);
  console.log(`  Nova proxy:      http://localhost:${PORT}/nova/`);
});

process.on("SIGTERM", () => { server.close(); process.exit(0); });
process.on("SIGINT", () => { server.close(); process.exit(0); });
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED] Unhandled rejection:", reason);
});
