let lastYield=0;
export async function yieldToBrowser(){if(typeof window==='undefined'||performance.now()-lastYield<24)return;await new Promise(resolve=>setTimeout(resolve,0));lastYield=performance.now();}
export async function reportLoading(label,percent){const el=typeof document!=='undefined'&&document.querySelector?.('#loading');if(el){el.textContent=label+' · '+percent+'%';el.setAttribute('role','status');el.setAttribute('aria-live','polite');}await yieldToBrowser();}
