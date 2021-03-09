const { oleoduc, transformData, accumulateData, writeData } = require("oleoduc");
const { Annuaire } = require("../../../common/model");
const apiSirene = require("../../../common/apis/apiSirene");
const dgefp = require("../referentiels/dgefp");

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
  let referentiel = await dgefp(() => true);

  await oleoduc(
    referentiel,
    accumulateData((acc, data) => [...acc, data.siret], { accumulator: [] }),
    writeData((acc) => (organismes = acc))
  );

  return organismes;
}

module.exports = async (options = {}) => {
  let api = options.apiSirene || apiSirene;
  let filters = options.filters || {};
  let organismes = options.organismes || (await loadOrganismeDeFormations());

  return oleoduc(
    Annuaire.find(filters).lean().cursor(),
    transformData(async (etablissement) => {
      let siret = etablissement.siret;

      try {
        let siren = siret.substring(0, 9);
        let uniteLegale = await api.getUniteLegale(siren);
        let data = uniteLegale.etablissements.find((e) => e.siret === siret);
        if (!data) {
          return { siret, anomalies: [`Etablissement inconnu pour l'entreprise ${siren}`] };
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
                annuaire: (await Annuaire.countDocuments({ siret: e.siret })) > 0,
              };
            })
        );

        return {
          siret,
          relations,
          data: {
            raison_sociale: getEtablissementName(data, uniteLegale),
            siege_social: data.etablissement_siege === "true",
            statut: data.etat_administratif === "A" ? "actif" : "fermé",
            adresse: {
              geojson: {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                },
                properties: {
                  score: parseFloat(data.geo_score),
                },
              },
              label: data.geo_adresse,
              numero_voie: data.numero_voie,
              type_voie: data.type_voie,
              nom_voie: data.libelle_voie,
              code_postal: data.code_postal,
              code_insee: data.code_commune,
              localite: data.libelle_commune,
              cedex: data.code_cedex,
            },
          },
        };
      } catch (e) {
        return { siret, anomalies: [e.reason === 404 ? "Entreprise inconnue" : e] };
      }
    }),
    { promisify: false, parallel: 5 }
  );
};
