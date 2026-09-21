(() => {
  "use strict";

  const C = window.GAME_CONFIG;
  const NS = "http://www.w3.org/2000/svg";

  function leaf(fill = "#4e9b35") {
    return '<path d="M64 25 C70 8 89 7 98 12 C90 28 76 34 64 25Z" fill="' + fill + '"/>' +
           '<path d="M65 25 C58 10 42 8 34 14 C41 27 53 31 65 25Z" fill="#69b94d"/>';
  }

  function shine() {
    return '<ellipse cx="44" cy="42" rx="10" ry="18" fill="#fff" opacity=".46" transform="rotate(28 44 42)"/>' +
           '<ellipse cx="51" cy="31" rx="4" ry="7" fill="#fff" opacity=".22" transform="rotate(28 51 31)"/>' +
           '<ellipse cx="80" cy="89" rx="18" ry="10" fill="#4b2f1b" opacity=".08" transform="rotate(-18 80 89)"/>';
  }

  function wrap(body, extra = "") {
    return '<svg xmlns="' + NS + '" width="128" height="128" viewBox="0 0 128 128">' +
      '<defs><filter id="s" x="-35%" y="-35%" width="170%" height="180%">' +
      '<feDropShadow dx="0" dy="5" stdDeviation="3.5" flood-color="#173d31" flood-opacity=".28"/></filter></defs>' +
      '<g filter="url(#s)">' + body + extra + '</g></svg>';
  }

  function roundFruit(meta, details = "", top = true) {
    const body =
      '<defs><radialGradient id="g" cx="33%" cy="25%" r="75%">' +
      '<stop offset="0" stop-color="' + meta.c2 + '"/><stop offset="1" stop-color="' + meta.c + '"/></radialGradient></defs>' +
      '<circle cx="64" cy="68" r="42" fill="url(#g)" stroke="#673e26" stroke-opacity=".36" stroke-width="3"/>' +
      (top ? leaf() : "") + details + shine();
    return wrap(body);
  }

  function spriteSvg(type) {
    const m = C.fruitMeta[type];

    switch (type) {
      case "watermelon":
        return wrap(
          '<defs><radialGradient id="g" cx="35%" cy="25%" r="80%"><stop offset="0" stop-color="' + m.c2 +
          '"/><stop offset="1" stop-color="' + m.c + '"/></radialGradient></defs>' +
          '<circle cx="64" cy="68" r="43" fill="url(#g)" stroke="#1d6e2a" stroke-width="3"/>' +
          '<g fill="none" stroke="#17732c" stroke-width="5" opacity=".92">' +
          '<path d="M31 45 C48 56 45 82 30 91"/><path d="M48 31 C61 49 58 91 45 104"/>' +
          '<path d="M80 28 C68 51 70 87 83 106"/><path d="M98 41 C84 61 87 83 100 94"/></g>' + shine()
        );
      case "grape":
        return wrap(
          leaf("#4f9a38") +
          '<g fill="#8336b8" stroke="#5b218a" stroke-width="2">' +
          '<circle cx="50" cy="48" r="16"/><circle cx="69" cy="45" r="16"/><circle cx="83" cy="58" r="16"/>' +
          '<circle cx="42" cy="65" r="16"/><circle cx="62" cy="66" r="17"/><circle cx="80" cy="76" r="16"/>' +
          '<circle cx="52" cy="84" r="16"/><circle cx="67" cy="96" r="14"/></g>' +
          '<ellipse cx="45" cy="47" rx="6" ry="9" fill="#fff" opacity=".27"/>'
        );
      case "strawberry":
        return wrap(
          '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' + m.c2 +
          '"/><stop offset="1" stop-color="' + m.c + '"/></linearGradient></defs>' +
          '<path d="M64 108 C38 89 24 64 33 45 C40 29 55 31 64 39 C74 29 90 30 97 45 C106 64 90 91 64 108Z" fill="url(#g)" stroke="#9f2434" stroke-width="3"/>' +
          leaf("#42963d") +
          '<g fill="#ffd66c">' +
          '<circle cx="47" cy="55" r="2.5"/><circle cx="65" cy="56" r="2.5"/><circle cx="81" cy="57" r="2.5"/>' +
          '<circle cx="42" cy="70" r="2.5"/><circle cx="59" cy="72" r="2.5"/><circle cx="77" cy="72" r="2.5"/>' +
          '<circle cx="51" cy="87" r="2.5"/><circle cx="68" cy="89" r="2.5"/></g>' + shine()
        );
      case "durian":
        return wrap(
          '<defs><radialGradient id="g"><stop stop-color="' + m.c2 + '"/><stop offset="1" stop-color="' + m.c + '"/></radialGradient></defs>' +
          '<path d="M64 21 L71 31 L82 24 L85 37 L99 34 L96 48 L109 53 L99 63 L108 75 L94 78 L96 93 L82 90 L76 104 L65 96 L54 106 L49 92 L34 96 L36 81 L21 77 L31 66 L20 55 L34 50 L31 36 L46 39 L50 25 L59 33Z" fill="url(#g)" stroke="#8c6b18" stroke-width="3"/>' +
          '<g fill="#f8d958" opacity=".85"><circle cx="50" cy="58" r="3"/><circle cx="73" cy="53" r="3"/><circle cx="62" cy="78" r="3"/><circle cx="82" cy="76" r="3"/></g>' + shine()
        );
      case "dragon":
        return wrap(
          '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' + m.c2 +
          '"/><stop offset="1" stop-color="' + m.c + '"/></linearGradient></defs>' +
          '<ellipse cx="64" cy="69" rx="36" ry="45" fill="url(#g)" stroke="#a32968" stroke-width="3"/>' +
          '<g fill="#72b849">' +
          '<path d="M37 48 L21 35 L35 61Z"/><path d="M91 45 L106 32 L94 61Z"/><path d="M34 72 L17 68 L35 84Z"/>' +
          '<path d="M94 70 L111 65 L93 84Z"/><path d="M49 29 L45 13 L59 28Z"/><path d="M78 28 L84 13 L88 32Z"/></g>' + shine()
        );
      case "mango":
        return wrap(
          '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#67af3a"/><stop offset=".45" stop-color="' + m.c2 +
          '"/><stop offset="1" stop-color="' + m.c + '"/></linearGradient></defs>' +
          '<ellipse cx="64" cy="69" rx="35" ry="46" transform="rotate(18 64 69)" fill="url(#g)" stroke="#8a7528" stroke-width="3"/>' +
          leaf("#4c9835") + shine()
        );
      case "lemon":
        return wrap(
          '<defs><radialGradient id="g"><stop stop-color="' + m.c2 + '"/><stop offset="1" stop-color="' + m.c + '"/></radialGradient></defs>' +
          '<path d="M30 65 C30 39 46 25 64 26 C84 26 99 43 99 65 C99 88 84 105 64 105 C43 105 29 89 30 65Z" fill="url(#g)" stroke="#ad9410" stroke-width="3"/>' +
          '<path d="M28 63 L19 58 L28 53Z" fill="' + m.c + '"/><path d="M100 64 L109 59 L100 54Z" fill="' + m.c + '"/>' + shine()
        );
      case "peach":
        return wrap(
          '<defs><radialGradient id="g" cx="35%" cy="30%"><stop stop-color="' + m.c2 + '"/><stop offset="1" stop-color="' + m.c + '"/></radialGradient></defs>' +
          '<path d="M64 28 C84 20 103 41 102 65 C101 90 83 106 64 106 C45 106 26 89 26 65 C26 41 45 22 64 28Z" fill="url(#g)" stroke="#c75e64" stroke-width="3"/>' +
          '<path d="M66 35 C56 51 58 79 69 99" fill="none" stroke="#bc6160" stroke-width="3" opacity=".65"/>' +
          leaf("#57983c") + shine()
        );
      case "blueberry":
        return roundFruit(m,
          '<path d="M64 29 L70 40 L83 37 L77 49 L88 55 L73 57 L72 71 L63 61 L52 70 L54 56 L41 50 L54 45 L54 32Z" fill="#1a3c83" opacity=".9"/>',
          false
        );
      case "kiwi":
        return roundFruit(m,
          '<circle cx="64" cy="68" r="27" fill="#83ad49" opacity=".8"/>' +
          '<ellipse cx="64" cy="68" rx="7" ry="10" fill="#f2e5b5"/>' +
          '<g fill="#3e3625">' +
          '<circle cx="64" cy="45" r="1.7"/><circle cx="76" cy="49" r="1.7"/><circle cx="83" cy="59" r="1.7"/>' +
          '<circle cx="82" cy="73" r="1.7"/><circle cx="74" cy="85" r="1.7"/><circle cx="61" cy="90" r="1.7"/>' +
          '<circle cx="49" cy="84" r="1.7"/><circle cx="44" cy="71" r="1.7"/><circle cx="47" cy="56" r="1.7"/></g>',
          false
        );
      case "persimmon":
        return roundFruit(m,
          '<g fill="#5f9b3b"><ellipse cx="64" cy="31" rx="18" ry="7"/><ellipse cx="64" cy="31" rx="7" ry="18"/>' +
          '<ellipse cx="64" cy="31" rx="16" ry="6" transform="rotate(45 64 31)"/><ellipse cx="64" cy="31" rx="16" ry="6" transform="rotate(-45 64 31)"/></g>',
          false
        );
      case "apple":
        return roundFruit(m,
          '<path d="M63 25 C62 18 67 12 74 10" fill="none" stroke="#6c492e" stroke-width="5" stroke-linecap="round"/>',
          true
        );
      case "tomato":
        return roundFruit(m,
          '<g fill="#48943a"><path d="M64 26 L70 39 L83 34 L76 45 L91 48 L75 52 L78 66 L65 57 L53 66 L55 52 L39 48 L53 44 L46 33 L59 39Z"/></g>',
          false
        );
      case "orange":
      default:
        return roundFruit(m,
          '<circle cx="79" cy="83" r="2" fill="#d97512" opacity=".45"/><circle cx="47" cy="75" r="2" fill="#d97512" opacity=".38"/>',
          true
        );
    }
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  const ATLAS_TYPES = [
    "apple","grape","blueberry","dragon",
    "watermelon","lemon","kiwi","orange",
    "strawberry","mango","peach","durian"
  ];
  const ATLAS_COLS = 4;
  const ATLAS_ROWS = 3;
  const JUICY_ATLAS_DATA = "data:image/webp;base64,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";

  function cropAtlas(atlas, index) {
    const sw = Math.round(atlas.naturalWidth / ATLAS_COLS);
    const sh = Math.round(atlas.naturalHeight / ATLAS_ROWS);
    const col = index % ATLAS_COLS;
    const row = Math.floor(index / ATLAS_COLS);
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, sw, sh);
    ctx.drawImage(atlas, col * sw, row * sh, sw, sh, 0, 0, sw, sh);
    return canvas;
  }

  const GameAssets = {
    fruits: {},
    async load() {
      let atlas = null;
      try {
        atlas = await loadImage(JUICY_ATLAS_DATA);
      } catch (err) {
        console.warn("[assets] juicy atlas load failed", err);
      }

      if (atlas) {
        ATLAS_TYPES.forEach((type, index) => {
          this.fruits[type] = cropAtlas(atlas, index);
        });
      }

      const missing = C.fruitTypes.filter(type => !this.fruits[type]);
      await Promise.all(missing.map(async type => {
        const svg = spriteSvg(type);
        const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        this.fruits[type] = await loadImage(uri);
      }));
    }
  };

  window.GameAssets = GameAssets;
})();
