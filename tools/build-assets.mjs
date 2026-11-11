/** Rebuild paper, geometric envelope art and notices from documented CC0 sources. */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  path.join(root, 'create-wedding-invitation/assets/classic-template'),
  path.join(root, 'create-witness-wedding-invitation/assets/witness-template'),
];
const source = path.join(root, 'asset-sources');
const image = async name => `data:image/jpeg;base64,${(await readFile(path.join(source, name))).toString('base64')}`;
const paper1 = await image('Paper001_1K-JPG_Color.jpg');
const paper2 = await image('Paper002_1K-JPG_Color.jpg');
const browser = await chromium.launch({headless:true, executablePath:process.env.WEDDING_BROWSER_PATH});
const rose = `<svg viewBox="0 0 100 100" fill="none" stroke="#ffe9d1" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M48 53C29 52 23 36 31 23C36 26 39 20 48 19C53 18 61 23 67 22C75 35 67 50 53 54Z"/><path d="M31 25C36 36 42 39 49 42C58 36 64 32 67 24M42 22C39 30 43 38 49 42M49 43L53 54C57 64 54 76 61 85M55 66C63 54 76 57 80 52C79 68 67 73 56 73M55 77C45 65 32 72 28 65C30 81 45 85 57 83"/></svg>`;
const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#d8cab9"/><circle cx="450" cy="425" r="130" fill="none" stroke="#856a5a" stroke-width="7"/><path d="M235 790C290 615 610 615 665 790" fill="none" stroke="#856a5a" stroke-width="7" stroke-linecap="round"/><text x="450" y="930" text-anchor="middle" font-family="serif" font-size="48" fill="#624b3d">照片待添加</text></svg>\n`;
const notices = `THIRD-PARTY MATERIALS\n\nDefault recording: Canon in D Major — Kevin MacLeod (incompetech.com)\nISRC: USUAN1100301\nSource: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100301\nRecording licensed under Creative Commons Attribution 4.0 International.\nhttps://creativecommons.org/licenses/by/4.0/\nChanges: removed ID3 metadata and embedded artwork; transcoded to 96 kbps MP3 for mobile use; renamed canon-in-d-major.mp3.\nRetain attribution, the license link and notices when redistributing or adapting the recording.\nThe default recording permits commercial use under that license; no non-commercial restriction is added.\nA replacement track requires its own permission and attribution.\n\nPaper textures: Paper001 and Paper002 — ambientCG / Lennart Demes.\nhttps://ambientcg.com/view?id=Paper001\nhttps://ambientcg.com/view?id=Paper002\nhttps://docs.ambientcg.com/license/\nCC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/\nChanges: color maps combined, tinted warm ivory with CSS and rendered as paper-warm.jpg.\nThe red and ivory appearances are additional CSS color treatments.\n\nGeometric rose seal, envelope-share composition, ripple effect and photo placeholder:\nnew vector/CSS artwork for Wedding Invitation Skills, dedicated under CC0 1.0.\nEnvelope render uses the CC0 paper above. Rebuild source: tools/build-assets.mjs.\n\nThis notice covers bundled assets only, not user photos, text or replacement music.\nFull license texts: assets/licenses/CC-BY-4.0.txt and assets/licenses/CC0-1.0.txt.\n`;
const materials = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>音乐与素材说明</title><style>body{margin:0;background:#f7efdf;color:#49372c;font:16px/1.8 system-ui,sans-serif}main{max-width:680px;padding:32px 24px;margin:auto}h1{font-size:26px}h2{font-size:20px;margin-top:28px}a{color:#8b3a3a;overflow-wrap:anywhere}small{display:block}pre{white-space:pre-wrap;font:13px/1.7 system-ui}button{font:inherit}</style><main><h1>音乐与素材说明</h1><p>以下是模板默认素材的来源。若请柬已关闭或更换音乐，默认录音可能未使用；替换素材需另行确认授权。</p><h2>默认音乐</h2><p>“Canon in D Major” — Kevin MacLeod（incompetech.com），ISRC USUAN1100301。<br>Licensed under Creative Commons: By Attribution 4.0 License.</p><p><a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100301">作者原站与曲目</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0 许可</a></p><p>已移除 ID3 标签与内嵌封面，转为适合手机加载的 96 kbps MP3，并重命名文件。使用、修改或再分发时应保留作者署名、来源及许可链接，修改后说明改动；在符合许可的情况下允许商业使用。</p><h2>纸张与装饰</h2><p><a href="https://ambientcg.com/view?id=Paper001">Paper001</a>、<a href="https://ambientcg.com/view?id=Paper002">Paper002</a> 来自 ambientCG / Lennart Demes，采用 <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>。模板对纸纹作暖色叠加和组合处理。信封分享图、玫瑰封蜡线稿、波纹与照片占位由本项目重新绘制，采用 CC0 1.0；其中信封使用上述 CC0 纸纹。</p><p><a href="./assets/NOTICES.txt">完整素材记录</a> · <a href="./assets/licenses/CC-BY-4.0.txt">音乐许可全文</a> · <a href="./assets/licenses/CC0-1.0.txt">CC0 全文</a></p><small>本说明不替使用者取得其照片、个人文案或替换音乐的授权。</small><p><a href="./index.html">返回请柬</a></p></main></html>\n`;
try {
  const page = await browser.newPage({viewport:{width:1920,height:1363},deviceScaleFactor:1});
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0}.paper{width:1920px;height:1363px;background:linear-gradient(135deg,#fff6e31a,#b6804212),url('${paper1}');background-size:cover;background-color:#e2c9a3;background-blend-mode:multiply}.paper:after{content:'';position:absolute;inset:0;background:url('${paper2}') center/cover;mix-blend-mode:multiply;opacity:.14}</style><div class="paper"></div>`);
  await page.locator('.paper').screenshot({path:path.join(source,'paper-warm.jpg'),type:'jpeg',quality:88});
  const warm = `data:image/jpeg;base64,${(await readFile(path.join(source,'paper-warm.jpg'))).toString('base64')}`;
  await page.setViewportSize({width:329,height:242});
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0}.envelope{width:329px;height:242px;position:relative;overflow:hidden;border:1px solid #c9b18b;border-radius:7px;background:linear-gradient(152deg,transparent 49.3%,#60482b38 49.8%,transparent 50.6%),linear-gradient(28deg,transparent 49.3%,#60482b38 49.8%,transparent 50.6%),url('${warm}') center/cover;box-shadow:inset 0 -18px 25px #68431e14}.inner{position:absolute;inset:12px;border:1px solid #fff1d891;border-radius:5px}.flap{position:absolute;inset:0;background:linear-gradient(#fff4d877,#e8cda22a);clip-path:polygon(0 0,100% 0,50% 51%);filter:drop-shadow(0 2px 1px #6e452840)}.seal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-5deg);width:83px;height:83px;border-radius:48% 52% 50% 46%;border:1px solid #7e3931;background:radial-gradient(circle at 32% 25%,#f7c3a975,transparent 27%),radial-gradient(circle at 50% 50%,#b9645c 0 36%,#934840 69%,#71342f);box-shadow:0 7px 18px #4b2c2038,inset 0 1px 1px #ffe5d577}.seal:before,.seal:after{content:'';position:absolute;inset:7px;border:1px solid #ffe7d573;border-radius:50%}.seal:after{inset:14px}.seal svg{position:absolute;inset:18px;width:47px;height:47px}p{position:absolute;bottom:16px;left:8px;right:8px;margin:0;text-align:center;font:600 11px Arial,sans-serif;color:#493c2e}</style><div class="envelope"><div class="flap"></div><div class="inner"></div><div class="seal">${rose}</div><p>PERSONAL · PLEASE OPEN BY YOURSELF</p></div>`);
  const envelopePath=path.join(targets[1],'assets/og-witness-letter.png');
  await page.locator('.envelope').screenshot({path:envelopePath});
  for (const target of targets) {
    await mkdir(path.join(target,'assets/licenses'),{recursive:true});
    await copyFile(path.join(source,'paper-warm.jpg'),path.join(target,'assets/paper-warm.jpg'));
    await writeFile(path.join(target,'assets/placeholder.svg'),placeholder);
    await writeFile(path.join(target,'assets/NOTICES.txt'),notices);
    await writeFile(path.join(target,'materials.html'),materials);
    for (const name of ['CC-BY-4.0.txt','CC0-1.0.txt']) await copyFile(path.join(source,name),path.join(target,'assets/licenses',name));
    await copyFile(path.join(source,'canon-in-d-major.mp3'),path.join(target,'assets/canon-in-d-major.mp3'));
  }
  const files=['Paper001_1K-JPG_Color.jpg','Paper002_1K-JPG_Color.jpg','paper-warm.jpg','canon-in-d-major.mp3','CC-BY-4.0.txt','CC0-1.0.txt'];
  const hashes={};
  for(const name of files)hashes[name]=createHash('sha256').update(await readFile(path.join(source,name))).digest('hex');
  hashes['og-witness-letter.png']=createHash('sha256').update(await readFile(envelopePath)).digest('hex');
  await writeFile(path.join(source,'SHA256.json'),JSON.stringify(hashes,null,2)+'\n');
  console.log('Built CC0 paper, original envelope composition, placeholders and license notices for both skills.');
} finally { await browser.close(); }
