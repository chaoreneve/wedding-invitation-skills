/** Browser regression checks using only fictional configurations and bundled test art. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const small = process.argv.includes('--small');
const viewportSize = small ? {width:360,height:640} : {width:390,height:844};
const work = path.join(root, 'output', `browser-check-${Date.now()}`);
await mkdir(work, {recursive:true});
const artwork = path.join(root, 'create-witness-wedding-invitation/assets/witness-template/assets/og-witness-letter.png');
const configurations = [
  ['classic', 'classic', {preset:'classic'}],
  ['classic-red', 'classic', {preset:'chinese-red-paper'}],
  ['classic-green', 'classic', {preset:'custom',accent:'#28533F',surface:'#28533F'}],
  ['witness', 'witness', null],
];
for (const [name, kind, theme] of configurations) {
  const config=JSON.parse(await readFile(path.join(root,`examples/${kind}.json`),'utf8'));
  delete config.media.music;
  if(theme)config.theme=theme;
  // Test geometry is not presented as a supplied portrait.
  config.media.gallery=[0,1,2].map(i=>({src:artwork,alt:`检查用图形 ${i+1}`}));
  const source=path.join(work,`${name}.json`);
  await writeFile(source,JSON.stringify(config));
  const skill=kind==='classic'?'create-wedding-invitation':'create-witness-wedding-invitation';
  const generator=kind==='classic'?'create_invitation.py':'create_witness_invitation.py';
  execFileSync('python3',[path.join(root,skill,'scripts',generator),'--config',source,'--output',path.join(work,name)]);
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=path.resolve(work,`.${pathname.endsWith('/')?pathname+'index.html':pathname}`);
    if(!target.startsWith(work+path.sep)){res.writeHead(403).end();return;}
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':data.length}).end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.WEDDING_BROWSER_PATH});
const report=[];
try{
  for(const [name,kind]of configurations){
    const context=await browser.newContext({viewport:viewportSize,deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const badRequests=[];
    page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))badRequests.push(r.url());});
    await page.addInitScript(()=>{
      const NativeAudio=window.Audio;
      window.__testAudio=[];
      window.Audio=function(...args){const audio=new NativeAudio(...args);window.__testAudio.push(audio);return audio;};
      window.Audio.prototype=NativeAudio.prototype;
    });
    await page.goto(`${base}/${name}/`,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.locator('.asset-credits-link').isVisible(),'materials link missing');
    const credits=await context.newPage();
    await credits.goto(`${base}/${name}/materials.html`);
    assert((await credits.textContent('main')).includes('Kevin MacLeod'));
    assert(await credits.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]').count());
    await credits.close();
    await page.screenshot({path:path.join(work,`${name}-cover.png`)});
    if(!small&&name!=='classic-green')await page.screenshot({path:path.join(root,`docs/previews/${name}.png`)});
    const musicButton=kind==='classic'?'#musicButton':'.sound-button';
    await page.locator('h1').click();
    await page.waitForFunction(()=>window.__testAudio[0]?.currentTime>0&&!window.__testAudio[0].paused);
    const audioInfo=await page.evaluate(()=>({duration:__testAudio[0].duration,loop:__testAudio[0].loop,src:__testAudio[0].src}));
    assert(audioInfo.duration>350&&audioInfo.duration<360);
    assert(audioInfo.loop&&audioInfo.src.endsWith('canon-in-d-major.mp3'));
    await page.locator(musicButton).click();
    assert(await page.evaluate(()=>__testAudio[0].paused));
    await page.locator('h1').click();
    assert(await page.evaluate(()=>__testAudio[0].paused),'explicit pause was overridden');
    await page.locator(musicButton).click();
    await page.waitForFunction(()=>!__testAudio[0].paused);
    await page.evaluate(()=>{__testAudio[0].currentTime=__testAudio[0].duration-.15;});
    await page.waitForTimeout(700);
    assert(await page.evaluate(()=>!__testAudio[0].paused&&__testAudio[0].currentTime<5),'music did not loop');
    await page.locator(musicButton).click();
    if(kind==='classic'){
      for(const id of ['welcome','gallery','ticket','ending']){
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const size=await page.locator(`#${id}`).boundingBox();
        assert(size.height<=viewportSize.height+2,`${name} ${id} taller than one screen: ${size.height}`);
        await page.screenshot({path:path.join(work,`${name}-${id}.png`)});
      }
      await page.locator('#gallery').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const before=await page.locator('#galleryList').evaluate(e=>e.style.transform);
      await page.waitForTimeout(600);
      const after=await page.locator('#galleryList').evaluate(e=>e.style.transform);
      assert.notEqual(before,after,'classic gallery stopped');
      const viewport=await page.locator('.projector-window').boundingBox();
      await page.mouse.move(viewport.x+viewport.width*.7,viewport.y+viewport.height*.5);
      await page.mouse.down();await page.mouse.move(viewport.x+viewport.width*.3,viewport.y+viewport.height*.5,{steps:8});await page.mouse.up();
      assert.notEqual(after,await page.locator('#galleryList').evaluate(e=>e.style.transform),'classic gallery does not drag');
      await page.waitForTimeout(450);
      await page.locator('#galleryList .photo').first().click({force:true});
      assert(await page.locator('#lightbox').evaluate(e=>e.open));
      await page.locator('#closeLightbox').click();
    }else{
      await page.locator('[data-envelope-open]').click();
      await page.waitForFunction(()=>!document.querySelector('#identity-check').hidden);
      await page.locator('[name="guestName"]').fill('演示宾客');
      await page.locator('[data-identity-form] button[type="submit"]').click();
      await page.waitForFunction(()=>!document.querySelector('#personal-letter').hidden);
      assert((await page.textContent('[data-letter-greeting]')).includes('演示宾客'));
      await page.waitForTimeout(650);
      await page.screenshot({path:path.join(work,'witness-letter.png')});
      await page.locator('[data-next="#hall-01"]').click();
      await page.waitForTimeout(700);
      const before=await page.locator('[data-projector-track]').evaluate(e=>e.style.transform);
      await page.waitForTimeout(600);
      const after=await page.locator('[data-projector-track]').evaluate(e=>e.style.transform);
      assert.notEqual(before,after,'witness gallery stopped');
      const viewport=await page.locator('.projector-window').boundingBox();
      await page.mouse.move(viewport.x+viewport.width*.7,viewport.y+viewport.height*.5);
      await page.mouse.down();await page.mouse.move(viewport.x+viewport.width*.3,viewport.y+viewport.height*.5,{steps:8});await page.mouse.up();
      assert.notEqual(after,await page.locator('[data-projector-track]').evaluate(e=>e.style.transform),'witness gallery does not drag');
      await page.waitForTimeout(450);
      await page.locator('[data-projector-frame]').first().click({force:true});
      assert(await page.locator('[data-lightbox-modal]').isVisible());
      assert(await page.locator('[data-lightbox-title]').isHidden(),'generic photo title was shown');
      await page.locator('.lightbox-close').click();
      await page.locator('[data-next="#mission"]').click();
      await page.waitForTimeout(500);
      assert(await page.locator('.mission-timeline').isHidden());
      await page.screenshot({path:path.join(work,'witness-mission.png')});
      await page.locator('[data-next="#mission-accepted"]').click();
      await page.waitForTimeout(500);
      assert((await page.textContent('#mission-accepted')).includes('演示宾客'));
      await page.screenshot({path:path.join(work,'witness-accepted.png')});
      await page.goto(`${base}/witness/`,{waitUntil:'networkidle'});
      await page.locator('[data-envelope-open]').click();
      await page.waitForFunction(()=>!document.querySelector('#identity-check').hidden);
      await page.locator('[data-identity-choice="other"]').click();
      await page.waitForFunction(()=>!document.querySelector('#identity-denied').hidden);
      await page.locator('[data-passphrase-open]').click();
      await page.locator('[name="passphrase"]').fill('错误答案');
      await page.locator('[data-passphrase-form] button').click();
      assert.equal(await page.locator('[data-passphrase-result]').getAttribute('data-state'),'wrong');
      await page.locator('[name="passphrase"]').fill('百无禁忌');
      await page.locator('[data-passphrase-form] button').click();
      await page.waitForFunction(()=>!document.querySelector('#personal-letter').hidden);
      assert((await page.textContent('[data-letter-greeting]')).includes('神秘人'));
    }
    assert.deepEqual(errors,[]);
    assert.deepEqual(badRequests,[]);
    report.push({name,music:audioInfo,passed:true});
    await context.close();
    console.log(`PASS ${name}: layout, assets, credits, music, gallery and interaction`);
  }
  await writeFile(path.join(work,'result.json'),JSON.stringify(report,null,2));
  console.log(`Screenshots and report: ${work}`);
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
