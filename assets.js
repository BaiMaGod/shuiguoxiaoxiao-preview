(() => {
  "use strict";

  const C = window.GAME_CONFIG;
  const BASE = "./assets/fruits/";

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

  const FRUIT_FILES = Object.freeze({
    apple: BASE + "apple.webp",
    grape: BASE + "grape.webp",
    blueberry: BASE + "blueberry.webp",
    dragon: BASE + "dragon.webp",
    watermelon: BASE + "watermelon.webp",
    lemon: BASE + "lemon.webp",
    kiwi: BASE + "kiwi.webp",
    orange: BASE + "orange.webp",
    strawberry: BASE + "strawberry.webp",
    mango: BASE + "mango.webp"
  });

  const GameAssets = {
    fruits: {},
    async load() {
      await Promise.all(C.fruitTypes.map(async type => {
        const src = FRUIT_FILES[type];
        if (!src) return;
        const img = await loadImage(src);
        if (img) this.fruits[type] = img;
      }));
    }
  };

  window.GameAssets = GameAssets;
})();
