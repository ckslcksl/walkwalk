// Weld adjacent polygon tiles in the same vertical corridor before baking.
// A bounded lower envelope spreads seam corrections along the pavement mesh.
export function stitchPaving(p,ix,walls){
 const columns=new Map(),nodes=[],ids=new Uint32Array(p.length/3),key=(x,z)=>Math.round(x*1000)+','+Math.round(z*1000);
 for(let i=0;i<p.length;i+=3){const k=key(p[i],p[i+2]);if(!columns.has(k))columns.set(k,[]);columns.get(k).push(i/3);}
 for(const entries of columns.values()){entries.sort((a,b)=>p[a*3+1]-p[b*3+1]);let group=[];const flush=()=>{if(!group.length)return;const id=nodes.length,y=group.reduce((n,i)=>n+p[i*3+1],0)/group.length,first=group[0]*3;nodes.push({x:p[first],z:p[first+2],y,initial:y,adj:new Map()});for(const i of group)ids[i]=id;group=[];};for(const i of entries){if(group.length&&p[i*3+1]-p[group[0]*3+1]>1.5)flush();group.push(i);}flush();}
 for(let i=0;i<ix.length;i+=3)for(let j=0;j<3;j++){const a=ids[ix[i+j]],b=ids[ix[i+(j+1)%3]];if(a===b)continue;const u=nodes[a],v=nodes[b],cost=Math.hypot(u.x-v.x,u.z-v.z)*.32;u.adj.set(b,cost);v.adj.set(a,cost);}
 const heap=[],push=(y,id)=>{let i=heap.length;heap.push([y,id]);while(i){const k=(i-1)>>1;if(heap[k][0]<=y)break;heap[i]=heap[k];i=k;}heap[i]=[y,id];},pop=()=>{const r=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return r;};
 nodes.forEach((n,i)=>push(n.y,i));while(heap.length){const[y,i]=pop();if(y>nodes[i].y+1e-7)continue;for(const[j,c]of nodes[i].adj){const h=y+c;if(h<nodes[j].y-1e-7){nodes[j].y=h;push(h,j);}}}
 // Skinny clipping triangles also need a plane-gradient bound, not only edge bounds.
 for(let pass=0;pass<100;pass++){let changed=0;for(let i=0;i<ix.length;i+=3){const a=nodes[ids[ix[i]]],b=nodes[ids[ix[i+1]]],c=nodes[ids[ix[i+2]]],ux=b.x-a.x,uz=b.z-a.z,vx=c.x-a.x,vz=c.z-a.z,den=ux*vz-uz*vx;if(Math.abs(den)<.001)continue;const uy=b.y-a.y,vy=c.y-a.y,gx=(uy*vz-uz*vy)/den,gz=(ux*vy-uy*vx)/den,slope=Math.hypot(gx,gz);if(slope<.42)continue;const bx=vz/den,bz=-vx/den,cx=-uz/den,cz=ux/den,ax=-bx-cx,az=-bz-cz,ga=(gx*ax+gz*az)/slope,gb=(gx*bx+gz*bz)/slope,gc=(gx*cx+gz*cz)/slope,step=(slope-.36)/(ga*ga+gb*gb+gc*gc);a.y-=step*ga;b.y-=step*gb;c.y-=step*gc;changed++;}if(!changed)break;}
 for(let i=0;i<ids.length;i++)p[i*3+1]=nodes[ids[i]].y;
 for(let i=0;i<walls.length;i+=3){const entries=columns.get(key(walls[i],walls[i+2]));if(!entries)continue;let best,delta=Infinity;for(const v of entries){const n=nodes[ids[v]],d=Math.abs(n.initial-.035-walls[i+1]);if(d<delta){delta=d;best=n;}}if(delta<.15)walls[i+1]=best.y-.035;else if(best)walls[i+1]=Math.min(walls[i+1],best.y-.18);}
}
