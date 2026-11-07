/* @types/prismjs covers the full bundle, not these smaller entry points. */
declare module 'prismjs/components/prism-core' {
  const Prism: typeof import('prismjs');
  export default Prism;
}

declare module 'prismjs/components/prism-json';
