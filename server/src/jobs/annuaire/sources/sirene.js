const { oleoduc, transformData, accumulateData, writeData } = require("oleoduc");
const { timeout } = require("../../../common/utils/asyncUtils");
const { Annuaire } = require("../../../common/model");
const ApiSirene = require("../../../common/apis/ApiSirene");
const ApiGeoAdresse = require("../../../common/apis/ApiGeoAdresse");
const datagouv = require("../referentiels/datagouv");
const adresses = require("../utils/adresses");
const categoriesJuridiques = require("../utils/categoriesJuridiques");

function getEtablissementName(e, uniteLegale) {
  return (
    e.enseigne_1 ||
    e.enseigne_2 ||
    e.enseigne_3 ||
    e.denomination_usuelle ||
    uniteLegale.denomination ||
    uniteLegale.denomination_usuelle_1 ||
    uniteLegale.denomination_usuelle_2 ||
    uniteLegale.denomination_usuelle_3 ||
    uniteLegale.nom
  );
}

function getRelationLabel(e, uniteLegale) {
  let nom = getEtablissementName(e, uniteLegale);

  let localisation;
  if (e.code_postal) {
    localisation = `${e.numero_voie || ""} ${e.code_postal || ""} ${e.libelle_commune || ""}`;
  } else {
    localisation = `${e.libelle_commune_etranger || ""} ${e.code_pays_etranger || ""} ${e.libelle_pays_etranger || ""}`;
  }

  return `${nom} ${localisation}`.replace(/ +/g, " ").trim();
}

async function loadOrganismeDeFormations() {
  let organismes = [];
  let referentiel = await datagouv();
  let stream = await referentiel.stream();

  await oleoduc(
    stream,
    accumulateData((acc, data) => [...acc, data.siret], { accumulator: [] }),
    writeData((acc) => (organismes = acc))
  );

  return organismes;
}

module.exports = async (options = {}) => {
  let name = "sirene";
  let api = options.apiSirene || new ApiSirene();
  let { getAdresseFromCoordinates } = adresses(options.apiGeoAdresse || new ApiGeoAdresse());
  let organismes = options.organismes || (await loadOrganismeDeFormations());

  return {
    name,
    stream(options = {}) {
      let filters = options.filters || {};

      return oleoduc(
        Annuaire.find(filters, { siret: 1 }).lean().cursor(),
        transformData(async ({ siret }) => {
          try {
            let siren = siret.substring(0, 9);
            let anomalies = [];
            let uniteLegale = await timeout(api.getUniteLegale(siren), 10000);
            let data = uniteLegale.etablissements.find((e) => e.siret === siret);
            if (!data) {
              return {
                selector: siret,
                anomalies: [`Etablissement inconnu pour l'entreprise ${siren}`],
              };
            }

            let relations = uniteLegale.etablissements
              .filter((e) => {
                return e.siret !== siret && e.etat_administratif === "A" && organismes.includes(e.siret);
              })
              .map((e) => {
                return {
                  siret: e.siret,
                  label: getRelationLabel(e, uniteLegale),
                };
              });

            let adresse;
            if (data.longitude) {
              try {
                adresse = await getAdresseFromCoordinates(parseFloat(data.longitude), parseFloat(data.latitude), {
                  label: data.geo_adresse,
                });
              } catch (e) {
                anomalies.push(
                  `Impossible de géolocaliser l'adresse de l'établissement: ${data.geo_adresse}. ${e.message}`
                );
              }
            }

            let formeJuridique = categoriesJuridiques.find((cj) => cj.code === uniteLegale.categorie_juridique);
            if (!formeJuridique) {
              anomalies.push(
                `Impossible de trouver la catégorie juridique de l'entreprise : ${uniteLegale.categorie_juridique}`
              );
            }

            return {
              selector: siret,
              relations,
              anomalies,
              data: {
                raison_sociale: getEtablissementName(data, uniteLegale),
                siege_social: data.etablissement_siege === "true",
                statut: data.etat_administratif === "A" ? "actif" : "fermé",
                ...(adresse ? { adresse } : {}),
                ...(formeJuridique ? { forme_juridique: formeJuridique } : {}),
              },
            };
          } catch (e) {
            return { selector: siret, anomalies: [e.reason === 404 ? "Entreprise inconnue" : e] };
          }
        }),
        transformData((data) => ({ ...data, from: name })),
        { promisify: false }
      );
    },
  };
};
