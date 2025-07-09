/**
 * Entry point for the Boids simulation.
 * Sets up canvas rendering, UI bindings, simulation loop, and interactivity.
 */

import { boidsCreator } from "./BoidsManager";
import { getTrailColor } from "./ColorUtil";

const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

// Slider and control elements
const cohesion = document.getElementById("slider-cohesion") as HTMLInputElement;
const repulsion = document.getElementById("slider-repulsion") as HTMLInputElement;
const alignment = document.getElementById("slider-alignment") as HTMLInputElement;
const visibility = document.getElementById("slider-visibility") as HTMLInputElement;
const opacity = document.getElementById("slider-opacity") as HTMLInputElement;
const color_selector = document.getElementById("color") as HTMLInputElement;
const checkbox = document.getElementById("path") as HTMLInputElement;

const acc_cap = document.getElementById("slider-acc") as HTMLButtonElement;
const reset = document.getElementById("reset") as HTMLButtonElement;
const debugSection = document.getElementById("debug-value-field") as HTMLDivElement;

const rect = canvas.getBoundingClientRect();

//! Scale canvas resolution for high-DPI displays
canvas.width = rect.width * devicePixelRatio;
canvas.height = rect.height * devicePixelRatio;
ctx?.scale(devicePixelRatio, devicePixelRatio);

/** Interface for exposing debug data */
type DebugValues = {
  cohesion_v: number;
  repulsion_v: number;
  alignment_v: number;
  visibility_v: number;
  acc_cap_multiplier: number;
  color_v: string;
};

const BOID_RADIUS = 4;
const NO_OF_BOIDS = 30;

// Initialize boids
export const boids = boidsCreator(NO_OF_BOIDS, BOID_RADIUS, canvas);

let lastTime: DOMHighResTimeStamp = 0;
let color_string = color_selector.value;
let show_path = false;
let trail_color = getTrailColor(color_string);

/**
 * Reads current slider values from the DOM.
 * @returns An object containing simulation parameters.
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

/**
 * Main animation loop using requestAnimationFrame.
 * Clears canvas, updates boids, and draws debug information.
 * @param {DOMHighResTimeStamp} currentTime - High-resolution timestamp from RAF
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

  boids.forEach((boid, i) => {
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
    if (i === 0) debugVals = vals; // Show first boid's debug info for each frame
  });

  // Display debug info panel
  if (debugVals) {
    const { cohesion_v, repulsion_v, alignment_v, visibility_v, acc_cap_multiplier, color_v } = debugVals;
    debugSection.innerHTML = `
      cohesion_factor : ${cohesion_v.toFixed(2)}<br>
      repulsion_factor : ${repulsion_v.toFixed(2)}<br>
      alignment_factor : ${alignment_v.toFixed(2)}<br>
      visibility_radius : ${visibility_v.toFixed(2)}px<br>
      acc_cap_multiplier : ${acc_cap_multiplier.toFixed(2)} <br>
      col_val : ${color_v}
    `;
  }

  requestAnimationFrame(animate);
}

/**
 * Resets the simulation by reloading the page.
 */
reset.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.reload();
});

/**
 * Updates color and trail hue on color picker input.
 */
color_selector.addEventListener("input", () => {
  color_string = color_selector.value;
  trail_color = getTrailColor(color_string);
});

/**
 * Toggles trail visibility for boids.
 */
checkbox.addEventListener("click", (_) => {
  show_path = checkbox.checked;
});

/**
 * Handles window resize to maintain resolution scaling.
 */
window.addEventListener("resize", (_) => {
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx?.scale(devicePixelRatio, devicePixelRatio);
});

// Kick off animation
requestAnimationFrame(animate);
