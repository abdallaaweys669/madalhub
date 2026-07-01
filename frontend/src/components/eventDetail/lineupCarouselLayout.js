import { Dimensions } from 'react-native';

/**
 * Shared horizontal carousel sizing — speaker lineup + sponsor logos on event detail.
 */
const CONTENT_PADDING = 40;
const CARD_GAP = 8;
/** ~4 full faces + peek of a 5th on typical phones */
const TARGET_VISIBLE = 4.6;

export function getLineupCarouselMetrics(windowWidth = Dimensions.get('window').width) {
  const trackWidth = windowWidth - CONTENT_PADDING;
  const cardWidth = Math.min(
    78,
    Math.max(64, Math.floor((trackWidth - CARD_GAP * Math.floor(TARGET_VISIBLE)) / TARGET_VISIBLE)),
  );
  const avatarSize = Math.round(cardWidth * 0.84);

  return {
    cardWidth,
    cardGap: CARD_GAP,
    avatarSize,
    itemStride: cardWidth + CARD_GAP,
  };
}
