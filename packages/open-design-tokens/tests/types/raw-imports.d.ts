// The demo examples module imports the sample tokens file with Vite's `?raw` suffix.
declare module '*?raw' {
  const text: string;
  export default text;
}
