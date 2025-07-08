import { boidsCreator } from "./BoidsManager";

const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const cohesion = document.getElementById("slider-cohesion") as HTMLInputElement;
const repulsion = document.getElementById("slider-repulsion") as HTMLInputElement;
const alignment = document.getElementById("slider-alignment") as HTMLInputElement;
const visibility = document.getElementById("slider-visibility") as HTMLInputElement;
const opacity = document.getElementById("slider-opacity") as HTMLInputElement;
const color_selector = document.getElementById("color") as HTMLInputElement;
const checkbox = document.getElementById("path") as HTMLInputElement;

const acc_cap = document.getElementById("slider-acc") as HTMLButtonElement;
const reset = document.getElementById("reset") as HTMLButtonElement;


const debugSection = document.getElementById("debug-output") as HTMLDivElement;

// Resize canvas properly
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * devicePixelRatio;
canvas.height = rect.height * devicePixelRatio;
ctx?.scale(devicePixelRatio, devicePixelRatio);

// Debug value type
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

export const boids = boidsCreator(NO_OF_BOIDS, BOID_RADIUS, canvas);

let lastTime: DOMHighResTimeStamp = 0;

let color_string = color_selector.value;

let show_path = false;

function animate(currentTime: DOMHighResTimeStamp) {

  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(animate);
    return;
  }

  const deltaT = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  if (!ctx) throw new Error("CONTEXT_LOAD_INVALIDATION_HAS_OCCURRED.");

  // Read user input
  const cohesion_value = parseFloat(cohesion.value);
  const repulsion_value = parseFloat(repulsion.value);
  const alignment_value = parseFloat(alignment.value);
  const visibility_value = parseFloat(visibility.value);
  const acc_cap_multiplier = parseFloat(acc_cap.value);
  const opacity_value = parseFloat(opacity.value);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let debugVals: DebugValues | undefined;

  boids.forEach((boid, i) => {
    const vals = boid.update(
      ctx,
      deltaT,
      cohesion_value,
      repulsion_value,
      alignment_value,
      visibility_value,
      acc_cap_multiplier,
      color_string,
      opacity_value,
      show_path
    );
    if (i === 0) debugVals = vals;
  });

  // Display debug info
  if (debugVals) {
    const { cohesion_v, repulsion_v, alignment_v, visibility_v, color_v } = debugVals;
    debugSection.innerHTML = `
      cohesion_factor : ${cohesion_v.toFixed(2)}<br>
      repulsion_factor : ${repulsion_v.toFixed(2)}<br>
      alignment_factor : ${alignment_v.toFixed(2)}<br>
      visibility_radius : ${visibility_v.toFixed(2)}px<br>
      acc_cap_multiplier : ${acc_cap_multiplier.toFixed(2)}
      col_val : ${color_v}
    `;
  }
  requestAnimationFrame(animate);
}

reset.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.reload();
});

color_selector.addEventListener('input', () => {
  color_string = color_selector.value;
})


checkbox.addEventListener("click", (_) => {
  show_path = checkbox.checked;
})


requestAnimationFrame(animate);
