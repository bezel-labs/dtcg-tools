import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

export const revalidate = false;

/** Exports the search index at build time; the client searches it locally. */
export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
});
