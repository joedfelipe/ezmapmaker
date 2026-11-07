const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {syntheticRaw}=require('./synthetic-data.cjs');
const engineAvailable=require('node:fs').existsSync('mapmaker/MAPMBIN.EXE');
const {DosSession}=require('../app/dos-session.cjs');
test('the supplied original MapMaker executable is unchanged',{skip:!engineAvailable&&'Supply the original MapMaker package in mapmaker/ to run engine tests.'},async()=>{
 const bytes=await fs.readFile('mapmaker/MAPMBIN.EXE');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'96c2067ee0df1f54d8526c99d543aad5eddfe5904614ada80040b3f489feea39');
});
test('original DOS MapMaker: live prompts, mapping, save confirmation, DOS results and reload', {timeout:60000,skip:!engineAvailable&&'Supply the original MapMaker package in mapmaker/ to run engine tests.'},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'EzMapMaker Original Lab '));
 const original=Buffer.from(syntheticRaw());
 await fs.writeFile(path.join(dir,'example.raw'),original);
 let session=new DosSession(dir),text='',errors=[];
 const attach=()=>{session.on('screen',value=>text=value);session.on('error',e=>errors.push(e));};attach();
 const wait=async regex=>{
  const deadline=Date.now()+20000;
  while(!regex.test(text)){if(errors.length)throw errors[0];if(Date.now()>deadline)throw Error('Timed out waiting for '+regex+'\n'+text.slice(-1500));await new Promise(r=>setTimeout(r,70));}
 };
 try{
  await session.start();await wait(/1> $/);
  assert.match(text,/\(version 3\.0b\)/);assert.doesNotMatch(text,/2019|Can't find help/);
  for(const [command,prompt] of [['prepare example.raw',/2> $/],['sequence all',/3> $/],['group',/4> $/]]){await session.command(command);await wait(prompt);}
  assert.match(text,/group1= 1 2/);assert.match(text,/group3= 5 6/);
  assert.match(text,/1> prepare example.raw\npreparing/);
  await session.command('quit');await wait(/save data before quitting\? \[yes\] $/);
  const ended=new Promise(resolve=>session.once('ended',resolve));await session.command('y');await ended;
  assert.deepEqual(await fs.readFile(path.join(dir,'example.raw')),original);
  for(const name of ['EXAMPLE.DAT','EXAMPLE.MAP','EXAMPLE.2PT'])assert.ok((await fs.stat(path.join(dir,name))).size>0);
  // Restart from the original engine's saved .DAT, rather than the native port's .data.
  session=new DosSession(dir);text='';attach();await session.start();
  await session.command('load example');await wait(/2> $/);
  assert.match(text,/120 individuals, 6 loci/);
  assert.equal(errors.length,0);
 }finally{await session.stop();await fs.rm(dir,{recursive:true,force:true});}
});
