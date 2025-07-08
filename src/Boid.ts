import { Vector2D } from "./Vector2D";

export class Boid {

  MIN_SPEED = 300;
  MAX_ACCELERATION = 260;

  COHESION_FACTOR = 0;
  ALIGNMENT_FACTOR = 0
  REPULSION_FACTOR = 0;
  VISIBILITY_FACTOR = 0;
  VISIBILITY_RADIUS;
  MAX_SPEED = 400;
  acc_cap_multiplier = 1;
  WALL_REPULSION_FORCE = 70;
  POS_BUFFER_CAPACITY = 50;

  pos_buffer: Vector2D[] = [];

  pos: Vector2D = new Vector2D();
  vel: Vector2D = new Vector2D();
  acc: Vector2D = new Vector2D();

  boids: Boid[];
  radius: number;
  canvas: HTMLCanvasElement;

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
  }

  //* Called Every Frame
  update(
    ctx: CanvasRenderingContext2D,
    deltaT: DOMHighResTimeStamp,
    cohesion_factor: number = 1,
    repulsion_factor: number = 1,
    alignment_factor: number = 1,
    visibility_input: number = 1,
    acc_multiplier: number = 1,
    color: string,
    opacity: number = 0.75,
    show_path: boolean
  ) {

    //! Initialize Constants with user input
    this.VISIBILITY_FACTOR = 0.35 * visibility_input;
    this.COHESION_FACTOR = 0.25 * cohesion_factor;
    this.ALIGNMENT_FACTOR = 0.75 * alignment_factor;
    this.REPULSION_FACTOR = 2.5 * repulsion_factor;
    this.acc_cap_multiplier = acc_multiplier;

    this.setConstants(); //!Set VISIBILITY_RADIUS

    //! recalibrate force vec for this frame, do n_o_t
    //! use  prev. because history is tracked by vel vec.
    this.acc.x = 0;
    this.acc.y = 0;



    //!Handle Wall Physics
    this.repelWall();
    this.handleWallCollision();

    //! boids algo.
    this.accumulateRepulsion();
    this.accumulateAlignment();
    this.accumulateCohesion();

    this.capAcceleration(); //! cap acceleration so that the kick isn't too big to vel. vec

    //!Δvel = (acc)*(Δt) ---> vel+=Δvel
    this.setVelocity(deltaT);
    this.capAndScaleVelocity(); //! cap velocity so that the kick isn't too big to pos. vec and prevent jitters

    //!Δx = (vel)*(Δt) ---> x+=Δx
    this.setPosition(deltaT);

    const colorWithOpacity = getColorWithOpacity(color, opacity);   //! Set opacity  to color from input

    //! Render boid
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = colorWithOpacity;
    ctx.fill();

    this.manageTrail(ctx, show_path);

    return {
      cohesion_v: this.COHESION_FACTOR,
      repulsion_v: this.REPULSION_FACTOR,
      alignment_v: this.ALIGNMENT_FACTOR,
      visibility_v: this.VISIBILITY_RADIUS,
      acc_cap_multiplier: this.MAX_ACCELERATION,
      color_v: colorWithOpacity,
    };

  }

  private manageTrail(ctx: CanvasRenderingContext2D, show_path: boolean) {

    if (this.pos_buffer.length >= this.POS_BUFFER_CAPACITY) this.pos_buffer.shift();
    else this.pos_buffer.push(new Vector2D(this.pos.x, this.pos.y));

    if (show_path) {
      this.pos_buffer.forEach((p, i) => {
        if (i > 10) {
          let lastPos = this.pos_buffer[i - 1];
          ctx.beginPath();
          ctx.moveTo(lastPos.x, lastPos.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = reduceOpacity({ r: 224, g: 23, b: 123 }, 1, i / 1000);
          ctx.stroke();
        }
      });
    }
  }

  setConstants() {
    this.VISIBILITY_RADIUS = 2 * this.VISIBILITY_FACTOR * this.radius;
    this.MAX_ACCELERATION *= this.acc_cap_multiplier;
  }

  capAcceleration() {
    const mag = Vector2D.magnitude(this.acc);

    if (mag > this.MAX_ACCELERATION) {
      this.acc.scale(this.MAX_ACCELERATION / mag);
    }
  }

  capAndScaleVelocity() {
    const mag = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);

    if (mag > this.MAX_SPEED) {
      this.vel.scale(this.MAX_SPEED / mag);
    } else if (mag < this.MIN_SPEED) {
      this.vel.scale(this.MIN_SPEED / mag);
    }
  }

  private accumulateAlignment() {
    let summation_vector_x = 0;
    let summation_vector_y = 0;

    let visible_boids = 0;

    this.boids.forEach((boid) => {
      let dist = this.distance(this, boid);

      if (this != boid && dist < this.VISIBILITY_RADIUS) {
        summation_vector_x += boid.vel.x;
        summation_vector_y += boid.vel.y;
        visible_boids++;
      }
    });

    if (visible_boids !== 0) {
      const vel = new Vector2D(
        summation_vector_x / visible_boids,
        summation_vector_y / visible_boids
      );
      const posVec = Vector2D.getDifference(vel, this.vel);
      this.acc.setScaledAddition(posVec, this.ALIGNMENT_FACTOR);
    }
  }

  private accumulateCohesion() {
    let sumPosX = 0;
    let sumPosY = 0;

    let visible_boids = 0;

    this.boids.forEach((boid) => {
      let dist = this.distance(this, boid);
      if (this !== boid && dist < this.VISIBILITY_RADIUS) {
        sumPosX += boid.pos.x;
        sumPosY += boid.pos.y;
        visible_boids++;
      }
    });

    if (visible_boids !== 0) {
      const com = new Vector2D(
        sumPosX / visible_boids,
        sumPosY / visible_boids
      );
      const posV = Vector2D.getDifference(com, this.pos);
      this.acc.setScaledAddition(posV, this.COHESION_FACTOR);
    }
  }

  private accumulateRepulsion() {
    this.boids.forEach((boid) => {
      const dist = this.distance(this, boid);
      if (dist < this.VISIBILITY_RADIUS && boid !== this) {
        const factor = this.REPULSION_FACTOR / (dist + 1);
        const dir = new Vector2D(
          this.pos.x - boid.pos.x,
          this.pos.y - boid.pos.y
        );
        dir.scale(factor);
        this.acc.add(dir);
      }
    });
  }

  repelWall() {
    const { width, height } = this.canvas;
    const repulsionZone = 100;
    const wallForce = this.WALL_REPULSION_FORCE;

    // Left wall
    if (this.pos.x < repulsionZone) {
      const forceStrength = (repulsionZone - this.pos.x) / repulsionZone;
      this.vel.x += forceStrength * wallForce;
    }
    // Right wall
    else if (this.pos.x > width - repulsionZone) {
      const forceStrength =
        (this.pos.x - (width - repulsionZone)) / repulsionZone;
      this.vel.x -= forceStrength * wallForce;
    }

    // Top wall
    if (this.pos.y < repulsionZone) {
      const forceStrength = (repulsionZone - this.pos.y) / repulsionZone;
      this.vel.y += forceStrength * wallForce;
    }
    // Bottom wall
    else if (this.pos.y > height - repulsionZone) {
      const forceStrength = (this.pos.y - (height - repulsionZone)) / repulsionZone;
      this.vel.y -= forceStrength * wallForce;
    }
  }

  private handleWallCollision() {
    const { width, height } = this.canvas;

    // X bounds
    if (this.pos.x + this.radius > width) {
      this.pos.x = width - this.radius;
      this.vel.x *= -1.02;
    } else if (this.pos.x - this.radius < 0) {
      this.pos.x = this.radius;
      this.vel.x *= -1.03;
    }

    // Y bounds
    if (this.pos.y + this.radius > height) {
      this.pos.y = height - this.radius;
      this.vel.y *= -1.04;
    } else if (this.pos.y - this.radius < 0) {
      this.pos.y = this.radius;
      this.vel.y *= -1.03;
    }
  }

  private setPosition(deltaT: number) {
    this.pos.setScaledAddition(this.vel, deltaT);
  }

  private setVelocity(deltaT: number) {
    this.vel.setScaledAddition(this.acc, deltaT);
  }

  distance(b1: Boid, b2: Boid) {
    return Math.sqrt((b1.pos.x - b2.pos.x) ** 2 + (b1.pos.y - b2.pos.y) ** 2);
  }
}

type rgb = {
  r: number;
  g: number;
  b: number;
};

function getColorWithOpacity(hexColor: string, opacity: number): string {
  const rgbCol: rgb = hexColToRgbCol(hexColor);
  const { r, g, b, a } = { r: rgbCol.r, g: rgbCol.g, b: rgbCol.b, a: opacity };
  return `rgba(${[r, g, b, a].join(",")})`;
}

function hexColToRgbCol(hexCol: string): rgb {
  const red = parseInt(hexCol.substring(1, 3), 16);
  const green = parseInt(hexCol.substring(3, 5), 16);
  const blue = parseInt(hexCol.substring(5, 7), 16);
  return { r: red, g: green, b: blue };
}

function reduceOpacity(val: rgb, opacity: number, subFactor: number) {

  const { r, g, b } = val;
  const a = opacity - subFactor;


  return `rgba(${[r, g, b, a].join(",")})`;

}
