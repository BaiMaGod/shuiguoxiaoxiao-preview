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

  function drawNumber(ctx,text,x,y,size,fill,stroke,width=4) {
    ctx.save();
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.font="900 "+size+"px \"Arial Black\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif";
    ctx.lineJoin="round";
    ctx.lineWidth=width;
    ctx.strokeStyle=stroke;
    ctx.strokeText(String(text),x,y);
    ctx.fillStyle=fill;
    ctx.fillText(String(text),x,y);
    ctx.restore();
  }

  function drawBackground(ctx) {
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#38b8f4");
    g.addColorStop(.55,"#8edcf5");
    g.addColorStop(.78,"#dff8df");
    g.addColorStop(1,"#75c84c");
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.globalAlpha=.62;
    ctx.fillStyle="#fff";
    [[48,184,47,18],[342,230,55,20],[103,335,36,14]].forEach(([x,y,rx,ry])=>{
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();

    ctx.fillStyle="#67bc43";
    ctx.beginPath();
    ctx.moveTo(0,705);
    ctx.quadraticCurveTo(75,675,148,707);
    ctx.quadraticCurveTo(245,743,390,694);
    ctx.lineTo(390,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();

    ctx.fillStyle="#4aa137";
    ctx.beginPath();
    ctx.moveTo(0,742);
    ctx.quadraticCurveTo(95,717,190,746);
    ctx.quadraticCurveTo(290,770,390,734);
    ctx.lineTo(390,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();

    if (!window.DEBUG_GAME.disableDecorations) {
      ctx.save();
      ctx.globalAlpha=.75;
      for (const [x,y,s] of [[22,679,1],[367,665,.9],[188,720,.7]]) {
        ctx.save();
        ctx.translate(x,y); ctx.scale(s,s);
        ctx.fillStyle="#2f8c38";
        ctx.beginPath(); ctx.ellipse(-8,0,10,22,-.55,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8,0,10,22,.55,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawStructures() {
    // V2.4: removed the old ramps, chute and tray entirely.
  }

  function drawHud(ctx,remaining,progress,level) {
    rr(ctx,126,16,138,52,18,"rgba(126,76,35,.92)","#6d3b1c",3);
    drawNumber(ctx,"第"+level+"关",195,42,25,"#ffe36a","#713312",4.5);

    rr(ctx,12,86,88,44,15,"rgba(87,60,31,.82)","rgba(255,242,194,.55)",2);
    rr(ctx,290,86,88,44,15,"rgba(87,60,31,.82)","rgba(255,242,194,.55)",2);
    ctx.save();
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.font='800 11px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle="#fff1c4";
    ctx.fillText("剩余",56,99); ctx.fillText("进度",334,99);
    ctx.restore();
    drawNumber(ctx,remaining,56,117,19,"#ffd843","#653316",3);
    drawNumber(ctx,progress+"%",334,117,17,"#fffdf4","#633317",3);
  }

  function monkeyPose(now, index, fx) {
    if (!fx || fx.bowMonkey !== index || now >= fx.bowUntil) return {rot:0, dy:0};
    const duration=C.monkeys.bowDuration;
    const t=Math.max(0,Math.min(1,(now-fx.bowStart)/duration));
    const wave=Math.sin(t*Math.PI);
    return {rot:(index===0?1:-1)*wave*.17, dy:wave*7};
  }

  function drawMonkey(ctx,now,index,fx) {
    const cx=C.monkeys.centers[index];
    const baseY=C.monkeys.groundY-9;
    const pose=monkeyPose(now,index,fx);
    const worried=fx && now<fx.dangerUntil;
    const handA=index*2;
    const handB=handA+1;

    ctx.save();
    ctx.translate(cx,baseY); ctx.rotate(pose.rot); ctx.translate(-cx,-baseY+pose.dy);

    ctx.fillStyle="rgba(45,55,34,.20)";
    ctx.beginPath(); ctx.ellipse(cx,baseY+18,49,12,0,0,Math.PI*2); ctx.fill();

    ctx.strokeStyle="#8b542d"; ctx.lineWidth=11; ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(cx+(index===0?23:-23),baseY-18);
    ctx.quadraticCurveTo(cx+(index===0?62:-62),baseY-40,cx+(index===0?48:-48),baseY-76);
    ctx.stroke();

    ctx.strokeStyle="#75421f"; ctx.lineWidth=14;
    ctx.beginPath(); ctx.moveTo(cx-17,baseY-6); ctx.lineTo(cx-22,baseY+15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+17,baseY-6); ctx.lineTo(cx+22,baseY+15); ctx.stroke();

    const body=ctx.createLinearGradient(cx,baseY-92,cx,baseY);
    body.addColorStop(0,"#a86a37"); body.addColorStop(1,"#75411f");
    ctx.fillStyle=body;
    ctx.beginPath(); ctx.ellipse(cx,baseY-43,38,52,0,0,Math.PI*2); ctx.fill();

    const shoulderY=baseY-58;
    const handY=C.monkeys.handY;
    [handA,handB].forEach((h,local)=>{
      const hx=C.monkeys.hands[h];
      ctx.strokeStyle="#8b542d"; ctx.lineWidth=14; ctx.lineCap="round";
      ctx.beginPath();
      ctx.moveTo(cx+(local===0?-24:24),shoulderY);
      ctx.quadraticCurveTo((cx+hx)/2,shoulderY-8,hx,handY);
      ctx.stroke();
      ctx.fillStyle="#d49a62";
      ctx.beginPath(); ctx.arc(hx,handY,10.5,0,Math.PI*2); ctx.fill();
    });

    ctx.fillStyle="#8b542d";
    ctx.beginPath(); ctx.arc(cx-29,baseY-103,17,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+29,baseY-103,17,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#b87943";
    ctx.beginPath(); ctx.arc(cx,baseY-102,36,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#e8bd88";
    ctx.beginPath(); ctx.ellipse(cx,baseY-96,25,24,0,0,Math.PI*2); ctx.fill();

    ctx.strokeStyle="#332116"; ctx.lineWidth=3; ctx.lineCap="round";
    if (worried) {
      ctx.beginPath(); ctx.moveTo(cx-15,baseY-108); ctx.lineTo(cx-6,baseY-104); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+6,baseY-104); ctx.lineTo(cx+15,baseY-108); ctx.stroke();
    } else {
      ctx.fillStyle="#332116";
      ctx.beginPath(); ctx.arc(cx-10,baseY-106,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+10,baseY-106,3,0,Math.PI*2); ctx.fill();
    }

    ctx.strokeStyle="#5b301e"; ctx.lineWidth=3;
    ctx.beginPath();
    if (worried) ctx.arc(cx,baseY-88,7,Math.PI,Math.PI*2);
    else ctx.arc(cx,baseY-93,8,.12*Math.PI,.88*Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  function drawMonkeys(ctx,now,fx) {
    drawMonkey(ctx,now,0,fx);
    drawMonkey(ctx,now,1,fx);

    if (fx && now < fx.thanksUntil && fx.bowMonkey >= 0) {
      const cx=C.monkeys.centers[fx.bowMonkey];
      const bubbleY=C.monkeys.handY-86;
      rr(ctx,cx-34,bubbleY-17,68,30,14,"rgba(255,255,255,.94)","rgba(112,73,40,.28)",1.5);
      ctx.save();
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.font='900 14px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillStyle="#7a4b27";
      ctx.fillText("谢谢！",cx,bubbleY-2);
      ctx.restore();
    }

    if (window.DEBUG_GAME.showHandNumbers) {
      ctx.save(); ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      C.monkeys.hands.forEach((x,i)=>{
        ctx.fillStyle='rgba(30,30,30,.75)'; ctx.beginPath(); ctx.arc(x,C.monkeys.handY-25,10,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.fillText(String(i+1),x,C.monkeys.handY-25);
      });
      ctx.restore();
    }
  }

  function drawBottomDecor() {}
  function drawDebug() {}

  window.GameRenderer={
    drawBackground,
    drawStructures,
    drawHud,
    drawMonkeys,
    drawBottomDecor,
    drawDebug
  };
})();
