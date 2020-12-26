import { IncomingMessage } from "http";
import qs from "querystring";

function parse(body: string) {
  if (!body) {
    return null;
  }
  // parse as json
  try {
    return JSON.parse(body);
  } catch (err) {}
  // parse as classic
  try {
    return qs.parse(body);
  } catch (err) {}
  return null;
}

export async function getPostBody(req: IncomingMessage) {
  return new Promise<qs.ParsedUrlQuery | null>((resolve) => {
    if (req.method !== "POST") {
      return resolve(null);
    }
    let body: string = "";

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      console.log("post body", body);
      resolve(parse(body));
    });
  });
}
