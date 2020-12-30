import * as Stream from 'stream';
import * as z from 'zod';
import {
  MockGetServerSidePropsContext,
  MockIncomingMessage,
} from '../src/createForm';
import { createForm } from '../src/index';
type HTTPMethods = 'POST' | 'GET' | 'OPTIONS' | 'PUT' | 'PATCH';

interface MockRequestOptions<TBody> {
  method: HTTPMethods;
  url: string;
  body?: TBody;
}
class MockIncomingRequest<TBody> extends Stream.Duplex
  implements MockIncomingMessage {
  readonly method: HTTPMethods;
  readonly url;
  private body;

  constructor(opts: MockRequestOptions<TBody>) {
    super();

    this.body = opts.body;
    this.method = opts.method;
    this.url = opts.url;
  }
  _read() {
    process.nextTick(() => {
      const str = JSON.stringify(this.body);
      this.push(Buffer.from(str, 'utf-8'));
      this.push(null);

      this.end();
    });
  }
}

function mockCtx<TBody>(
  opts: {
    req?: Partial<MockRequestOptions<TBody>>;
    resolvedUrl?: string;
  } = {}
) {
  const { resolvedUrl = '/' } = opts;

  const url = opts.req?.url ?? resolvedUrl;
  const method = opts.req?.method ?? 'GET';
  const body = opts.req?.body;

  const ctx: MockGetServerSidePropsContext = {
    resolvedUrl,
    req: new MockIncomingRequest({
      url,
      method,
      body,
    }),
  };

  return ctx;
}

describe('getPageProps()', () => {
  const form = createForm({
    schema: z.object({
      text: z.string().min(10),
    }),
    defaultValues: {
      text: '',
    },
    formId: 'testy',
  });
  const VALID_FORM_BODY = {
    text: 'hello im a form test',
  };
  describe('valid', () => {
    test('get (not posting anything)', async () => {
      const ctx = mockCtx({});
      const pageProps = await form.getPageProps({
        ctx,
        async mutation() {},
      });

      expect(pageProps).toMatchInlineSnapshot(`
          Object {
            "testy": Object {
              "endpoints": Object {
                "action": "/?formId=testy",
                "fetch": "/_next/data/development/index.json?formId=testy",
              },
              "response": null,
            },
          }
      `);
    });

    test('valid post', async () => {
      const ctx = mockCtx({
        req: {
          method: 'POST',
          body: VALID_FORM_BODY,
        },
        resolvedUrl: `/?formId=${form.formId}`,
      });
      const pageProps = await form.getPageProps({
        ctx,
        async mutation(input) {
          return {
            text: input.text,
          };
        },
      });

      expect(pageProps.testy.response?.success).toBeTruthy();
      expect(pageProps.testy.response?.input.text).toMatchInlineSnapshot(
        `"hello im a form test"`
      );
      expect(pageProps).toMatchInlineSnapshot(`
        Object {
          "testy": Object {
            "endpoints": Object {
              "action": "/?formId=testy",
              "fetch": "/_next/data/development/index.json?formId=testy",
            },
            "response": Object {
              "data": Object {
                "text": "hello im a form test",
              },
              "input": Object {
                "text": "hello im a form test",
              },
              "success": true,
            },
          },
        }
      `);
    });
  });
  describe('errors', () => {
    test('over-posting', async () => {
      const ctx = mockCtx({
        req: {
          method: 'POST',
          body: {
            ...VALID_FORM_BODY,
            unknownProperty: 'boopy',
          },
        },
        resolvedUrl: `/?formId=${form.formId}`,
      });
      const pageProps = await form.getPageProps({
        ctx,
        async mutation(input) {
          return {
            text: input.text,
          };
        },
      });

      expect(pageProps.testy.response?.success).toBe(false);
      expect(pageProps.testy.response?.input).toMatchInlineSnapshot(`
              Object {
                "text": "hello im a form test",
                "unknownProperty": "boopy",
              }
          `);
      expect(pageProps.testy.response?.error?.message).toMatchInlineSnapshot(`
        "1 validation issue(s)

          Issue #0: unrecognized_keys at 
          Unrecognized key(s) in object: 'unknownProperty'
        "
      `);
      expect(pageProps.testy.response?.error?.fieldErrors)
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "message": "Unrecognized key(s) in object: 'unknownProperty'",
            "path": Array [],
          },
        ]
      `);

      expect(form.getInitialErrors(pageProps)).toMatchInlineSnapshot(
        `Object {}`
      );
    });
    test('field error', async () => {
      const ctx = mockCtx({
        req: {
          method: 'POST',
          body: {
            text: 'too short',
          },
        },
        resolvedUrl: `/?formId=${form.formId}`,
      });
      const pageProps = await form.getPageProps({
        ctx,
        async mutation(input) {
          return {
            text: input.text,
          };
        },
      });
      expect(pageProps.testy.response?.success).toBe(false);
      expect(pageProps.testy.response?.error?.message).toMatchInlineSnapshot(`
              "1 validation issue(s)

                Issue #0: too_small at text
                Should be at least 10 characters
              "
          `);
      expect(pageProps.testy.response?.error?.fieldErrors)
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "message": "Should be at least 10 characters",
            "path": Array [
              "text",
            ],
          },
        ]
      `);
      expect(form.getInitialErrors(pageProps)).toMatchInlineSnapshot(`
        Object {
          "text": "Should be at least 10 characters",
        }
      `);
    });

    test('mutation error', async () => {
      const ctx = mockCtx({
        req: {
          method: 'POST',
          body: VALID_FORM_BODY,
        },
        resolvedUrl: `/?formId=${form.formId}`,
      });
      const pageProps = await form.getPageProps({
        ctx,
        async mutation() {
          throw new Error('My mutation failed');
        },
      });
      expect(pageProps.testy.response?.success).toBe(false);
      expect(pageProps.testy.response?.input).toMatchInlineSnapshot(`
              Object {
                "text": "hello im a form test",
              }
          `);
      expect(pageProps.testy.response?.error).toMatchInlineSnapshot(`
              Object {
                "message": "My mutation failed",
                "stack": undefined,
                "type": "MutationError",
              }
          `);
    });
  });
});

describe('nested form', () => {
  const form = createForm({
    schema: z.object({
      deep: z.object({
        nested: z.object({
          arr: z.array(
            z.object({
              with: z.object({
                text: z.string().nonempty(),
                foo: z
                  .string()
                  .nonempty()
                  .refine(val => val === 'bar', {
                    message: 'foo must be "bar"',
                  }),
              }),
            })
          ),
        }),
      }),
    }),
    defaultValues: {
      deep: {
        nested: {
          arr: [
            {
              with: {
                text: '',
                foo: '' as any,
              },
            },
          ],
        },
      },
    },
    formId: 'form',
  });

  const VALID_FORM_BODY: z.infer<typeof form['schema']> = {
    deep: {
      nested: {
        arr: [
          {
            with: {
              text: 'hello',
              foo: 'bar',
            },
          },
        ],
      },
    },
  };

  test('valid', async () => {
    const ctx = mockCtx({
      req: {
        method: 'POST',
        body: VALID_FORM_BODY,
      },
      resolvedUrl: `/?formId=${form.formId}`,
    });
    const pageProps = await form.getPageProps({
      ctx,
      async mutation(input) {
        return {
          texts: input?.deep?.nested?.arr?.map(item => item?.with?.text),
        };
      },
    });

    expect(pageProps.form.response?.success).toBe(true);
    expect(pageProps.form.response?.data).toMatchInlineSnapshot(`
      Object {
        "texts": Array [
          "hello",
        ],
      }
    `);
  });
  test('invalid', async () => {
    const ctx = mockCtx({
      req: {
        method: 'POST',
        body: {
          deep: {
            nested: {
              arr: [
                {
                  with: {
                    text: 'text',
                    foo: '',
                  },
                },
              ],
            },
          },
        },
      },
      resolvedUrl: `/?formId=${form.formId}`,
    });
    const pageProps = await form.getPageProps({
      ctx,
      async mutation(input) {
        return {
          texts: input?.deep?.nested?.arr?.map(item => item?.with?.text),
        };
      },
    });

    expect(pageProps.form.response?.success).toBe(false);
    expect(pageProps.form.response?.error).toMatchInlineSnapshot(`
      Object {
        "fieldErrors": Array [
          Object {
            "message": "Should be at least 1 characters",
            "path": Array [
              "deep",
              "nested",
              "arr",
              0,
              "with",
              "foo",
            ],
          },
          Object {
            "message": "foo must be \\"bar\\"",
            "path": Array [
              "deep",
              "nested",
              "arr",
              0,
              "with",
              "foo",
            ],
          },
        ],
        "message": "2 validation issue(s)

        Issue #0: too_small at deep.nested.arr.0.with.foo
        Should be at least 1 characters

        Issue #1: custom_error at deep.nested.arr.0.with.foo
        foo must be \\"bar\\"
      ",
        "stack": undefined,
        "type": "ValidationError",
      }
    `);
    expect(form.getInitialErrors(pageProps)).toMatchInlineSnapshot(`
      Object {
        "deep": Object {
          "nested": Object {
            "arr": Array [
              Object {
                "with": Object {
                  "foo": "foo must be \\"bar\\"",
                },
              },
            ],
          },
        },
      }
    `);
    const initialErrors = form.getInitialErrors(pageProps);
    const validatorErrors = form.formikValidator(
      pageProps.form.response?.input!
    );
    expect(initialErrors).toEqual(validatorErrors);
  });
});
