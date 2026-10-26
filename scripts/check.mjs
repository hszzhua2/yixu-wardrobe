// Optional developer check. Runtime remains buildless and dependency-free.
import assert from 'node:assert/strict';
import {readFile, access, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
for(const name of ['app.js','data.js'])execFileSync(process.execPath,['--check',path.join(root,name)],{stdio:'inherit'});
const context={window:{}};
vm.runInNewContext(await readFile(path.join(root,'data.js'),'utf8'),context,{timeout:1000});
const seed=context.window.WARDROBE_SEED;
assert(seed?.source?.demo===true,'Only generic demo data belongs in the public seed');
assert.equal(seed.items.length,16);
assert.equal(seed.categories.length,6);
assert.equal(new Set(seed.items.map(i=>i.id)).size,seed.items.length);
assert.equal(new Set(seed.items.map(i=>i.code.toLowerCase())).size,seed.items.length);
assert.equal(new Set(seed.categories.map(c=>c.id)).size,seed.categories.length);
const categories=new Set(seed.categories.map(c=>c.id));
for(const item of seed.items){
  assert(item.id&&item.code&&item.name&&categories.has(item.categoryId));
  assert(['active','idle','laundry'].includes(item.status));
  assert.match(item.image,/^assets\/items\/demo-[a-z0-9-]+\.svg$/);
  assert(!item.sourceSheet&&!item.sourceCell,'Demo records must not carry personal workbook provenance');
  await access(path.join(root,item.image));
}
const images=await readdir(path.join(root,'assets/items'));
assert.equal(images.length,16);
assert(images.every(n=>/^demo-[a-z0-9-]+\.svg$/.test(n)));
const app=await readFile(path.join(root,'app.js'),'utf8');
assert(app.includes("'yixu.public.wardrobe.v1'"),'Public and personal editions must use separate storage keys');
assert(!app.includes("'yixu.wardrobe.v1'"));
const index=await readFile(path.join(root,'index.html'),'utf8');
for(const match of index.matchAll(/(?:src|href)="([^"#]+)"/g)){
  assert(!/^https?:/.test(match[1]),'Runtime assets must remain local');
  await access(path.join(root,match[1]));
}
console.log('Checks passed: source syntax, 16 synthetic items, 6 categories, local assets and isolated storage.');
