import { getDataFromCP } from "../../logic/handlers/geoHandler";

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