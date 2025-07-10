export class Vector2D {

  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  setScaledAddition(v: Vector2D, scale: number): this {
    this.x += v.x * scale;
    this.y += v.y * scale;
    return this;
  }

  setScaledDifference(v: Vector2D, scale: number): this {
    this.x -= v.x * scale;
    this.y -= v.y * scale;
    return this;
  }

  add(v: Vector2D): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector2D): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(n: number): this {
    this.x *= n;
    this.y *= n;
    return this;
  }

  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  static getDifference(v1: Vector2D, v2: Vector2D): Vector2D {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }

  static getAddition(v1: Vector2D, v2: Vector2D): Vector2D {
    return new Vector2D(v1.x + v2.x, v1.y + v2.y);
  }

  static magnitude(v: Vector2D): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2);
  }

  static distance(v1: Vector2D, v2: Vector2D): number {
    return Math.hypot(v1.x - v2.x, v1.y - v2.y);
  }
}
