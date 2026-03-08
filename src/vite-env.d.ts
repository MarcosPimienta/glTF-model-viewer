// Allow Vite's ?url imports for WebAssembly files
declare module "*.wasm?url" {
  const url: string;
  export default url;
}
