import { getDataFromCP } from "../../logic/handlers/geoHandler";

export async function getCpInfo(
  codePostal: string,
): Promise<any> {
  const result = await getDataFromCP(codePostal);
  return result;
}