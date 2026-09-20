window.GAME_CONFIG = Object.freeze({
  version: "2.0.1",
  width: 390,
  height: 844,
  level: 5,
  fruitTypes: [
    "tomato","orange","apple","blueberry","lemon","kiwi","watermelon",
    "grape","strawberry","durian","dragon","mango","peach","persimmon"
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
    rampFriction: 0.06,
    rampAngle: 0.415
  },
  board: {
    rows: 8,
    cols: 7,
    startX: 31,
    startY: 116,
    spacingX: 51,
    spacingY: 48,
    staggerX: 24,
    randomX: 8,
    randomY: 7,
    hitScale: 1.32,
    blockedCoverRatio: 0.20
  },
  tray: {
    capacity: 4,
    y: 751,
    slots: [165,185,205,225],
    flyDuration: 240,
    clearDuration: 340,
    slideDuration: 180
  }
});

window.DEBUG_GAME = Object.assign({
  showPhysicsBody: false,
  showClickableState: false,
  allFruitsClickable: false,
  disableGameOver: false
}, window.DEBUG_GAME || {});
