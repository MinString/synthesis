export const RADII=[18,24,31,39,48,58,69,81,94,108,124];
export class World {
 constructor(w=800,h=650){this.w=w;this.h=h;this.balls=[];this.merges=0;this.score=0;this.max=-1;this.nextId=1;}
 spawn(x,y,level=Math.floor(Math.random()*5)) {if(!Number.isInteger(level)||level<0||level>4)return null;const r=RADII[level];x=Math.max(r,Math.min(this.w-r,x));y=Math.max(r,Math.min(this.h-r,y));if(this.balls.some(b=>Math.hypot(b.x-x,b.y-y)<b.r+r+1))return null;return this.add(x,y,level);}
 add(x,y,level){const b={id:this.nextId++,x,y,level,r:RADII[level],vx:0,vy:0};this.balls.push(b);this.max=Math.max(this.max,level);return b;}
 step(dt=1/120){for(const b of this.balls){b.mergeAge=(b.mergeAge??1)+dt;b.vy+=1000*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.998;}
 for(let k=0;k<12;k++){
 for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
 const a=this.balls[i],b=this.balls[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),sum=a.r+b.r;if(d>sum+.05)continue;
 if(a.level===b.level&&a.level<10){const l=a.level+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2;this.balls.splice(j,1);this.balls.splice(i,1);const c=this.add(x,y,l);c.mergeAge=0;c.vx=(a.vx+b.vx)/2;c.vy=(a.vy+b.vy)/2;this.merges++;this.score+=2**(l+1);i--;break;}
 if(d<.0001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d,ia=1/(a.r*a.r),ib=1/(b.r*b.r),over=Math.max(0,sum-d);a.x-=nx*over*ia/(ia+ib);a.y-=ny*over*ia/(ia+ib);b.x+=nx*over*ib/(ia+ib);b.y+=ny*over*ib/(ia+ib);
 const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){const p=-v/(ia+ib);a.vx-=p*nx*ia;a.vy-=p*ny*ia;b.vx+=p*nx*ib;b.vy+=p*ny*ib;}
 }
 for(const b of this.balls){if(b.x<b.r){b.x=b.r;b.vx=Math.max(0,b.vx);}if(b.x>this.w-b.r){b.x=this.w-b.r;b.vx=Math.min(0,b.vx);}if(b.y<b.r){b.y=b.r;b.vy=Math.max(0,b.vy);}if(b.y>this.h-b.r){b.y=this.h-b.r;b.vy=Math.min(0,b.vy);b.vx*=.92;}}
 }
 }
}
