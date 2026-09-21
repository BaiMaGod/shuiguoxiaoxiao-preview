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

  const GameAssets = {
    fruits: {},
    async load() {
      const jobs = C.fruitTypes.map(async type => {
        // V2 使用预渲染 SVG 贴图。后续放入 assets/fruits/*.png 时，
        // 只需要在这里优先尝试 PNG 即可，游戏逻辑无需修改。
        const svg = spriteSvg(type);
        const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        this.fruits[type] = await loadImage(uri);
      });
      await Promise.all(jobs);
    }
  };

  window.GameAssets = GameAssets;
})();
