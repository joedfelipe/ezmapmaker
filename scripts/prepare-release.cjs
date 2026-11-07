// Rebuild corresponding source materials from an explicit, dataset-free allowlist.
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const version=require('../package.json').version;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const upstream=[
 ['emulators-8.5.2.tar.gz','https://codeload.github.com/js-dos/emulators/tar.gz/6bbf0925d221a7304ea8e0dda1e89b8dc01569b2','9b7354c2cc853681b99eb288bcdc7e5e0ff7fd2e821485c9b20c12472fbc822e'],
 ['dosbox-528578d5.tar.gz','https://codeload.github.com/js-dos/dosbox/tar.gz/528578d5a6f76afd4d5ef4e722b5670826f1183a','797efaf22246bbc5b2e6be0a6c791a58addd2bca330e0aa93232780a77e06019']
];
(async()=>{
 const target=path.join(root,'distribution/source');await fs.mkdir(target,{recursive:true});
 for(const [name,url,expected] of upstream){
  const file=path.join(target,name);let bytes;
  try{bytes=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!bytes){const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(`Source download failed (${response.status}): ${name}`);bytes=Buffer.from(await response.arrayBuffer());}
  if(digest(bytes)!==expected)throw Error(`Source checksum mismatch: ${name}`);
  await fs.writeFile(file,bytes);
 }
 const files=['app','scripts','tests','build/icon.png','build/icon.icns','build/icon.ico','build/make-icon.py','electron-builder.yml','package.json','package-lock.json','README.md','LICENSE','licenses','distribution/START-HERE.txt','distribution/THIRD-PARTY-NOTICES.txt'];
 const out=path.join(target,`ezmapmaker-${version}-source.tar.gz`);
 const run=spawnSync('tar',['--exclude=.DS_Store','-czf',out,...files],{cwd:root,stdio:'inherit'});
 if(run.error)throw run.error;if(run.status!==0)throw Error('Could not create wrapper source archive.');
 console.log(`Prepared corresponding sources for EzMapMaker ${version}.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
