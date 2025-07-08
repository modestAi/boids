import { Boid } from "./Boids";
import { Vector2D } from "./Vector2D";

export function boidsCreator(numOfBalls: number, radius: number, canvas: HTMLCanvasElement): Boid[] {

  let boidsCollection: Boid[] = [];

  for (let i = 1; i <= numOfBalls; i++) {

    const position = new Vector2D(
      randNum(radius, canvas.width - radius),
      randNum(radius, canvas.height - radius)
    );

    const angle = randNum(0, 2 * Math.PI);
    const speed = randNum(10, 20)
    const velocity = new Vector2D(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    boidsCollection.push(new Boid(position, velocity, radius, boidsCollection, canvas));
  }
  return boidsCollection;
}

export function randNum(min: number, max: number): number {
  let numbers_to_gen = max - min + 1;
  let temp = Math.floor((Math.random() * (numbers_to_gen)));
  return min + temp;
}
