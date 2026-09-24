window.GAME_CONFIG = Object.freeze({
  version: "2.3.2",
  width: 390,
  height: 844,
  level: 5,

  theme: {
    skyTop: "#42aef2",
    skyMiddle: "#73cef3",
    skyBottom: "#dcf8fb",
    cloud: "rgba(255,255,255,.72)",
    grassLight: "#8bdb4b",
    grassMid: "#5ab637",
    grassDark: "#287f2b",
    leafLight: "#7fd342",
    leafDark: "#2f8e36",
    woodLight: "#f1c574",
    woodMid: "#cb8843",
    woodDark: "#75431f",
    woodEdge: "#5a3219",
    stoneLight: "#f3d69a",
    stoneDark: "#c99254",
    panelLight: "#d7934b",
    panelDark: "#70401f",
    greenTop: "#63f04a",
    greenBottom: "#22bd28",
    greenStroke: "#118b1d",
    goldTop: "#ffe560",
    goldBottom: "#f1a221",
    white: "#fffdf2",
    ink: "#65401f"
  },

  fruitTypes: [
    "apple","grape","blueberry","dragon","watermelon",
    "lemon","kiwi","orange","strawberry","mango"
  ],

  fruitMeta: {
    tomato:     { c:"#ef3f37", c2:"#ff7a66", radius:19.2, visual:24.0 },
    orange:     { c:"#ff9617", c2:"#ffc642", radius:19.5, visual:23.8 },
    apple:      { c:"#d91f2b", c2:"#ff6570", radius:19.3, visual:24.2 },
    blueberry:  { c:"#2858b8", c2:"#6a99f4", radius:18.7, visual:23.4 },
    lemon:      { c:"#f0d81b", c2:"#fff06b", radius:18.8, visual:23.6 },
    kiwi:       { c:"#98713b", c2:"#c9a263", radius:19.3, visual:23.8 },
    watermelon: { c:"#4eb43b", c2:"#88df6c", radius:20.2, visual:24.5 },
    grape:      { c:"#7b31b5", c2:"#bd72e6", radius:19.0, visual:24.0 },
    strawberry: { c:"#e83945", c2:"#ff8189", radius:18.7, visual:23.8 },
    durian:     { c:"#c9961d", c2:"#f2c842", radius:20.0, visual:24.5 },
    dragon:     { c:"#ef4d91", c2:"#ff8fbd", radius:19.5, visual:24.2 },
    mango:      { c:"#f08c23", c2:"#ffc331", radius:19.0, visual:24.0 },
    peach:      { c:"#f6817d", c2:"#ffc6aa", radius:19.3, visual:24.0 },
    persimmon:  { c:"#f07a1e", c2:"#ffb83d", radius:19.5, visual:24.0 }
  },

  physics: {
    gravityY: 1,
    gravityScale: 0.00165,
    restitution: 0.05,
    friction: 0.12,
    frictionStatic: 0.22,
    density: 0.0018,
    sleepThreshold: 45,
    rampFriction: 0.06
  },

  geometry: {
    leftRamp:  { x:72,  y:584.5, length:176, thickness:20, angle:0.431 },
    rightRamp: { x:318, y:584.5, length:176, thickness:20, angle:-0.431 },
    chute: { captureY:590, xMin:145, xMax:245 }
  },

  board: {
    cols: 7,
    startX: 31,

    // 第 1 关保留较疏的教学布局；第 2 关起进入高密度布局。
    level1BottomY: 355,
    level1SpacingX: 51,
    level1SpacingY: 48,
    level1StaggerX: 24,

    denseBottomY: 470,
    denseSpacingX: 49,
    denseSpacingY: 42,
    denseStaggerX: 23,

    randomX: 6,
    randomY: 5,
    hitScale: 1.32,
    blockedCoverRatio: 0.20,

    // 关卡水果总量：全部按“成对”生成，保证理论上可全部二消。
    fruitCountByLevel: [0, 40, 56, 64, 72, 80],
    fruitGrowthAfter5: 8,
    maxFruitCount: 96,

    // 当最下方未掉落水果进入上半屏时，整体下压，露出上方储备水果。
    scrollTriggerY: 405,
    scrollTargetY: 470,
    scrollDuration: 380,
    scrollCooldown: 550
  },

  tray: {
    capacity: 4,
    y: 690,
    slots: [157,182,207,232],
    flyDuration: 250,
    clearDuration: 360,
    slideDuration: 190
  },

  visual: {
    levelSign: { x:195, y:65, w:156, h:58 },
    remainPanel: { x:55, y:654, w:82, h:92 },
    progressPanel: { x:335, y:654, w:82, h:92 },
    tray: { x:195, y:690, w:118, h:60 },
    grassY: 758
  }
});

window.DEBUG_GAME = Object.assign({
  showPhysicsBody: false,
  showClickableState: false,
  showRampCollider: false,
  showCaptureZone: false,
  disableDecorations: false,
  disableParticles: false,
  allFruitsClickable: false,
  disableGameOver: false
}, window.DEBUG_GAME || {});
