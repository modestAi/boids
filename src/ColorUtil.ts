/**
 * Represents an RGB color.
 */
export type rgb = {
  r: number;
  g: number;
  b: number;
};

/**
 * Represents an HSL color.
 */
type hsl = {
  h: number;
  s: number;
  l: number;
};

let min_disable = 220;
let max_disable = 280;

/**
 * Computes a suitable hue that avoids a specific range.
 * @param hue - Original hue value (0–360)
 * @returns A new hue that avoids the disabled hue range
 */
function getHueForTrail(hue: number): number {
  let hue2 = hue;
  if (hue > min_disable && hue < max_disable) {
    hue2 += (max_disable - hue) + min_disable;
  } else {
    hue2 += 100;
  }
  return hue2 % 360;
}

/**
 * Converts a 6-digit hex color string to an RGB object.
 * @param hexCol - A hex string like '#FFAA00'
 * @returns An RGB color object
 */
function hexToRgb(hexCol: string): rgb {
  const red = parseInt(hexCol.substring(1, 3), 16);
  const green = parseInt(hexCol.substring(3, 5), 16);
  const blue = parseInt(hexCol.substring(5, 7), 16);
  return { r: red, g: green, b: blue };
}

/**
 * Converts a hex color string to HSL.
 * @param hex - A 6-digit hex color string, with or without the `#`
 * @returns An HSL object with hue, saturation, and lightness
 */
function hexToHsl(hex: string): hsl {
  hex = hex.replace(/^#/, "");
  if (hex.length !== 6) {
    throw new Error("hexToHsl: Only 6-digit hex values are supported");
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r: h = ((g - b) / delta) % 6; break;
      case g: h = (b - r) / delta + 2; break;
      case b: h = (r - g) / delta + 4; break;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h),
    s: +(s * 100).toFixed(1),
    l: +(l * 100).toFixed(1)
  };
}

/**
 * Converts an HSL color to an RGB color.
 * @param hsl_col - HSL color object
 * @returns RGB color object
 */
function hslToRgb(hsl_col: hsl): rgb {
  let { h, s, l } = hsl_col;
  s /= 100;
  l /= 100;

  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - C / 2;

  let r1: number, g1: number, b1: number;

  if (h < 60) [r1, g1, b1] = [C, X, 0];
  else if (h < 120) [r1, g1, b1] = [X, C, 0];
  else if (h < 180) [r1, g1, b1] = [0, C, X];
  else if (h < 240) [r1, g1, b1] = [0, X, C];
  else if (h < 300) [r1, g1, b1] = [X, 0, C];
  else[r1, g1, b1] = [C, 0, X];

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  return { r, g, b };
}


//TODO: Implement
/**
 * Generates a color based on the original hex string with adjusted hue.
 * @param str - A hex color string
 * @returns An RGB object with the modified hue
 */
export function getTrailColor(str: string): rgb {
  let { h, s, l } = hexToHsl(str);
  let new_hue = getHueForTrail(h);
  return hslToRgb({ h: new_hue, s, l });
}


/**
 * Adds opacity to a hex color and returns an `rgba(...)` string.
 * @param hexColor - A 6-digit hex color string
 * @param opacity - Opacity value between 0 and 1
 * @returns An rgba(...) string
 */
export function getColorWithOpacity(hexColor: string, opacity: number): string {
  const rgbCol: rgb = hexToRgb(hexColor);
  const { r, g, b, a } = { r: rgbCol.r, g: rgbCol.g, b: rgbCol.b, a: opacity };
  return `rgba(${[r, g, b, a].join(",")})`;
}


/**
 * Reduces the opacity of a given RGB value and returns an `rgba(...)` string.
 * @param val - RGB color object
 * @param opacity - Initial opacity (0–1)
 * @param subFactor - Amount to subtract from opacity(0-1).
 * @returns An rgba(...) string with reduced opacity
 */
export function reduceOpacity(val: rgb, opacity: number, subFactor: number): string {
  let { r, g, b } = val;
  let alpha = opacity * (1 - subFactor);
  return `rgba(${[r, g, b, alpha].join(",")})`;
}


