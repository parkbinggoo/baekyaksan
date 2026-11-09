/**
 * 백약산 개발 빌드 - Node.js 내장 모듈만 사용 (추가 npm 설치 불필요).
 * 순서가 중요한 기존 게임의 IIFE 스코프를 보존한 채 기능별 소스를 결합합니다.
 * HTML/CSS는 그대로 분리된 파일로 제공됩니다.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'src/game/manifest.json'), 'utf8'));
const fragments = await Promise.all(manifest.files.map(async entry => {
  if (entry.file.startsWith('/') || entry.file.includes('..')) throw new Error('잘못된 소스 경로: ' + entry.file);
  return await readFile(join(root, 'src/game', entry.file), 'utf8');
}));
const bundle = fragments.join('');
const expectedFirst = '(()=>{';
if (!bundle.startsWith(expectedFirst) || !bundle.trimEnd().endsWith('})();')) {
  throw new Error('게임 시작/종료 구조가 손상되었습니다. manifest 순서를 확인하세요.');
}
const dir = join(root, 'dist'); await mkdir(dir, { recursive: true });
await writeFile(join(dir, 'game.bundle.js'), bundle, 'utf8');
const hash = createHash('sha256').update(bundle).digest('hex');
console.log(`빌드 완료: ${manifest.files.length}개 기능 파일 → dist/game.bundle.js (${bundle.length.toLocaleString()}자)`);
console.log(`SHA-256: ${hash}`);

await import('./update-map.mjs');
