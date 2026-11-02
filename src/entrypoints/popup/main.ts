import { mount } from "svelte";

import "@/assets/theme.css";
import App from "./App.svelte";

const target = document.getElementById("app");

if (!target) {
  throw new Error("vol: #app ausente");
}

mount(App, { target });
