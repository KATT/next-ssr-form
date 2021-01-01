import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { ErrorMessage, Field } from 'formik';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import fetch from 'node-fetch';
import * as React from 'react';
import * as Stream from 'stream';
import * as z from 'zod';
import {
  MockGetServerSidePropsContext,
  MockIncomingMessage,
} from './createForm';
import { createForm } from './index';
jest.mock('node-fetch');
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

    this.body =
      typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body;
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
function mockFetchOnce({ form, mutation }: { form: any; mutation: any }) {
  ((fetch as any) as jest.Mock<any>).mockImplementationOnce(
    async (path, { body, method }) => {
      const postCtx = mockCtx({
        resolvedUrl: path,
        req: {
          method,
          body,
          url: `http://localhost:3000${path}`,
        },
      });
      const res = await form.getPageProps({ ctx: postCtx, mutation });
      return {
        json() {
          return {
            pageProps: res,
          };
        },
      };
    }
  );
}

function mockCtx<TBody extends Object | string>(
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

describe('deep nesting', () => {
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

describe('useForm hook', () => {
  const form = createForm({
    schema: z.object({
      message: z.string(),
      user: z.object({
        name: z.string().min(2),
        twitter: z.string().optional(),
      }),
    }),
    defaultValues: {
      message: 'defaultMessage',
      user: {
        name: '',
        twitter: '',
      },
    },
    formId: 'form',
  });
  test('simple render', async () => {
    const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
      const formProps = await form.getPageProps({
        ctx,
        async mutation() {},
      });
      return {
        props: {
          ...formProps,
        },
      };
    };

    const ctx = mockCtx({}) as GetServerSidePropsContext;
    type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

    function MyPage(props: Props) {
      const { Form } = form._unstable_useFormikScaffold(props);
      return <Form>{() => <>{props.form.endpoints.action}</>}</Form>;
    }

    const ssr = await getServerSideProps(ctx);
    await waitFor(() => {
      render(<MyPage {...ssr.props} />);
    });
  });

  test('interactions', async () => {
    const ctx = mockCtx({});

    const mutation = jest.fn(async function mutationMock<T>(arg: T) {
      return arg;
    });
    const formProps = await form.getPageProps({
      ctx,
      mutation,
    });

    function FieldAndError({ name }: { name: string }) {
      return (
        <label>
          <Field type="text" name={name} data-testid={name} />

          <ErrorMessage name={name} />
        </label>
      );
    }
    const ERROR_MSG = 'SOMETHING_WENT_WRONG';
    const SUCCESS_MSG = 'YAY_SUCCEEDED';
    function MyPage(props: typeof formProps) {
      const { Form, feedback } = form._unstable_useFormikScaffold(props);
      return (
        <Form>
          {({ isSubmitting }) => (
            <>
              <FieldAndError name="message" />
              <FieldAndError name="user.name" />
              <FieldAndError name="user.twitter" />
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="submit"
              >
                Submit
              </button>
              {feedback?.state === 'error' && (
                <>
                  {ERROR_MSG}
                  <pre>
                    {JSON.stringify(
                      {
                        stack: feedback.error.stack,
                        message: feedback.error.message,
                      },
                      null,
                      4
                    )}
                  </pre>
                </>
              )}
              {feedback?.state === 'success' && SUCCESS_MSG}
            </>
          )}
        </Form>
      );
    }

    const utils = render(<MyPage {...formProps} />);
    mockFetchOnce({ form, mutation });
    function getInput(name: string) {
      const el = utils.getByTestId(name);
      return el as HTMLInputElement;
    }

    function setInput(name: string, value: string) {
      const input = getInput(name);
      fireEvent.change(input, { target: { value } });
    }
    await waitFor(async () => {
      // check defaults
      const input = getInput('message');
      expect(input.value).toBe('defaultMessage');
    });
    setInput('message', 'test');
    setInput('user.name', 'name');
    setInput('user.twitter', 'handle');

    utils.getByTestId('submit').click();

    await waitFor(async () => {
      // expect success
      expect(utils.getByText(SUCCESS_MSG)).toBeInTheDocument();
      // expect reset
      const input = getInput('message');
      expect(input.value).toBe('defaultMessage');
    });

    // // submit again with other values (failing)
    {
      const input = getInput('user.name');
      fireEvent.change(input, { target: { value: 'a' } });
      utils.getByTestId('submit').click();
    }

    // fill in properly but fail mutation
    mockFetchOnce({
      form,
      mutation: async function() {
        throw new Error('__ERROR__');
      },
    });
    setInput('user.name', ' alex');
    setInput('message', ' hello there');

    utils.getByTestId('submit').click();
    await waitFor(async () => {
      expect(
        utils.getByText('Should be at least 2 characters')
      ).toBeInTheDocument();
    });
  });
});

describe('DefaultValues<T> test', () => {
  test('literal string - empty string is allowed', () => {
    createForm({
      schema: z.object({
        rating: z.enum(['1', '2', '3', '4', '5']),
      }),
      defaultValues: {
        rating: '',
      },
      formId: 'form',
    });
  });
  test('number - empty string is allowed', () => {
    createForm({
      schema: z.object({
        rating: z.union([z.literal(1), z.literal(2)]),
      }),
      defaultValues: {
        rating: '',
      },
      formId: 'form',
    });
  });
});
describe('getInitialValues()', () => {
  test('simple', async () => {
    const form = createForm({
      schema: z.object({
        set: z.string(),
        notSet: z.string(),
      }),
      defaultValues: {
        set: 'defaultValue',
        notSet: '',
      },
      formId: 'form',
    });
    const props = await form.getPageProps({
      ctx: mockCtx({}),
      async mutation() {},
    });
    const defaultValues = form.getInitialValues(props);
    expect(defaultValues).toMatchInlineSnapshot(`
      Object {
        "notSet": "",
        "set": "defaultValue",
      }
    `);
  });

  test('simple', async () => {
    const form = createForm({
      schema: z.object({
        set: z.string(),
        notSet: z.string(),
      }),
      defaultValues: {
        set: 'defaultValue',
        notSet: '',
      },
      formId: 'form',
    });
    const props = await form.getPageProps({
      ctx: mockCtx({}),
      async mutation() {},
    });
    const defaultValues = form.getInitialValues(props);
    expect(defaultValues).toMatchInlineSnapshot(`
      Object {
        "notSet": "",
        "set": "defaultValue",
      }
    `);
  });
  test('nested', async () => {
    const form = createForm({
      schema: z.object({
        arr: z.array(z.string()),
        obj: z.object({
          str: z.string(),
        }),
      }),
      defaultValues: {
        arr: [],
        obj: {
          str: '',
        },
      },
      formId: 'form',
    });
    const props = await form.getPageProps({
      ctx: mockCtx({}),
      async mutation() {},
    });
    const defaultValues = form.getInitialValues(props);
    expect(defaultValues).toMatchInlineSnapshot(`
      Object {
        "arr": Array [],
        "obj": Object {
          "str": "",
        },
      }
    `);
  });
});

describe('error handling', () => {
  test('multiple errors on the same field', async () => {
    const form = createForm({
      schema: z.object({
        from: z.object({
          twitter: z
            .string()
            .regex(/^[a-zA-Z0-9_]{1,15}$/, {
              message: 'Not a valid twitter handle',
            })
            .refine(val => val === 'alexdotjs', {
              message: 'has to be alexdotjs',
            })
            .optional(),
        }),
      }),
      defaultValues: {
        from: {
          twitter: '',
        },
      },
      formId: 'form',
    });
    expect(
      form.formikValidator({
        from: {
          twitter: 'nope',
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "from": Object {
          "twitter": "has to be alexdotjs",
        },
      }
    `);
  });
});
