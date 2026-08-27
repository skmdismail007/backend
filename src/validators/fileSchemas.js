import { z } from 'zod'

export const fileIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid file id'),
  }),
})
