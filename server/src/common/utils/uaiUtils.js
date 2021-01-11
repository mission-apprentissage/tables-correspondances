const ALPHABET_23_LETTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

module.exports = {
  validateUAI: (code) => {
    if (!code || code.length !== 8) {
      return false;
    }

    //https://blog.juliendelmas.fr/?qu-est-ce-que-le-code-rne-ou-uai
    let numbers = code.substring(0, 7);
    let checksum = code.substring(7, 8).toLowerCase();

    let res = ALPHABET_23_LETTERS[numbers % 23];
    return res === checksum;
  },
};
