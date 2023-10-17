export const getOptionNames = (concept) => {
  return [concept.name, ...(concept.expressions || [])]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join('|');
};

export const arrayToString = (arr, separator = '|') => {
  return (arr || []).join(separator);
};

export const stringToArray = (str, separator = '|') => {
  return str
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => !!s);
};
