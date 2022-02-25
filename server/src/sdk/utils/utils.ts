import type { Connection } from "mongoose";
import { setMongooseInstance } from "../../common/mongodb";

let mongooseInstanceShared = false;
const isSdkReady = () => {
  if (!mongooseInstanceShared) {
    throw new Error(`@mission-apprentissage/tco-service-node: You must initialize the library with a mongoose instance before calling any other method(s).
    Please use initTcoModel(mongooseInstance: Mongoose)`);
  }
};

export async function initTcoModel(mongooseInstanceFromParentProject: any) {
  try {
    setMongooseInstance(mongooseInstanceFromParentProject);
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
      // eslint-disable-next-line require-atomic-updates
      Models = await import("../../common/model");
    }

    return Models;
  } catch (error) {
    console.error(`getModels: something went wrong!`, error);
    return null;
  }
}

export async function getCpInfo(codePostal: string, codeInsee?: string) {
  isSdkReady();
  try {
    const { getDataFromCP } = await import("../../logic/handlers/geoHandler");
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
    const { rncpImporter: importer } = await import("../../jobs/rncpImporter");
    await importer(localPath);
  } catch (error) {
    console.error(`rncpImporter: something went wrong!`, error);
  }
}

export async function onisepImporter(db: Connection) {
  isSdkReady();
  try {
    const { onisepImporter: importer } = await import("../../jobs/OnisepImporter");
    await importer(db);
  } catch (error) {
    console.error(`onisepImporter: something went wrong!`, error);
  }
}

export async function getRncpInfo(codeRncp: string) {
  isSdkReady();
  try {
    const { getDataFromRncp } = await import("../../logic/handlers/rncpHandler");
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
    const { downloadBcnTables } = await import("../../jobs/bcnDownloader");
    const { importBcnTables } = await import("../../jobs/bcnImporter");

    await downloadBcnTables();
    await importBcnTables();
  } catch (error) {
    console.error(`bcnImporter: something went wrong!`, error);
    throw new Error("@mission-apprentissage/tco-service-node: BCN Exception");
  }
}

export interface cfdOptions {
  onisep: boolean;
}
export async function getCfdInfo(cfd: string, options: cfdOptions = { onisep: true }) {
  isSdkReady();
  try {
    const { getDataFromCfd } = await import("../../logic/handlers/cfdHandler");
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
    const { getDataFromMef10 } = await import("../../logic/handlers/mefHandler");
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
    const { getDataFromSiret } = await import("../../logic/handlers/siretHandler");
    const result = await getDataFromSiret(siret);
    return result;
  } catch (error) {
    console.error(`getSiretInfo: something went wrong!`, error);
    return null;
  }
}

export async function isValideUAI(uai: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { validateUAI } = await import("../../common/utils/uaiUtils");
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

    // @ts-ignore
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
  code_insee?: string;
};

export async function getCoordinatesFromAddressData({
  numero_voie,
  type_voie,
  nom_voie,
  localite,
  code_postal,
  code_insee,
}: AddressData) {
  isSdkReady();
  try {
    const { getCoordinatesFromAddressData: getCoords } = await import("../../logic/handlers/geoHandler");
    return await getCoords({
      numero_voie,
      type_voie,
      nom_voie,
      localite,
      code_postal,
      code_insee,
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
    const regex = new RegExp(`^(${value.join("|")})`);

    // @ts-ignore
    const niveauxFormationDiplome = await BcnFormationDiplome.distinct("NIVEAU_FORMATION_DIPLOME", {
      FORMATION_DIPLOME: { $regex: regex },
    });

    // @ts-ignore
    accSync[niveau] = await BcnNNiveauFormationDiplome.distinct("LIBELLE_100", {
      NIVEAU_FORMATION_DIPLOME: { $in: niveauxFormationDiplome },
    });

    return accSync;
  }, {});
}

type AdressResult = {
  result: {
    adresse?: {
      numero_voie: string;
      type_voie: string;
      nom_voie: string;
      code_postal: string;
      code_commune_insee: string;
      commune: string;
      num_departement: string;
      nom_departement: string;
      region: string;
      num_region: string;
      nom_academie: string;
      num_academie: string;
    };
    results_count?: number;
  };
  messages: { error?: string; address?: string };
};

export async function getAddressFromCoordinates({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<AdressResult | null> {
  isSdkReady();
  try {
    const { getAddressDataFromCoordinates } = await import("../../logic/handlers/geoHandler");
    const result = getAddressDataFromCoordinates({ latitude, longitude });
    return result;
  } catch (error) {
    console.error(`getAddressFromCoordinates: something went wrong!`, error);
    return null;
  }
}

type Etablissement = any;

type EtablissementScope = {
  siret: boolean;
  geoloc: boolean;
  conventionnement: boolean;
  onisep: boolean;
};

type EtablissementOptions = {
  withHistoryUpdate?: boolean;
  scope?: EtablissementScope;
};

type UpdatesResult = {
  updates: any;
  error?: string;
  etablissement: Etablissement;
};

export async function getEtablissementUpdates(
  etablissement: Etablissement,
  options?: EtablissementOptions
): Promise<UpdatesResult> {
  isSdkReady();
  const { etablissementService } = await import("../../logic/services/etablissementService");
  // eslint-disable-next-line no-return-await
  return await etablissementService(etablissement, options);
}

export async function conventionFilesImporter(db: Connection, assetsDir?: string) {
  isSdkReady();
  try {
    const { conventionFilesImporter: importer } = await import("../../jobs/convetionFilesImporter/index");
    await importer(db, assetsDir);
  } catch (error) {
    console.error(`conventionFilesImporter: something went wrong!`, error);
  }
}

/**
 * One job to setup all tables
 */
export async function tcoJobs(db: Connection, conventionFilesDir: string, rncpKitPath: string) {
  isSdkReady();
  try {
    await bcnImporter();
    await onisepImporter(db);
    await conventionFilesImporter(db, conventionFilesDir);
    await rncpImporter(rncpKitPath);
  } catch (error) {
    console.error(`tcoJobs: something went wrong!`);
  }
}
