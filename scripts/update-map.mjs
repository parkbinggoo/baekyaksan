/** 기능 파일의 실제 줄 수를 코드 맵에 자동 기록합니다. manifest.json이 단일 진실 공급원입니다. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest=JSON.parse(await readFile(join(root,'src/game/manifest.json'),'utf8'));
const mapPath=join(root,'CODE_MAP.md');
const text=await readFile(mapPath,'utf8');
const start='<!-- AUTO-MAP-START -->';
const end='<!-- AUTO-MAP-END -->';
const a=text.indexOf(start),b=text.indexOf(end);
if(a<0||b<=a)throw new Error('CODE_MAP.md 자동 생성 영역 표시가 누락되었습니다.');
const rows=['| 구분 | 소스 파일 | 원본 줄 | 현재 줄 수 | 담당 기능 |','|---|---|---:|---:|---|'];
for(const f of manifest.files){
 const body=await readFile(join(root,'src/game',f.file),'utf8');
 const n=body.split('\n').length-(body.endsWith('\n')?1:0);
 const [first,last]=f.originalLines||['—','—'];
 rows.push(`| ${f.file.split('/')[0]} | \`src/game/${f.file}\` | ${first}–${last} | ${n}줄 | ${f.purpose.replaceAll('|','/')} |`);
}
const next=text.slice(0,a+start.length)+'\n'+rows.join('\n')+'\n'+text.slice(b);
await writeFile(mapPath,next,'utf8');
console.log(`코드 맵 갱신: CODE_MAP.md (${manifest.files.length}개 모듈)`);
