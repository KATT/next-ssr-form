import {
  // flattenObject,
  replaceLeafNodes,
  unflattenObject,
} from './objectUtils';

// describe('flattenObject', () => {
//   test('flattenObject simple', () => {
//     expect(
//       flattenObject({
//         foo: 'bar',
//         num: 1,
//       })
//     ).toMatchInlineSnapshot(`
//           Object {
//             "foo": "bar",
//             "num": 1,
//           }
//       `);
//   });

//   test('flattenObject complex', () => {
//     expect(
//       flattenObject({
//         foo: {
//           emptyArr: [],
//           filledArr: [1, 2, 3],
//         },
//         zoo: {
//           ok: true,
//         },
//       })
//     ).toMatchInlineSnapshot(`
//       Object {
//         "foo.emptyArr": Array [],
//         "foo.filledArr.0": 1,
//         "foo.filledArr.1": 2,
//         "foo.filledArr.2": 3,
//         "zoo.ok": true,
//       }
//     `);
//   });
// });
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

// test('wrap/unwrap', () => {
//   const wrapped = flattenObject({
//     foo: 'bar',
//     num: 1,
//     user: {
//       test: '',
//     },
//   });
//   const unwrapped = unflattenObject(wrapped);

//   const wrappedAgain = flattenObject(unwrapped);

//   expect(wrappedAgain).toEqual(wrapped);
// });

test('replaceLeafNode', () => {
  expect(
    replaceLeafNodes(
      {
        key: 'value',
      },
      true
    )
  ).toEqual({
    key: true,
  });
  expect(
    replaceLeafNodes(
      {
        deep: {
          value: {
            ok: false,
          },
        },
      },
      true
    )
  ).toEqual({
    deep: {
      value: {
        ok: true,
      },
    },
  });

  expect(
    replaceLeafNodes(
      {
        deep: {
          array: [
            {
              ok: false,
            },
          ],
          arr2: ['string1', 'string2'],
        },
      },
      true
    )
  ).toEqual({
    deep: {
      array: [
        {
          ok: true,
        },
      ],
      arr2: [true, true],
    },
  });
});
