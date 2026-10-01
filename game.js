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
    HAND: 'hand',
    CLEARED: 'cleared'
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
  let hands = [null, null, null, null];
  let particles = [];
  let boundaries = [];
  let activeAction = null;
  let nextFruitId = 1;
  let nextRenderOrder = 1;
  let total = 0;
  let clearedCount = 0;
  let gameEnded = false;
  let toastTimer = 0;
  let audioCtx = null;
  let lastTime = performance.now();
  let boardShift = null;
  let lastBoardShiftAt = 0;
  let monkeyFx = {
    bowStart:0,
    bowUntil:0,
    bowMonkey:-1,
    thanksUntil:0,
    dangerUntil:0
  };

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

    // V2.4: old ramps/chute/tray colliders are gone. Only keep side walls so
    // released fruit can fall naturally into the monkeys' catch zone.
    add(Bodies.rectangle(-12, 360, 24, 760, { isStatic:true, friction:.35 }));
    add(Bodies.rectangle(W + 12, 360, 24, 760, { isStatic:true, friction:.35 }));
  }

  function buildLevel() {
    fruits.forEach(f => {
      if (f.body) World.remove(world, f.body);
    });

    fruits = [];
    hands = [null, null, null, null];
    particles = [];
    activeAction = null;
    clearedCount = 0;
    gameEnded = false;
    nextFruitId = 1;
    nextRenderOrder = 1;
    boardShift = null;
    lastBoardShiftAt = 0;
    monkeyFx = { bowStart:0, bowUntil:0, bowMonkey:-1, thanksUntil:0, dangerUntil:0 };
    ui.overlay.classList.add('hidden');
    if (window.GameEffects && GameEffects.reset) GameEffects.reset();

    const targetCount = getLevelFruitCount(C.level);
    const types = [];
    const pairCount = targetCount / 2;

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
        const x = Math.min(W - 27, Math.max(27, baseX + (Math.random() - .5) * C.board.randomX));
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

  function hasFruitInFlight() {
    return fruits.some(f => f.state === FRUIT_STATE.FALLING);
  }

  function releaseFruit(item, kick = true) {
    if (!item || gameEnded || activeAction || hasFruitInFlight() || item.state !== FRUIT_STATE.BOARD) return;

    item.state = FRUIT_STATE.FALLING;
    item.renderOrder = nextRenderOrder++;
    item.visual.pressStart = performance.now();
    item.lastMoveTime = performance.now();
    item.lastX = item.body.position.x;
    item.lastY = item.body.position.y;
    Body.setStatic(item.body, false);
    if (Sleeping && Sleeping.set) Sleeping.set(item.body, false);
    Body.setVelocity(item.body, {
      x:0,
      y:kick ? C.physics.releaseVelocityY : 0
    });
    Body.setAngularVelocity(item.body, (Math.random() - .5) * .03);

    if (kick) {
      Body.applyForce(item.body, item.body.position, {
        x:(Math.random() - .5) * .00006,
        y:.00012
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
    if (gameEnded || activeAction || hasFruitInFlight()) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    if (y > 555) return;

    const fruit = findFruitAtPoint(x, y);
    if (!fruit) return;
    if (!isFruitExposed(fruit)) {
      blockedFeedback(fruit);
      return;
    }

    releaseFruit(fruit);
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive:true });

  function partnerHand(index) {
    return index % 2 === 0 ? index + 1 : index - 1;
  }

  function monkeyIndexForHand(index) {
    return index < 2 ? 0 : 1;
  }

  function firstEmptyOnOtherMonkey(matchIndex) {
    const candidates = matchIndex < 2 ? [2, 3] : [0, 1];
    return candidates.find(i => !hands[i]) ?? -1;
  }

  // Core rule: scan hand 1 -> 4. Empty hands are remembered, not selected
  // immediately. The first same-type hand wins; only when no match exists do
  // we use the first empty hand encountered during the scan.
  function planCatch(type, slots = hands) {
    let firstEmpty = -1;
    for (let i = 0; i < 4; i++) {
      const held = slots[i];
      if (!held) {
        if (firstEmpty < 0) firstEmpty = i;
        continue;
      }
      if (held.type === type) {
        const partner = partnerHand(i);
        return {
          kind:'match',
          matchIndex:i,
          targetHand:partner,
          needsToss:Boolean(slots[partner])
        };
      }
    }
    return { kind:'store', targetHand:firstEmpty };
  }

  function pairForMonkey(monkeyIndex) {
    const a = monkeyIndex * 2;
    const b = a + 1;
    if (hands[a] && hands[b] && hands[a].type === hands[b].type) return [a, b];
    return null;
  }

  function handPoint(index) {
    return { x:C.monkeys.hands[index], y:C.monkeys.handY };
  }

  function mouthPoint(monkeyIndex) {
    return { x:C.monkeys.centers[monkeyIndex], y:C.monkeys.mouthY };
  }

  function makeHandItem(fruit) {
    return { id:fruit.id, type:fruit.type, source:fruit };
  }

  function startIncomingMove(pending) {
    activeAction = {
      kind:'move',
      start:performance.now(),
      duration:C.monkeys.catchDuration,
      item:pending.item,
      fromX:pending.fromX,
      fromY:pending.fromY,
      targetHand:pending.targetHand,
      matchIndex:Number.isInteger(pending.matchIndex) ? pending.matchIndex : -1
    };
    ping(610, .045, .03);
  }

  function startConsume(handA, handB, afterIncoming = null) {
    const monkeyIndex = monkeyIndexForHand(handA);
    activeAction = {
      kind:'consume',
      start:performance.now(),
      duration:C.monkeys.eatDuration,
      handA,
      handB,
      monkeyIndex,
      afterIncoming
    };
    ping(790, .05, .03);
  }

  function startLose() {
    if (DEBUG.disableGameOver) {
      activeAction = null;
      return;
    }
    const now = performance.now();
    monkeyFx.dangerUntil = now + C.monkeys.loseDelay + 500;
    activeAction = { kind:'lose', start:now, duration:C.monkeys.loseDelay };
    ping(120, .12, .045);
  }

  function beginMonkeyCatch(fruit) {
    if (gameEnded || activeAction || fruit.state !== FRUIT_STATE.FALLING) return;

    const p = { x:fruit.body.position.x, y:fruit.body.position.y };
    World.remove(world, fruit.body);
    fruit.state = FRUIT_STATE.HAND;
    const item = makeHandItem(fruit);
    const plan = planCatch(fruit.type);

    if (plan.kind === 'store') {
      if (plan.targetHand < 0) {
        startLose();
        return;
      }
      startIncomingMove({ item, fromX:p.x, fromY:p.y, targetHand:plan.targetHand, matchIndex:-1 });
      return;
    }

    const pending = {
      item,
      fromX:p.x,
      fromY:p.y,
      matchIndex:plan.matchIndex,
      targetHand:plan.targetHand
    };

    if (!plan.needsToss) {
      startIncomingMove(pending);
      return;
    }

    const tossTo = firstEmptyOnOtherMonkey(plan.matchIndex);
    if (tossTo < 0) {
      // This should be unreachable in normal play because four occupied,
      // non-clearing hands already ends the game immediately.
      startLose();
      return;
    }

    activeAction = {
      kind:'toss',
      start:performance.now(),
      duration:C.monkeys.tossDuration,
      fromHand:plan.targetHand,
      toHand:tossTo,
      item:hands[plan.targetHand],
      pendingIncoming:pending
    };
    ping(520, .04, .025);
  }

  function allHandsFull() {
    return hands.every(Boolean);
  }

  function completeConsume(action, now) {
    const pair = [hands[action.handA], hands[action.handB]].filter(Boolean);
    pair.forEach(item => {
      const p = mouthPoint(action.monkeyIndex);
      burst(p.x, p.y, item.type, 15);
      item.source.state = FRUIT_STATE.CLEARED;
      clearedCount += 1;
    });
    hands[action.handA] = null;
    hands[action.handB] = null;
    updateHud();
    ping(980, .075, .045);

    monkeyFx.bowStart = now;
    monkeyFx.bowUntil = now + C.monkeys.bowDuration;
    monkeyFx.bowMonkey = action.monkeyIndex;
    monkeyFx.thanksUntil = now + C.monkeys.bowDuration;

    if (action.afterIncoming) {
      activeAction = null;
      startIncomingMove(action.afterIncoming);
      return;
    }

    activeAction = null;
    if (clearedCount >= total) finish(true);
  }

  function updateHandAction(now) {
    if (!activeAction) return;
    const action = activeAction;
    const t = clamp01((now - action.start) / Math.max(1, action.duration));
    if (t < 1) return;

    if (action.kind === 'move') {
      hands[action.targetHand] = action.item;
      if (action.matchIndex >= 0) {
        startConsume(action.matchIndex, action.targetHand);
      } else if (allHandsFull()) {
        startLose();
      } else {
        activeAction = null;
      }
      return;
    }

    if (action.kind === 'toss') {
      hands[action.fromHand] = null;
      hands[action.toHand] = action.item;
      const autoPair = pairForMonkey(monkeyIndexForHand(action.toHand));
      if (autoPair) {
        startConsume(autoPair[0], autoPair[1], action.pendingIncoming);
      } else {
        activeAction = null;
        startIncomingMove(action.pendingIncoming);
      }
      return;
    }

    if (action.kind === 'consume') {
      completeConsume(action, now);
      return;
    }

    if (action.kind === 'lose') {
      activeAction = null;
      finish(false);
    }
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
        fruit:f,
        fromX:f.body.position.x,
        fromY:f.body.position.y,
        toY:f.body.position.y + dy
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
        x:item.fromX,
        y:lerp(item.fromY, item.toY, eased)
      });
    });
    if (t >= 1) boardShift = null;
  }

  function checkFruitCollection() {
    if (gameEnded || activeAction) return;
    for (const fruit of fruits) {
      if (fruit.state !== FRUIT_STATE.FALLING) continue;
      if (fruit.body.position.y >= C.monkeys.catchY) {
        beginMonkeyCatch(fruit);
        return;
      }
    }
  }

  function checkStuckFruits(now) {
    for (const fruit of fruits) {
      if (fruit.state !== FRUIT_STATE.FALLING || !fruit.body) continue;
      const p = fruit.body.position;
      const moved = Math.abs(p.x - fruit.lastX) + Math.abs(p.y - fruit.lastY);
      if (moved > 1.2) {
        fruit.lastX = p.x;
        fruit.lastY = p.y;
        fruit.lastMoveTime = now;
        continue;
      }

      if (now - fruit.lastMoveTime > 1100 && p.y < C.monkeys.catchY - 12) {
        if (Sleeping && Sleeping.set) Sleeping.set(fruit.body, false);
        Body.setPosition(fruit.body, {
          x:Math.max(24, Math.min(W - 24, p.x + (Math.random() - .5) * 34)),
          y:p.y + 18
        });
        Body.setVelocity(fruit.body, { x:(Math.random() - .5) * .4, y:1.35 });
        fruit.lastMoveTime = now;
      }
    }
  }

  function finish(win) {
    if (gameEnded) return;
    gameEnded = true;
    ui.emoji.textContent = win ? '🎉' : '🙈';
    ui.title.textContent = win ? '过关啦！' : '猴子没手啦';
    ui.desc.textContent = win
      ? '两个猴子把所有成对水果都吃掉啦！'
      : '四只手抓满了不同水果，换个顺序再试试。';
    setTimeout(() => ui.overlay.classList.remove('hidden'), 220);
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
      } catch (err) {}
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
    if (now < fruit.visual.blockedUntil) shakeX = Math.sin(now * .07) * 3.2;

    ctx.save();
    ctx.translate(p.x + shakeX, p.y);
    ctx.rotate(fruit.body.angle);
    const scale = fruitVisualScale(fruit, now);
    ctx.scale(scale, scale);
    ctx.shadowColor = fruit.state === FRUIT_STATE.FALLING ? 'rgba(38,65,48,.34)' : 'rgba(38,65,48,.24)';
    ctx.shadowBlur = fruit.state === FRUIT_STATE.FALLING ? 7 : 4;
    ctx.shadowOffsetY = fruit.state === FRUIT_STATE.FALLING ? 5 : 3;
    drawSprite(fruit.type, fruit.visualRadius, fruit.visual.alpha);
    ctx.restore();

    if (DEBUG.showPhysicsBody || DEBUG.showClickableState) {
      ctx.save();
      ctx.beginPath(); ctx.arc(p.x,p.y,fruit.radius,0,Math.PI*2);
      ctx.lineWidth=1.4;
      ctx.strokeStyle = DEBUG.showClickableState && fruit.state === FRUIT_STATE.BOARD
        ? (isFruitExposed(fruit) ? '#18ff58' : '#ff2f42')
        : 'rgba(255,255,255,.75)';
      ctx.stroke(); ctx.restore();
    }
  }

  function drawHandFruit(item, x, y, scale = 1, alpha = 1) {
    if (!item) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowColor='rgba(53,39,25,.25)';
    ctx.shadowBlur=5; ctx.shadowOffsetY=3;
    drawSprite(item.type, 17.5, alpha);
    ctx.restore();
  }

  function drawHandsAndActions(now) {
    const action = activeAction;
    const skip = new Set();

    if (action && action.kind === 'toss') skip.add(action.fromHand);
    if (action && action.kind === 'consume') {
      skip.add(action.handA); skip.add(action.handB);
    }

    hands.forEach((item, index) => {
      if (!item || skip.has(index)) return;
      const p = handPoint(index);
      drawHandFruit(item, p.x, p.y, 1);
    });

    if (!action) return;
    const t = clamp01((now - action.start) / Math.max(1, action.duration));

    if (action.kind === 'move') {
      const to = handPoint(action.targetHand);
      const eased = easeOutBack(t);
      const x = lerp(action.fromX, to.x, eased);
      const y = lerp(action.fromY, to.y, easeOutCubic(t));
      drawHandFruit(action.item, x, y, lerp(1.08, 1, t));
      return;
    }

    if (action.kind === 'toss') {
      const from = handPoint(action.fromHand);
      const to = handPoint(action.toHand);
      const eased = easeOutCubic(t);
      const x = lerp(from.x, to.x, eased);
      const y = lerp(from.y, to.y, eased) - Math.sin(t * Math.PI) * 48;
      drawHandFruit(action.item, x, y, 1 + Math.sin(t*Math.PI)*.08);
      const waiting = action.pendingIncoming;
      drawHandFruit(waiting.item, waiting.fromX, waiting.fromY, .92 + Math.sin(now*.01)*.03);
      return;
    }

    if (action.kind === 'consume') {
      const mouth = mouthPoint(action.monkeyIndex);
      const fromA = handPoint(action.handA);
      const fromB = handPoint(action.handB);
      const merge = {
        x:(fromA.x + fromB.x) / 2,
        y:C.monkeys.handY - 12
      };
      const itemA = hands[action.handA];
      const itemB = hands[action.handB];

      // First merge two same fruits into one, then feed the merged fruit to the monkey.
      if (t < .46) {
        const mt = easeOutCubic(t / .46);
        if (itemA) drawHandFruit(itemA, lerp(fromA.x, merge.x, mt), lerp(fromA.y, merge.y, mt), lerp(1, .78, mt));
        if (itemB) drawHandFruit(itemB, lerp(fromB.x, merge.x, mt), lerp(fromB.y, merge.y, mt), lerp(1, .78, mt));
      } else if (itemA || itemB) {
        const et = easeOutCubic((t - .46) / .54);
        const merged = itemA || itemB;
        drawHandFruit(
          merged,
          lerp(merge.x, mouth.x, et),
          lerp(merge.y, mouth.y, et),
          lerp(1.12, .18, et),
          1 - et*.55
        );
      }

      if (action.afterIncoming) {
        const waiting = action.afterIncoming;
        drawHandFruit(waiting.item, waiting.fromX, waiting.fromY, .92 + Math.sin(now*.01)*.03);
      }
    }
  }

  function drawFallbackFruit(type, r) {
    const m = fruitMeta(type);
    const g = ctx.createRadialGradient(-r*.35,-r*.4,1,0,0,r);
    g.addColorStop(0,m.c2); g.addColorStop(1,m.c);
    ctx.fillStyle=g;
    ctx.strokeStyle='rgba(77,48,27,.55)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.arc(0,0,r*.92,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.48)';
    ctx.beginPath(); ctx.ellipse(-r*.28,-r*.3,r*.16,r*.25,-.6,0,Math.PI*2); ctx.fill();
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
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
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
      o.type='sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(vol,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+duration);
    } catch (e) {}
  }

  document.getElementById('restartBtn').addEventListener('click', buildLevel);

  document.getElementById('shakeBtn').addEventListener('click', () => {
    if (gameEnded || activeAction) return;
    fruits.filter(f => f.state === FRUIT_STATE.FALLING).forEach(f => {
      if (Sleeping && Sleeping.set) Sleeping.set(f.body, false);
      Body.applyForce(f.body, f.body.position, {
        x:(Math.random()-.5)*.0014,
        y:-Math.random()*.0007
      });
    });
    showToast('震一震！');
    ping(170,.08,.04);
  });

  document.getElementById('shuffleBtn').addEventListener('click', () => {
    if (gameEnded || activeAction || hasFruitInFlight()) return;
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
    if (gameEnded || activeAction || hasFruitInFlight()) return;
    const index = hands.findIndex(Boolean);
    if (index < 0) {
      showToast('猴子手里还没有水果');
      return;
    }
    const item = hands[index];
    hands[index] = null;
    item.source.state = FRUIT_STATE.CLEARED;
    clearedCount += 1;
    const p=handPoint(index);
    burst(p.x,p.y,item.type,16);
    updateHud();
    ping(980,.08,.045);
    showToast('帮猴子吃掉 1 个水果');
    if (clearedCount >= total) finish(true);
  });

  document.getElementById('unlockBtn').addEventListener('click', () => {
    if (gameEnded || activeAction || hasFruitInFlight()) return;
    const target = fruits
      .filter(f => f.state === FRUIT_STATE.BOARD && isFruitExposed(f))
      .sort((a,b) => b.body.position.y - a.body.position.y)[0];
    if (target) {
      releaseFruit(target,false);
      Body.applyForce(target.body,target.body.position,{x:0,y:.00045});
      showToast('自动释放一个可点击水果');
    }
  });

  function resizeBackingStore() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * DPR));
    canvas.height = Math.max(1, Math.round(rect.height * DPR));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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
    GameRenderer.drawMonkeys(ctx, now, monkeyFx);
    drawHandsAndActions(now);
    GameRenderer.drawBottomDecor(ctx);

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
    checkStuckFruits(now);
    updateHandAction(now);
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

  // Small pure-logic hook for branch testing/debugging without exposing game state mutations.
  window.__MONKEY_HAND_RULES__ = Object.freeze({ planCatch, partnerHand });

  startGame();
})();
