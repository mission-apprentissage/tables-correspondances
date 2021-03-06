import { setMongooseInstance } from "../../common/mongodb";

let mongooseInstanceShared = false;
const isSdkReady = () => {
  if (!mongooseInstanceShared) {
    throw new Error(`@mission-apprentissage/tco-service-node: You must initialize the library with a mongoose instance before calling any other method(s).
    Please use initTcoModel(mongooseInstance: Mongoose)`);
  }
};

type InitOptions = {
  noElastic?: boolean;
};
export async function initTcoModel(mongooseInstanceFromParentProject: any, { noElastic = false }: InitOptions) {
  try {
    setMongooseInstance(mongooseInstanceFromParentProject, noElastic);
    mongooseInstanceShared = true;
  } catch (error) {
    console.error(`init: something went wrong!`, error);
  }
}

let Models: any = null;
export async function getModels() {
  isSdkReady();
  try {
    if (!Models) {
      Models = await import("../../common/model");
    }

    return Models;
  } catch (error) {
    console.error(`getModels: something went wrong!`, error);
    return null;
  }
}

// export async function tcoJobs(): Promise<any> {
//   isSdkReady();
//   try {
//     // TODO
//   } catch (error) {
//     console.error(`tcoJobs: something went wrong!`);
//     return null;
//   }
// }

export async function getCpInfo(codePostal: string, codeInsee?: string) {
  isSdkReady();
  try {
    let { getDataFromCP } = await import("../../logic/handlers/geoHandler");
    const result = await getDataFromCP(codePostal, codeInsee);
    return result;
  } catch (error) {
    console.error(`getCpInfo: something went wrong!`, error);
    return null;
  }
}

export async function rncpImporter(localPath: string | null = null) {
  isSdkReady();
  try {
    let { rncpImporter: importer } = await import("../../jobs/rncpImporter");
    await importer(localPath);
  } catch (error) {
    console.error(`rncpImporter: something went wrong!`, error);
  }
}

export async function onisepImporter(db: any) {
  isSdkReady();
  try {
    let { onisepImporter: importer } = await import("../../jobs/OnisepImporter");
    await importer(db);
  } catch (error) {
    console.error(`onisepImporter: something went wrong!`, error);
  }
}

export async function getRncpInfo(codeRncp: string) {
  isSdkReady();
  try {
    let { getDataFromRncp } = await import("../../logic/handlers/rncpHandler");
    const result = await getDataFromRncp(codeRncp); // TODO si aucun documents TypeError: Cannot read property '_doc' of null
    return result;
  } catch (error) {
    console.error(`getRncpInfo: something went wrong!`, error);
    return null;
  }
}

export async function bcnImporter() {
  isSdkReady();
  try {
    let { downloadBcnTables } = await import("../../jobs/bcnDownloader");
    let { importBcnTables } = await import("../../jobs/bcnImporter");

    await downloadBcnTables();
    await importBcnTables();
  } catch (error) {
    console.error(`bcnImporter: something went wrong!`, error);
  }
}

export interface cfdOptions {
  onisep: boolean;
}
export async function getCfdInfo(cfd: string, options: cfdOptions = { onisep: true }) {
  isSdkReady();
  try {
    let { getDataFromCfd } = await import("../../logic/handlers/cfdHandler");
    const result = await getDataFromCfd(cfd, options);
    return result;
  } catch (error) {
    console.error(`getCfdInfo: something went wrong!`, error);
    return null;
  }
}

export async function getMef10Info(mef10: string) {
  isSdkReady();
  try {
    let { getDataFromMef10 } = await import("../../logic/handlers/mefHandler");
    const result = await getDataFromMef10(mef10);
    return result;
  } catch (error) {
    console.error(`getMef10Info: something went wrong!`, error);
    return null;
  }
}

export async function getSiretInfo(siret: string) {
  isSdkReady();
  try {
    let { getDataFromSiret } = await import("../../logic/handlers/siretHandler");
    const result = await getDataFromSiret(siret);
    return result;
  } catch (error) {
    console.error(`getSiretInfo: something went wrong!`, error);
    return null;
  }
}

export async function isValideUAI(uai: string) {
  isSdkReady();
  try {
    let { validateUAI } = await import("../../common/utils/uaiUtils");
    return validateUAI(uai);
  } catch (error) {
    console.error(`getSiretInfo: something went wrong!`, error);
    return null;
  }
}

export async function getBcnInfo({ page = 1, limit = 10, query = {} }) {
  isSdkReady();
  try {
    const { BcnFormationDiplome } = await import("../../common/model");

    const allData = await BcnFormationDiplome.paginate(query, { page, limit });
    return {
      formationsDiplomes: allData.docs,
      pagination: {
        page: allData.page,
        resultats_par_page: limit,
        nombre_de_page: allData.pages,
        total: allData.total,
      },
    };
  } catch (error) {
    console.error(`getBcnInfo: something went wrong!`, error);
    return null;
  }
}

type AddressData = {
  numero_voie: string;
  type_voie: string;
  nom_voie: string;
  localite: string;
  code_postal: string;
};

export async function getCoordinatesFromAddressData({
  numero_voie,
  type_voie,
  nom_voie,
  localite,
  code_postal,
}: AddressData) {
  isSdkReady();
  try {
    let { getCoordinatesFromAddressData } = await import("../../logic/handlers/geoHandler");
    return await getCoordinatesFromAddressData({
      numero_voie,
      type_voie,
      nom_voie,
      localite,
      code_postal,
    });
  } catch (error) {
    console.error(`getCoordinatesFromAddressData: something went wrong!`, error);
    return null;
  }
}

interface Tree {
  [key: string]: string[];
}
export async function getNiveauxDiplomesTree(): Promise<Tree> {
  const { BcnFormationDiplome, BcnNNiveauFormationDiplome } = await import("../../common/model");
  const { mappingCodesEnNiveau }: { mappingCodesEnNiveau: Tree } = await import(
    "../../logic/controllers/bcn/Constants"
  );

  return Object.entries(mappingCodesEnNiveau).reduce(async (acc, [niveau, value]) => {
    const accSync: Tree = await acc;
    let regex = new RegExp(`^(${value.join("|")})`);

    const niveauxFormationDiplome = await BcnFormationDiplome.distinct("NIVEAU_FORMATION_DIPLOME", {
      FORMATION_DIPLOME: { $regex: regex },
    });

    accSync[niveau] = await BcnNNiveauFormationDiplome.distinct("LIBELLE_100", {
      NIVEAU_FORMATION_DIPLOME: { $in: niveauxFormationDiplome },
    });

    return accSync;
  }, {});
}

// TODO
// const conventionFilesImporter = require("./convetionFilesImporter/index");
// await conventionFilesImporter(db);
//await EtablissementsUpdater();
