(() => {
  "use strict";

  const C = window.GAME_CONFIG;
  const FRUIT_BASE = "./assets/fruits/";
  const UI_BASE = "./assets/ui/";
  const ASSET_VERSION = "20260926-ui-v2";

  function src(base,file) {
    return base + file + "?v=" + ASSET_VERSION;
  }

  function loadImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("[assets] image failed:", url);
        resolve(null);
      };
      img.src = url;
    });
  }

  function hasVisiblePixels(img) {
    if (!img) return false;
    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    if (!width || !height) return false;

    try {
      const test = document.createElement("canvas");
      test.width = 32;
      test.height = 32;
      const tctx = test.getContext("2d", { willReadFrequently:true });
      tctx.clearRect(0, 0, 32, 32);
      tctx.drawImage(img, 0, 0, 32, 32);
      const data = tctx.getImageData(0, 0, 32, 32).data;
      let visible = 0;
      let solid = 0;
      for (let i = 3; i < data.length; i += 4) {
        const a = data[i];
        if (a > 16) visible++;
        if (a > 96) solid++;
      }
      return visible >= 20 && solid >= 8;
    } catch (err) {
      return true;
    }
  }

  const FRUIT_FILES = Object.freeze({
    apple: src(FRUIT_BASE,"apple.webp"),
    grape: src(FRUIT_BASE,"grape.webp"),
    blueberry: src(FRUIT_BASE,"blueberry.webp"),
    dragon: src(FRUIT_BASE,"dragon.webp"),
    watermelon: src(FRUIT_BASE,"watermelon.webp"),
    lemon: src(FRUIT_BASE,"lemon.webp"),
    kiwi: src(FRUIT_BASE,"kiwi.webp"),
    orange: src(FRUIT_BASE,"orange.webp"),
    strawberry: src(FRUIT_BASE,"strawberry.webp"),
    mango: src(FRUIT_BASE,"mango.webp")
  });

  const UI_FILES = Object.freeze({
    background: src(UI_BASE,"background.svg"),
    levelSign: src(UI_BASE,"level-sign.svg"),
    settings: src(UI_BASE,"settings.svg"),
    remainPanel: src(UI_BASE,"remain-panel.svg"),
    progressPanel: src(UI_BASE,"progress-panel.svg"),
    tray: src(UI_BASE,"tray.svg"),
    remove: src(UI_BASE,"remove.svg"),
    unlock: src(UI_BASE,"unlock.svg"),
    shuffle: src(UI_BASE,"shuffle.svg"),
    shake: src(UI_BASE,"shake.svg")
  });

  const GameAssets = {
    fruits: {},
    ui: {},
    invalidTypes: new Set(),

    async load() {
      this.fruits = {};
      this.ui = {};
      this.invalidTypes.clear();

      const fruitJobs = C.fruitTypes.map(async type => {
        const url = FRUIT_FILES[type];
        if (!url) {
          this.invalidTypes.add(type);
          return;
        }
        const img = await loadImage(url);
        if (img && hasVisiblePixels(img)) this.fruits[type] = img;
        else this.invalidTypes.add(type);
      });

      const uiJobs = Object.entries(UI_FILES).map(async ([key,url]) => {
        const img = await loadImage(url);
        if (img) this.ui[key] = img;
      });

      await Promise.all([...fruitJobs,...uiJobs]);

      if (this.invalidTypes.size) {
        console.warn("[assets] fallback fruit types:", Array.from(this.invalidTypes));
      }
    }
  };

  window.GameAssets = GameAssets;
})();