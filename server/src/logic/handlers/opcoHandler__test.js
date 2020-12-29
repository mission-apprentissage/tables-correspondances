const assert = require("assert");
const { findIdccsFromCfd, findOpcosFromCfd, findOpcosFromIdccs } = require("./opcoHandler");
const { connectToMongo, closeMongoConnection } = require("../../common/mongodb");

describe(__filename, async () => {
  before(async () => {
    // Connection to mongo
    await connectToMongo();
  });

  after(async () => {
    await closeMongoConnection();
  });

  it("Vérifie qu'il est possible de trouver un code IDCC pour un code EN", async () => {
    const idcssTestFound = await findIdccsFromCfd("56X22101");
    assert.deepStrictEqual(idcssTestFound.includes("1266"), true);
  });

  it("Vérifie qu'on ne trouve pas de code IDCC pour un mauvais code EN", async () => {
    assert.deepStrictEqual(await findIdccsFromCfd("UNKNOWN"), []);
  });

  it("Vérifie qu'on trouve un OPCO valide pour un code IDCC valide", async () => {
    assert.deepStrictEqual(await findOpcosFromIdccs(["83"]), [
      {
        IDCC: "83",
        libelle:
          "Convention collective nationale des menuiseries charpentes et constructions industrialisées et des portes planes",
        obs: "",
        operateur_de_competences: "OPCO 2i",
      },
    ]);
  });

  it("Vérifie qu'on trouve une liste d'OPCOs valides pour une liste de codes IDCC valides", async () => {
    assert.deepStrictEqual(await findOpcosFromIdccs(["83", "86"]), [
      {
        IDCC: "83",
        libelle:
          "Convention collective nationale des menuiseries charpentes et constructions industrialisées et des portes planes",
        obs: "",
        operateur_de_competences: "OPCO 2i",
      },
      {
        IDCC: "86",
        libelle: "Convention collective nationale des entreprises de publicité et assimilées",
        obs: "",
        operateur_de_competences: "AFDAS",
      },
    ]);
  });

  it("Vérifie qu'on trouve une liste d'OPCOs valides pour une liste de codes IDCC valides et invalides", async () => {
    assert.deepStrictEqual(await findOpcosFromIdccs(["83", "UNKNOWN"]), [
      {
        IDCC: "83",
        libelle:
          "Convention collective nationale des menuiseries charpentes et constructions industrialisées et des portes planes",
        obs: "",
        operateur_de_competences: "OPCO 2i",
      },
    ]);
  });

  it("Vérifie qu'on ne trouve pas de liste d'OPCOs pour une liste de codes IDCC invalides", async () => {
    assert.deepStrictEqual(await findOpcosFromIdccs(["UNKNOWN", "KO"]), []);
  });

  it("Vérifie qu'on ne trouve pas de liste d'OPCOs pour un code EN invalide", async () => {
    assert.deepStrictEqual(await findOpcosFromCfd("UNKNOWN"), []);
  });

  it("Vérifie qu'on trouve un OPCO valide pour un code EN valide", async () => {
    assert.deepStrictEqual(await findOpcosFromCfd("56X22101"), [
      {
        IDCC: "1266",
        libelle: "Convention collective nationale du personnel des entreprises de restauration de collectivités",
        obs: "",
        operateur_de_competences: "OPCO entreprises et salariés des services à forte intensité de main-d'œuvre",
      },
    ]);
  });
});
