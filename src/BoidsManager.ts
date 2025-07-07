import { Boid } from "./Boids";
import { Vector2D } from "./Vector2D";



export function randNum(min: number, max: number): number {
  let nums = max - min + 1;
  let temp = Math.floor((Math.random() * (nums)));
  return min + temp;
}

export function boidsCreator(numOfBalls: number, radius: number, canvas: HTMLCanvasElement): Boid[] {

  let arr: Boid[] = [];

  for (let i = 1; i <= numOfBalls; i++) {

    const position = new Vector2D(
      randNum(radius, canvas.width - radius),
      randNum(radius, canvas.height - radius)
    );

    const angle = randNum(0, 2 * Math.PI);
    const speed = randNum(30, 50)

    const velocity = new Vector2D(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    arr.push(new Boid(position, velocity, radius, arr, canvas));
  }
  return arr;
}
