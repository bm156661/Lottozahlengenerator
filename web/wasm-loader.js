export default async function initWasm(){
  try {
    // Erwartet, dass 'wasm-pack build --target web' nach /web/pkg/ erzeugt
    const wasmModule = await import('./pkg/lotto_wasm.js');
    await wasmModule.default(); // init
    return {
      generate_lotto: wasmModule.generate_lotto
    };
  } catch (e) {
    console.warn('WASM-Modul nicht gefunden oder konnte nicht geladen werden. Fallback wird verwendet.', e);
    return {};
  }
}
