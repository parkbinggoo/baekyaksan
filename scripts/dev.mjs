/** npm run dev - 추가 라이브러리 없이 정적 개발 서버 실행 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const port=Number(process.env.PORT)||8000;
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
  const pathname=resolve(root,relative);
  if(pathname!==root&&!pathname.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const file=await readFile(pathname);
  res.writeHead(200,{'Content-Type':types[extname(pathname)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:file);
 }catch(e){res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`백약산 개발 서버: http://localhost:${port}/`));
