const assert = require("assert");
const { omit } = require("lodash");
const { Annuaire } = require("../../../../src/common/model");
const integrationTests = require("../../../utils/integrationTests");
const { createSource } = require("../../../../src/jobs/annuaire/sources/sources");
const collect = require("../../../../src/jobs/annuaire/collect");
const { createStream } = require("../../../utils/testUtils");
const { createAnnuaire } = require("../../../utils/fixtures");

integrationTests(__filename, () => {
  it("Vérifie qu'on peut collecter des relations pour le fichier ideo2 de l'ONISEP", async () => {
    await createAnnuaire({ siret: "11111111111111" });
    await createAnnuaire({ siret: "22222222222222" });
    let source = await createSource("ideo2", {
      input: createStream(
        `"UAI_gestionnaire";"SIRET_gestionnaire";"SIRET_lieu_enseignement";"UAI_lieu_enseignement"
"0011073L";"11111111111111";"22222222222222";"0011073X"`
      ),
    });

    await collect(source);

    let found = await Annuaire.findOne({ siret: "11111111111111" }, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(found.relations[0], ["label"]), {
      siret: "22222222222222",
      annuaire: true,
      type: "formateur",
      sources: ["ideo2"],
    });
    found = await Annuaire.findOne({ siret: "22222222222222" }, { _id: 0 }).lean();
    assert.deepStrictEqual(omit(found.relations[0], ["label"]), {
      siret: "11111111111111",
      annuaire: true,
      type: "gestionnaire",
      sources: ["ideo2"],
    });
  });
});
