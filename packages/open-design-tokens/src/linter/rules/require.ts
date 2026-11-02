import { defineRule } from '../define.js';

export const requireDescription = defineRule<undefined>({
  id: 'require-description',
  meta: { description: 'Every token has a $description.', defaultSeverity: 'warning' },
  create(ctx) {
    return {
      token(node) {
        if (typeof node.raw.$description !== 'string' || node.raw.$description.trim() === '') {
          ctx.report({ code: 'missing', message: 'Token has no $description.', path: node.path });
        }
      },
    };
  },
});

export const requireExplicitType = defineRule<undefined>({
  id: 'require-explicit-type',
  meta: {
    description: 'Every token declares its own $type instead of inheriting it.',
    defaultSeverity: 'warning',
  },
  create(ctx) {
    return {
      token(node) {
        if (node.ownType === undefined) {
          ctx.report({
            code: 'inherited',
            message: 'Token inherits its $type; declare it explicitly.',
            path: node.path,
            meta: { inheritedType: node.inheritedType },
          });
        }
      },
    };
  },
});

export const noEmptyGroups = defineRule<undefined>({
  id: 'no-empty-groups',
  meta: {
    description: 'Groups contain at least one token or sub-group.',
    defaultSeverity: 'warning',
    recommended: true,
  },
  create(ctx) {
    return {
      group(node) {
        if (node.path.length === 0) return;
        const hasMember = Object.keys(node.raw).some((k) => !k.startsWith('$') || k === '$root');
        if (!hasMember)
          ctx.report({
            code: 'empty',
            message: 'Group has no tokens or sub-groups.',
            path: node.path,
          });
      },
    };
  },
});
