const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('consoleAPI',{
 openMapmakerSource:()=>ipcRenderer.invoke('open-mapmaker-source'),
 appInfo:()=>ipcRenderer.invoke('app-info'),copyCitation:()=>ipcRenderer.invoke('copy-citation'),
 openProject:()=>ipcRenderer.invoke('open-project'),command:line=>ipcRenderer.invoke('command',line),
 onScreen:fn=>ipcRenderer.on('screen',(_,text)=>fn(text)),
 onOutput:fn=>ipcRenderer.on('output',(_,text)=>fn(text)),
 onEnded:fn=>ipcRenderer.on('ended',()=>fn())
});
