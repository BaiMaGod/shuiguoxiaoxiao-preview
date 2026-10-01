window.GAME_CONFIG = Object.freeze({
  version: "2.4.0",
  width: 390,
  height: 844,
  level: 5,

  theme: {
    skyTop: "#42aef2",
    skyMiddle: "#73cef3",
    skyBottom: "#dcf8fb",
    grassLight: "#8bdb4b",
    grassMid: "#5ab637",
    grassDark: "#287f2b",
    woodLight: "#f1c574",
    woodMid: "#cb8843",
    woodDark: "#75431f",
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
    gravityScale: 0.00172,
    releaseVelocityY: 1.65,
    restitution: 0.04,
    friction: 0.10,
    frictionStatic: 0.20,
    density: 0.0018,
    sleepThreshold: 35
  },

  board: {
    cols: 7,
    startX: 31,
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
    fruitCountByLevel: [0, 40, 56, 64, 72, 80],
    fruitGrowthAfter5: 8,
    maxFruitCount: 96,
    scrollTriggerY: 405,
    scrollTargetY: 470,
    scrollDuration: 380,
    scrollCooldown: 550
  },

  monkeys: {
    catchY: 555,
    groundY: 742,
    centers: [108, 282],
    handY: 625,
    hands: [66, 148, 242, 324],
    mouthY: 670,
    catchDuration: 250,
    tossDuration: 210,
    eatDuration: 390,
    bowDuration: 470,
    loseDelay: 430
  }
});

window.DEBUG_GAME = Object.assign({
  showPhysicsBody: false,
  showClickableState: false,
  showHandNumbers: false,
  disableDecorations: false,
  disableParticles: false,
  allFruitsClickable: false,
  disableGameOver: false
}, window.DEBUG_GAME || {});
