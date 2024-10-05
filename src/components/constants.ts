export const TILE_ORIGINAL_WIDTH = 590;
export const TILE_ORIGINAL_HEIGHT = 371;
export const BASE_ORIGINAL_HEIGHT = 480;

export const TILE_DISPLAY_WIDTH = 256;

export const ASPECT_RATIO = TILE_ORIGINAL_HEIGHT / TILE_ORIGINAL_WIDTH;
export const TILE_DISPLAY_HEIGHT = TILE_DISPLAY_WIDTH * ASPECT_RATIO;

export const PLAYER_COLORS: { [key: number]: string } = {
  0: "rgba(255, 0, 0, 0.15)",
  1: "rgba(245, 167, 73, 0.2)",
  2: "rgba(44, 166, 55, 0.2)",
  3: "rgba(46, 239, 218, 0.2)",
};

// export const PLAYER_COLORS: { [key: number]: string } = {
//   0: "red",
//   1: "orange",
//   2: "green",
//   3: "blue",
// };
