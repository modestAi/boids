import { getColorWithOpacity, reduceOpacity as reduceOpacity_ManageLightness, type rgb } from "./ColorUtil";
import { Vector2D } from "./Vector2D";

/**
 * A single Boid entity that simulates flocking behavior on an HTML canvas.
 */
export class Boid {
  MIN_SPEED = 300;
  MAX_SPEED = 375;
  /** Maximum acceleration cap (modifiable via multiplier) */
  MAX_ACCELERATION = 260;

  COHESION_FACTOR = 0;
  ALIGNMENT_FACTOR = 0;
  REPULSION_FACTOR = 0;

  /** Raw visibility scaling factor */
  VISIBILITY_FACTOR = 0;

  /** Visibility radius based on scaling and boid size */
  VISIBILITY_RADIUS: number;

  /** Acceleration multiplier from user input */
  ACC_CAP_MULTIPLIER = 1;

  /** Force applied to repel from canvas boundaries */
  WALL_REPULSION_FORCE = 69;

  POS_BUFFER_CAPACITY = 60;
  POS_BUFFER: Vector2D[] = [];

  pos: Vector2D = new Vector2D();
  vel: Vector2D = new Vector2D();
  acc: Vector2D = new Vector2D();

  boids: Boid[];
  radius: number;

  canvas: HTMLCanvasElement;
  BoundingClient: DOMRect; /** DOM bounding box of the canvas for wall collision logic */

  /**
   * Constructs a new Boid.
   * @param position Initial position of the boid
   * @param velocity Initial velocity
   * @param radius Radius of the boid (in pixels)
   * @param boids Reference to the full boid array
   * @param canvas Canvas element for bounds and rendering
   */
  constructor(
    position: Vector2D,
    velocity: Vector2D,
    radius: number,
    boids: Boid[],
    canvas: HTMLCanvasElement
  ) {
    this.pos = position;
    this.vel = velocity;
    this.radius = radius;
    this.canvas = canvas;
    this.boids = boids;

    this.VISIBILITY_RADIUS = radius * this.VISIBILITY_FACTOR;
    this.BoundingClient = canvas.getBoundingClientRect();
  }

  /**
   * Updates the boid's state for a given animation frame.
   * @param ctx Canvas rendering context
   * @param deltaT Time step (in seconds)
   * @param cohesion_factor Cohesion scaling factor
   * @param repulsion_factor Repulsion scaling factor
   * @param alignment_factor Alignment scaling factor
   * @param visibility_input Visibility range factor
   * @param acc_multiplier Acceleration cap multiplier
   * @param color Base color hex string
   * @param opacity Alpha value for rendering
   * @param show_path Whether to show trail path
   * @param trail_color RGB color of the trail
   * @returns Debug values for on-screen display
   */
  update(
    ctx: CanvasRenderingContext2D,
    deltaT: DOMHighResTimeStamp,
    cohesion_factor = 1,
    repulsion_factor = 1,
    alignment_factor = 1,
    visibility_input = 1,
    acc_multiplier = 1,
    color: string,
    opacity = 0.75,
    show_path: boolean,
    trail_color: rgb
  ) {
    this.BoundingClient = this.canvas.getBoundingClientRect();

    this.VISIBILITY_FACTOR = 0.35 * visibility_input;
    this.COHESION_FACTOR = 0.25 * cohesion_factor;
    this.ALIGNMENT_FACTOR = 0.75 * alignment_factor;
    this.REPULSION_FACTOR = 2.5 * repulsion_factor;
    this.ACC_CAP_MULTIPLIER = acc_multiplier;

    this.setConstants();

    this.acc.x = this.acc.y = 0;

    this.repelWall();
    this.handleWallCollision();

    this.accumulateRepulsion();
    this.accumulateAlignment();
    this.accumulateCohesion();

    this.capAcceleration();
    this.setVelocity(deltaT);

    this.capAndScaleVelocity();
    this.setPosition(deltaT);

    const colorWithOpacity = getColorWithOpacity(color, opacity);

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = colorWithOpacity;
    ctx.fill();

    this.manageTrail(ctx, show_path, trail_color, opacity);

    return {
      cohesion_v: this.COHESION_FACTOR,
      repulsion_v: this.REPULSION_FACTOR,
      alignment_v: this.ALIGNMENT_FACTOR,
      visibility_v: this.VISIBILITY_RADIUS,
      acc_cap_multiplier: this.MAX_ACCELERATION,
      color_v: colorWithOpacity,
    };
  }

  /**
   * Handles rendering of the boid's trail if enabled.
   */
  private manageTrail(
    ctx: CanvasRenderingContext2D,
    show_path: boolean,
    trail_color: rgb,
    opacity: number
  ) {
    if (this.POS_BUFFER.length >= this.POS_BUFFER_CAPACITY) this.POS_BUFFER.shift();
    if (this.POS_BUFFER.length < this.POS_BUFFER_CAPACITY)
      this.POS_BUFFER.push(new Vector2D(this.pos.x, this.pos.y));

    if (show_path) {
      this.POS_BUFFER.forEach((p, i) => {
        if (i > this.radius * 2) {
          const lastPos = this.POS_BUFFER[i - 1];
          ctx.beginPath();
          ctx.moveTo(lastPos.x, lastPos.y);
          ctx.lineTo(p.x, p.y);

          ctx.strokeStyle = reduceOpacity_ManageLightness(trail_color, opacity, 1 - i / this.POS_BUFFER_CAPACITY);
          ctx.stroke();
        }
      });
    }
  }

  /**
   * Updates acceleration and visibility constants.
   */
  private setConstants() {
    this.VISIBILITY_RADIUS = 2 * this.VISIBILITY_FACTOR * this.radius;
    this.MAX_ACCELERATION *= this.ACC_CAP_MULTIPLIER;
  }

  /**
   * Caps acceleration vector magnitude while preserving direction.
   */
  private capAcceleration() {
    const acc_magnitude = Vector2D.magnitude(this.acc);

    if (acc_magnitude > this.MAX_ACCELERATION) {
      this.acc.scale(this.MAX_ACCELERATION / acc_magnitude);
    }
  }

  /**
   * Caps velocity within bounds [MIN_SPEED, MAX_SPEED].
   0000*/
  private capAndScaleVelocity() {
    const velocity_magnitude = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);

    if (velocity_magnitude > this.MAX_SPEED) {
      this.vel.scale(this.MAX_SPEED / velocity_magnitude);
    } else if (velocity_magnitude < this.MIN_SPEED) {
      this.vel.scale(this.MIN_SPEED / velocity_magnitude);
    }
  }

  /**
   * Applies alignment behavior based on nearby boids.
   */
  private accumulateAlignment() {
    let sumX = 0, sumY = 0, count = 0;

    this.boids.forEach((boid) => {
      const dist = this.distance(this, boid);
      if (boid !== this && dist < this.VISIBILITY_RADIUS) {
        sumX += boid.vel.x;
        sumY += boid.vel.y;
        count++;
      }
    });

    if (count) {
      const avg = new Vector2D(sumX / count, sumY / count);
      const delta = Vector2D.getDifference(avg, this.vel);
      this.acc.setScaledAddition(delta, this.ALIGNMENT_FACTOR);
    }
  }

  /**
   * Applies cohesion behavior based on nearby boids.
   */
  private accumulateCohesion() {
    let sumX = 0, sumY = 0, count = 0;

    this.boids.forEach((boid) => {
      const dist = this.distance(this, boid);
      if (boid !== this && dist < this.VISIBILITY_RADIUS) {
        sumX += boid.pos.x;
        sumY += boid.pos.y;
        count++;
      }
    });

    if (count) {
      const com = new Vector2D(sumX / count, sumY / count);
      const delta = Vector2D.getDifference(com, this.pos);
      this.acc.setScaledAddition(delta, this.COHESION_FACTOR);
    }
  }

  /**
   * Applies repulsion behavior from nearby boids.
   */
  private accumulateRepulsion() {
    this.boids.forEach((boid) => {
      const dist = this.distance(this, boid);
      if (boid !== this && dist < this.VISIBILITY_RADIUS) {
        const force = this.REPULSION_FACTOR / (dist + 1);
        const dir = new Vector2D(this.pos.x - boid.pos.x, this.pos.y - boid.pos.y);
        dir.scale(force);
        this.acc.add(dir);
      }
    });
  }

  /**
   * Applies repulsion force when close to canvas walls.
   */
  private repelWall() {
    const zone = 100;
    const force = this.WALL_REPULSION_FORCE;

    if (this.pos.x < zone) this.vel.x += ((zone - this.pos.x) / zone) * force;
    else if (this.pos.x > this.BoundingClient.width - zone)
      this.vel.x -= ((this.pos.x - (this.BoundingClient.width - zone)) / zone) * force;

    if (this.pos.y < zone) this.vel.y += ((zone - this.pos.y) / zone) * force;
    else if (this.pos.y > this.BoundingClient.height - zone)
      this.vel.y -= ((this.pos.y - (this.BoundingClient.height - zone)) / zone) * force;
  }

  /**
   * Bounces the boid off canvas walls.
   */
  private handleWallCollision() {
    const { width, height } = this.BoundingClient;

    if (this.pos.x + this.radius > width) {
      this.pos.x = width - this.radius;
      this.vel.x *= -1.02;
    } else if (this.pos.x - this.radius < 0) {
      this.pos.x = this.radius;
      this.vel.x *= -1.03;
    }

    if (this.pos.y + this.radius > height) {
      this.pos.y = height - this.radius;
      this.vel.y *= -1.04;
    } else if (this.pos.y - this.radius < 0) {
      this.pos.y = this.radius;
      this.vel.y *= -1.03;
    }
  }

  /**
   * Updates position: `pos += vel * Δt`
   */
  private setPosition(deltaT: number) {
    this.pos.setScaledAddition(this.vel, deltaT);
  }

  /**
   * Updates velocity: `vel += acc * Δt`
   */
  private setVelocity(deltaT: number) {
    this.vel.setScaledAddition(this.acc, deltaT);
  }

  /**
   * Calculates Euclidean distance between two boids.
   */
  private distance(b1: Boid, b2: Boid): number {
    return Math.hypot(b1.pos.x - b2.pos.x, b1.pos.y - b2.pos.y);
  }
}
