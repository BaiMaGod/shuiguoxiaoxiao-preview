(() => {
  "use strict";

  const C = window.GAME_CONFIG;
  const T = C.theme;
  const W = C.width;
  const H = C.height;

  function rr(ctx,x,y,w,h,r,fill,stroke,lw=1) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x,y,w,h,r);
    } else {
      ctx.moveTo(x+r,y);
      ctx.lineTo(x+w-r,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r);
      ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h);
      ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y);
    }
    if (fill) { ctx.fillStyle=fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
  }

  function leaf(ctx,x,y,s,rot=0,light=false) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    const g=ctx.createLinearGradient(-s,0,s,0);
    g.addColorStop(0, light ? "#8fe04f" : T.leafLight);
    g.addColorStop(1, light ? "#49a83b" : T.leafDark);
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(-s*.9,0);
    ctx.quadraticCurveTo(0,-s*.78,s,0);
    ctx.quadraticCurveTo(0,s*.72,-s*.9,0);
    ctx.fill();
    ctx.strokeStyle="rgba(32,103,43,.35)";
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(-s*.62,0);
    ctx.lineTo(s*.72,0);
    ctx.stroke();
    ctx.restore();
  }

  function flower(ctx,x,y,s=1) {
    ctx.save();
    ctx.translate(x,y);
    for(let i=0;i<5;i++){
      ctx.save();
      ctx.rotate(i*Math.PI*2/5);
      ctx.fillStyle="#fffdf1";
      ctx.beginPath();
      ctx.ellipse(0,-5*s,3.2*s,5.2*s,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle="#ffd84b";
    ctx.beginPath();
    ctx.arc(0,0,2.6*s,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawCloud(ctx,x,y,s=.8,a=.18) {
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle="#fff";
    [
      [-24,4,24],[0,-5,31],[26,3,23],[7,12,33],[-17,13,27]
    ].forEach(([ox,oy,r])=>{
      ctx.beginPath();
      ctx.arc(x+ox*s,y+oy*s,r*s,0,Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawSky(ctx) {
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,T.skyTop);
    g.addColorStop(.54,T.skyMiddle);
    g.addColorStop(1,T.skyBottom);
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);

    drawCloud(ctx,26,205,1.05,.11);
    drawCloud(ctx,365,265,1.1,.10);
    drawCloud(ctx,78,405,.7,.07);

    const glow=ctx.createRadialGradient(330,115,8,330,115,150);
    glow.addColorStop(0,"rgba(255,255,221,.26)");
    glow.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=glow;
    ctx.fillRect(180,0,210,280);
  }

  function treeBlob(ctx,x,y,rx,ry,c,a) {
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle=c;
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarOrchard(ctx) {
    const horizon=545;
    const hill=ctx.createLinearGradient(0,horizon-40,0,650);
    hill.addColorStop(0,"rgba(80,166,79,.12)");
    hill.addColorStop(1,"rgba(45,133,62,.28)");
    ctx.fillStyle=hill;
    ctx.beginPath();
    ctx.moveTo(0,585);
    ctx.quadraticCurveTo(80,515,170,565);
    ctx.quadraticCurveTo(265,505,390,570);
    ctx.lineTo(390,650);
    ctx.lineTo(0,650);
    ctx.closePath();
    ctx.fill();

    for(let i=0;i<13;i++){
      const x=-20+i*35;
      const y=566+(i%3)*7;
      treeBlob(ctx,x,y,34,22,i%2?"#4a9c4d":"#66af51",.18);
      treeBlob(ctx,x+13,y-16,27,25,"#79bd59",.16);
      ctx.save();
      ctx.globalAlpha=.15;
      ctx.fillStyle="#f9af37";
      ctx.beginPath();
      ctx.arc(x+((i*13)%20)-5,y-8,3,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTopDecor(ctx) {
    if (window.DEBUG_GAME.disableDecorations) return;
    ctx.save();

    ctx.strokeStyle="#7a4b27";
    ctx.lineWidth=17;
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(-25,20);
    ctx.quadraticCurveTo(35,6,84,-15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(415,5);
    ctx.quadraticCurveTo(370,16,337,-8);
    ctx.stroke();

    const left=[
      [9,24,18,.25],[30,18,16,-.45],[53,7,17,.28],[77,5,14,-.18],
      [17,50,14,.7],[66,35,16,.88]
    ];
    left.forEach(v=>leaf(ctx,...v,true));
    const right=[
      [381,20,18,2.8],[357,13,15,3.65],[337,4,16,2.9],[402,48,14,2.3],
      [362,43,14,2.1]
    ];
    right.forEach(v=>leaf(ctx,...v,true));
    flower(ctx,78,24,.8);
    flower(ctx,337,27,.75);
    ctx.restore();
  }

  function woodGradient(ctx,y1,y2) {
    const g=ctx.createLinearGradient(0,y1,0,y2);
    g.addColorStop(0,T.woodLight);
    g.addColorStop(.55,T.woodMid);
    g.addColorStop(1,T.woodDark);
    return g;
  }

  function drawWoodPlank(ctx,geo) {
    ctx.save();
    ctx.translate(geo.x,geo.y);
    ctx.rotate(geo.angle);

    ctx.shadowColor="rgba(74,48,26,.28)";
    ctx.shadowBlur=7;
    ctx.shadowOffsetY=5;
    rr(ctx,-geo.length/2,-14,geo.length,28,13,T.woodDark,T.woodEdge,2);

    ctx.shadowColor="transparent";
    const g=ctx.createLinearGradient(0,-12,0,12);
    g.addColorStop(0,"#ffe1a0");
    g.addColorStop(.35,T.woodLight);
    g.addColorStop(1,"#c98137");
    rr(ctx,-geo.length/2+2,-12,geo.length-4,22,11,g,"rgba(255,242,188,.75)",1.2);

    ctx.strokeStyle="rgba(118,72,31,.22)";
    ctx.lineWidth=1.1;
    for(let i=-geo.length/2+24;i<geo.length/2-16;i+=30){
      ctx.beginPath();
      ctx.moveTo(i,-6);
      ctx.bezierCurveTo(i+8,-9,i+18,3,i+27,1);
      ctx.stroke();
    }

    for(const x of [-geo.length/2+14,geo.length/2-14]){
      const rg=ctx.createRadialGradient(x-2,-2,1,x,0,5);
      rg.addColorStop(0,"#fff1b9");
      rg.addColorStop(.45,"#b88955");
      rg.addColorStop(1,"#71502f");
      ctx.fillStyle=rg;
      ctx.beginPath();
      ctx.arc(x,0,4.2,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRamps(ctx) {
    drawWoodPlank(ctx,C.geometry.leftRamp);
    drawWoodPlank(ctx,C.geometry.rightRamp);

    if (!window.DEBUG_GAME.disableDecorations) {
      leaf(ctx,140,613,10,.45);
      leaf(ctx,249,614,10,2.7);
      flower(ctx,143,606,.7);
      flower(ctx,247,607,.7);
    }
  }

  function drawStoneWalls(ctx) {
    const y=615;
    function wall(x,w) {
      const g=ctx.createLinearGradient(0,y,0,H);
      g.addColorStop(0,T.stoneLight);
      g.addColorStop(1,"#d2aa70");
      ctx.fillStyle=g;
      ctx.fillRect(x,y,w,H-y);

      ctx.strokeStyle="rgba(150,96,49,.46)";
      ctx.lineWidth=1.7;
      const bw=42,bh=21;
      for(let r=0;r<8;r++){
        for(let c=-1;c<5;c++){
          const ox=(r%2)*21;
          ctx.strokeRect(x+c*bw+ox,y+r*bh,bw,bh);
        }
      }
    }
    wall(0,145);
    wall(245,145);
  }

  function drawFunnel(ctx) {
    ctx.save();
    const x=153,y=608,w=84,h=63;

    ctx.shadowColor="rgba(82,45,21,.27)";
    ctx.shadowBlur=9;
    ctx.shadowOffsetY=5;
    const g=ctx.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,"#9a5c29");
    g.addColorStop(1,"#d58c3c");
    rr(ctx,x,y,w,h,12,g,T.woodEdge,3);

    ctx.fillStyle="rgba(81,44,23,.28)";
    rr(ctx,x+9,y+8,w-18,h-17,9,"rgba(91,50,26,.43)",null);

    ctx.strokeStyle="rgba(255,222,155,.28)";
    ctx.lineWidth=1.2;
    for(let yy=y+18;yy<y+h-7;yy+=14){
      ctx.beginPath();
      ctx.moveTo(x+13,yy);
      ctx.lineTo(x+w-13,yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPanel(ctx,panel,title,value,kind) {
    const {x,y,w,h}=panel;
    ctx.save();
    ctx.shadowColor="rgba(69,44,23,.24)";
    ctx.shadowBlur=8;
    ctx.shadowOffsetY=5;

    const g=ctx.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,"#c98241");
    g.addColorStop(1,"#7a4423");
    rr(ctx,x-w/2,y-h/2,w,h,15,g,"#653719",3);

    ctx.shadowColor="transparent";
    rr(ctx,x-w/2+6,y-h/2+6,w-12,h-12,11,"rgba(114,60,28,.52)","rgba(255,224,168,.32)",1);

    if(kind==="progress"){
      ctx.save();
      ctx.translate(x,y-h/2+23);
      ctx.fillStyle="#96d652";
      ctx.beginPath();
      ctx.ellipse(-4,2,15,20,-.22,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#e7ef83";
      ctx.beginPath();
      ctx.ellipse(-3,3,10,14,-.22,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#73462a";
      ctx.beginPath();
      ctx.arc(0,6,5.3,0,Math.PI*2);
      ctx.fill();
      leaf(ctx,5,-14,6,-.5,true);
      ctx.restore();
    } else {
      ctx.font='900 16px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.lineWidth=3;
      ctx.strokeStyle="#6d3e20";
      ctx.strokeText(title,x,y-h/2+22);
      ctx.fillStyle="#fff4d5";
      ctx.fillText(title,x,y-h/2+22);
    }

    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font='900 30px "Arial Black","PingFang SC",sans-serif';
    ctx.lineWidth=4;
    ctx.strokeStyle="#603718";
    ctx.strokeText(String(value),x,y+18);
    const vg=ctx.createLinearGradient(0,y+2,0,y+34);
    vg.addColorStop(0,"#fff77b");
    vg.addColorStop(.46,"#ffd62f");
    vg.addColorStop(1,"#f19114");
    ctx.fillStyle=kind==="progress" ? "#fffdf2" : vg;
    ctx.fillText(String(value),x,y+18);

    ctx.restore();
  }

  function drawLevelSign(ctx,level) {
    const s=C.visual.levelSign;
    ctx.save();

    ctx.strokeStyle="#8b572a";
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(s.x-42,0);
    ctx.lineTo(s.x-42,s.y-s.h/2+7);
    ctx.moveTo(s.x+42,0);
    ctx.lineTo(s.x+42,s.y-s.h/2+7);
    ctx.stroke();

    ctx.shadowColor="rgba(72,43,22,.27)";
    ctx.shadowBlur=9;
    ctx.shadowOffsetY=5;
    const g=ctx.createLinearGradient(0,s.y-s.h/2,0,s.y+s.h/2);
    g.addColorStop(0,"#e8ac58");
    g.addColorStop(1,"#a9632d");
    rr(ctx,s.x-s.w/2,s.y-s.h/2,s.w,s.h,18,g,"#78401e",3);
    ctx.shadowColor="transparent";

    ctx.strokeStyle="rgba(101,55,25,.25)";
    ctx.lineWidth=1.2;
    for(let i=-55;i<55;i+=25){
      ctx.beginPath();
      ctx.moveTo(s.x+i,s.y-17);
      ctx.bezierCurveTo(s.x+i+10,s.y-22,s.x+i+17,s.y+12,s.x+i+24,s.y+14);
      ctx.stroke();
    }

    leaf(ctx,s.x-s.w/2+11,s.y-s.h/2+5,10,.6,true);
    leaf(ctx,s.x+s.w/2-11,s.y-s.h/2+5,10,2.5,true);
    flower(ctx,s.x+s.w/2-23,s.y-s.h/2+7,.75);

    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font='900 31px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.lineWidth=6;
    ctx.strokeStyle="#774522";
    ctx.strokeText("第"+level+"关",s.x,s.y+2);
    const tg=ctx.createLinearGradient(0,s.y-18,0,s.y+20);
    tg.addColorStop(0,"#fff8d2");
    tg.addColorStop(.58,"#ffe37b");
    tg.addColorStop(1,"#f5b62e");
    ctx.fillStyle=tg;
    ctx.fillText("第"+level+"关",s.x,s.y+2);
    ctx.restore();
  }

  function drawTrayBase(ctx,now,dangerUntil) {
    const box=C.visual.tray;
    const danger=now<dangerUntil;
    const shake=danger?Math.sin(now*.09)*4:0;

    ctx.save();
    ctx.translate(shake,0);
    if(danger){
      ctx.shadowColor="rgba(255,66,47,.72)";
      ctx.shadowBlur=16;
    } else {
      ctx.shadowColor="rgba(72,43,20,.28)";
      ctx.shadowBlur=9;
      ctx.shadowOffsetY=5;
    }

    const g=ctx.createLinearGradient(0,box.y-box.h/2,0,box.y+box.h/2);
    g.addColorStop(0,"#e3a75e");
    g.addColorStop(1,"#8f5229");
    rr(ctx,box.x-box.w/2,box.y-box.h/2,box.w,box.h,16,g,T.woodEdge,3.2);
    ctx.shadowColor="transparent";
    rr(ctx,box.x-box.w/2+7,box.y-box.h/2+8,box.w-14,box.h-16,11,"#75462a","rgba(255,223,156,.45)",1.5);

    C.tray.slots.forEach(x=>{
      const rg=ctx.createRadialGradient(x-3,C.tray.y-4,1,x,C.tray.y,14);
      rg.addColorStop(0,"rgba(242,199,117,.34)");
      rg.addColorStop(.58,"rgba(101,62,36,.50)");
      rg.addColorStop(1,"rgba(52,31,21,.78)");
      ctx.fillStyle=rg;
      ctx.beginPath();
      ctx.arc(x,C.tray.y,12,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle="rgba(255,213,135,.42)";
      ctx.lineWidth=1.4;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawBottomDecor(ctx) {
    if (window.DEBUG_GAME.disableDecorations) return;
    const y=C.visual.grassY;

    const grass=ctx.createLinearGradient(0,y,0,H);
    grass.addColorStop(0,"rgba(117,207,69,.86)");
    grass.addColorStop(1,"rgba(40,126,44,.96)");
    ctx.fillStyle=grass;
    ctx.fillRect(0,y,W,H-y);

    ctx.save();
    for(let x=0;x<W;x+=9){
      ctx.strokeStyle=x%18===0 ? "#74cb47" : "#4ca53a";
      ctx.lineWidth=1.6;
      ctx.beginPath();
      ctx.moveTo(x,H);
      ctx.quadraticCurveTo(x-3,H-26-(x%4)*3,x+2,H-45-(x%5)*2);
      ctx.stroke();
    }
    ctx.restore();

    // left crate
    rr(ctx,-13,781,91,73,9,"#b76d34","#77401f",3);
    ctx.strokeStyle="rgba(90,49,24,.4)";
    ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(-3,801); ctx.lineTo(74,801); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3,829); ctx.lineTo(74,829); ctx.stroke();

    // right crate
    rr(ctx,312,779,92,75,9,"#b76d34","#77401f",3);
    ctx.strokeStyle="rgba(90,49,24,.38)";
    ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(318,801); ctx.lineTo(398,801); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(318,829); ctx.lineTo(398,829); ctx.stroke();
    ctx.fillStyle="rgba(103,55,25,.65)";
    ctx.textAlign="center";
    ctx.font='800 11px Arial,sans-serif';
    ctx.fillText("FRESH",357,808);
    ctx.fillText("FRUITS",357,822);

    flower(ctx,18,774,.7);
    flower(ctx,298,791,.55);
    flower(ctx,286,826,.65);
    leaf(ctx,72,778,11,.2,true);
    leaf(ctx,315,780,10,2.9,true);
  }

  function drawHud(ctx,remaining,progress,level) {
    drawLevelSign(ctx,level);
    drawPanel(ctx,C.visual.remainPanel,"剩余",remaining,"remain");
    drawPanel(ctx,C.visual.progressPanel,"",progress+"%","progress");
  }

  function drawDebug(ctx) {
    const D=window.DEBUG_GAME;
    if(D.showRampCollider){
      ctx.save();
      ctx.strokeStyle="rgba(255,45,45,.92)";
      ctx.lineWidth=2;
      [C.geometry.leftRamp,C.geometry.rightRamp].forEach(g=>{
        ctx.translate(g.x,g.y);
        ctx.rotate(g.angle);
        ctx.strokeRect(-g.length/2,-g.thickness/2,g.length,g.thickness);
        ctx.rotate(-g.angle);
        ctx.translate(-g.x,-g.y);
      });
      ctx.restore();
    }
    if(D.showCaptureZone){
      const z=C.geometry.chute;
      ctx.save();
      ctx.fillStyle="rgba(46,255,89,.18)";
      ctx.strokeStyle="rgba(0,210,60,.9)";
      ctx.lineWidth=2;
      ctx.fillRect(z.xMin,z.captureY,z.xMax-z.xMin,45);
      ctx.strokeRect(z.xMin,z.captureY,z.xMax-z.xMin,45);
      ctx.restore();
    }
  }

  window.GameRenderer={
    drawBackground(ctx){
      drawSky(ctx);
      drawFarOrchard(ctx);
      drawTopDecor(ctx);
    },
    drawStructures(ctx){
      drawStoneWalls(ctx);
      drawRamps(ctx);
      drawFunnel(ctx);
    },
    drawHud,
    drawTrayBase,
    drawBottomDecor,
    drawDebug
  };
})();
