const {_electron:electron} = require('playwright');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const {syntheticRaw}=require('../tests/synthetic-data.cjs');
(async () => {
 const executablePath=process.env.EZMAPMAKER_EXECUTABLE;
 const app = await electron.launch(executablePath ? {executablePath,args:[]} : {args:[path.resolve(__dirname,'..'),'--preview']});
 const page = await app.firstWindow();
 await page.waitForLoadState('domcontentloaded');
 await fs.mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/interface-preview.png'});
 console.log('PREVIEW_READY');
 if (!process.argv.includes('--test')) { await new Promise(()=>{}); return; }
 try {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(),'MapMaker Lab '));
  await fs.writeFile(path.join(folder,'example.raw'),syntheticRaw());
  await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},folder);
  if(await page.getByRole('button').count()!==3)throw Error('Expected About, folder and theme buttons');
  await page.getByRole('button',{name:'Open project folder',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('output').textContent.includes("Type 'help'"));
  const input=page.getByRole('textbox',{name:'MapMaker command',exact:true});
  for (const [index,command] of ['prepare example.raw','sequence all','group'].entries()) {
   await input.fill(command); await input.press('Enter');
   await page.waitForFunction(n=>document.getElementById('output').textContent.trimEnd().endsWith(n+'>'),index+2);
  }
  await page.waitForFunction(()=>document.getElementById('output').textContent.includes('group3= 5 6'));
  if(!await page.locator('#terminal').evaluate(e=>e.scrollHeight>e.clientHeight))throw Error('Expected scrollback');
  await input.press('ArrowUp');
  if(await input.inputValue()!=='group')throw Error('Command history failed');
  // The editable command sits on the same baseline as MapMaker's own prompt.
  const aligned=await page.evaluate(()=>{
   const o=document.getElementById('output'),r=document.createRange();
   const last=o.lastChild; r.setStart(last,Math.max(0,last.length-1));r.setEnd(last,last.length);
   return Math.abs(r.getBoundingClientRect().top-document.getElementById('command').getBoundingClientRect().top)<6;
  });
  if(!aligned)throw Error('Input is not inline with terminal prompt');
  await input.fill('');
  if(await page.locator('html').getAttribute('data-theme')==='dark') await page.locator('#dark-mode').click();
  await page.screenshot({path:'artifacts/running-preview.png'});
  await page.locator('#dark-mode').click();
  await page.screenshot({path:'artifacts/dark-preview.png'});
  if(await page.locator('html').getAttribute('data-theme')==='dark') await page.locator('#dark-mode').click();
  await input.press(process.platform==='darwin'?'Meta+=':'Control+=');
  if(await input.evaluate(e=>getComputedStyle(e).fontSize)!=='16px')throw Error('Keyboard font control failed');
  await page.setViewportSize({width:640,height:480});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Window overflow');
  await input.fill('quit');await input.press('Enter');
  await page.waitForFunction(()=>document.getElementById('output').textContent.includes('save data before quitting? [yes] '));
  await input.fill('y');await input.press('Enter');
  await page.waitForFunction(()=>document.getElementById('command').hidden);
  await fs.access(path.join(folder,'EXAMPLE.MAP'));await fs.access(path.join(folder,'EXAMPLE.2PT'));
  if((await page.locator('#output').textContent()).includes('2019'))throw Error('Wrong MapMaker build');
  const before=await page.locator('#output').textContent();
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});});
  await page.getByRole('button',{name:'Open project folder'}).click();
  if(await page.locator('#output').textContent()!==before)throw Error('Canceled picker erased output');
  await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});dialog.showMessageBoxSync=()=>1;},folder);
  await page.getByRole('button',{name:'Open project folder'}).click();
  await page.waitForFunction(()=>!document.getElementById('command').disabled);
  const closed=page.waitForEvent('close',{timeout:15000});
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());
  await closed;
  console.log('PASS: original DOS binary, inline commands, scrollback, history, themes, resize, save confirmation, original DOS results, cancel and safe close');
 } catch(error) { console.error(error); if(!page.isClosed())await page.screenshot({path:'artifacts/debug.png'}); throw error; } finally { await app.evaluate(({app})=>app.exit(0)).catch(()=>{}); }
})().catch(e=>{console.error(e);process.exit(1);});
