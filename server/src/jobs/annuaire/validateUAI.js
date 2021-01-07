module.exports = (uai) => {
  //https://blog.juliendelmas.fr/?qu-est-ce-que-le-code-rne-ou-uai
  let alphabet = [
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

  let numbers = uai.substring(0, 7);
  let checksum = uai.substring(7, 8).toLowerCase();

  let res = alphabet[numbers % 23];
  return res === checksum;
};
