import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    lang: z.enum(['en', 'zh']),
    title: z.string(), description: z.string(), date: z.coerce.date(),
    tags: z.array(z.string()), category: z.string(), readingTime: z.string(),
    featured: z.boolean().default(false), demo: z.boolean().default(false),
    draft: z.boolean().default(false), coverTitle: z.string().max(64).optional(),
  }),
});
export const collections = { blog };
