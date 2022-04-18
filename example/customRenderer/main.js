import {
  createRenderer
} from "../../lib/vue3-study.esm.js";
import {
  App
} from "./App.js";

// let rootContainer = document.querySelector("#app")
// createApp(App).mount(rootContainer);

const renderer = createRenderer({
  createElement(type) {
    if (type === "rect") {
      let rect = new PIXI.Graphics();
      rect.beginFill(0x66CCFF);
      rect.drawRect(100, 100, 100, 100);
      rect.endFill();
      return rect;
    }

  },
  patchProps(el, key, value) {
    el[key] = value;
  },
  insert(el, parent) {
    parent.addChild(el);
  }
})

let app = new PIXI.Application({
  width: 500,
  height: 500
});
document.body.append(app.view);
renderer.createApp(App).mount(app.stage);