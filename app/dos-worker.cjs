const {parentPort,workerData}=require('node:worker_threads');
const {DosSession}=require('./dos-session.cjs');
const session=new DosSession(workerData.folder);
session.on('screen',text=>parentPort.postMessage({type:'screen',text}));
session.on('error',error=>parentPort.postMessage({type:'error',message:error.message}));
session.on('ended',()=>{parentPort.postMessage({type:'ended'});parentPort.close();});
parentPort.on('message',async message=>{
 try{
  if(message.type==='command')await session.command(message.line);
  if(message.type==='stop'){await session.stop();parentPort.postMessage({type:'reply',id:message.id});parentPort.close();return;}
  if(message.id)parentPort.postMessage({type:'reply',id:message.id});
 }catch(error){parentPort.postMessage({type:'reply',id:message.id,error:error.message});}
});
session.start().then(()=>parentPort.postMessage({type:'ready'})).catch(error=>{parentPort.postMessage({type:'error',message:error.message});parentPort.close();});
