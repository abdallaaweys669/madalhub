/**
 * Shared sponsor logo tiles — event detail carousel + organizer create flow.
 * Keep carousel stride math in sync with {@link SPONSOR_TILE_WIDTH} + {@link SPONSOR_TILE_GAP}.
 */
export const SPONSOR_TILE_WIDTH = 96;
export const SPONSOR_TILE_HEIGHT = 74;
export const SPONSOR_TILE_GAP = 16;
export const SPONSOR_TILE_PADDING = 10;
export const SPONSOR_TILE_RADIUS = 14;

export const sponsorCarouselStride = () => SPONSOR_TILE_WIDTH + SPONSOR_TILE_GAP;
