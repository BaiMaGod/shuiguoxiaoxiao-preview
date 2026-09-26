(() => {
  'use strict';

  const { Engine, World, Bodies, Body, Sleeping } = Matter;
  const C = window.GAME_CONFIG;
  const DEBUG = window.DEBUG_GAME;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = C.width;
  const H = C.height;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const FRUIT_STATE = Object.freeze({
    BOARD: 'board',
    FALLING: 'falling',
    TO_TRAY: 'toTray',
    CLEARED: 'cleared'
  });

  const TRAY_STATE = Object.freeze({
    FLYING: 'flying',
    IDLE: 'idle',
    CLEARING: 'clearing',
    SLIDING: 'sliding'
  });

  const ui = {
    remain: document.getElementById('remainCount'),
    progress: document.getElementById('progressText'),
    overlay: document.getElementById('resultOverlay'),
    title: document.getElementById('resultTitle'),
    desc: document.getElementById('resultDesc'),
    emoji: document.getElementById('resultEmoji'),
    toast: document.getElementById('toast'),
    loading: document.getElementById('loadingOverlay')
  };

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = C.physics.gravityY;
  engine.gravity.scale = C.physics.gravityScale;
  const world = engine.world;

  let fruits = [];
  let tray = [];
  let particles = [];
  let boundaries = [];
  let nextFruitId = 1;
  let nextRenderOrder = 1;
  let total = 0;
  let clearedCount = 0;
  let gameEnded = false;
  let toastTimer = 0;
  let audioCtx = null;
  let activePair = null;
  let pairBusy = false;
  let trayDangerUntil = 0;
  let pendingLoseAt = 0;
  let lastTime = performance.now();
  let boardShift = null;
  let lastBoardShiftAt = 0;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function fruitMeta(type) {
    return C.fruitMeta[type] || C.fruitMeta.orange;
  }

  function getLevelFruitCount(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const fixed = C.board.fruitCountByLevel || [];
    let count = fixed[safeLevel];

    if (!Number.isFinite(count)) {
      const base = fixed[5] || fixed[fixed.length - 1] || 80;
      count = base + Math.max(0, safeLevel - 5) * (C.board.fruitGrowthAfter5 || 8);
    }

    count = Math.min(C.board.maxFruitCount || 96, Math.max(2, Math.floor(count)));
    if (count % 2 !== 0) count -= 1;
    return count;
  }

  function getBoardLayout(level, totalCount) {
    const dense = Number(level) >= 2;
    const cols = C.board.cols;
    const rows = Math.ceil(totalCount / cols);
    return {
      dense,
      cols,
      rows,
      bottomY: dense ? C.board.denseBottomY : C.board.level1BottomY,
      spacingX: dense ? C.board.denseSpacingX : C.board.level1SpacingX,
      spacingY: dense ? C.board.denseSpacingY : C.board.level1SpacingY,
      staggerX: dense ? C.board.denseStaggerX : C.board.level1StaggerX
    };
  }

  function setupBoundaries() {
    boundaries.forEach(b => World.remove(world, b));
    boundaries = [];

    const add = body => {
      boundaries.push(body);
      World.add(world, body);
      return body;
    };

    add(Bodies.rectangle(-12, 330, 24, 700, { isStatic:true, friction:.4 }));
    add(Bodies.rectangle(W + 12, 330, 24, 700, { isStatic:true, friction:.4 }));

    const leftRamp = C.geometry.leftRamp;
    const rightRamp = C.geometry.rightRamp;

    add(Bodies.rectangle(
      leftRamp.x,
      leftRamp.y,
      leftRamp.length,
      leftRamp.thickness,
      {
        isStatic:true,
        angle:leftRamp.angle,
        friction:C.physics.rampFriction,
        restitution:0.02
      }
    ));

    add(Bodies.rectangle(
      rightRamp.x,
      rightRamp.y,
      rightRamp.length,
      rightRamp.thickness,
      {
        isStatic:true,
        angle:rightRamp.angle,
        friction:C.physics.rampFriction,
        restitution:0.02
      }
    ));

    // 不在中央收集口放竖直物理墙。
    // 旧实现的两根墙会挡住斜坡末端，导致水果在入口永久卡死。
    // 水果进入漏斗口后直接切换到槽位动画，因此这里只保留视觉通道。

    add(Bodies.rectangle(W / 2, 760, 92, 12, {
      isStatic:true,
      friction:0.18,
      restitution:0
    }));
  }

  function buildLevel() {
    fruits.forEach(f => {
      if (f.body) World.remove(world, f.body);
    });

    fruits = [];
    tray = [];
    particles = [];
    activePair = null;
    pairBusy = false;
    pendingLoseAt = 0;
    trayDangerUntil = 0;
    clearedCount = 0;
    gameEnded = false;
    nextFruitId = 1;
    nextRenderOrder = 1;
    boardShift = null;
    lastBoardShiftAt = 0;
    ui.overlay.classList.add('hidden');
    if (window.GameEffects && GameEffects.reset) GameEffects.reset();

    const targetCount = getLevelFruitCount(C.level);
    const types = [];
    const pairCount = targetCount / 2;

    // 按“水果对”生成，而不是单纯随机单颗生成，避免高数量关卡出现奇数残单。
    for (let i = 0; i < pairCount; i++) {
      const type = C.fruitTypes[i % C.fruitTypes.length];
      types.push(type, type);
    }
    shuffle(types);
    total = types.length;

    const layout = getBoardLayout(C.level, total);
    let index = 0;
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        if (index >= types.length) break;

        const stagger = row % 2 ? layout.staggerX : 0;
        const baseX = C.board.startX + col * layout.spacingX + stagger;
        const x = Math.min(
          W - 27,
          Math.max(27, baseX + (Math.random() - .5) * C.board.randomX)
        );

        // 从“最下方锚点”向上排布。第 2 关起水果更多、更密，
        // 高关卡的最上方若超出屏幕，会作为储备层在后续下压时进入画面。
        const baseY = layout.bottomY - (layout.rows - 1 - row) * layout.spacingY;
        const y = baseY + (Math.random() - .5) * C.board.randomY;
        createFruit(types[index++], x, y);
      }
    }

    updateHud();
  }

  function createFruit(type, x, y) {
    const meta = fruitMeta(type);
    const radius = meta.radius + (Math.random() - .5) * .9;
    // 不能直接用 { isStatic:true } 创建后再解除静态。
    // Matter.js 0.20 在这种路径下没有可恢复的有限质量/惯量，
    // Body.setStatic(false) 后会导致物理位置变成 NaN。
    // 正确做法：先创建正常动态刚体，再切成 static，让 Matter 保存原始物理属性。
    const body = Bodies.circle(x, y, radius, {
      restitution:C.physics.restitution,
      friction:C.physics.friction,
      frictionStatic:C.physics.frictionStatic,
      density:C.physics.density,
      sleepThreshold:C.physics.sleepThreshold
    });
    Body.setStatic(body, true);

    const item = {
      id: nextFruitId++,
      type,
      body,
      radius,
      visualRadius: meta.visual,
      state: FRUIT_STATE.BOARD,
      renderOrder: nextRenderOrder++,
      visual: {
        pressStart:0,
        blockedUntil:0,
        glowUntil:0,
        alpha:1
      },
      lastX:x,
      lastY:y,
      lastMoveTime:performance.now()
    };

    body.plugin.fruit = item;
    fruits.push(item);
    World.add(world, body);
  }

  function releaseFruit(item, kick = true) {
    if (!item || gameEnded || item.state !== FRUIT_STATE.BOARD) return;

    item.state = FRUIT_STATE.FALLING;
    item.renderOrder = nextRenderOrder++;
    item.visual.pressStart = performance.now();
    item.lastMoveTime = performance.now();
    item.lastX = item.body.position.x;
    item.lastY = item.body.position.y;
    Body.setStatic(item.body, false);
    if (Sleeping && Sleeping.set) Sleeping.set(item.body, false);
    Body.setVelocity(item.body, { x:0, y:0 });
    Body.setAngularVelocity(item.body, (Math.random() - .5) * .035);

    if (kick) {
      Body.applyForce(item.body, item.body.position, {
        x:(Math.random() - .5) * .00008,
        y:.00010
      });
    }

    ping(390, .035, .024);
  }

  function remainingCount() {
    return fruits.reduce((n, f) => n + (f.state === FRUIT_STATE.CLEARED ? 0 : 1), 0);
  }

  function updateHud() {
    ui.remain.textContent = remainingCount();
    ui.progress.textContent = Math.round((clearedCount / Math.max(1, total)) * 100) + '%';
  }

  function circleIntersectionRatio(target, other) {
    const r1 = target.visualRadius;
    const r2 = other.visualRadius;
    const dx = target.body.position.x - other.body.position.x;
    const dy = target.body.position.y - other.body.position.y;
    const d = Math.hypot(dx, dy);

    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) {
      const smallArea = Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
      return Math.min(1, smallArea / (Math.PI * r1 * r1));
    }

    const a1 = Math.acos((d*d + r1*r1 - r2*r2) / (2*d*r1));
    const a2 = Math.acos((d*d + r2*r2 - r1*r1) / (2*d*r2));
    const area = r1*r1*a1 + r2*r2*a2 - .5 * Math.sqrt(
      Math.max(0, (-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2))
    );
    return area / (Math.PI * r1 * r1);
  }

  function isFruitExposed(target) {
    if (DEBUG.allFruitsClickable) return true;
    if (!target || target.state !== FRUIT_STATE.BOARD) return false;

    for (const other of fruits) {
      if (other === target || other.state !== FRUIT_STATE.BOARD) continue;
      if (other.renderOrder <= target.renderOrder) continue;
      if (circleIntersectionRatio(target, other) >= C.board.blockedCoverRatio) return false;
    }
    return true;
  }

  function findFruitAtPoint(x, y) {
    const candidates = fruits.filter(f => {
      if (f.state !== FRUIT_STATE.BOARD) return false;
      const dx = x - f.body.position.x;
      const dy = y - f.body.position.y;
      const hitR = f.visualRadius * C.board.hitScale;
      return dx*dx + dy*dy <= hitR*hitR;
    });

    candidates.sort((a, b) => b.renderOrder - a.renderOrder);
    return candidates[0] || null;
  }

  function blockedFeedback(fruit) {
    fruit.visual.blockedUntil = performance.now() + 360;
    showToast('先移开上面的水果');
    ping(150, .06, .025);
  }

  function onPointerDown(e) {
    if (gameEnded) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    if (y > 610) return;

    const fruit = findFruitAtPoint(x, y);
    if (!fruit) return;
    if (!isFruitExposed(fruit)) {
      blockedFeedback(fruit);
      return;
    }

    releaseFruit(fruit);
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive:true });

  function collectFruit(fruit) {
    if (gameEnded || fruit.state !== FRUIT_STATE.FALLING) return;
    if (tray.length >= C.tray.capacity) return;

    const p = fruit.body.position;
    fruit.state = FRUIT_STATE.TO_TRAY;
    World.remove(world, fruit.body);

    const slotIndex = tray.length;
    const now = performance.now();
    tray.push({
      id:fruit.id,
      source:fruit,
      type:fruit.type,
      state:TRAY_STATE.FLYING,
      x:p.x,
      y:p.y,
      fromX:p.x,
      fromY:p.y,
      targetX:C.tray.slots[slotIndex],
      targetY:C.tray.y,
      moveStart:now,
      moveDuration:C.tray.flyDuration,
      scale:1,
      alpha:1,
      clearStart:0
    });

    burst(p.x, p.y, fruit.type, 7);
    updateHud();
    ping(610, .045, .03);
  }

  function findTrayPair() {
    // 4 槽二消：只有相邻两个相同水果才消除。
    // 这样槽位顺序本身才有策略意义。
    for (let i = 0; i < tray.length - 1; i++) {
      const a = tray[i];
      const b = tray[i + 1];
      if (
        a.state === TRAY_STATE.IDLE &&
        b.state === TRAY_STATE.IDLE &&
        a.type === b.type
      ) {
        return [a, b];
      }
    }
    return null;
  }

  function trayIsStable() {
    return tray.every(item => item.state === TRAY_STATE.IDLE);
  }

  function resolveTray() {
    if (gameEnded || pairBusy || !trayIsStable()) return;

    const pair = findTrayPair();
    if (pair) {
      pairBusy = true;
      activePair = pair;
      const now = performance.now();
      pair.forEach(item => {
        item.state = TRAY_STATE.CLEARING;
        item.clearStart = now;
      });
      ping(760, .05, .028);
      return;
    }

    if (clearedCount >= total) {
      finish(true);
      return;
    }

    if (tray.length >= C.tray.capacity && !DEBUG.disableGameOver && !pendingLoseAt) {
      const now = performance.now();
      trayDangerUntil = now + 560;
      pendingLoseAt = now + 560;
      ping(120, .12, .045);
    }
  }

  function relayoutTray(now = performance.now()) {
    tray.forEach((item, index) => {
      item.fromX = item.x;
      item.fromY = item.y;
      item.targetX = C.tray.slots[index];
      item.targetY = C.tray.y;
      item.moveStart = now;
      item.moveDuration = C.tray.slideDuration;
      item.scale = 1;
      item.alpha = 1;
      item.state = TRAY_STATE.SLIDING;
    });
  }

  function finalizePair(pair) {
    pair.forEach(item => {
      burst(item.x, item.y, item.type, 15);
      item.source.state = FRUIT_STATE.CLEARED;
      clearedCount += 1;
    });
    tray = tray.filter(item => !pair.includes(item));
    activePair = null;
    pairBusy = false;
    pendingLoseAt = 0;
    trayDangerUntil = 0;
    updateHud();
    ping(980, .075, .045);

    if (tray.length) relayoutTray();
    else resolveTray();
  }

  function updateTrayAnimations(now) {
    let becameStable = false;

    for (const item of tray) {
      if (item.state === TRAY_STATE.FLYING || item.state === TRAY_STATE.SLIDING) {
        const t = clamp01((now - item.moveStart) / item.moveDuration);
        const eased = item.state === TRAY_STATE.FLYING ? easeOutBack(t) : easeOutCubic(t);
        item.x = lerp(item.fromX, item.targetX, eased);
        item.y = lerp(item.fromY, item.targetY, eased);

        if (item.state === TRAY_STATE.FLYING) {
          if (t < .65) {
            item.scale = lerp(1.16, .95, t / .65);
          } else {
            item.scale = 1 + Math.sin(((t - .65) / .35) * Math.PI) * .12;
          }
        } else {
          item.scale = 1;
        }
        if (t >= 1) {
          item.x = item.targetX;
          item.y = item.targetY;
          item.state = TRAY_STATE.IDLE;
          item.scale = 1;
          becameStable = true;
          ping(560, .03, .018);
        }
      } else if (item.state === TRAY_STATE.CLEARING) {
        const t = clamp01((now - item.clearStart) / C.tray.clearDuration);
        item.scale = 1 + Math.sin(t * Math.PI) * .28;
        item.alpha = 1 - Math.max(0, (t - .42) / .58);

        if (activePair && activePair.length === 2) {
          const centerX = (activePair[0].targetX + activePair[1].targetX) / 2;
          item.x = lerp(item.targetX, centerX, Math.sin(t * Math.PI) * .18);
        }
      }
    }

    if (activePair) {
      const done = activePair.every(item => now - item.clearStart >= C.tray.clearDuration);
      if (done) {
        finalizePair(activePair.slice());
        return;
      }
    }

    if (becameStable && trayIsStable()) resolveTray();
  }

  function startBoardShift(now) {
    if (Number(C.level) < 2 || boardShift || gameEnded) return;
    if (now - lastBoardShiftAt < C.board.scrollCooldown) return;

    const still = fruits.filter(f => f.state === FRUIT_STATE.BOARD && f.body);
    if (!still.length) return;

    const lowestY = Math.max(...still.map(f => f.body.position.y));
    if (lowestY >= C.board.scrollTriggerY) return;

    const dy = C.board.scrollTargetY - lowestY;
    if (dy <= 1) return;

    boardShift = {
      start: now,
      duration: C.board.scrollDuration,
      items: still.map(f => ({
        fruit: f,
        fromX: f.body.position.x,
        fromY: f.body.position.y,
        toY: f.body.position.y + dy
      }))
    };
    lastBoardShiftAt = now;
  }

  function updateBoardShift(now) {
    if (!boardShift) {
      startBoardShift(now);
      return;
    }

    const t = clamp01((now - boardShift.start) / boardShift.duration);
    const eased = easeOutCubic(t);

    boardShift.items.forEach(item => {
      const fruit = item.fruit;
      if (!fruit || fruit.state !== FRUIT_STATE.BOARD || !fruit.body) return;
      Body.setPosition(fruit.body, {
        x: item.fromX,
        y: lerp(item.fromY, item.toY, eased)
      });
    });

    if (t >= 1) {
      boardShift = null;
    }
  }

  function checkFruitCollection() {
    if (gameEnded) return;
    for (const fruit of fruits) {
      if (fruit.state !== FRUIT_STATE.FALLING) continue;
      const p = fruit.body.position;
      if (
        p.y > C.geometry.chute.captureY &&
        p.x > C.geometry.chute.xMin &&
        p.x < C.geometry.chute.xMax &&
        tray.length < C.tray.capacity
      ) {
        // 水果一进入中央收集口，就由物理世界切换到槽位动画。
        // 不再要求它穿完整条狭窄通道，避免两个水果在入口互相卡死。
        collectFruit(fruit);
      } else if (p.y > H + 80) {
        Body.setPosition(fruit.body, { x:W/2 + (Math.random() - .5) * 24, y:620 });
        Body.setVelocity(fruit.body, { x:0, y:0 });
      }
    }
  }

  function checkStuckFruits(now) {
    for (const fruit of fruits) {
      if (fruit.state !== FRUIT_STATE.FALLING || !fruit.body) continue;
      const p = fruit.body.position;
      const moved = Math.abs(p.x - fruit.lastX) + Math.abs(p.y - fruit.lastY);
      if (moved > 1.5) {
        fruit.lastX = p.x;
        fruit.lastY = p.y;
        fruit.lastMoveTime = now;
        continue;
      }

      if (now - fruit.lastMoveTime > 1800 && p.y < 688) {
        if (Sleeping && Sleeping.set) Sleeping.set(fruit.body, false);
        Body.setVelocity(fruit.body, {
          x:(Math.random() - .5) * .28,
          y:.20
        });
        fruit.lastMoveTime = now;
      }
    }
  }

  function checkPendingGameOver(now) {
    if (pendingLoseAt && now >= pendingLoseAt && !gameEnded) {
      pendingLoseAt = 0;
      finish(false);
    }
  }

  function finish(win) {
    if (gameEnded) return;
    gameEnded = true;
    ui.emoji.textContent = win ? '🎉' : '😵';
    ui.title.textContent = win ? '过关啦！' : '槽位满了';
    ui.desc.textContent = win
      ? '所有水果都成功配对消除了。'
      : '4 个槽位被不同水果占满了，换个顺序再试试。';
    setTimeout(() => ui.overlay.classList.remove('hidden'), 220);
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#52afe6');
    sky.addColorStop(.58, '#67c8f2');
    sky.addColorStop(.76, '#cdf9f9');
    sky.addColorStop(1, '#87e1f1');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#fff';
    [[58,230,56],[85,255,64],[37,262,45],[112,275,40],[335,245,52]].forEach(([x,y,r]) => {
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    });
    ctx.restore();

    drawBuilding(0, 615, 150, false);
    drawBuilding(240, 615, 150, true);
    drawRampArtwork();
    drawChute();

    ctx.fillStyle = 'rgba(255,255,255,.58)';
    ctx.font = '7px sans-serif';
    ctx.fillText('VERSION:' + C.version, 54, 10);
  }

  function drawBuilding(x, y, w, mirror) {
    ctx.save();
    const wall = ctx.createLinearGradient(x, y, x, H);
    wall.addColorStop(0, '#f2dca8');
    wall.addColorStop(1, '#ddbd82');
    ctx.fillStyle = wall;
    ctx.fillRect(x, y, w, H-y);

    ctx.strokeStyle = 'rgba(179,128,72,.60)';
    ctx.lineWidth = 2;
    const bw = 42;
    const bh = 22;
    for (let r = 0; r < 7; r++) {
      for (let c = -1; c < 5; c++) {
        const ox = (r % 2) * 21;
        ctx.strokeRect(x + c * bw + ox, y + r * bh, bw, bh);
      }
    }

    const doorX = mirror ? x + 72 : x + 8;
    roundRect(doorX, 730, 70, 114, 10, '#71482c', '#a67b52', 4);
    ctx.restore();
  }

  function drawRampArtwork() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#bd7d31';
    ctx.beginPath(); ctx.moveTo(-8,548); ctx.lineTo(151,621); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(398,548); ctx.lineTo(239,621); ctx.stroke();

    ctx.lineWidth = 16;
    const g = ctx.createLinearGradient(0,540,0,620);
    g.addColorStop(0,'#fff0b3');
    g.addColorStop(1,'#f1b54d');
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.moveTo(-8,548); ctx.lineTo(151,621); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(398,548); ctx.lineTo(239,621); ctx.stroke();
    ctx.restore();
  }

  function drawChute() {
    const g = ctx.createLinearGradient(0,620,0,735);
    g.addColorStop(0,'#7b4b22');
    g.addColorStop(1,'#d6933f');
    ctx.fillStyle = g;
    ctx.fillRect(158,620,74,115);

    ctx.strokeStyle = 'rgba(112,67,32,.55)';
    ctx.lineWidth = 2;
    for (let y = 632; y < 735; y += 22) {
      ctx.beginPath(); ctx.moveTo(158,y); ctx.lineTo(232,y); ctx.stroke();
    }
  }

  function drawTrayBase(now) {
    const danger = now < trayDangerUntil;
    const shake = danger ? Math.sin(now * .09) * 4 : 0;
    ctx.save();
    ctx.translate(shake, 0);

    if (danger) {
      ctx.shadowColor = 'rgba(255,70,50,.8)';
      ctx.shadowBlur = 14;
    }

    roundRect(147,670,96,45,13,'#e8b46c','#805028',4);
    roundRect(153,676,84,31,10,'#8a5d39','#654127',2);

    C.tray.slots.forEach(x => {
      const slotG = ctx.createRadialGradient(x-2,C.tray.y-4,1,x,C.tray.y,13);
      slotG.addColorStop(0,'rgba(255,241,191,.30)');
      slotG.addColorStop(1,'rgba(61,38,26,.36)');
      ctx.fillStyle = slotG;
      ctx.beginPath();
      ctx.arc(x,C.tray.y,10.2,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,224,166,.24)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.restore();
  }

  function isDrawableSprite(img) {
    if (!img) return false;
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    return width > 0 && height > 0;
  }

  function drawSprite(type, radius, alpha = 1) {
    const img = window.GameAssets && window.GameAssets.fruits[type];
    ctx.globalAlpha *= alpha;

    if (isDrawableSprite(img)) {
      try {
        ctx.drawImage(img, -radius, -radius, radius*2, radius*2);
        return;
      } catch (err) {
        // Never leave an interactive fruit invisible because one bitmap
        // cannot be drawn. Fall through to a visible procedural sprite.
      }
    }

    drawFallbackFruit(type, radius);
  }

  function fruitVisualScale(fruit, now) {
    if (!fruit.visual.pressStart) return 1;
    const t = (now - fruit.visual.pressStart) / 170;
    if (t >= 1) return 1;
    if (t < .38) return lerp(1, .86, t/.38);
    return lerp(.86, 1.06, (t-.38)/.62);
  }

  function drawBoardFruit(fruit, now) {
    const p = fruit.body.position;
    let shakeX = 0;
    if (now < fruit.visual.blockedUntil) {
      shakeX = Math.sin(now * .07) * 3.2;
    }

    ctx.save();
    ctx.translate(p.x + shakeX, p.y);
    ctx.rotate(fruit.body.angle);
    const scale = fruitVisualScale(fruit, now);
    ctx.scale(scale, scale);

    if (now < fruit.visual.glowUntil) {
      const pulse = .55 + Math.sin(now*.012)*.18;
      ctx.shadowColor = 'rgba(255,255,255,' + pulse + ')';
      ctx.shadowBlur = 12;
    }

    ctx.shadowColor = fruit.state === FRUIT_STATE.FALLING
      ? 'rgba(38,65,48,.34)'
      : 'rgba(38,65,48,.24)';
    ctx.shadowBlur = fruit.state === FRUIT_STATE.FALLING ? 7 : 4;
    ctx.shadowOffsetY = fruit.state === FRUIT_STATE.FALLING ? 5 : 3;

    drawSprite(fruit.type, fruit.visualRadius, fruit.visual.alpha);
    ctx.restore();

    if (DEBUG.showPhysicsBody || DEBUG.showClickableState) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, fruit.radius, 0, Math.PI*2);
      ctx.lineWidth = 1.4;
      if (DEBUG.showClickableState && fruit.state === FRUIT_STATE.BOARD) {
        ctx.strokeStyle = isFruitExposed(fruit) ? '#18ff58' : '#ff2f42';
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTrayItems() {
    for (const item of tray) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(item.scale, item.scale);
      drawSprite(item.type, 10.2, item.alpha);
      ctx.restore();
    }
  }

  function drawFallbackFruit(type, r) {
    // A failed/transparent asset must never become a clickable invisible
    // object. Keep recognisable cut-fruit fallbacks for the most important
    // problem types and a bright generic fallback for everything else.
    if (type === 'apple') {
      const skin = ctx.createRadialGradient(-r*.28,-r*.32,1,0,0,r);
      skin.addColorStop(0,'#ff6b5f');
      skin.addColorStop(1,'#c91f2e');
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0,0,r*.94,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#fff1c8';
      ctx.beginPath();
      ctx.arc(0,0,r*.73,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#704329';
      [[-.16,-.05],[.16,.05]].forEach(([sx,sy]) => {
        ctx.save();
        ctx.translate(sx*r,sy*r);
        ctx.rotate(sx < 0 ? -.45 : .45);
        ctx.beginPath();
        ctx.ellipse(0,0,r*.075,r*.15,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      });

      ctx.fillStyle = '#54a63e';
      ctx.beginPath();
      ctx.ellipse(r*.20,-r*.92,r*.22,r*.10,-.45,0,Math.PI*2);
      ctx.fill();
    } else if (type === 'watermelon') {
      ctx.fillStyle = '#2f9d3c';
      ctx.beginPath();
      ctx.arc(0,0,r*.96,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#d8f2b7';
      ctx.beginPath();
      ctx.arc(0,0,r*.80,0,Math.PI*2);
      ctx.fill();

      const flesh = ctx.createRadialGradient(-r*.22,-r*.28,1,0,0,r*.72);
      flesh.addColorStop(0,'#ff7777');
      flesh.addColorStop(1,'#ef3447');
      ctx.fillStyle = flesh;
      ctx.beginPath();
      ctx.arc(0,0,r*.69,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#4b2d24';
      for (const a of [-2.25,-1.05,.05,1.15,2.3]) {
        ctx.save();
        ctx.rotate(a);
        ctx.translate(r*.36,0);
        ctx.beginPath();
        ctx.ellipse(0,0,r*.055,r*.11,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
    } else if (type === 'grape') {
      // grape is currently represented by the purple-skin plum artwork.
      ctx.fillStyle = '#6f2e9f';
      ctx.beginPath();
      ctx.arc(0,0,r*.96,0,Math.PI*2);
      ctx.fill();

      const flesh = ctx.createRadialGradient(-r*.2,-r*.2,1,0,0,r*.75);
      flesh.addColorStop(0,'#ffe66f');
      flesh.addColorStop(1,'#f39b2d');
      ctx.fillStyle = flesh;
      ctx.beginPath();
      ctx.arc(0,0,r*.72,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#8b4a2b';
      ctx.beginPath();
      ctx.ellipse(0,0,r*.15,r*.30,0,0,Math.PI*2);
      ctx.fill();
    } else {
      const m = fruitMeta(type);
      const g = ctx.createRadialGradient(-r*.35,-r*.4,1,0,0,r);
      g.addColorStop(0,m.c2);
      g.addColorStop(1,m.c);
      ctx.fillStyle = g;
      ctx.strokeStyle = 'rgba(77,48,27,.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0,0,r*.92,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,.48)';
      ctx.beginPath();
      ctx.ellipse(-r*.28,-r*.3,r*.16,r*.25,-.6,0,Math.PI*2);
      ctx.fill();
    }
  }

  function roundRect(x,y,w,h,r,fill,stroke,lw=1) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x,y,w,h,r);
    } else {
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    }
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  function burst(x,y,type,count=10) {
    const meta = fruitMeta(type);
    for (let i = 0; i < count; i++) {
      particles.push({
        x,y,
        vx:(Math.random()-.5)*3.1,
        vy:-Math.random()*3.2-1,
        life:1,
        c:Math.random() > .35 ? meta.c2 : '#fff5b5',
        r:2+Math.random()*2.4
      });
    }
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.x += p.vx * dt * .06;
      p.y += p.vy * dt * .06;
      p.vy += .005 * dt;
      p.life -= .0017 * dt;
    }
    particles = particles.filter(p => p.life > 0);
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0,p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function showToast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1300);
  }

  function ping(freq, duration=.05, vol=.03) {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime + duration);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  document.getElementById('restartBtn').addEventListener('click', buildLevel);

  document.getElementById('shakeBtn').addEventListener('click', () => {
    if (gameEnded) return;
    fruits.filter(f => f.state === FRUIT_STATE.FALLING).forEach(f => {
      if (Sleeping && Sleeping.set) Sleeping.set(f.body, false);
      Body.applyForce(f.body, f.body.position, {
        x:(Math.random()-.5)*.0014,
        y:-Math.random()*.0007
      });
    });
    showToast('震一震！掉落中的水果松动了');
    ping(170,.08,.04);
  });

  document.getElementById('shuffleBtn').addEventListener('click', () => {
    if (gameEnded) return;
    const still = fruits.filter(f => f.state === FRUIT_STATE.BOARD);
    const positions = shuffle(still.map(f => ({ x:f.body.position.x, y:f.body.position.y })));
    still.forEach((f,i) => {
      Body.setPosition(f.body, positions[i]);
      f.renderOrder = nextRenderOrder++;
    });
    showToast('未掉落水果已重新打乱');
    ping(480,.05,.03);
  });

  document.getElementById('removeBtn').addEventListener('click', () => {
    if (gameEnded || pairBusy) return;
    const target = tray.find(x => x.state === TRAY_STATE.IDLE);
    if (!target) {
      showToast('槽位里还没有可消除的水果');
      return;
    }
    target.source.state = FRUIT_STATE.CLEARED;
    clearedCount += 1;
    burst(target.x,target.y,target.type,16);
    tray = tray.filter(x => x !== target);
    updateHud();
    ping(980,.08,.045);
    if (tray.length) relayoutTray();
    else resolveTray();
    showToast('帮你移除 1 个槽位水果');
  });

  document.getElementById('unlockBtn').addEventListener('click', () => {
    if (gameEnded) return;
    const target = fruits
      .filter(f => f.state === FRUIT_STATE.BOARD && isFruitExposed(f))
      .sort((a,b) => b.body.position.y - a.body.position.y)[0];
    if (target) {
      releaseFruit(target,false);
      Body.applyForce(target.body,target.body.position,{x:0,y:.00035});
      showToast('自动释放一个可点击水果');
    }
  });

  function resizeBackingStore() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * DPR));
    canvas.height = Math.max(1, Math.round(rect.height * DPR));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  window.addEventListener('resize', resizeBackingStore);

  function render(now) {
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.clearRect(0,0,W,H);

    GameRenderer.drawBackground(ctx);
    GameRenderer.drawStructures(ctx);

    const boardFruits = fruits
      .filter(f => f.state === FRUIT_STATE.BOARD)
      .sort((a,b) => a.renderOrder - b.renderOrder);

    const fallingFruits = fruits
      .filter(f => f.state === FRUIT_STATE.FALLING)
      .sort((a,b) => a.renderOrder - b.renderOrder);

    boardFruits.forEach(f => drawBoardFruit(f, now));
    fallingFruits.forEach(f => drawBoardFruit(f, now));

    const progress = Math.round((clearedCount / Math.max(1,total)) * 100);
    GameRenderer.drawHud(ctx, remainingCount(), progress, C.level);
    GameRenderer.drawBottomDecor(ctx);
    GameRenderer.drawTrayBase(ctx, now, trayDangerUntil);

    drawTrayItems();
    if (!DEBUG.disableParticles) drawParticles();
    if (window.GameEffects) GameEffects.draw(ctx);
    GameRenderer.drawDebug(ctx);
  }

  function frame(now) {
    const dt = Math.min(33, Math.max(1, now - lastTime));
    lastTime = now;

    if (!gameEnded) Engine.update(engine, dt);
    updateBoardShift(now);
    checkFruitCollection();
    updateTrayAnimations(now);
    checkStuckFruits(now);
    checkPendingGameOver(now);
    updateParticles(dt);
    if (window.GameEffects) GameEffects.update(dt, now);
    render(now);
    requestAnimationFrame(frame);
  }

  async function startGame() {
    try {
      if (window.GameAssets && window.GameAssets.load) await window.GameAssets.load();
    } catch (e) {
      console.warn('Fruit sprite preload failed; fallback renderer will be used.', e);
    }

    setupBoundaries();
    buildLevel();
    resizeBackingStore();
    if (ui.loading) ui.loading.classList.add('hidden');
    requestAnimationFrame(frame);
  }

  startGame();
})();
