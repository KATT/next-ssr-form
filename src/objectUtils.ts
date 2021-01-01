// export function flattenObject(data: any, path?: string) {
//   let result: Record<string, unknown> = {};
//   const prefix = path === undefined ? '' : path + '.';
//   for (var i in data) {
//     const value = data[i];
//     if (
//       typeof value !== 'object' ||
//       (Array.isArray(value) && value.length === 0)
//     ) {
//       result[prefix + i] = value;
//       continue;
//     }
//     Object.assign(result, flattenObject(value, prefix + i));
//   }
//   return result;
// }

export function replaceLeafNodes(
  node: any[] | Record<string, any>,
  newValue: any
) {
  const copy: any = Array.isArray(node) ? [...node] : { ...node };

  for (var indexOrKey in copy) {
    const value = copy[indexOrKey];
    if (typeof value !== 'object' || !value) {
      // leaf node
      copy[indexOrKey] = newValue;
    } else {
      copy[indexOrKey] = replaceLeafNodes(value, newValue);
    }
  }
  return copy;
}

export function unflattenObject<T extends Record<string, any>>(
  obj: Record<string, any>
): T {
  const newObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('.');
    const lastPart = parts.pop();
    let current = newObj;
    if (lastPart === undefined) {
      continue;
    }
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const next = parts[index + 1];
      if (current[part] === undefined) {
        current[part] = typeof next === 'number' ? [] : {};
      }
      current = current[part];
    }
    current[lastPart] = value;
  }
  return newObj as T;
}
