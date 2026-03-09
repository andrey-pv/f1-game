export const POINTS = {
  CORRECT_WINNER: 25,
  CORRECT_POLE: 15,
  DOUBLE_HIT: 10,
  PERFECT_WEEKEND: 20,
  WINNER_POLE_PODIUM: 5,
  STREAK_3: 15,
  STREAK_5: 30,
  EARLY_BIRD: 2,
}

export function getMaxPoints() {
  return POINTS.CORRECT_WINNER + POINTS.CORRECT_POLE + POINTS.DOUBLE_HIT + POINTS.PERFECT_WEEKEND + POINTS.WINNER_POLE_PODIUM + POINTS.EARLY_BIRD
}

export function calcAccuracy(correct, total) {
  if (!total) return 0
  return Math.round((correct / total) * 100)
}
