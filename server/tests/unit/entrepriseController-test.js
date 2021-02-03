const assert = require("assert");
const { apiEntrepriseMock } = require("../utils/mocks");
const entrepriseController = require("../../src/logic/controllers/entrepriseController");

describe(__filename, () => {
  it("Permet d'obtenir le statut d'une entreprise (actif)", async () => {
    let statut = await entrepriseController.getEtablissementStatut("11111111111111", {
      apiEntreprise: apiEntrepriseMock({
        siret: "11111111111111",
        etat_administratif: {
          value: "A",
          date_fermeture: null,
        },
      }),
    });

    assert.strictEqual(statut, "actif");
  });

  it("Permet d'obtenir le statut d'une entreprise (fermé)", async () => {
    let statut = await entrepriseController.getEtablissementStatut("11111111111111", {
      apiEntreprise: apiEntrepriseMock({
        siret: "11111111111111",
        etat_administratif: {
          value: "F",
          date_fermeture: null,
        },
      }),
    });

    assert.strictEqual(statut, "fermé");
  });

  it("Permet d'obtenir le statut d'une entreprise en cas d'erreur", async () => {
    let statut = await entrepriseController.getEtablissementStatut("11111111111111", {
      apiEntreprise: {
        getEtablissement: () => {
          throw { response: { status: 451 } };
        },
      },
    });

    assert.strictEqual(statut, "indisponible");
  });

  it("Propage l'erreur si le statut est inconnue", async () => {
    try {
      await entrepriseController.getEtablissementStatut("11111111111111", {
        apiEntreprise: {
          getEtablissement: () => {
            throw { response: { status: 500 } };
          },
        },
      });
      assert.fail("should thow error");
    } catch (e) {
      assert.strictEqual(e.response.status, 500);
    }
  });
});
