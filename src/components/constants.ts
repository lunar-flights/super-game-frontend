export const TILE_ORIGINAL_WIDTH = 590;
export const TILE_ORIGINAL_HEIGHT = 371;
export const BASE_ORIGINAL_HEIGHT = 480;

export const TILE_DISPLAY_WIDTH = 256;

export const ASPECT_RATIO = TILE_ORIGINAL_HEIGHT / TILE_ORIGINAL_WIDTH;
export const TILE_DISPLAY_HEIGHT = TILE_DISPLAY_WIDTH * ASPECT_RATIO;

export const PLAYER_COLORS: { [key: number]: string } = {
  0: "rgba(255, 0, 0, 0.15)",
  1: "rgba(0, 255, 0, 0.15)",
  2: "rgba(0, 0, 255, 0.15)",
  3: "rgba(255, 255, 0, 0.15)",
};
