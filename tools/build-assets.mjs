/** Preserve original bundled media; regenerate only its notices and checksum record. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folders=['create-wedding-invitation/assets/classic-template','create-witness-wedding-invitation/assets/witness-template'];
const hashes={};
const notice='原项目素材：严禁商用。\n本项目要求仅供个人非商业婚礼请柬使用，禁止将所含音乐、纸纹及装饰素材用于商业用途。\nOriginal project materials: commercial use strictly prohibited by project policy.\nThis notice is a project restriction, not a grant of copyright or redistribution rights.\nDefault BGM and images are restored from the original project, not the later CC0/CC BY alternatives.\nUser photos and replacement tracks require their own permission.\n';
const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>音乐与素材说明</title><style>body{margin:0;background:#f7efdf;color:#49372c;font:16px/1.9 system-ui}main{max-width:640px;margin:auto;padding:32px 24px}h1{font-size:26px}strong{color:#9b2626}a{color:#8b3a3a}</style><main><h1>音乐与素材说明</h1><p><strong>严禁商用。</strong></p><p>本请柬所含的背景音乐、纸纹及装饰素材仅供个人非商业婚礼请柬使用，禁止用于商业用途。</p><p>使用者提供的照片、文案和替换音乐需另行确认使用权限。</p><p><a href="./assets/NOTICES.txt">完整素材说明</a> · <a href="./index.html">返回请柬</a></p></main></html>\n';
for(const rel of folders){
 const target=path.join(root,rel);
 await writeFile(path.join(target,'assets/NOTICES.txt'),notice);
 await writeFile(path.join(target,'materials.html'),html);
 for(const name of ['classic-bgm.mp3','paper-warm.jpg',...(rel.includes('witness')?['og-witness-letter.png','water-ripple-bg.png']:[])]){
  const key=rel+'/assets/'+name;hashes[key]=createHash('sha256').update(await readFile(path.join(root,key))).digest('hex');
 }
}
await writeFile(path.join(root,'asset-sources/ORIGINAL_SHA256.json'),JSON.stringify(hashes,null,2)+'\n');
console.log('Original media retained; non-commercial notices and original-asset checksums updated.');
