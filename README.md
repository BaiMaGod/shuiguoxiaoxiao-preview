# 水果消消（物理掉落二消）

移动端竖屏 Web 小游戏，参考“水果堆叠 + 物理掉落 + 4 槽二消”的核心体验制作。

## V2 已实现

- 56 个水果、14 种水果，每种 4 个。
- 水果改为预加载的 Q 版矢量贴图渲染，并保留程序绘制 fallback。
- 初始水果保持静态实体；点击后才解除固定进入 Matter.js 物理模拟。
- 未点击水果继续参与碰撞，因此会真实挡住已经释放的水果。
- 加入视觉层级与遮挡比例判断：明显被上层水果覆盖时不可点击。
- 点击被遮挡水果会左右抖动，并提示“先移开上面的水果”。
- “提示”只高亮一个当前可点击水果，不再满屏常亮。
- 降低水果弹性、降低斜坡摩擦，让掉落更像水果而不是橡胶球。
- 左右斜坡将水果汇入中央出口。
- 水果进入槽位后有飞入 + 吸附回弹动画，不再瞬移。
- 两个相同水果会放大、渐隐、爆粒子后消除。
- 消除后剩余槽位会平滑左移补位。
- 4 个不同水果占满槽位后，槽位先红色闪烁并抖动，再判定失败。
- 增加卡住/睡眠检测，避免 Matter.js 休眠导致水果永久不动。
- 支持震动、消除、打乱、解锁辅助按钮。
- 适配手机竖屏。

## 调试开关

浏览器控制台中可修改：

```js
DEBUG_GAME.showPhysicsBody = true;
DEBUG_GAME.showClickableState = true;
DEBUG_GAME.allFruitsClickable = true;
DEBUG_GAME.disableGameOver = true;
```

刷新页面后恢复默认。

## 文件结构

```text
index.html
styles.css
config.js
assets.js
game.js
vendor/matter.min.js
```

`config.js` 保存物理、布局、槽位等参数；`assets.js` 负责水果贴图预加载；`game.js` 负责物理、遮挡判定、槽位状态机和动画。

## 运行

直接打开 `index.html`，或本地启动静态服务器：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

Matter.js 已放入 `vendor/`，运行时不依赖外部 CDN。
