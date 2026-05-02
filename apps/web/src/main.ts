import "./style.css";
import { bindDomRefs } from "./dom.js";
import { mountDialogs } from "./mountDialogs.js";
import { render } from "./render.js";

mountDialogs();
bindDomRefs();
render();
