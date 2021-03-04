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
    console.error(error);
    console.error(`init: something went wrong!`);
    return null;
  }
}

export async function getCpInfo(
  codePostal: string,
): Promise<any> {
  isSdkReady();
  try {
    let { getDataFromCP } = await import("../../logic/handlers/geoHandler");
    const result = await getDataFromCP(codePostal);
    return result;
  } catch (error) {
    console.error(`getCpInfo: something went wrong!`);
    return null;
  }
}


export async function tcoJobs(): Promise<any> {
  isSdkReady();
  try {
    
  } catch (error) {
    console.error(`tco-sdk: something went wrong!`);
    return null;
  }
}


// TODO later

// import rncpImporter from "../../jobs/rncpImporter";
// import {ficheRncpSchema} from "../../common/model/schema";s
    // const FicheRncp = createModel("ficherncp", ficheRncpSchema);
    // const exist = await FicheRncp.findOne({ code_rncp: "RNCP" });
    // console.log(exist);
    // await rncpImporter();