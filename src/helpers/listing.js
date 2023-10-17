export const getRating = (totalCount, errorCount, warningCount) => {
  const errorPenalty = 50 / totalCount;
  const warningPenalty = errorPenalty / 2;
  const score = 100 - errorPenalty * errorCount - warningPenalty * warningCount;

  if (score < 60) {
    return 'F';
  } else if (score < 63) {
    return 'D-';
  } else if (score < 67) {
    return 'D';
  } else if (score < 70) {
    return 'D+';
  } else if (score < 73) {
    return 'C-';
  } else if (score < 77) {
    return 'C';
  } else if (score < 80) {
    return 'C+';
  } else if (score < 83) {
    return 'B-';
  } else if (score < 87) {
    return 'B';
  } else if (score < 90) {
    return 'B+';
  } else if (score < 93) {
    return 'A-';
  } else if (score < 97) {
    return 'A';
  } else {
    return 'A+';
  }
};

export const getScoreBackground = (score) =>
  score > 80
    ? 'rgba(8, 143, 143, 0.7)'
    : score > 60
    ? 'rgba(245, 128, 62, 0.7)'
    : 'rgba(210, 43, 43, 0.7)';
