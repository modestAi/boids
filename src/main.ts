/**
 * Entry point for the Boids simulation.
 * Sets up canvas rendering, UI bindings, simulation loop, and interactivity.
 */

import { boidsCreator } from "./BoidsManager";
import { getTrailColor } from "./ColorUtil";

// ------------------------------
// DOM Element References
// ------------------------------

/** The simulation canvas */
const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;

/** 2D rendering context */
const ctx = canvas.getContext("2d");

// Sliders and Controls
const cohesion = document.getElementById("slider-cohesion") as HTMLInputElement;
const repulsion = document.getElementById("slider-repulsion") as HTMLInputElement;
const alignment = document.getElementById("slider-alignment") as HTMLInputElement;
const visibility = document.getElementById("slider-visibility") as HTMLInputElement;
const opacity = document.getElementById("slider-opacity") as HTMLInputElement;
const color_selector = document.getElementById("color") as HTMLInputElement;
const checkbox = document.getElementById("path") as HTMLInputElement;
const acc_cap = document.getElementById("slider-acc") as HTMLInputElement;
const boids_number = document.getElementById("boids-number") as HTMLInputElement;
const boid_size = document.getElementById("boid-size") as HTMLInputElement;

const reset = document.getElementById("reset") as HTMLButtonElement;
const applyBtn = document.getElementById("apply") as HTMLButtonElement;
const debugSection = document.getElementById("debug-value-field") as HTMLDivElement;

// Scroll to top on load
window.scrollTo(0, 0);

// ------------------------------
// Constants and Config
// ------------------------------

/** Default radius of each boid */
const BOID_RADIUS = 4;

/** Default number of boids */
const NO_OF_BOIDS = 50;

/**
 * Debug information structure returned by boid update
 */
type DebugValues = {
  cohesion_v: number;
  repulsion_v: number;
  alignment_v: number;
  visibility_v: number;
  acc_cap_multiplier: number;
  color_v: string;
  buffer: number;
};

// ------------------------------
// Canvas DPI Scaling
// ------------------------------

/**
 * Scales canvas resolution for high-DPI displays (e.g., Retina screens).
 * Adjusts physical canvas size based on CSS size and devicePixelRatio.
 * Resets transform to avoid accumulated scaling.
 */
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

// ------------------------------
// Settings from Local Storage
// ------------------------------

/**
 * Loads trail visibility setting from localStorage and applies to checkbox.
 * @returns {boolean} Whether to show the boid trail path.
 */
function getPathSettingFromLocalStorage(): boolean {
  const storageVal = window.localStorage.getItem("show_path");
  if (storageVal === "true") {
    checkbox.checked = true;
    return true;
  }
  return checkbox.checked;
}

/**
 * Loads boid color from localStorage and applies to input.
 * @returns {string} Color value for the boid trail and fill.
 */
function getColorSettingFromLocalStorage(): string {
  const storageVal = window.localStorage.getItem("boid_color");
  if (storageVal !== null) {
    color_selector.value = storageVal;
    return storageVal;
  }
  return color_selector.value;
}

// ------------------------------
// Simulation Initialization
// ------------------------------

/** Boid simulation state array */
export let boidsArray = boidsCreator(NO_OF_BOIDS, BOID_RADIUS, canvas);

let lastTime: DOMHighResTimeStamp = 0;
let color_string = getColorSettingFromLocalStorage();
let show_path = getPathSettingFromLocalStorage();
let trail_color = getTrailColor(color_string);

/**
 * Restarts simulation with new boid count and size.
 * @param {number} count - Number of boids to create
 * @param {number} size - Radius of each boid
 */
function restartSimulation(count = NO_OF_BOIDS, size = BOID_RADIUS) {


  if (count === NO_OF_BOIDS && size === BOID_RADIUS) {
    boids_number.value = count.toString();
    boid_size.value = size.toString();
  }

  cancelAnimationFrame(id);
  boidsArray = boidsCreator(count, size, canvas);
  lastTime = 0;
  id = requestAnimationFrame(animate);
}

// ------------------------------
// Slider and UI Value Handling
// ------------------------------

/**
 * Reads all simulation control values from sliders.
 * @returns {Object} Current simulation parameters.
 */
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

// ------------------------------
// Animation Loop
// ------------------------------

/**
 * Main animation loop. Updates and renders all boids.
 * Also displays debug information for the first boid.
 * @param {DOMHighResTimeStamp} currentTime - High-resolution timestamp from RAF.
 */
function animate(currentTime: DOMHighResTimeStamp) {
  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(animate);
    return;
  }

  const deltaT = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  if (!ctx) throw new Error("CONTEXT_LOAD_INVALIDATION_HAS_OCCURRED.");

  const { cohesion, repulsion, alignment, visibility, accCap, opacity } = readSliders();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let debugVals: DebugValues | undefined;

  boidsArray.forEach((boid, i) => {
    const vals = boid.update(
      ctx,
      deltaT,
      cohesion,
      repulsion,
      alignment,
      visibility,
      accCap,
      color_string,
      opacity,
      show_path,
      trail_color
    );
    if (i === 0) debugVals = vals;
  });

  // Render debug information for first boid
  if (debugVals) {
    const { cohesion_v, repulsion_v, alignment_v, visibility_v, acc_cap_multiplier, color_v, buffer } = debugVals;
    debugSection.innerHTML = `
      cohesion_factor : ${cohesion_v.toFixed(2)}<br>
      repulsion_factor : ${repulsion_v.toFixed(2)}<br>
      alignment_factor : ${alignment_v.toFixed(2)}<br>
      visibility_radius : ${visibility_v.toFixed(2)}px<br>
      acc_cap_multiplier : ${acc_cap_multiplier.toFixed(2)} <br>
      col_val : ${color_v} <br>
      buffer_len : ${buffer}
    `;
  }

  id = requestAnimationFrame(animate);
}

reset.addEventListener("click", (_) => {

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
