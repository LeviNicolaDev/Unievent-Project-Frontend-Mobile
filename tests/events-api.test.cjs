const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function loadApi(fetch) {
  const context = vm.createContext({ fetch, FormData, URLSearchParams, process: { env: {} }, console });
  const api = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, "../src/services/api.js"), "utf8"), { context }
  );
  await api.link((specifier) => {
    let values;
    if (specifier === "react-native")
      values = { Image: {}, Platform: { OS: "android" } };
    else if (specifier.includes("/data/events"))
      values = { events: [{ title: "Fallback", image: null }] };
    else values = { default: {} };
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await api.evaluate();
  return api.namespace;
}

test("mobile displays UTC and legacy event dates in Sao Paulo time", async () => {
  const { mapApiEvent } = await loadApi();
  for (const [input, expected] of [
    ["2026-11-24T00:00:00Z", "21:00"],
    ["2026-11-23T18:53:00Z", "15:53"],
    ["2026-11-23T15:53:00", "15:53"],
  ]) {
    const event = mapApiEvent({ id: 7, nome: "Evento", dataEvento: input });
    assert.equal(event.displayTime, expected);
    assert.match(event.fullDate, /23/);
  }
});

test("cancellation uses the authenticated participant endpoint and propagates failure", async () => {
  const calls = [];
  let status = 200;
  const { eventsApi } = await loadApi(async (url, options) => {
    calls.push({ url, ...options });
    return new Response(JSON.stringify(status === 200 ? { statusInscricao: "cancelada" } : ["Check-in realizado"]), { status });
  });
  assert.equal((await eventsApi.cancelRegistration(7, "student-token")).statusInscricao, "cancelada");
  assert.match(calls[0].url, /\/api\/Evento\/7\/inscricao$/);
  assert.equal(calls[0].method, "DELETE");
  assert.equal(calls[0].headers.Authorization, "Bearer student-token");
  status = 400;
  await assert.rejects(eventsApi.cancelRegistration(7, "student-token"), /Check-in realizado/);
});

test("registrations are loaded from tickets, including cancelled history", async () => {
  const { eventsApi } = await loadApi(async (url, options) => {
    assert.match(url, /\/api\/Evento\/meus-ingressos$/);
    assert.equal(options.headers.Authorization, "Bearer student-token");
    return new Response(JSON.stringify([{ eventoId: 7, statusInscricao: "cancelada" }]));
  });
  assert.equal((await eventsApi.listTickets("student-token"))[0].statusInscricao, "cancelada");
});

test("preferences use authenticated GET and PUT with selected categories and report API errors", async () => {
  const calls = [];
  let status = 200;
  const { preferencesApi } = await loadApi(async (url, options) => {
    calls.push({ url, ...options });
    return new Response(JSON.stringify(status === 200
      ? { categorias: "Palestra,Workshop", lembretesEventos: true, recomendacoes: true }
      : ["Falha ao salvar preferencias"]), { status });
  });
  assert.equal((await preferencesApi.get("student-token")).categorias, "Palestra,Workshop");
  const payload = { categorias: ["Palestra", "Workshop"], lembretesEventos: true,
    alertasCertificados: true, recomendacoes: true, usarLocalizacao: false, raioKm: 30 };
  await preferencesApi.update("student-token", payload);
  assert.match(calls[1].url, /\/api\/me\/preferencias$/);
  assert.equal(calls[1].method, "PUT");
  assert.equal(calls[1].headers.Authorization, "Bearer student-token");
  assert.deepEqual(JSON.parse(calls[1].body), payload);
  status = 500;
  await assert.rejects(preferencesApi.update("student-token", payload), /Falha ao salvar preferencias/);
});

test("new API categories use the labels available in the home filters", async () => {
  const { mapApiEvent } = await loadApi();
  for (const [category, label] of [["curso", "Cursos"], ["musica", "Música"], ["hackathon", "Hackathon"]]) {
    assert.equal(mapApiEvent({ id: 1, nome: "Evento", categoria: category,
      dataEvento: "2026-12-01T18:00:00Z" }).category, label);
  }
});
