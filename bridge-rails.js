import{roadSections}from'./road-surface.js?v=grade-20261107';
// Fix one outer rail line per bridge side. Nearby lower paths cannot move it.
export function bridgeRailRuns(road,data,walkSurfaces){const sections=roadSections(road,2),walks=data.graph.edges.filter(e=>e.hostRoad===road),runs=[];
 for(const side of[-1,1]){const offsets=sections.map(s=>{let offset=s.width/2-.12;for(const e of walks){const a=data.graph.nodes[e.a],b=data.graph.nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),t=((s.x-a[0])*dx+(s.z-a[1])*dz)/(l*l);if(t<-.03||t>1.03)continue;const x=a[0]+dx*Math.max(0,Math.min(1,t)),z=a[1]+dz*Math.max(0,Math.min(1,t)),across=((x-s.x)*s.nx+(z-s.z)*s.nz)*side,along=Math.hypot(x-s.x,z-s.z);if(across>0&&along<s.width/2+7)offset=Math.max(offset,Math.min(s.width/2+5.5,across+e.width/2+.15));}return offset;});
  // Expand a necessary clearance gradually in both directions, never jagged inward teeth.
  for(let i=1;i<offsets.length;i++)offsets[i]=Math.max(offsets[i],offsets[i-1]-.18);for(let i=offsets.length-2;i>=0;i--)offsets[i]=Math.max(offsets[i],offsets[i+1]-.18);
  runs.push(sections.map((s,i)=>({x:s.x+s.nx*offsets[i]*side,z:s.z+s.nz*offsets[i]*side,offset:offsets[i],side})));
 }return runs;
}
