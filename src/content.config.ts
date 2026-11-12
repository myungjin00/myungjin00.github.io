import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    // review: a paper I read. concept: something I worked out for myself. tutorial: how to use a tool.
    category: z.enum(['review', 'concept', 'tutorial']),
    tags: z.array(z.string()).default([]),
    topic: z.string().optional(),
    // a second level inside a topic, e.g. Bioinformatics -> Transcriptomics
    subtopic: z.string().optional(),
    // paper reviews carry the venue of the paper being reviewed
    venue: z.string().optional(),
    venueYear: z.number().optional(),   // groups guides: Linux, Graph neural networks, …
    // when the CONTENT was last checked, not when it was posted. YYYY-MM.
    updated: z.string().regex(/^\d{4}-\d{2}$/),
    lang: z.enum(['en', 'ko']).default('en'),
    // posts sharing a group are translations of one another
    group: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { blog }
