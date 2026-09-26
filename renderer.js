(() => {
  "use strict";

  const C = window.GAME_CONFIG;
  const W = C.width;
  const H = C.height;

  function rr(ctx,x,y,w,h,r,fill,stroke,lw=1) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x,y,w,h,r);
    else {
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    }
    if (fill) { ctx.fillStyle=fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
  }

  function ui(name) {
    return window.GameAssets && window.GameAssets.ui && window.GameAssets.ui[name];
  }

  function drawImageFit(ctx,img,x,y,w,h,alpha=1) {
    if (!img) return false;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";
    ctx.drawImage(img,x,y,w,h);
    ctx.restore();
    return true;
  }

  function drawFallbackBackground(ctx) {
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#28aef4");
    g.addColorStop(.58,"#70d2f4");
    g.addColorStop(1,"#d9f7ea");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.globalAlpha=.18;
    ctx.fillStyle="#fff";
    [[28,220,62,24],[355,280,72,28],[90,425,48,19]].forEach(([x,y,rx,ry])=>{
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();

    const hill=ctx.createLinearGradient(0,520,0,H);
    hill.addColorStop(0,"#a9e660");
    hill.addColorStop(1,"#3ca43c");
    ctx.fillStyle=hill;
    ctx.beginPath();
    ctx.moveTo(0,615); ctx.quadraticCurveTo(86,565,170,605);
    ctx.quadraticCurveTo(270,650,390,594); ctx.lineTo(390,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
  }

  function drawFallbackRamp(ctx,g) {
    ctx.save();
    ctx.translate(g.x,g.y);
    ctx.rotate(g.angle);
    ctx.shadowColor="rgba(75,42,17,.28)";
    ctx.shadowBlur=7;
    ctx.shadowOffsetY=5;
    const grad=ctx.createLinearGradient(0,-13,0,13);
    grad.addColorStop(0,"#ffe09c"); grad.addColorStop(.35,"#efba64"); grad.addColorStop(1,"#bd6d29");
    rr(ctx,-g.length/2,-14,g.length,28,14,grad,"#754019",2.5);
    ctx.restore();
  }

  function drawBackground(ctx) {
    const bg=ui("background");
    if (!drawImageFit(ctx,bg,0,0,W,H)) drawFallbackBackground(ctx);
  }

  function drawStructures(ctx) {
    if (!ui("background")) {
      drawFallbackRamp(ctx,C.geometry.leftRamp);
      drawFallbackRamp(ctx,C.geometry.rightRamp);
    }
  }

  function drawNumber(ctx,text,x,y,size,fill,stroke,width=4) {
    ctx.save();
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font=`900 ${size}px "Arial Black","PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.lineJoin="round";
    ctx.lineWidth=width;
    ctx.strokeStyle=stroke;
    ctx.strokeText(String(text),x,y);
    ctx.fillStyle=fill;
    ctx.fillText(String(text),x,y);
    ctx.restore();
  }

  function drawHud(ctx,remaining,progress,level) {
    const sign=ui("levelSign");
    if (sign) {
      drawImageFit(ctx,sign,85,8,220,73);
      if (Number(level)!==5) {
        // Cover the baked sample title and keep later levels dynamic.
        rr(ctx,130,31,130,40,12,"rgba(173,92,38,.96)",null);
        drawNumber(ctx,"第"+level+"关",195,51,25,"#ffe66f","#713312",5);
      }
    } else {
      rr(ctx,118,26,154,60,18,"#bc7435","#703815",3);
      drawNumber(ctx,"第"+level+"关",195,57,30,"#ffe26a","#713312",5);
    }

    const remain=ui("remainPanel");
    if (remain) drawImageFit(ctx,remain,8,603,94,107);
    else rr(ctx,14,607,82,96,16,"#824821","#5b2d14",3);

    const progressPanel=ui("progressPanel");
    if (progressPanel) drawImageFit(ctx,progressPanel,288,603,94,107);
    else rr(ctx,294,607,82,96,16,"#824821","#5b2d14",3);

    drawNumber(ctx,remaining,55,676,29,"#ffd938","#653316",4.5);
    drawNumber(ctx,progress+"%",335,681,26,"#fffdf4","#633317",4);
  }

  function drawTrayBase(ctx,now,dangerUntil) {
    const danger=now<dangerUntil;
    const shake=danger ? Math.sin(now*.09)*4 : 0;
    const tray=ui("tray");

    ctx.save();
    ctx.translate(shake,0);
    if (danger) {
      ctx.shadowColor="rgba(255,66,47,.78)";
      ctx.shadowBlur=18;
    } else {
      ctx.shadowColor="rgba(69,38,16,.28)";
      ctx.shadowBlur=9;
      ctx.shadowOffsetY=4;
    }

    if (tray) {
      drawImageFit(ctx,tray,103,600,184,147);
    } else {
      const box=C.visual.tray;
      const grad=ctx.createLinearGradient(0,box.y-box.h/2,0,box.y+box.h/2);
      grad.addColorStop(0,"#e6ab63"); grad.addColorStop(1,"#874723");
      rr(ctx,box.x-box.w/2,box.y-box.h/2,box.w,box.h,16,grad,"#5b2e17",3);
      C.tray.slots.forEach(x=>{
        ctx.fillStyle="#4a2b1d"; ctx.beginPath(); ctx.arc(x,C.tray.y,12,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="#d79d50"; ctx.lineWidth=1.5; ctx.stroke();
      });
    }

    ctx.restore();
  }

  function drawBottomDecor(ctx) {
    // The polished garden background already contains the ground, leaves and ramp decoration.
  }

  function drawDebug(ctx) {
    const D=window.DEBUG_GAME;
    if(D.showRampCollider){
      ctx.save();
      ctx.strokeStyle="rgba(255,45,45,.92)";
      ctx.lineWidth=2;
      [C.geometry.leftRamp,C.geometry.rightRamp].forEach(g=>{
        ctx.save();
        ctx.translate(g.x,g.y); ctx.rotate(g.angle);
        ctx.strokeRect(-g.length/2,-g.thickness/2,g.length,g.thickness);
        ctx.restore();
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
    drawBackground,
    drawStructures,
    drawHud,
    drawTrayBase,
    drawBottomDecor,
    drawDebug
  };
})();