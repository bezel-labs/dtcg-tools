/**
 * Self-contained examples, one group per validator area. Each example loads
 * into the editor so every rule can be exercised by hand. `expect` lists the
 * issue codes the validator should report (empty means valid).
 */
export interface Example {
  title: string;
  description: string;
  expect: string[];
  json: string;
}

export interface ExampleGroup {
  area: string;
  spec: string;
  examples: Example[];
}

const j = (value: unknown): string => JSON.stringify(value, null, 2);
const color = (components: unknown[], extra: Record<string, unknown> = {}) => ({
  $type: 'color',
  $value: { colorSpace: 'srgb', components, ...extra },
});

export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    area: 'Document',
    spec: '§4 File format',
    examples: [
      {
        title: 'Empty document',
        description: 'An empty object is a valid (empty) design tokens file.',
        expect: [],
        json: '{}',
      },
      {
        title: 'Root is not an object',
        description: 'The document root must be a JSON object, not an array or scalar.',
        expect: ['document.not-object'],
        json: '[]',
      },
      {
        title: 'Broken JSON',
        description: 'Parse failures are reported as a diagnostic rather than thrown.',
        expect: ['document.invalid-json'],
        json: '{ "color": { "$type": "color" ',
      },
    ],
  },
  {
    area: 'Tokens and names',
    spec: '§5 Design token',
    examples: [
      {
        title: 'Missing $type',
        description:
          'A token needs an explicit $type or one inherited from a parent group. Nothing is inferred from the value.',
        expect: ['token.type.missing'],
        json: j({ spacing: { $value: { value: 4, unit: 'px' } } }),
      },
      {
        title: 'Unknown or mis-cased $type',
        description: '$type is case-sensitive; the message suggests the correct casing.',
        expect: ['token.type.invalid'],
        json: j({
          brand: { $type: 'Color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } },
        }),
      },
      {
        title: 'Forbidden characters in names',
        description: 'Names must not contain { } or . because those are alias syntax.',
        expect: ['name.forbidden-character'],
        json: j({ 'brand.primary': { $type: 'number', $value: 1 } }),
      },
      {
        title: 'Token with child members',
        description:
          'An object with $value is a token and cannot also hold child tokens or groups (§6.1).',
        expect: ['token.property.not-allowed'],
        json: j({ size: { $type: 'number', $value: 1, large: { $type: 'number', $value: 2 } } }),
      },
      {
        title: '$description, $deprecated, $extensions',
        description:
          '$description must be a string, $deprecated a boolean or string, $extensions an object. Keys without a dot get a namespacing warning.',
        expect: [
          'token.description.not-string',
          'token.deprecated.invalid',
          'token.extensions.key-not-namespaced',
        ],
        json: j({
          t: {
            $type: 'number',
            $value: 1,
            $description: ['not a string'],
            $deprecated: 1,
            $extensions: { myTool: true, 'com.example.tool': true },
          },
        }),
      },
      {
        title: 'Unknown $-property',
        description: 'Unknown $-prefixed properties are warnings, for forward compatibility.',
        expect: ['token.property.unknown'],
        json: j({ t: { $type: 'number', $value: 1, $comment: 'hello' } }),
      },
    ],
  },
  {
    area: 'Groups',
    spec: '§6 Groups',
    examples: [
      {
        title: 'Type inheritance and $root',
        description: "Tokens inherit $type from the nearest group; $root is the group's own token.",
        expect: [],
        json: j({
          spacing: {
            $type: 'dimension',
            $root: { $value: { value: 16, unit: 'px' } },
            small: { $value: { value: 8, unit: 'px' } },
          },
        }),
      },
      {
        title: 'Member that is not an object',
        description: 'Every non-$ member of a group must be a token or a group.',
        expect: ['group.member.invalid'],
        json: j({ colors: { primary: '#ff0000' } }),
      },
      {
        title: 'Names differing only by case',
        description: 'Valid, but tools that transform names may collide, so a warning is emitted.',
        expect: ['group.name.case-collision'],
        json: j({ Size: {}, size: {} }),
      },
      {
        title: '$root that is not a token',
        description: 'The reserved $root member must be a token (object with $value).',
        expect: ['group.root.not-token'],
        json: j({ g: { $root: { child: { $type: 'number', $value: 1 } } } }),
      },
    ],
  },
  {
    area: 'Color',
    spec: '§8.1 / Color Module 2025.10',
    examples: [
      {
        title: 'Valid colors across spaces',
        description:
          'colorSpace from the 14 supported spaces, three components (numbers or "none"), optional alpha and hex.',
        expect: [],
        json: j({
          $type: 'color',
          pink: { $value: { colorSpace: 'srgb', components: [1, 0, 1], alpha: 1, hex: '#ff00ff' } },
          white: { $value: { colorSpace: 'hsl', components: ['none', 0, 100] } },
          lab: { $value: { colorSpace: 'oklch', components: [0.7, 0.32, 328.4] } },
        }),
      },
      {
        title: 'Unknown color space',
        description: 'Case-sensitive; "sRGB" is suggested as "srgb".',
        expect: ['color.color-space.invalid'],
        json: j({ c: { $type: 'color', $value: { colorSpace: 'sRGB', components: [1, 0, 0] } } }),
      },
      {
        title: 'Components out of range',
        description: 'Each space has per-component ranges; hue is [0, 360) so 360 is rejected.',
        expect: ['color.component.out-of-range', 'color.component.out-of-range'],
        json: j({
          a: color([1.5, 0, 0]),
          b: { $type: 'color', $value: { colorSpace: 'hsl', components: [360, 50, 50] } },
        }),
      },
      {
        title: 'Wrong component count and alpha',
        description: 'Exactly three components; alpha must be a number in [0, 1].',
        expect: ['color.components.wrong-length', 'color.alpha.out-of-range'],
        json: j({ a: color([1, 0]), b: color([0, 0, 0], { alpha: 2 }) }),
      },
      {
        title: 'Hex format and mismatch',
        description:
          'hex must be 6-digit "#rrggbb". For srgb, a hex that disagrees with the components is a warning.',
        expect: ['color.hex.invalid', 'color.hex.mismatch'],
        json: j({ a: color([1, 1, 1], { hex: '#fff' }), b: color([1, 0, 0], { hex: '#00ff00' }) }),
      },
      {
        title: 'Legacy hex string value',
        description: '2025.10 color values are objects; a bare "#ff0000" is not accepted.',
        expect: ['color.value.not-object'],
        json: j({ c: { $type: 'color', $value: '#ff0000' } }),
      },
    ],
  },
  {
    area: 'Dimension and duration',
    spec: '§8.2, §8.5',
    examples: [
      {
        title: 'Valid dimension and duration',
        description: 'Objects with a numeric value and a unit: px or rem, ms or s.',
        expect: [],
        json: j({
          gap: { $type: 'dimension', $value: { value: 0.5, unit: 'rem' } },
          quick: { $type: 'duration', $value: { value: 100, unit: 'ms' } },
        }),
      },
      {
        title: 'Missing unit (even for 0)',
        description: 'unit is required even when value is 0.',
        expect: ['dimension.unit.missing'],
        json: j({ zero: { $type: 'dimension', $value: { value: 0 } } }),
      },
      {
        title: 'Unsupported units',
        description: 'Only px/rem and ms/s are allowed; case matters.',
        expect: ['dimension.unit.invalid', 'duration.unit.invalid'],
        json: j({
          a: { $type: 'dimension', $value: { value: 1, unit: 'em' } },
          b: { $type: 'duration', $value: { value: 1, unit: 'sec' } },
        }),
      },
      {
        title: 'CSS shorthand strings',
        description: '"16px" and "100ms" are not objects and are rejected.',
        expect: ['dimension.value.not-object', 'duration.value.not-object'],
        json: j({
          a: { $type: 'dimension', $value: '16px' },
          b: { $type: 'duration', $value: '100ms' },
        }),
      },
    ],
  },
  {
    area: 'Font family and weight',
    spec: '§8.3, §8.4',
    examples: [
      {
        title: 'Valid families and weights',
        description:
          'fontFamily is a string or array of strings; fontWeight is 1..1000 or a keyword.',
        expect: [],
        json: j({
          body: { $type: 'fontFamily', $value: ['Inter', 'Helvetica', 'sans-serif'] },
          heavy: { $type: 'fontWeight', $value: 'extra-bold' },
          custom: { $type: 'fontWeight', $value: 350 },
        }),
      },
      {
        title: 'Weight keyword casing and range',
        description:
          'Keywords are case-sensitive ("Bold" suggests "bold"); numbers outside [1, 1000] fail.',
        expect: ['font-weight.keyword.invalid', 'font-weight.number.out-of-range'],
        json: j({
          a: { $type: 'fontWeight', $value: 'Bold' },
          b: { $type: 'fontWeight', $value: 1001 },
        }),
      },
      {
        title: 'Non-string family entry',
        description: 'Every entry in a fontFamily array must be a string.',
        expect: ['font-family.name.not-string'],
        json: j({ f: { $type: 'fontFamily', $value: ['Inter', 12] } }),
      },
    ],
  },
  {
    area: 'Cubic Bézier and number',
    spec: '§8.6, §8.7',
    examples: [
      {
        title: 'Valid curves and numbers',
        description:
          'Four numbers [x1, y1, x2, y2]; x in [0, 1], y unbounded. Numbers are any JSON number.',
        expect: [],
        json: j({
          ease: { $type: 'cubicBezier', $value: [0.34, 1.56, 0.64, 1] },
          lh: { $type: 'number', $value: 1.5 },
        }),
      },
      {
        title: 'x out of range and wrong length',
        description: 'x coordinates must be within [0, 1]; exactly four numbers are required.',
        expect: ['cubic-bezier.x.out-of-range', 'cubic-bezier.value.wrong-length'],
        json: j({
          a: { $type: 'cubicBezier', $value: [1.2, 0, 1, 1] },
          b: { $type: 'cubicBezier', $value: [0, 0, 1] },
        }),
      },
      {
        title: 'Number as string',
        description: 'A number token value must be a JSON number.',
        expect: ['number.value.not-number'],
        json: j({ n: { $type: 'number', $value: '2' } }),
      },
    ],
  },
  {
    area: 'Aliases',
    spec: '§7.1.1 Curly braces',
    examples: [
      {
        title: 'Alias and chained alias',
        description: 'Aliases resolve to tokens; untyped aliases take the type of the chain end.',
        expect: [],
        json: j({
          base: { $type: 'number', $value: 1 },
          a: { $value: '{base}' },
          b: { $value: '{a}' },
        }),
      },
      {
        title: 'Missing target and group target',
        description:
          'Targets must exist and be tokens; a group cannot be aliased (use {group.$root}).',
        expect: ['alias.target.missing', 'alias.target.not-token'],
        json: j({
          g: { $type: 'number', t: { $value: 1 } },
          a: { $value: '{nope}' },
          b: { $value: '{g}' },
        }),
      },
      {
        title: 'Circular aliases',
        description: 'Every token in the cycle is reported, plus any token aliasing into it.',
        expect: ['alias.cycle', 'alias.cycle', 'alias.cycle'],
        json: j({ a: { $value: '{b}' }, b: { $value: '{a}' }, c: { $value: '{a}' } }),
      },
      {
        title: 'Type mismatch',
        description: 'A declared or inherited type must match the resolved target type.',
        expect: ['alias.type.mismatch'],
        json: j({ n: { $type: 'number', $value: 1 }, c: { $type: 'color', $value: '{n}' } }),
      },
      {
        title: 'Malformed alias',
        description: 'Alias-shaped strings must follow {group.token} with non-empty segments.',
        expect: ['alias.syntax.invalid'],
        json: j({ a: { $type: 'number', $value: 1 }, b: { $type: 'number', $value: '{a..}' } }),
      },
    ],
  },
  {
    area: 'JSON pointer references',
    spec: '§7.1.2 $ref',
    examples: [
      {
        title: 'Whole-value and fragment references',
        description:
          '$ref may replace $value (reference node) or appear as the value; fragments are typed by the referencing token.',
        expect: [],
        json: j({
          colors: {
            blue: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0.4, 0.8] } },
          },
          primary: { $ref: '#/colors/blue/$value', $type: 'color' },
          red: { $type: 'number', $value: { $ref: '#/colors/blue/$value/components/0' } },
        }),
      },
      {
        title: 'Non-local reference',
        description:
          'Only "#/..." pointers inside the document are followed; nothing is ever fetched.',
        expect: ['ref.not-local'],
        json: j({ n: { $type: 'number', $value: { $ref: 'https://example.com/tokens.json#/n' } } }),
      },
      {
        title: 'Missing target and bad fragment type',
        description: "The pointer must resolve; a fragment is validated against the token's type.",
        expect: ['ref.target.missing', 'number.value.not-number'],
        json: j({
          c: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
          a: { $type: 'number', $value: { $ref: '#/missing' } },
          b: { $type: 'number', $value: { $ref: '#/c/$value/colorSpace' } },
        }),
      },
    ],
  },
  {
    area: 'Group extension',
    spec: '§6.4 $extends',
    examples: [
      {
        title: 'Extend and override',
        description:
          'The extending group inherits tokens and $type; local tokens replace inherited ones at the same path.',
        expect: [],
        json: j({
          button: {
            $type: 'color',
            bg: { $value: { colorSpace: 'srgb', components: [0, 0.4, 0.8] } },
          },
          'button-primary': {
            $extends: '{button}',
            bg: { $value: { colorSpace: 'srgb', components: [0.8, 0, 0.4] } },
          },
          link: { $value: '{button-primary.bg}' },
        }),
      },
      {
        title: 'Missing target and token target',
        description: '$extends must reference an existing group, not a token.',
        expect: ['extends.target.missing', 'extends.target.not-group'],
        json: j({
          t: { $type: 'number', $value: 1 },
          a: { $extends: '{nope}' },
          b: { $extends: '{t}' },
        }),
      },
      {
        title: 'Circular extension',
        description: 'Groups cannot extend themselves, an ancestor, or each other.',
        expect: ['extends.cycle', 'extends.cycle'],
        json: j({ a: { $extends: '{b}' }, b: { $extends: '{a}' } }),
      },
      {
        title: 'Inherited token invalid in the new group',
        description: 'An inherited color token under a group typed dimension is invalid there.',
        expect: ['extends.inherited-token.invalid'],
        json: j({
          base: { $type: 'color', c: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } } },
          ext: { $extends: '{base}', $type: 'dimension' },
        }),
      },
    ],
  },
  {
    area: 'Composite types',
    spec: '§9 strokeStyle, border, transition, shadow, gradient, typography',
    examples: [
      {
        title: 'Shadow with aliased sub-values',
        description:
          'Sub-values may be explicit values or aliases to tokens of the right type; an untyped alias of the shadow takes its type.',
        expect: [],
        json: j({
          space: { small: { $type: 'dimension', $value: { value: 0.5, unit: 'rem' } } },
          color: {
            shadow: {
              $type: 'color',
              $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 },
            },
          },
          shadow: {
            medium: {
              $type: 'shadow',
              $value: {
                color: '{color.shadow}',
                offsetX: '{space.small}',
                offsetY: '{space.small}',
                blur: { value: 1.5, unit: 'rem' },
                spread: { value: 0, unit: 'rem' },
              },
            },
          },
          card: { $value: '{shadow.medium}' },
        }),
      },
      {
        title: 'Layered shadow array',
        description:
          'A shadow value may be an array of shadow objects and references to shadow tokens; references are not flattened.',
        expect: [],
        json: j({
          base: {
            $type: 'shadow',
            $value: {
              color: { colorSpace: 'srgb', components: [0, 0, 0] },
              offsetX: { value: 0, unit: 'px' },
              offsetY: { value: 2, unit: 'px' },
              blur: { value: 4, unit: 'px' },
              spread: { value: 0, unit: 'px' },
            },
          },
          layered: {
            $type: 'shadow',
            $value: [
              '{base}',
              {
                color: { colorSpace: 'srgb', components: [1, 0, 0] },
                offsetX: { value: 0, unit: 'px' },
                offsetY: { value: 8, unit: 'px' },
                blur: { value: 16, unit: 'px' },
                spread: { value: 0, unit: 'px' },
                inset: true,
              },
            ],
          },
        }),
      },
      {
        title: 'Missing and mistyped sub-values',
        description:
          'Each composite lists its required sub-values; an alias must point at a token of the expected type.',
        expect: ['composite.property.missing', 'alias.type.mismatch', 'dimension.value.not-object'],
        json: j({
          n: { $type: 'number', $value: 1 },
          b: { $type: 'border', $value: { color: '{n}', width: 'thin' } },
        }),
      },
      {
        title: 'Stroke style keyword and object',
        description:
          'A keyword from the fixed list, or { dashArray, lineCap } with dimension entries and round/butt/square.',
        expect: ['stroke-style.keyword.invalid', 'stroke-style.line-cap.invalid'],
        json: j({
          ok: {
            $type: 'strokeStyle',
            $value: { dashArray: [{ value: 4, unit: 'px' }], lineCap: 'round' },
          },
          a: { $type: 'strokeStyle', $value: 'Dashed' },
          b: { $type: 'strokeStyle', $value: { dashArray: [], lineCap: 'flat' } },
        }),
      },
      {
        title: 'Gradient stops and position clamping',
        description:
          'Stops need color and position; positions outside [0, 1] are clamped by consumers, so they only warn.',
        expect: ['gradient.position.out-of-range', 'gradient.stop.invalid'],
        json: j({
          g: {
            $type: 'gradient',
            $value: [
              { color: { colorSpace: 'srgb', components: [0, 0, 1] }, position: 0 },
              { color: { colorSpace: 'srgb', components: [1, 0, 0] }, position: 1.5 },
              'solid',
            ],
          },
        }),
      },
      {
        title: 'Typography with references',
        description:
          'Five required sub-values; aliases must resolve to tokens of the matching type.',
        expect: ['composite.property.missing', 'alias.target.missing'],
        json: j({
          t: {
            $type: 'typography',
            $value: {
              fontFamily: '{font.serif}',
              fontSize: { value: 16, unit: 'px' },
              fontWeight: 400,
              lineHeight: 1.5,
            },
          },
        }),
      },
      {
        title: 'Property-level $ref fragments',
        description:
          'A $ref may point at any part of another value (§7.3); the fragment is validated in place.',
        expect: ['dimension.value.not-number'],
        json: j({
          base: { $type: 'dimension', $value: { value: 16, unit: 'px' } },
          ok: {
            $type: 'dimension',
            $value: { value: { $ref: '#/base/$value/value' }, unit: 'rem' },
          },
          bad: {
            $type: 'dimension',
            $value: { value: { $ref: '#/base/$value/unit' }, unit: 'px' },
          },
        }),
      },
    ],
  },
];
