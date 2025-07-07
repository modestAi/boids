import { boidsCreator } from "./BoidsManager";

const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const cohesion = document.getElementById("slider-cohesion") as HTMLInputElement;
const repulsion = document.getElementById("slider-repulsion") as HTMLInputElement;
const alignment = document.getElementById("slider-alignment") as HTMLInputElement;
const visibility = document.getElementById("slider-visibility") as HTMLInputElement;
const debugSection = document.getElementById("debug-output") as HTMLDivElement;
const reset = document.getElementById("reset") as HTMLButtonElement;

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
};

const BOID_RADIUS = 2;
const NO_OF_BOIDS = 100;

export const boids = boidsCreator(NO_OF_BOIDS, BOID_RADIUS, canvas);

let lastTime: DOMHighResTimeStamp = 0;

function animate(currentTime: DOMHighResTimeStamp) {
  if (lastTime === 0) {
    lastTime = currentTime;
    requestAnimationFrame(animate);
    return;
  }

  const deltaT = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  if (!ctx) throw new Error("CONTEXT_LOAD_INVALIDATION_HAS_OCCURED.");

  // Read user input
  const cohersion_value = parseFloat(cohesion.value);
  const repulsion_value = parseFloat(repulsion.value);
  const alignment_value = parseFloat(alignment.value);
  const visibility_value = parseFloat(visibility.value);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let debugVals: DebugValues | undefined;

  boids.forEach((boid, i) => {
    const vals = boid.update(ctx, deltaT, cohersion_value, repulsion_value, alignment_value, visibility_value);
    if (i === 0) debugVals = vals;
  });

  // Display debug info
  if (debugVals) {
    const { cohesion_v, repulsion_v, alignment_v, visibility_v } = debugVals;
    debugSection.innerHTML = `
      cohesion_factor : ${cohesion_v.toFixed(2)}<br>
      repulsion_factor : ${repulsion_v.toFixed(2)}<br>
      alignment_factor : ${alignment_v.toFixed(2)}<br>
      visibility_radius : ${visibility_v.toFixed(2)} px
    `;
  }

  requestAnimationFrame(animate);
}

reset.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.reload();
});

requestAnimationFrame(animate);

