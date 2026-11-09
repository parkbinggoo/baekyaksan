/** 정적 검증: 소스 구문·DOM 연결·CSS/HTML 링크·모듈 순서 */
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest=JSON.parse(await readFile(join(root,'src/game/manifest.json'),'utf8'));
let prevEnd=0;
for (const [index,part] of manifest.files.entries()){
  if(prevEnd && part.originalLines[0]!==prevEnd+1) throw new Error(`원본 줄 범위 불연속: ${part.file}`);
  prevEnd=part.originalLines[1];
  const code=await readFile(join(root,'src/game',part.file),'utf8');
  try {
    const piece = index === 0 ? code + '\n})();' : (index === manifest.files.length-1 ? '(()=>{\n' + code : code);
    new Function(piece);
  } catch(e) { throw new Error(`기능 소스 구문 오류: ${part.file}: ${e.message}`); }
}
execFileSync(process.execPath,['--check',join(root,'dist/game.bundle.js')]);
const html=await readFile(join(root,'index.html'),'utf8');
const cssPaths=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(x=>x[1]);
for(const p of cssPaths.filter(p=>p.startsWith('./'))){await access(join(root,p));}
const jsPaths=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>x[1]);
for(const p of jsPaths.filter(p=>p.startsWith('./'))){await access(join(root,p));}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const duplicates=ids.filter((x,i)=>ids.indexOf(x)!==i);
if(duplicates.length)throw new Error('HTML 중복 ID: '+[...new Set(duplicates)].join(', '));
if(/\sstyle=/.test(html))throw new Error('HTML에 인라인 스타일이 남았습니다.');
let css='';for(const p of cssPaths.filter(p=>p.startsWith('./'))){css+=await readFile(join(root,p),'utf8')+'\n';}
// Rule nesting depth; comments/strings should not be interpreted as braces.
let dep=0,inComment=false,quote=null;
for(let i=0;i<css.length;i++){
 const c=css[i],n=css[i+1];
 if(inComment){if(c==='*'&&n==='/'){inComment=false;i++;}continue;}
 if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;continue;}
 if(c==='/'&&n==='*'){inComment=true;i++;continue;}
 if(c==='"'||c==="'"){quote=c;continue;}
 if(c==='{')dep++;if(c==='}')dep--;
 if(dep<0)throw new Error('CSS 중괄호가 일치하지 않습니다.');
}
if(dep!==0)throw new Error('CSS 중괄호가 닫히지 않았습니다.');
const bundle=await readFile(join(root,'dist/game.bundle.js'),'utf8');
const referencedIds=[...bundle.matchAll(/\$\(['"]([a-zA-Z][A-Za-z0-9_-]*)['"]\)/g)].map(x=>x[1]);
const missing=[...new Set(referencedIds)].filter(x=>!ids.includes(x));
if(missing.length)throw new Error('JS에서 참조하지만 없는 HTML ID: '+missing.join(', '));
console.log(`검증 통과: ${manifest.files.length}개 JS 소스 구문, 번들 구문, ${ids.length}개 DOM ID, ${cssPaths.length}개 CSS, 상대경로 확인.`);
