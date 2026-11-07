// Deterministic artificial F2 genotypes, generated for software tests only.
// Three independently generated markers, each with an identical paired marker.
function syntheticRaw() {
 let state=0x45a81d;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const markers=[];
 for(let group=0;group<3;group++){
  const genotypes=Array.from({length:120},()=>{const r=random();return r<.25?'A':r<.75?'H':'B';}).join('');
  markers.push(`*m${group*2+1} ${genotypes}`,`*m${group*2+2} ${genotypes}`);
 }
 return 'data type f2 intercross\n120 6 0\n\n'+markers.join('\n')+'\n';
}
module.exports={syntheticRaw};
