import * as T from'./three.module.js?v=grade-20261107';
export function matchBankTint(g,m,terrain){if(!terrain.groundTint)return;const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const rgb=terrain.groundTint(p.getX(i),p.getZ(i));c.set(rgb,i*3);}g.setAttribute('color',new T.BufferAttribute(c,3));m.vertexColors=true;m.color.set('#ffffff');}
