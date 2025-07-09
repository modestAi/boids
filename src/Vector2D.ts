export class Vector2D {

  x: number = 0;
  y: number = 0;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  setScaledAddition(vector2: Vector2D, scale: number) {
    this.x += vector2.x * scale;
    this.y += vector2.y * scale;
  }

  setScaledDifference(vector2: Vector2D, scale: number) {
    this.x -= vector2.x * scale;
    this.y -= vector2.y * scale;
  }

  add(v: Vector2D) {
    this.x += v.x;
    this.y += v.y;
  }

  sub(v: Vector2D) {
    this.x -= v.x;
    this.y -= v.y;
  }

  scale(n: number) {
    this.x *= n;
    this.y *= n;
  }

  static getDifference(v1: Vector2D, v2: Vector2D) {
    let v3: Vector2D = new Vector2D;
    v3.x = v1.x - v2.x;
    v3.y = v1.y - v2.y;
    return v3;
  }

  static getAddition(v1: Vector2D, v2: Vector2D) {
    let v3: Vector2D = new Vector2D;
    v3.x = v1.x + v2.x;
    v3.y = v1.y + v2.y;
    return v3;
  }

  static magnitude(v: Vector2D) {
    return Math.sqrt(v.x ** 2 + v.y ** 2)
  }
}
