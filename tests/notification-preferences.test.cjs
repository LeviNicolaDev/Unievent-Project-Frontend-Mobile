const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function preferencesUtil() {
  const module = new vm.SourceTextModule(fs.readFileSync(
    path.join(__dirname, "../src/utils/notificationPreferences.js"), "utf8"));
  await module.link(() => { throw new Error("Unexpected import"); });
  await module.evaluate();
  return module.namespace;
}

test("normalizes the API's comma-separated categories into selectable canonical values", async () => {
  const { normalizeNotificationPreferences } = await preferencesUtil();
  const result = normalizeNotificationPreferences({ categorias: " workshop,PALESTRA,Workshop, desconhecida " });
  assert.deepEqual(Array.from(result.categorias), ["Palestra", "Workshop"]);
});

test("accepts array and PascalCase responses and preserves location settings", async () => {
  const { normalizeNotificationPreferences } = await preferencesUtil();
  const result = normalizeNotificationPreferences({
    Categorias: ["Feira", "Festa"], LembretesEventos: false, Recomendacoes: false,
    AlertasCertificados: false, UsarLocalizacao: true, LatitudeAproximada: -23.5,
    LongitudeAproximada: -46.6, RaioKm: 12,
  });
  assert.deepEqual(Array.from(result.categorias), ["Feira", "Festa"]);
  assert.equal(result.lembretesEventos, false);
  assert.equal(result.recomendacoes, false);
  assert.equal(result.alertasCertificados, false);
  assert.equal(result.usarLocalizacao, true);
  assert.equal(result.latitudeAproximada, -23.5);
  assert.equal(result.longitudeAproximada, -46.6);
  assert.equal(result.raioKm, 12);
});

test("saving and reloading keeps the selected categories and permits clearing all interests", async () => {
  const { normalizeNotificationPreferences } = await preferencesUtil();
  const selected = normalizeNotificationPreferences({ categorias: ["Workshop", "Palestra"] });
  const reloaded = normalizeNotificationPreferences({ ...selected, categorias: selected.categorias.join(",") });
  assert.deepEqual(Array.from(reloaded.categorias), ["Palestra", "Workshop"]);
  assert.deepEqual(Array.from(normalizeNotificationPreferences({ ...selected, categorias: [] }).categorias), []);
});
