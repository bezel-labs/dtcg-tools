import { describe, expect, it } from 'vitest';
import { getNodeAtPointer, prepareDocument, walkDocument } from '../../src/validator/index.js';

describe('walkDocument', () => {
  const doc = prepareDocument({
    g: { $type: 'number', a: { $value: 1 }, h: { b: { $value: 2 } } },
    r: { $ref: '#/g/a' },
  });

  it('visits every node in document order with the right visitor', () => {
    const seen: string[] = [];
    walkDocument(doc, {
      token: (n) => seen.push(`t:${n.pointer}`),
      group: (n) => seen.push(`g:${n.pointer}`),
    });
    expect(seen).toEqual(['g:', 'g:/g', 't:/g/a', 'g:/g/h', 't:/g/h/b', 't:/r']);
  });

  it('tolerates a partial visitor', () => {
    const groups: string[] = [];
    walkDocument(doc, { group: (n) => groups.push(n.pointer) });
    expect(groups).toEqual(['', '/g', '/g/h']);
  });

  it('getNodeAtPointer looks up the index', () => {
    expect(getNodeAtPointer(doc, '/g/a')?.kind).toBe('token');
    expect(getNodeAtPointer(doc, '/r')?.kind).toBe('reference');
    expect(getNodeAtPointer(doc, '/nope')).toBeUndefined();
  });
});
