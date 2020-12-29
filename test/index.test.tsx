import * as z from 'zod';
import { createForm } from '../src/index';

test('createForm', () => {
  createForm({
    schema: z.object({
      from: z.string().min(2),
      message: z.string().min(4),
    }),
    defaultValues: {
      message: '',
      from: '',
    },
    formId: 'createPost',
  });
});
