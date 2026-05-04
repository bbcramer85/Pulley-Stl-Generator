export function legacy() {
  if (!window.GeneratorLegacy) {
    throw new Error("Generator engine did not load. Check the legacy script tags in index.html.");
  }
  return window.GeneratorLegacy;
}
