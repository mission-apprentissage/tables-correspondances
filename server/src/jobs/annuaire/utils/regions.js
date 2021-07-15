const regions = [
  {
    code: "00",
    nom: "Collectivités d'outre-mer",
    departements: [
      { code: "987", nom: "Polynésie Française" },
      { code: "988", nom: "Nouvelle-Calédonie" },
      { code: "989", nom: "Île de Clipperton" },
      { code: "984", nom: "Terres australes et antarctiques françaises" },
      { code: "986", nom: "Wallis et Futuna" },
      { code: "975", nom: "Saint-Pierre-et-Miquelon" },
      { code: "977", nom: "Saint-Barthélemy" },
      { code: "978", nom: "Saint-Martin" },
    ],
  },
  { code: "01", nom: "Guadeloupe", departements: [{ code: "971", nom: "Guadeloupe" }] },
  { code: "02", nom: "Martinique", departements: [{ code: "972", nom: "Martinique" }] },
  { code: "03", nom: "Guyane", departements: [{ code: "973", nom: "Guyane" }] },
  { code: "04", nom: "La Réunion", departements: [{ code: "974", nom: "La Réunion" }] },
  { code: "06", nom: "Mayotte", departements: [{ code: "976", nom: "Mayotte" }] },
  {
    code: "11",
    nom: "Île-de-France",
    departements: [
      { code: "75", nom: "Paris" },
      { code: "77", nom: "Seine-et-Marne" },
      { code: "78", nom: "Yvelines" },
      { code: "91", nom: "Essonne" },
      { code: "92", nom: "Hauts-de-Seine" },
      { code: "93", nom: "Seine-Saint-Denis" },
      { code: "94", nom: "Val-de-Marne" },
      { code: "95", nom: "Val-d'Oise" },
    ],
  },
  {
    code: "24",
    nom: "Centre-Val de Loire",
    departements: [
      { code: "28", nom: "Eure-et-Loir" },
      { code: "36", nom: "Indre" },
      { code: "37", nom: "Indre-et-Loire" },
      { code: "41", nom: "Loir-et-Cher" },
      { code: "45", nom: "Loiret" },
      { code: "18", nom: "Cher" },
    ],
  },
  {
    code: "27",
    nom: "Bourgogne-Franche-Comté",
    departements: [
      { code: "70", nom: "Haute-Saône" },
      { code: "71", nom: "Saône-et-Loire" },
      { code: "89", nom: "Yonne" },
      { code: "90", nom: "Territoire de Belfort" },
      { code: "39", nom: "Jura" },
      { code: "21", nom: "Côte-d'Or" },
      { code: "25", nom: "Doubs" },
      { code: "58", nom: "Nièvre" },
    ],
  },
  {
    code: "28",
    nom: "Normandie",
    departements: [
      { code: "76", nom: "Seine-Maritime" },
      { code: "27", nom: "Eure" },
      { code: "50", nom: "Manche" },
      { code: "14", nom: "Calvados" },
      { code: "61", nom: "Orne" },
    ],
  },
  {
    code: "32",
    nom: "Hauts-de-France",
    departements: [
      { code: "80", nom: "Somme" },
      { code: "02", nom: "Aisne" },
      { code: "59", nom: "Nord" },
      { code: "60", nom: "Oise" },
      { code: "62", nom: "Pas-de-Calais" },
    ],
  },
  {
    code: "44",
    nom: "Grand Est",
    departements: [
      { code: "88", nom: "Vosges" },
      { code: "08", nom: "Ardennes" },
      { code: "10", nom: "Aube" },
      { code: "51", nom: "Marne" },
      { code: "52", nom: "Haute-Marne" },
      { code: "54", nom: "Meurthe-et-Moselle" },
      { code: "55", nom: "Meuse" },
      { code: "57", nom: "Moselle" },
      { code: "67", nom: "Bas-Rhin" },
      { code: "68", nom: "Haut-Rhin" },
    ],
  },
  {
    code: "52",
    nom: "Pays de la Loire",
    departements: [
      { code: "72", nom: "Sarthe" },
      { code: "85", nom: "Vendée" },
      { code: "44", nom: "Loire-Atlantique" },
      { code: "49", nom: "Maine-et-Loire" },
      { code: "53", nom: "Mayenne" },
    ],
  },
  {
    code: "53",
    nom: "Bretagne",
    departements: [
      { code: "29", nom: "Finistère" },
      { code: "35", nom: "Ille-et-Vilaine" },
      { code: "22", nom: "Côtes-d'Armor" },
      { code: "56", nom: "Morbihan" },
    ],
  },
  {
    code: "75",
    nom: "Nouvelle-Aquitaine",
    departements: [
      { code: "79", nom: "Deux-Sèvres" },
      { code: "86", nom: "Vienne" },
      { code: "87", nom: "Haute-Vienne" },
      { code: "33", nom: "Gironde" },
      { code: "40", nom: "Landes" },
      { code: "47", nom: "Lot-et-Garonne" },
      { code: "16", nom: "Charente" },
      { code: "17", nom: "Charente-Maritime" },
      { code: "19", nom: "Corrèze" },
      { code: "23", nom: "Creuse" },
      { code: "24", nom: "Dordogne" },
      { code: "64", nom: "Pyrénées-Atlantiques" },
    ],
  },
  {
    code: "76",
    nom: "Occitanie",
    departements: [
      { code: "81", nom: "Tarn" },
      { code: "82", nom: "Tarn-et-Garonne" },
      { code: "30", nom: "Gard" },
      { code: "31", nom: "Haute-Garonne" },
      { code: "32", nom: "Gers" },
      { code: "34", nom: "Hérault" },
      { code: "46", nom: "Lot" },
      { code: "48", nom: "Lozère" },
      { code: "09", nom: "Ariège" },
      { code: "11", nom: "Aude" },
      { code: "12", nom: "Aveyron" },
      { code: "65", nom: "Hautes-Pyrénées" },
      { code: "66", nom: "Pyrénées-Orientales" },
    ],
  },
  {
    code: "84",
    nom: "Auvergne-Rhône-Alpes",
    departements: [
      { code: "73", nom: "Savoie" },
      { code: "74", nom: "Haute-Savoie" },
      { code: "26", nom: "Drôme" },
      { code: "38", nom: "Isère" },
      { code: "42", nom: "Loire" },
      { code: "43", nom: "Haute-Loire" },
      { code: "01", nom: "Ain" },
      { code: "03", nom: "Allier" },
      { code: "07", nom: "Ardèche" },
      { code: "15", nom: "Cantal" },
      { code: "63", nom: "Puy-de-Dôme" },
      { code: "69", nom: "Rhône" },
    ],
  },
  {
    code: "93",
    nom: "Provence-Alpes-Côte d'Azur",
    departements: [
      { code: "83", nom: "Var" },
      { code: "84", nom: "Vaucluse" },
      { code: "04", nom: "Alpes-de-Haute-Provence" },
      { code: "05", nom: "Hautes-Alpes" },
      { code: "06", nom: "Alpes-Maritimes" },
      { code: "13", nom: "Bouches-du-Rhône" },
    ],
  },
  {
    code: "94",
    nom: "Corse",
    departements: [
      { code: "20", nom: "Corse" },
      { code: "2A", nom: "Corse-du-Sud" },
      { code: "2B", nom: "Haute-Corse" },
    ],
  },
];

function findRegionByUai(uai) {
  if (!uai) {
    return null;
  }

  let metropole = ["0", "6", "7"].includes(uai.substring(0, 1));
  let found = regions.find((region) => {
    let code = metropole ? uai.substring(1, 3) : uai.substring(0, 3);
    return region.departements.map((d) => d.code).includes(code);
  });

  return found || null;
}

function findRegionByName(name) {
  if (!name) {
    return null;
  }

  let found = regions.find((region) => region.nom === name);

  return found || null;
}

module.exports = {
  findRegionByUai,
  findRegionByName,
};
