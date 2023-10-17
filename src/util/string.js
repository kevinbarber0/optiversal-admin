export const stringContainsAny = (text, keywords) => {
  const searchText = text.toLowerCase();
  for (let i = 0; i < keywords.length; i++) {
    if (searchText.indexOf(keywords[i]) >= 0) {
      return true;
    }
  }
  return false;
};

export const removeEmptyLinks = (text) => {
  let final = text.replace(/<a href="#">/gi, '');
  final = final.replace(/<\/a>/i, '');
  return final;
};

export const removeNonAlphaNumericMinusSpaces = (text) => {
  return text.replace(/[^\w\s]/gi, '');
};

export const removeNonAlphaNumeric = (text) => {
  return text.replace(/[^\w]/gi, '');
};

// Standard suffix manipulations.
var step2list = {
  ational: 'ate',
  tional: 'tion',
  enci: 'ence',
  anci: 'ance',
  izer: 'ize',
  bli: 'ble',
  alli: 'al',
  entli: 'ent',
  eli: 'e',
  ousli: 'ous',
  ization: 'ize',
  ation: 'ate',
  ator: 'ate',
  alism: 'al',
  iveness: 'ive',
  fulness: 'ful',
  ousness: 'ous',
  aliti: 'al',
  iviti: 'ive',
  biliti: 'ble',
  logi: 'log',
};

var step3list = {
  icate: 'ic',
  ative: '',
  alize: 'al',
  iciti: 'ic',
  ical: 'ic',
  ful: '',
  ness: '',
};

// Consonant-vowel sequences.
var consonant = '[^aeiou]';
var vowel = '[aeiouy]';
var consonants = '(' + consonant + '[^aeiouy]*)';
var vowels = '(' + vowel + '[aeiou]*)';

var gt0 = new RegExp('^' + consonants + '?' + vowels + consonants);
var eq1 = new RegExp(
  '^' + consonants + '?' + vowels + consonants + vowels + '?$',
);
var gt1 = new RegExp('^' + consonants + '?(' + vowels + consonants + '){2,}');
var vowelInStem = new RegExp('^' + consonants + '?' + vowel);
var consonantLike = new RegExp('^' + consonants + vowel + '[^aeiouwxy]$');

// Exception expressions.
var sfxLl = /ll$/;
var sfxE = /^(.+?)e$/;
var sfxY = /^(.+?)y$/;
var sfxIon = /^(.+?(s|t))(ion)$/;
var sfxEdOrIng = /^(.+?)(ed|ing)$/;
var sfxAtOrBlOrIz = /(at|bl|iz)$/;
var sfxEED = /^(.+?)eed$/;
var sfxS = /^.+?[^s]s$/;
var sfxSsesOrIes = /^.+?(ss|i)es$/;
var sfxMultiConsonantLike = /([^aeiouylsz])\1$/;
var step2 =
  /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
var step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
var step4 =
  /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;

/**
 * Stem `value`.
 *
 * @param {string} value
 * @returns {string}
 */
export const stem = (value) => {
  /** @type {boolean} */
  var firstCharacterWasLowerCaseY;
  /** @type {RegExpMatchArray} */
  var match;

  value = String(value).toLowerCase();

  // Exit early.
  if (value.length < 3) {
    return value;
  }

  // Detect initial `y`, make sure it never matches.
  if (
    value.charCodeAt(0) === 121 // Lowercase Y
  ) {
    firstCharacterWasLowerCaseY = true;
    value = 'Y' + value.slice(1);
  }

  // Step 1a.
  if (sfxSsesOrIes.test(value)) {
    // Remove last two characters.
    value = value.slice(0, -2);
  } else if (sfxS.test(value)) {
    // Remove last character.
    value = value.slice(0, -1);
  }

  // Step 1b.
  if ((match = sfxEED.exec(value))) {
    if (gt0.test(match[1])) {
      // Remove last character.
      value = value.slice(0, -1);
    }
  } else if ((match = sfxEdOrIng.exec(value)) && vowelInStem.test(match[1])) {
    value = match[1];

    if (sfxAtOrBlOrIz.test(value)) {
      // Append `e`.
      value += 'e';
    } else if (sfxMultiConsonantLike.test(value)) {
      // Remove last character.
      value = value.slice(0, -1);
    } else if (consonantLike.test(value)) {
      // Append `e`.
      value += 'e';
    }
  }

  // Step 1c.
  if ((match = sfxY.exec(value)) && vowelInStem.test(match[1])) {
    // Remove suffixing `y` and append `i`.
    value = match[1] + 'i';
  }

  // Step 2.
  if ((match = step2.exec(value)) && gt0.test(match[1])) {
    value = match[1] + step2list[match[2]];
  }

  // Step 3.
  if ((match = step3.exec(value)) && gt0.test(match[1])) {
    value = match[1] + step3list[match[2]];
  }

  // Step 4.
  if ((match = step4.exec(value))) {
    if (gt1.test(match[1])) {
      value = match[1];
    }
  } else if ((match = sfxIon.exec(value)) && gt1.test(match[1])) {
    value = match[1];
  }

  // Step 5.
  if (
    (match = sfxE.exec(value)) &&
    (gt1.test(match[1]) ||
      (eq1.test(match[1]) && !consonantLike.test(match[1])))
  ) {
    value = match[1];
  }

  if (sfxLl.test(value) && gt1.test(value)) {
    value = value.slice(0, -1);
  }

  // Turn initial `Y` back to `y`.
  if (firstCharacterWasLowerCaseY) {
    value = 'y' + value.slice(1);
  }

  return value;
};

export const revertSingularOrPlural = (str) => {
  const plural = {
    '(quiz)$': '$1zes',
    '^(ox)$': '$1en',
    '([m|l])ouse$': '$1ice',
    '(matr|vert|ind)ix|ex$': '$1ices',
    '(x|ch|ss|sh)$': '$1es',
    '([^aeiouy]|qu)y$': '$1ies',
    '(hive)$': '$1s',
    '(?:([^f])fe|([lr])f)$': '$1$2ves',
    '(shea|lea|loa|thie)f$': '$1ves',
    sis$: 'ses',
    '([ti])um$': '$1a',
    '(tomat|potat|ech|her|vet)o$': '$1oes',
    '(bu)s$': '$1ses',
    '(alias)$': '$1es',
    '(octop)us$': '$1i',
    '(ax|test)is$': '$1es',
    '(us)$': '$1es',
    '([^s]+)$': '$1s',
  };

  const singular = {
    '(quiz)zes$': '$1',
    '(matr)ices$': '$1ix',
    '(vert|ind)ices$': '$1ex',
    '^(ox)en$': '$1',
    '(alias)es$': '$1',
    '(octop|vir)i$': '$1us',
    '(cris|ax|test)es$': '$1is',
    '(shoe)s$': '$1',
    '(o)es$': '$1',
    '(bus)es$': '$1',
    '([m|l])ice$': '$1ouse',
    '(x|ch|ss|sh)es$': '$1',
    '(m)ovies$': '$1ovie',
    '(s)eries$': '$1eries',
    '([^aeiouy]|qu)ies$': '$1y',
    '([lr])ves$': '$1f',
    '(tive)s$': '$1',
    '(hive)s$': '$1',
    '(li|wi|kni)ves$': '$1fe',
    '(shea|loa|lea|thie)ves$': '$1f',
    '(^analy)ses$': '$1sis',
    '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': '$1$2sis',
    '([ti])a$': '$1um',
    '(n)ews$': '$1ews',
    '(h|bl)ouses$': '$1ouse',
    '(corpse)s$': '$1',
    '(us)es$': '$1',
    s$: '',
  };

  const irregular = {
    move: 'moves',
    foot: 'feet',
    goose: 'geese',
    sex: 'sexes',
    child: 'children',
    man: 'men',
    tooth: 'teeth',
    person: 'people',
  };

  const uncountable = [
    'sheep',
    'fish',
    'deer',
    'moose',
    'series',
    'species',
    'money',
    'rice',
    'information',
    'equipment',
    'bison',
    'cod',
    'offspring',
    'pike',
    'salmon',
    'shrimp',
    'swine',
    'trout',
    'aircraft',
    'hovercraft',
    'spacecraft',
    'sugar',
    'tuna',
    'you',
    'wood',
  ];

  // save some time in the case that singular and plural are the same
  if (uncountable.indexOf(str.toLowerCase()) >= 0) return str;

  // check for irregular forms
  for (const word in irregular) {
    let pattern = new RegExp(irregular[word] + '$', 'i');
    if (pattern.test(str)) {
      const replace = word;
      return str.replace(pattern, replace);
    } else {
      pattern = new RegExp(word + '$', 'i');

      if (pattern.test(str)) {
        const replace = irregular[word];
        return str.replace(pattern, replace);
      }
    }
  }

  // check for matches using regular expressions
  for (const reg in plural) {
    const pattern = new RegExp(reg, 'i');

    if (pattern.test(str)) return str.replace(pattern, plural[reg]);
  }

  for (const reg in singular) {
    const pattern = new RegExp(reg, 'i');

    if (pattern.test(str)) return str.replace(pattern, singular[reg]);
  }

  return str;
};
