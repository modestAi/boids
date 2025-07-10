import { boidsCreator } from "./BoidsManager";
import { getTrailColor } from "./ColorUtil";

const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) throw new Error("Canvas 2D context could not be initialized.");
function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}
function getButton(id: string): HTMLButtonElement {
  return document.getElementById(id) as HTMLButtonElement;
}

const cohesion = getInput("slider-cohesion");
const repulsion = getInput("slider-repulsion");
const alignment = getInput("slider-alignment");
const visibility = getInput("slider-visibility");
const opacity = getInput("slider-opacity");
const color_selector = getInput("color");
const checkbox = getInput("path");
const acc_cap = getInput("slider-acc");
const boids_number = getInput("boids-number");
const boid_size = getInput("boid-size");

const reset = getButton("reset");
const applyBtn = getButton("apply");

window.scrollTo(0, 0);

const CONFIG_DEFAULT = {
  BOID_RADIUS: 4, NO_OF_BOIDS: 50
}

// Canvas DPI Scaling
function setUpScaling() {
  const dpr = Math.max(devicePixelRatio, 1);
  const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transform
    ctx.scale(dpr, dpr);               // Apply new scaling
  }
}

// Apply scaling on initial load
setUpScaling();


function fromLocalStorage() {
  const show_path = localStorage.getItem("show_path") === "true";
  checkbox.checked = show_path; // Reflect saved setting in UI

  const storedColor = localStorage.getItem("boid_color");
  const color_string = storedColor ?? color_selector.value;
  if (storedColor) color_selector.value = storedColor;  // Reflect saved setting in UI

  return { show_path, color_string };
}



/** Boid simulation state array */
export let boidsArray = boidsCreator(CONFIG_DEFAULT.NO_OF_BOIDS, CONFIG_DEFAULT.BOID_RADIUS, canvas);

let lastTime: DOMHighResTimeStamp = 0;
let { show_path, color_string } = fromLocalStorage();
let trail_color = getTrailColor(color_string);

function restartSimulation(count = CONFIG_DEFAULT.NO_OF_BOIDS, size = CONFIG_DEFAULT.BOID_RADIUS) {
  cancelAnimationFrame(id);
  boidsArray = boidsCreator(count, size, canvas);
  lastTime = 0;
  id = requestAnimationFrame(animate);
}

function readSliders() {
  return {
    cohesion: parseFloat(cohesion.value),
    repulsion: parseFloat(repulsion.value),
    alignment: parseFloat(alignment.value),
    visibility: parseFloat(visibility.value),
    accCap: parseFloat(acc_cap.value),
    opacity: parseFloat(opacity.value),
  };
}

function animate(currentTime: DOMHighResTimeStamp) {

  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(animate);
    return;
  }

  const deltaT = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const { cohesion, repulsion, alignment, visibility, accCap, opacity } = readSliders();
  ctx!.clearRect(0, 0, canvas.width, canvas.height);

  boidsArray.forEach(boid => {
    boid.update(ctx!, deltaT, cohesion, repulsion, alignment, visibility, accCap, color_string, opacity, show_path, trail_color);
  });

  id = requestAnimationFrame(animate);
}

reset.addEventListener("click", (_) => {

  //UI update
  boids_number.value = CONFIG_DEFAULT.NO_OF_BOIDS.toString();
  boid_size.value = CONFIG_DEFAULT.BOID_RADIUS.toString();
  color_selector.value = "#12E988";
  checkbox.checked = false;

  // Sync localStorage
  localStorage.setItem("boid_color", color_selector.value);
  localStorage.setItem("show_path", "false");

  // Sync simulation
  show_path = false;
  color_string = color_selector.value;
  trail_color = getTrailColor(color_string);

  restartSimulation()
});

applyBtn.addEventListener("click", (e) => {
  e.preventDefault();
  restartSimulation(
    parseInt(boids_number.value),
    parseInt(boid_size.value)
  );
});

color_selector.addEventListener("input", () => {
  color_string = color_selector.value;
  trail_color = getTrailColor(color_string);
  window.localStorage.setItem("boid_color", color_string);
});

checkbox.addEventListener("click", () => {
  show_path = checkbox.checked;
  window.localStorage.setItem("show_path", `${show_path}`);
});

window.addEventListener("resize", (_) => setUpScaling());

/** Active animation frame ID */
let id = requestAnimationFrame(animate);
