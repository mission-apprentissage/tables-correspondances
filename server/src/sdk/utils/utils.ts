import { setMongooseInstance } from "../../common/mongodb";

let mongooseInstanceShared = false;
const isSdkReady = ()=> {    
  if(!mongooseInstanceShared) {
    throw new Error(`@mission-apprentissage/tco-service-node: You must initialize the library with a mongoose instance before calling any other method(s).
    Please use initTcoModel(mongooseInstance: Mongoose)`);
  }
}

export async function initTcoModel(
mongooseInstanceFromParentProject: any
): Promise<any> {
  try {
    setMongooseInstance(mongooseInstanceFromParentProject);
    mongooseInstanceShared = true;
  } catch (error) {
    console.error(`init: something went wrong!`, error);
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

export async function getCpInfo(
  codePostal: string,
): Promise<any> {
  isSdkReady();
  try {
    let { getDataFromCP } = await import("../../logic/handlers/geoHandler");
    const result = await getDataFromCP(codePostal);
    return result;
  } catch (error) {
    console.error(`getCpInfo: something went wrong!`, error);
    return null;
  }
}

export async function rncpImporter(): Promise<any> {
  isSdkReady();
  try {
    let { rncpImporter: importer } = await import("../../jobs/rncpImporter");
    // @ts-ignore
    await importer();
  } catch (error) {
    console.error(`rncpImporter: something went wrong!`, error);
    return null;
  }
}

export async function getRncpInfo(
  codeRncp: string,
): Promise<any> {
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

export async function bcnImporter(): Promise<any> {
  isSdkReady();
  try {
    let { downloadBcnTables } = await import("../../jobs/bcnDownloader");
    let { importBcnTables } = await import("../../jobs/bcnImporter");

    // @ts-ignore
    await downloadBcnTables();
    await importBcnTables();
  } catch (error) {
    console.error(`bcnImporter: something went wrong!`, error);
    return null;
  }
}


export async function getCfdInfo(
  cfd: string,
): Promise<any> {
  isSdkReady();
  try {
    let { getDataFromCfd } = await import("../../logic/handlers/cfdHandler");
    const result = await getDataFromCfd(cfd);
    return result;
  } catch (error) {
    console.error(`getCfdInfo: something went wrong!`, error);
    return null;
  }
}


export async function getMef10Info(
  mef10: string,
): Promise<any> {
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

export async function getSiretInfo(
  siret: string,
): Promise<any> {
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



export async function isValideUAI(
  uai: string,
): Promise<any> {
  isSdkReady();
  try {
    let { validateUAI } = await import("../../common/utils/uaiUtils");
    return validateUAI(uai);
  } catch (error) {
    console.error(`getSiretInfo: something went wrong!`, error);
    return null;
  }
}

// TODO
// const conventionFilesImporter = require("./convetionFilesImporter/index");
// await conventionFilesImporter(db);
//await EtablissementsUpdater();