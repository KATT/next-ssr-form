import { IncomingMessage } from 'http';
import qs from 'querystring';
import { MockIncomingMessage } from './createForm';

export async function getPostBody<
  TRequest extends MockIncomingMessage | IncomingMessage
>(req: TRequest) {
  if (!process.browser) {
    const parse = (body: string) => {
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
    };

    return new Promise<qs.ParsedUrlQuery | null>(async resolve => {
      if (req.method !== 'POST') {
        resolve(null);
        return;
      }
      let body: string = '';

      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        resolve(parse(body));
      });
    });
  }
  throw new Error(`getPostBody can't be invoked in browser`);
}
