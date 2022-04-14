import {
  createApp
} from "../../lib/vue3-study.esm.js";
import {
  App
} from "./App.js";

let rootContainer = document.querySelector("#app")
createApp(App).mount(rootContainer);