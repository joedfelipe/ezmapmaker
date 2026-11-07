const {app,BrowserWindow,ipcMain,dialog,clipboard,shell}=require('electron');
const {Worker}=require('node:worker_threads');
const fs=require('node:fs/promises');
const path=require('node:path');
let win,worker,project,transcript='',quitting=false,serial=0;
const requests=new Map();
function send(type,line){return new Promise((resolve,reject)=>{const id=++serial;requests.set(id,{resolve,reject});worker.postMessage({type,line,id});});}
async function start(folder){
 if(worker)throw Error('Type quit and finish saving before changing projects.');
 transcript='';project=folder;
 worker=new Worker(path.join(__dirname,'dos-worker.cjs'),{workerData:{folder}});
 await new Promise((resolve,reject)=>{
  let ready=false;
  worker.on('message',message=>{
   if(message.type==='ready'){ready=true;resolve();}
   if(message.type==='screen'){transcript=message.text;win.webContents.send('screen',message.text);}
   if(message.type==='reply'){const r=requests.get(message.id);if(r){requests.delete(message.id);message.error?r.reject(Error(message.error)):r.resolve();}}
   if(message.type==='error'){
    if(!ready)reject(Error(message.message));
    else win.webContents.send('output',`\nDOS runtime error: ${message.message}\n`);
   }
   if(message.type==='ended'){win.webContents.send('ended');}
  });
  worker.on('error',error=>{reject(error);if(ready)win.webContents.send('output',`\n${error.message}\n`);});
  worker.on('exit',()=>{
   worker=null;for(const r of requests.values())r.reject(Error('DOS session ended.'));requests.clear();
   if(!win.isDestroyed())win.webContents.send('ended');
  });
 }).catch(async error=>{if(worker)await worker.terminate();worker=null;throw error;});
 return {folder};
}
app.whenReady().then(()=>{
 win=new BrowserWindow({width:1280,height:840,minWidth:480,minHeight:320,backgroundColor:'#f4faf7',title:'EzMapMaker',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.setMenuBarVisibility(false);win.loadFile(path.join(__dirname,'index.html'));
 win.on('close',event=>{
  if(!worker||quitting)return;
  event.preventDefault();
  const answer=dialog.showMessageBoxSync(win,{type:'question',buttons:['Keep Working','Close'],defaultId:0,cancelId:0,message:'Close the MapMaker session?',detail:'Use quit and answer the save prompt to save analysis still held by MapMaker. Files already written will be copied to your project before closing.'});
  if(answer===0)return;
  send('stop').then(()=>{quitting=true;win.close();}).catch(error=>dialog.showErrorBox('Could not save project files',error.message));
 });
});
app.on('window-all-closed',()=>app.quit());
ipcMain.handle('open-project',async()=>{
 const result=await dialog.showOpenDialog(win,{title:'Choose a MapMaker project folder',properties:['openDirectory','createDirectory']});
 return result.canceled?null:start(result.filePaths[0]);
});
ipcMain.handle('command',(_,line)=>{if(!worker)throw Error('Open a project to start MapMaker.');return send('command',line);});

function softwareCitation(){return `Felipe, J. E. L. (2026). EzMapMaker (Version ${app.getVersion()}) [Computer software].`;}
ipcMain.handle('app-info',()=>({version:app.getVersion(),citation:softwareCitation()}));
ipcMain.handle('copy-citation',()=>{clipboard.writeText(softwareCitation());return true;});

ipcMain.handle('open-mapmaker-source',()=>shell.openExternal('https://github.com/kentavv/mapmaker'));
