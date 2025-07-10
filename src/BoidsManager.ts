import { Boid } from "./Boid";
import { Vector2D } from "./Vector2D";

/**
 * Generates and returns a collection of randomly positioned and directed boids.
 *
 * Each boid is initialized with:
 * - A random position within canvas bounds (respecting the radius)
 * - A random angle and speed vector
 * - A shared reference to the boid group (for interaction)
 *
 * @param {number} numBoids - Number of boids to create
 * @param {number} radius - Radius of each boid (used for spacing and collision)
 * @param {HTMLCanvasElement} canvas - Canvas for boundary constraints
 * @returns {Boid[]} An array of initialized Boid instances
 */
export function boidsCreator(
  numBoids: number,
  radius: number,
  canvas: HTMLCanvasElement
): Boid[] {
  let boidsCollection: Boid[] = [];

  const { width, height } = canvas.getBoundingClientRect();
  let border = radius * 2;

  for (let i = 0; i < numBoids; i++) {
    const position = new Vector2D(
      randFloatNum(border, width - border),
      randFloatNum(border, height - border)
    );

    const angle = randFloatNum(0, 2 * Math.PI);
    const speed = randFloatNum(10, 20);

    const velocity = new Vector2D(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    boidsCollection.push(new Boid(position,
      velocity,
      radius,
      boidsCollection,
      canvas));
  }

  return boidsCollection;
}

/**
 * Returns a random float in the range [min, max].
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} A randomly generated float in the given range
 */
/**
 * Returns a random float in the range [min, max).
 */
export function randFloatNum(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
