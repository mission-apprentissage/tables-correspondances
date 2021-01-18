const { oleoduc, transformData } = require("oleoduc");
const csv = require("csv-parse");

module.exports = () => {
  return oleoduc(
    csv({
      delimiter: ";",
      bom: true,
      columns: true,
    }),
    transformData((data) => {
      return {
        siret: data["n° SIRET"],
        uai: Object.values(data)[0], //FIXME impossible d'obtenir la valeur avec data['"code UAI"']
        nom: data["nom"],
      };
    })
  );
};
