(() => {
  "use strict";

  const C=window.GAME_CONFIG;
  const leaves=[];

  function reset(){
    leaves.length=0;
    const seeds=[
      [32,160,.10,.17,.36,1.2,.52],
      [355,185,-.07,.15,-.28,.9,.42],
      [92,315,.06,.12,.21,1.0,.34],
      [330,385,-.08,.16,-.18,1.15,.31],
      [57,495,.05,.11,.14,.85,.26],
      [302,520,-.04,.10,-.12,.95,.25]
    ];
    seeds.forEach((s,i)=>leaves.push({
      x:s[0],y:s[1],vx:s[2],vy:s[3],rot:s[4],spin:(i%2?-.0006:.0006),
      scale:s[5],alpha:s[6],phase:i*1.37
    }));
  }

  function update(dt,now){
    if(window.DEBUG_GAME.disableDecorations) return;
    for(const p of leaves){
      p.x += (p.vx + Math.sin(now*.0015+p.phase)*.025) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin*dt;
      if(p.y > C.height+20){
        p.y=-18;
        p.x=40+Math.random()*(C.width-80);
      }
      if(p.x<-20) p.x=C.width+15;
      if(p.x>C.width+20) p.x=-15;
    }
  }

  function drawLeaf(ctx,p){
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.scale,p.scale);
    ctx.globalAlpha=p.alpha;
    const g=ctx.createLinearGradient(-9,0,9,0);
    g.addColorStop(0,"#8ddd4c");
    g.addColorStop(1,"#2f923a");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(-10,0);
    ctx.quadraticCurveTo(0,-8,11,0);
    ctx.quadraticCurveTo(0,7,-10,0);
    ctx.fill();
    ctx.strokeStyle="rgba(36,104,43,.4)";
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(-7,0);
    ctx.lineTo(8,0);
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx){
    if(window.DEBUG_GAME.disableDecorations) return;
    leaves.forEach(p=>drawLeaf(ctx,p));
  }

  reset();

  window.GameEffects={reset,update,draw};
})();
