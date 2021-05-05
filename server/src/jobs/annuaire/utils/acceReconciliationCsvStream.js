const { oleoduc, readLineByLine, transformIntoCSV, transformData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");

function acceReconciliationCsvStream(input) {
  return oleoduc(
    input,
    readLineByLine(),
    transformData(async (line) => {
      let json = JSON.parse(line);
      if (!json.geojson) {
        return;
      }

      let etablissement = await Annuaire.findOne({
        "adresse.geojson.geometry": {
          $near: {
            $geometry: json.geojson.geometry,
            $maxDistance: 10, //meters
          },
        },
      });

      if (!etablissement) {
        return null;
      }

      return {
        nouvel_uai: etablissement.uais.map((u) => u.uai).includes(json.uai) ? "Oui" : "Non",
        uai: json.uai,
        annuaire_siret: `"${etablissement.siret}"`,
        annuaire_raison_sociale: etablissement.raison_sociale,
        annuaire_adresse: etablissement.adresse.label,
        acce_nom: json.nom,
        acce_denomination: json.denominations.denomination_principale,
        acce_adresse: json.adresse,
        acce_localisation: `${json.localisation.adresse || ""} ${json.localisation.acheminement || ""}`,
      };
    }),
    transformIntoCSV(),
    { promisify: false }
  );
}

module.exports = acceReconciliationCsvStream;
