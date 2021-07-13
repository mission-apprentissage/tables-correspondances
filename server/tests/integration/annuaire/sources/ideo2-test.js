const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collectSources = require("../../../../src/jobs/annuaire/collectSources");
const { createStream } = require("../../../utils/testUtils");
const { insertAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des relations pour le fichier ideo2 de l'ONISEP", async () => {
    await insertAnnuaire({ siret: "11111111100006" });
    await insertAnnuaire({ siret: "22222222200002" });
    let source = await createSource("ideo2", {
      input: createStream(
        `"UAI_gestionnaire";"SIRET_gestionnaire";"SIRET_lieu_enseignement";"UAI_lieu_enseignement"
"1234567W";"11111111100006";"22222222200002";"0011073X"`
      ),
    });

    await collectSources(source);

    let found = await Annuaire.findOne({ siret: "11111111100006" }, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(found.relations[0], ["label"]), {
      siret: "22222222200002",
      annuaire: true,
      type: "formateur",
      sources: ["ideo2"],
    });
    found = await Annuaire.findOne({ siret: "22222222200002" }, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(found.relations[0], ["label"]), {
      siret: "11111111100006",
      annuaire: true,
      type: "gestionnaire",
      sources: ["ideo2"],
    });
  });
});
