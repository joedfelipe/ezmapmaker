const {EventEmitter}=require('node:events');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
require('emulators');
const emulators=global.emulators;
const root=path.resolve(__dirname,'..');
emulators.pathPrefix=path.join(root,'engine/dos')+path.sep;
const runtimeFiles=['DOS4GW.EXE','MAPMBIN.EXE','MAPMAKER.BAT','MAPM.VMC','MAPMAKER.HLP'];
const dosName=/^[A-Za-z0-9_!#$%&'()@^`{}~\-]{1,8}(\.[A-Za-z0-9_!#$%&'()@^`{}~\-]{1,3})?$/;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function clean(s){return s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/\r\n/g,'\n').replace(/\r/g,'').replace(/[^\x09\x0a\x20-\x7e\xa0-\xff]/g,'');}
class DosSession extends EventEmitter {
 constructor(folder){super();this.folder=folder;this.full='';this.echoes=[];this.names=new Map();this.hashes=new Map();this.visible=false;this.lastText='';this.sending=false;this.closed=false;this.syncing=null;}
 async start(){
  const init=[{dosboxConf:'[sdl]\noutput=surface\n[dosbox]\nmemsize=32\n[cpu]\ncycles=max\n[mixer]\nnosound=true\n[autoexec]\n@echo off\nmount c .\nmount d ./project\nset PATH=Z:\\;C:\\MAPMAKER\nset MAPM_LIB=C:\\MAPMAKER\nd:\ncall c:\\mapmaker\\mapmaker.bat\necho EZMAPMAKER_SESSION_DONE\n',jsdosConf:{version:'8'}}];
  for(const name of runtimeFiles)init.push({path:'mapmaker/'+name,contents:new Uint8Array(await fs.readFile(path.join(root,'mapmaker',name)))});
  // The project is a separate DOS drive. The supplied launcher keeps its original C:\MAPMAKER paths.
  init.push({path:'project/EZEMPTY.TMP',contents:new Uint8Array()});
  for(const entry of await fs.readdir(this.folder,{withFileTypes:true})){
   if(!entry.isFile()||entry.name.startsWith('.')||!dosName.test(entry.name))continue;
   const key=entry.name.toUpperCase();if(this.names.has(key))throw Error(`DOS filename collision: ${entry.name}`);
   const bytes=await fs.readFile(path.join(this.folder,entry.name));
   this.names.set(key,entry.name);this.hashes.set(key,hash(bytes));init.push({path:'project/'+key,contents:new Uint8Array(bytes)});
  }
  this.ci=await emulators.dosboxNode(init);
  const module=this.ci.transport?.module;
  if(typeof module?.ezReadPending!=='function')throw Error('DOS console adapter not installed. Run npm run prepare:dos.');
  this.ci.events().onStdout(raw=>{
   const text=clean(raw);
   if(text.includes('EZMAPMAKER_SESSION_DONE')){this.finish().catch(e=>this.emit('error',e));return;}
   if(!this.visible){if(!text.includes('************************************************************************'))return;this.visible=true;}
   this.full+=text;this.publish();
  });
  this.ci.events().onExit(()=>{if(!this.closed)this.finish().catch(e=>this.emit('error',e));});
  this.timer=setInterval(()=>this.publish(),60);
  this.saveTimer=setInterval(()=>this.sync().catch(e=>this.emit('error',e)),1200);
  const deadline=Date.now()+20000;
  while(!/(?:^|\n)\d+> $/.test(this.text())){
   if(Date.now()>deadline)throw Error('The original MapMaker did not reach its command prompt.');
   await delay(60);
  }
 }
 pending(){if(!this.visible||this.closed||this.finishing)return '';return clean(this.ci.transport.module.ezReadPending());}
 text(){
  const raw=this.full+this.pending();let result='',offset=0;
  for(const echo of this.echoes){const end=Math.min(raw.length,echo.offset);result+=raw.slice(offset,end)+echo.text;offset=end;}
  return result+raw.slice(offset);
 }
 publish(){const text=this.text();if(text!==this.lastText){this.lastText=text;this.emit('screen',text);}}
 async command(line){
  if(this.closed||!this.ci)throw Error('Open a project to start MapMaker.');
  if(this.sending)throw Error('Wait for the current command to be entered.');
  if(typeof line!=='string'||!/^[\x20-\x7e]*$/.test(line)||line.length>250)throw Error('Use one DOS command of up to 250 ASCII characters.');
  this.sending=true;
  try{
   const pending=this.pending();
   this.echoes.push({offset:this.full.length+pending.length,text:line+'\n'});this.publish();
   for(const char of line){
    const shifted='~!@#$%^&*()_+{}|:"<>?';const base='`1234567890-=[]\\;\',./';
    let key=char.toUpperCase().charCodeAt(0),shift=/[A-Z]/.test(char);
    const i=shifted.indexOf(char);if(i>=0){key=base.charCodeAt(i);shift=true;}
    if(shift)this.ci.sendKeyEvent(340,true);
    this.ci.simulateKeyPress(key);await delay(22);
    if(shift)this.ci.sendKeyEvent(340,false);
   }
   this.ci.simulateKeyPress(257);await delay(30);
  }finally{this.sending=false;}
 }
 async sync(){
  if(this.closed)return;if(this.syncing)return this.syncing;
  this.syncing=(async()=>{
   const tree=await this.ci.fsTree();const project=tree.nodes?.find(n=>n.name.toLowerCase()==='project');
   for(const file of project?.nodes||[]){
    if(file.nodes||!dosName.test(file.name)||file.name==='EZEMPTY.TMP')continue;
    const data=await this.ci.fsReadFile('project/'+file.name);const digest=hash(data),key=file.name.toUpperCase();
    if(digest===this.hashes.get(key))continue;
    const name=this.names.get(key)||key;const dest=path.join(this.folder,name);
    // Never follow an existing project symlink when writing emulator results.
    try{if((await fs.lstat(dest)).isSymbolicLink())throw Error(`Cannot save over symbolic link: ${name}`);}catch(e){if(e.code!=='ENOENT')throw e;}
    const temp=path.join(this.folder,`.ezmapmaker-${crypto.randomUUID()}.tmp`);
    try{await fs.writeFile(temp,data,{flag:'wx'});await fs.rename(temp,dest);}finally{await fs.rm(temp,{force:true});}
    this.names.set(key,name);this.hashes.set(key,digest);
   }
  })();
  try{await this.syncing;}finally{this.syncing=null;}
 }
 async finish(){
  if(this.finishing||this.closed)return;this.finishing=true;clearInterval(this.timer);clearInterval(this.saveTimer);
  await this.sync();this.full=this.full.replace(/(?:C|D):\\[^\n]*>\s*$/,'');this.publish();this.closed=true;
  await this.ci.exit();this.emit('ended');
 }
 async stop(){clearInterval(this.timer);clearInterval(this.saveTimer);await this.sync();this.closed=true;if(this.ci)await this.ci.exit();}
}
module.exports={DosSession,runtimeFiles};
