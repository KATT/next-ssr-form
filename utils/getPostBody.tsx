import { IncomingMessage } from "http";
import { parse, ParsedUrlQuery } from "querystring";

export async function getPostBody(req: IncomingMessage) {
  return new Promise<ParsedUrlQuery | null>((resolve) => {
    if (req.method !== "POST") {
      return resolve(null);
    }
    let body: string = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      console.log("end", body);
      resolve(body ? parse(body) : null);
    });
  });
}
