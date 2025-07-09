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
 * @param {number} numOfBalls - Number of boids to create
 * @param {number} radius - Radius of each boid (used for spacing and collision)
 * @param {HTMLCanvasElement} canvas - Canvas for boundary constraints
 * @returns {Boid[]} An array of initialized Boid instances
 */
export function boidsCreator(
  numOfBalls: number,
  radius: number,
  canvas: HTMLCanvasElement
): Boid[] {
  let boidsCollection: Boid[] = [];

  for (let i = 1; i <= numOfBalls; i++) {
    const position = new Vector2D(
      randNum(radius, canvas.width - radius),
      randNum(radius, canvas.height - radius)
    );

    const angle = randNum(0, 2 * Math.PI);
    const speed = randNum(10, 20);

    const velocity = new Vector2D(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    boidsCollection.push(
      new Boid(position, velocity, radius, boidsCollection, canvas)
    );
  }

  return boidsCollection;
}

/**
 * Returns a random integer in the range [min, max].
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} A randomly generated integer in the given range
 */
export function randNum(min: number, max: number): number {
  let numbers_to_gen = max - min + 1;
  let temp = Math.floor(Math.random() * numbers_to_gen);
  return min + temp;
}
