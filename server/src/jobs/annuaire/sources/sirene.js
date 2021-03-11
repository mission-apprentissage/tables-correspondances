const { oleoduc, transformData, accumulateData, writeData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiSirene = require("../../../common/apis/apiSirene");
const apiGeoAdresse = require("../../../common/apis/apiGeoAdresse");
const dgefp = require("../referentiels/dgefp");
const adresses = require("../utils/adresses");

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
  let referentiel = await dgefp();

  await oleoduc(
    referentiel.stream(),
    accumulateData((acc, data) => [...acc, data.siret], { accumulator: [] }),
    writeData((acc) => (organismes = acc))
  );

  return organismes;
}

module.exports = async (custom = {}) => {
  let api = custom.apiSirene || apiSirene;
  let { getAdresseFromCoordinates } = adresses(custom.apiGeoAdresse || apiGeoAdresse);
  let organismes = custom.organismes || (await loadOrganismeDeFormations());

  return {
    stream(options = {}) {
      let filters = options.filters || {};

      return oleoduc(
        Annuaire.find(filters, { siret: 1 }).lean().cursor(),
        transformData(async ({ siret }) => {
          try {
            let siren = siret.substring(0, 9);
            let anomalies = [];
            let uniteLegale = await api.getUniteLegale(siren);
            let data = uniteLegale.etablissements.find((e) => e.siret === siret);
            if (!data) {
              return { selector: siret, anomalies: [`Etablissement inconnu pour l'entreprise ${siren}`] };
            }

            let relations = await Promise.all(
              uniteLegale.etablissements
                .filter((e) => {
                  return e.siret !== siret && e.etat_administratif === "A" && organismes.includes(e.siret);
                })
                .map(async (e) => {
                  return {
                    siret: e.siret,
                    label: getRelationLabel(e, uniteLegale),
                  };
                })
            );

            let adresse;
            try {
              adresse = await getAdresseFromCoordinates(
                parseFloat(data.longitude),
                parseFloat(data.latitude),
                data.geo_adresse
              );
            } catch (e) {
              anomalies.push(e);
            }

            return {
              selector: siret,
              relations,
              anomalies,
              data: {
                raison_sociale: getEtablissementName(data, uniteLegale),
                siege_social: data.etablissement_siege === "true",
                statut: data.etat_administratif === "A" ? "actif" : "fermé",
                adresse: adresse,
              },
            };
          } catch (e) {
            return { selector: siret, anomalies: [e.reason === 404 ? "Entreprise inconnue" : e] };
          }
        }),
        { promisify: false, parallel: 5 }
      );
    },
  };
};
