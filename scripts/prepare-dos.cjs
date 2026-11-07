// Expose DOSBox's existing partial stdout buffer so prompts appear before newline.
// MAPMBIN.EXE, DOS4GW.EXE and the WASM binary are copied without modification.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'node_modules/emulators/dist');
if(require('emulators/package.json').version!=='8.5.2')throw Error('Review the stdout adapter before upgrading emulators.');
const original=fs.readFileSync(path.join(source,'wdosbox.js'),'utf8');
const marker='function ws_client_stdout(data,amount){';
if(original.split(marker).length!==2)throw Error('Unexpected DOSBox stdout bridge.');
fs.mkdirSync(path.join(root,'engine/dos'),{recursive:true});
fs.writeFileSync(path.join(root,'engine/dos/wdosbox.js'),original.replace(marker,marker+'Module.ezReadPending=()=>UTF8ToString(data,4096);'));
for(const file of ['wdosbox.wasm'])fs.copyFileSync(path.join(source,file),path.join(root,'engine/dos',file));
fs.copyFileSync(path.join(root,'node_modules/emulators/LICENSE'),path.join(root,'engine/dos/LICENSE'));
