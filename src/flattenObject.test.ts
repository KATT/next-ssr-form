import { flattenObject, unflattenObject } from './flattenObject';

describe('flattenObject', () => {
  test('flattenObject simple', () => {
    expect(
      flattenObject({
        foo: 'bar',
        num: 1,
      })
    ).toMatchInlineSnapshot(`
          Object {
            "foo": "bar",
            "num": 1,
          }
      `);
  });

  test('flattenObject complex', () => {
    expect(
      flattenObject({
        foo: {
          emptyArr: [],
          filledArr: [1, 2, 3],
        },
        zoo: {
          ok: true,
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "foo.emptyArr": Array [],
        "foo.filledArr.0": 1,
        "foo.filledArr.1": 2,
        "foo.filledArr.2": 3,
        "zoo.ok": true,
      }
    `);
  });
});
describe('unflattenObject', () => {
  test('simple', () => {
    expect(
      unflattenObject({
        a: 'b',
      })
    ).toEqual({
      a: 'b',
    });
  });

  test('complex', () => {
    expect(
      unflattenObject({
        'a.b': 'c',
        arr: [1],
      })
    ).toEqual({
      a: {
        b: 'c',
      },
      arr: [1],
    });
  });
});

test('wrap/unwrap', () => {
  const wrapped = flattenObject({
    foo: 'bar',
    num: 1,
    user: {
      test: '',
    },
  });
  const unwrapped = unflattenObject(wrapped);

  const wrappedAgain = flattenObject(unwrapped);

  expect(wrappedAgain).toEqual(wrapped);
});
