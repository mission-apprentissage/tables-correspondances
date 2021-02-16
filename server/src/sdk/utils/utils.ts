import { getDataFromCP } from "../../logic/handlers/geoHandler";
// import rncpImporter from "../../jobs/rncpImporter";
import {ficheRncpSchema} from "../../common/model/schema";

export async function getCpInfo(
  codePostal: string,
): Promise<any> {
  try {
    const result = await getDataFromCP(codePostal);
    return result;
  } catch (error) {
    console.error(`getCpInfo: something went wrong!`);
    return null;
  }
}

export async function init(
  getModel: any
): Promise<any> {
  try {
    const FicheRncp = getModel("ficherncp", ficheRncpSchema);
    const exist = await FicheRncp.findOne({ code_rncp: "RNCP" });
    console.log(exist);
    // await rncpImporter();
  } catch (error) {
    console.error(error);
    console.error(`init: something went wrong!`);
    return null;
  }
}