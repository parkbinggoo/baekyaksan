/** Startup compatibility regression: optional golden-hoe UI may be absent in
 * a cached index.html. That must never stop profile/login event bindings.
 * Uses a tiny DOM stub and real UI module (no browser/Three.js dependency).
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/game/gameplay/49a-golden-hoe-ui-and-aura.js',import.meta.url),'utf8');
function run(preexisting=''){
  const nodes=new Map(),links=[];
  class Node {
    constructor(tag='section'){
      this.tagName=tag;this.id='';this.className='';this.events={};this.attributes={};
      this.classList={add(){},remove(){}};this.style={};this.parentNode=null;
    }
    set innerHTML(value){
      this._html=value;
      for(const m of value.matchAll(/\bid="([\w-]+)"/g))nodes.set(m[1],new Node());
    }
    get innerHTML(){return this._html||''}
    addEventListener(name,fn){this.events[name]=fn}
    setAttribute(k,v){this.attributes[k]=v}
    remove(){nodes.delete(this.id)}
    appendChild(child){if(child.id)nodes.set(child.id,child);child.parentNode=this;return child}
  }
  const document={createElement:tag=>new Node(tag),body:new Node('body'),head:new Node('head'),
    querySelector:q=>q.includes('14-golden-hoe-ui.css')?(links[0]||null):null};
  const originalHeadAppend=document.head.appendChild.bind(document.head);
  document.head.appendChild=n=>{links.push(n);return originalHeadAppend(n)};
  const originalBodyAppend=document.body.appendChild.bind(document.body);
  document.body.appendChild=n=>originalBodyAppend(n);
  if(preexisting==='complete'){
    for(const id of ['goldenHoePanel','goldenHoeProgress','goldenHoeProgressBar','goldenHoeInstruction',
      'goldenHoeDigBtn','goldenHoeAchievement','goldenHoeAchievementClose'])nodes.set(id,new Node());
  }else if(preexisting==='partial')nodes.set('goldenHoePanel',new Node());
  const ctx={document,$:id=>nodes.get(id)||null,console,Math};
  vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'49a-golden-hoe-ui-and-aura.js'});
  const mandatory=['goldenHoePanel','goldenHoeProgress','goldenHoeProgressBar','goldenHoeInstruction',
    'goldenHoeDigBtn','goldenHoeAchievement','goldenHoeAchievementClose'];
  for(const id of mandatory)assert(nodes.has(id),`Missing recoverable UI node: ${id}`);
  assert.equal(typeof nodes.get('goldenHoeDigBtn').events.click,'function');
  assert.equal(typeof nodes.get('goldenHoeAchievementClose').events.click,'function');
  const original=nodes.get('goldenHoePanel');
  vm.runInContext('ensureGoldenHoeUiElements()',ctx);
  assert.strictEqual(nodes.get('goldenHoePanel'),original,'Recovery must be idempotent');
  if(preexisting==='complete')assert.equal(links.length,0,'Do not add redundant CSS for new HTML');
  else assert.equal(links.length,1,'Recover missing CSS from stale HTML');
  return true;
}
assert(run('complete'));
assert(run('partial'));
assert(run('missing'));
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/dist\/game\.bundle\.js\?v=1\.2\.8-entryfix/,'bust stale bundled JS cache');
assert.match(html,/styles\/14-golden-hoe-ui\.css\?v=1\.2\.8-entryfix/,'bust stale CSS cache');
console.log('시작 화면 회귀 검증 통과: 최신/구형/일부 누락 HTML에서도 UI 초기화가 중단되지 않고, 캐시 갱신 경로가 존재합니다.');
