export const INTEREST_CATEGORIES = [
  { value: "Palestra", label: "Palestras" },
  { value: "Workshop", label: "Workshops" },
  { value: "Feira", label: "Feiras" },
  { value: "Evento", label: "Eventos" },
  { value: "Festa", label: "Festas" },
  { value: "Curso", label: "Cursos" },
  { value: "Musica", label: "Música" },
  { value: "Hackathon", label: "Hackathon" },
];

export function normalizeNotificationPreferences(item = {}) {
  item = item || {};
  const raw = item.categorias ?? item.Categorias ?? [];
  const values = (Array.isArray(raw) ? raw : String(raw).split(","))
    .map(value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase());
  return {
    lembretesEventos: item.lembretesEventos ?? item.LembretesEventos ?? true,
    alertasCertificados: item.alertasCertificados ?? item.AlertasCertificados ?? true,
    recomendacoes: item.recomendacoes ?? item.Recomendacoes ?? true,
    usarLocalizacao: item.usarLocalizacao ?? item.UsarLocalizacao ?? false,
    categorias: INTEREST_CATEGORIES.filter(category =>
      values.includes(category.value.toLowerCase())).map(category => category.value),
    latitudeAproximada: item.latitudeAproximada ?? item.LatitudeAproximada ?? null,
    longitudeAproximada: item.longitudeAproximada ?? item.LongitudeAproximada ?? null,
    raioKm: item.raioKm ?? item.RaioKm ?? 30,
  };
}
