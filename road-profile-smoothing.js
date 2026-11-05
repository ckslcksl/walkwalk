// Continuous engineering grades shared at mapped junctions. Source XY is retained.
export function smoothRegionalRoadProfiles(data,profiles){
 if(data.region!=='suji')return;
 const nodes=[],ids=new Map(),refs=new Map(),arcs=[];
 for(const [road,p] of profiles){const list=[];for(let i=0;i<p.samples.length;i++){const q=p.samples[i],key=q[0].toFixed(5)+','+q[1].toFixed(5);let id=ids.get(key);if(id===undefined){id=nodes.length;ids.set(key,id);nodes.push({p:q,y:p.heights[i]});arcs.push([]);}else nodes[id].y=Math.min(nodes[id].y,p.heights[i]);list.push(id);if(i){const before=list[i-1],cost=Math.hypot(q[0]-nodes[before].p[0],q[1]-nodes[before].p[1])*.2;arcs[id].push([before,cost]);arcs[before].push([id,cost]);}}refs.set(road,list);}
 const heap=[],push=(y,id)=>{let i=heap.length;heap.push([y,id]);while(i){const p=(i-1)>>1;if(heap[p][0]<=y)break;heap[i]=heap[p];i=p;}heap[i]=[y,id];},pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;};nodes.forEach((n,i)=>push(n.y,i));while(heap.length){const [y,id]=pop();if(y>nodes[id].y+1e-9)continue;for(const [v,cost]of arcs[id])if(nodes[v].y>y+cost+1e-9){nodes[v].y=y+cost;push(nodes[v].y,v);}}
 for(const [r,p]of profiles){const list=refs.get(r);p.heights=p.heights.map((_,i)=>nodes[list[i]].y);}
}
