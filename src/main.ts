import { boidsCreator } from "./BoidsManager";
import { getTrailColor } from "./ColorUtil";

const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const cohesion = document.getElementById("slider-cohesion") as HTMLInputElement;
const repulsion = document.getElementById("slider-repulsion") as HTMLInputElement;
const alignment = document.getElementById("slider-alignment") as HTMLInputElement;
const visibility = document.getElementById("slider-visibility") as HTMLInputElement;
const opacity = document.getElementById("slider-opacity") as HTMLInputElement;
const color_selector = document.getElementById("color") as HTMLInputElement;
const checkbox = document.getElementById("path") as HTMLInputElement;
const acc_cap = document.getElementById("slider-acc") as HTMLInputElement;

const reset = document.getElementById("reset") as HTMLButtonElement;


const debugSection = document.getElementById("debug-value-field") as HTMLDivElement;


const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * devicePixelRatio;    //! SET canvas to use more pixels for bitmap it generates
canvas.height = rect.height * devicePixelRatio;  //!                       "
ctx?.scale(devicePixelRatio, devicePixelRatio);  //! SET canvas to use default size conventions with upgraded resolution


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

let trail_color = getTrailColor(color_string);

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

  if (!ctx) throw new Error("CONTEXT_LOAD_INVALIDATION_HAS_OCCURRED.");

  // Read user input
  const { cohesion, repulsion, alignment, visibility, accCap, opacity } = readSliders();

  ctx.clearRect(0, 0, canvas.width, canvas.height); //!CLEAR CANVAS OF PREVIOUS FRAME.

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
      acc_cap_multiplier : ${accCap.toFixed(2)}
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
  trail_color = getTrailColor(color_string)
})

checkbox.addEventListener("click", (_) => {
  show_path = checkbox.checked;
})


window.addEventListener("resize", (_) => {
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx?.scale(devicePixelRatio, devicePixelRatio);
})

requestAnimationFrame(animate);
