// const { describe, it } = require("mocha");
const assert = require("assert");
const { getDataFromCfd } = require("./cfdHandler");

describe(__filename, () => {
  xit("Vérifie que on récupere les informations BCN d'un code formation diplome 8 Caracteres", async () => {
    assert.deepStrictEqual(await getDataFromCfd("32321014"), {
      result: {
        cfd: "32321014",
        specialite: null,
        niveau: "5 (BTS, DUT...)",
        intitule_long: "ANALYSE, CONDUITE ET STRATEGIE DE L'ENTREPRISE AGRICOLE (ACSE) (BTSA)",
        intitule_court: "ANALYSE CDTE STRAT ENTREP AG ACSE",
        diplome: "BREVET DE TECHNICIEN SUPERIEUR AGRICOLE",
        mefs10: [
          { mef10: "3712101422", modalite: { duree: "2", annee: "2" } },
          { mef10: "3712101421", modalite: { duree: "2", annee: "1" } },
          { mef10: "3702101411", modalite: { duree: "1", annee: "1" } },
        ],
        mefs8: ["37121014", "37121014", "37021014"],
        code_rncp: "RNCP24440",
      },
      messages: {
        cfd: "Trouvé",
        specialite: "Non fourni",
        niveau: "Ok",
        intitule_long: "Ok",
        intitule_court: "Ok",
        diplome: "Ok",
        mefs10: "Ok",
        mefs8: "Ok",
        code_rncp: "Ok",
      },
    });
  });

  // xit("Vérifie que on récupere les détails de la spécialité d'un code formation diplome 9 Caracteres", async () => {
  //   assert.deepStrictEqual(await getDataFromCfd("32321014T"), {
  //     result: {
  //       cfd: "32321014",
  //       specialite: {
  //         lettre: "T",
  //         libelle: "REALISATION DU SERVICE",
  //         libelle_court: "REALI-SERV",
  //       },
  //       niveau: "5 (BTS, DUT...)",
  //       intitule_long: "ANALYSE, CONDUITE ET STRATEGIE DE L'ENTREPRISE AGRICOLE (ACSE) (BTSA)",
  //       intitule_court: "ANALYSE CDTE STRAT ENTREP AG ACSE",
  //       diplome: "BREVET DE TECHNICIEN SUPERIEUR AGRICOLE",
  //       mefs10: [
  //         { mef10: "3712101422", modalite: { duree: "2", annee: "2" } },
  //         { mef10: "3712101421", modalite: { duree: "2", annee: "1" } },
  //         { mef10: "3702101411", modalite: { duree: "1", annee: "1" } },
  //       ],
  //       mefs8: ["37121014", "37121014", "37021014"],
  //       code_rncp: "RNCP24440",
  //     },
  //     messages: {
  //       cfd: "Trouvé",
  //       specialite: "Ok",
  //       niveau: "Ok",
  //       intitule_long: "Ok",
  //       intitule_court: "Ok",
  //       diplome: "Ok",
  //       mefs10: "Ok",
  //       mefs8: "Ok",
  //       code_rncp: "Ok",
  //     },
  //   });
  // });

  xit("Doit retourner les erreurs avec un code Cfd erroné", async () => {
    assert.deepStrictEqual(await getDataFromCfd("323210X14TW"), {
      result: {
        mefs: {},
        rncps: [],
      },
      messages: {
        error: "Le code formation diplôme doit être définit et au format 8 caractères ou 9 avec la lettre spécialité",
        mefs: {},
        rncps: [],
      },
    });
  });

  xit("Doit toujours retourner un tableau de rncps", async () => {
    assert.deepStrictEqual(await getDataFromCfd("32321014"), {
      result: {
        cfd: "32321014",
        cfd_outdated: false,
        date_fermeture: null,
        date_ouverture: null,
        diplome: null,
        intitule_court: null,
        intitule_long: null,
        mefs: {
          mefs10: [],
          mefs11: [],
          mefs8: [],
          mefs_aproximation: [],
        },
        niveau: null,
        onisep: {
          mefs: [],
          url: "http://www.onisep.fr/http/redirection/formation/identifiant/4643",
        },
        rncps: [],
        specialite: null,
      },
      messages: {
        cfd: "Non trouvé dans la BCN",
        diplome: "Erreur",
        error: "Non trouvé dans la BCN",
        intitule_court: "Erreur",
        intitule_long: "Erreur",
        mefs: {
          mefs10: "Non trouvé",
          mefs11: "Non trouvé",
          mefs8: "Non trouvé",
          mefs_aproximation: "Codes Mef trouvés les plus proches du code CFD fournit",
        },
        niveau: "Erreur",
        onisep: {
          url: "Ok",
        },
        rncps: [
          {
            error: "Erreur: Non trouvé",
          },
        ],
        specialite: "Erreur",
      },
    });

    assert.deepStrictEqual(await getDataFromCfd("32321014T"), {
      result: {
        cfd: "32321014",
        cfd_outdated: false,
        date_fermeture: null,
        date_ouverture: null,
        diplome: null,
        intitule_court: null,
        intitule_long: null,
        mefs: {
          mefs10: [],
          mefs11: [],
          mefs8: [],
          mefs_aproximation: [],
        },
        niveau: null,
        onisep: {
          mefs: [],
          url: "http://www.onisep.fr/http/redirection/formation/identifiant/4643",
        },
        rncps: [],
        specialite: null,
      },
      messages: {
        cfd: "Non trouvé dans la BCN",
        diplome: "Erreur",
        error: "Non trouvé dans la BCN",
        intitule_court: "Erreur",
        intitule_long: "Erreur",
        mefs: {
          mefs10: "Non trouvé",
          mefs11: "Non trouvé",
          mefs8: "Non trouvé",
          mefs_aproximation: "Codes Mef trouvés les plus proches du code CFD fournit",
        },
        niveau: "Erreur",
        onisep: {
          url: "Ok",
        },
        rncps: [
          {
            error: "Erreur: Non trouvé",
          },
        ],
        specialite: "Erreur",
      },
    });

    const cfds = ["32321014", "40033006", "40033002", "test"];

    await Promise.all(
      cfds.map(async (cfd) => {
        const { result } = await getDataFromCfd(cfd);
        console.log(cfd, result);
        assert.deepStrictEqual(typeof result.rncps?.length === "number", true);
      })
    );
  });
});
