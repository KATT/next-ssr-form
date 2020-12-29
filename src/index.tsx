import { useState } from 'react';

export { assertOnServer } from './assertOnServer';
export { createForm, MiniTest, useTestHook } from './createForm';

export function useStupidHook(startValue: string) {
  return useState(startValue);
}
