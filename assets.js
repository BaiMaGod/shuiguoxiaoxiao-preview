(() => {
  "use strict";

  const C = window.GAME_CONFIG;
  const BASE = "./assets/fruits/";
  const ASSET_VERSION = "20260923-fruit-final2";

  function fruitSrc(file) {
    return BASE + file + "?v=" + ASSET_VERSION;
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("[assets] fruit image failed:", src);
        resolve(null);
      };
      img.src = src;
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
      // If pixel inspection is unavailable, keep the loaded image and let
      // the renderer's fallback guard handle hard failures.
      console.warn("[assets] visibility probe skipped:", err);
      return true;
    }
  }

  const FRUIT_FILES = Object.freeze({
    apple: fruitSrc("apple.webp"),
    grape: fruitSrc("grape.webp"),
    blueberry: fruitSrc("blueberry.webp"),
    dragon: fruitSrc("dragon.webp"),
    watermelon: fruitSrc("watermelon.webp"),
    lemon: fruitSrc("lemon.webp"),
    kiwi: fruitSrc("kiwi.webp"),
    orange: fruitSrc("orange.webp"),
    strawberry: fruitSrc("strawberry.webp"),
    mango: fruitSrc("mango.webp")
  });

  const GameAssets = {
    fruits: {},
    invalidTypes: new Set(),
    async load() {
      this.fruits = {};
      this.invalidTypes.clear();

      await Promise.all(C.fruitTypes.map(async type => {
        const src = FRUIT_FILES[type];
        if (!src) {
          this.invalidTypes.add(type);
          console.warn("[assets] no fruit file mapping:", type);
          return;
        }

        const img = await loadImage(src);
        if (img && hasVisiblePixels(img)) {
          this.fruits[type] = img;
          return;
        }

        this.invalidTypes.add(type);
        console.warn("[assets] invisible/invalid fruit sprite, fallback enabled:", type, src);
      }));

      if (this.invalidTypes.size) {
        console.warn("[assets] fallback fruit types:", Array.from(this.invalidTypes));
      }
    }
  };

  window.GameAssets = GameAssets;
})();
