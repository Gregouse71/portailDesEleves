import { API_BASE_URL } from "./base";

export async function obtenirSondageDuJour() {
  const res = await fetch(`${API_BASE_URL}/sondages/sondage_du_jour`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON 
}

export async function obtenirSondagesEnAttente() {
  const res = await fetch(`${API_BASE_URL}/sondages/obtenir_sondages_en_attente`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON 
}

export async function validerSondage(id_sondage) {
  await fetch(`${API_BASE_URL}/sondages/route_valider_sondage/${id_sondage}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  });
}

export async function supprimerSondage(id_sondage) {
  await fetch(`${API_BASE_URL}/sondages/route_supprimer_sondage/${id_sondage}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  });
}

export async function sondageSuivant() {
  try {
    const response = await fetch(`${API_BASE_URL}/sondages/sondage_suivant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (!response.ok) { // Si la réponse n'est pas 200, c'est une erreur
      const errorData = await response.json();
      console.error("Erreur :", errorData.message);
      // Afficher l'erreur dans l'interface utilisateur si nécessaire
      alert(`Erreur : ${errorData.message}`);
    }
  } catch (error) {
    console.error("Erreur réseau :", error);
    // Afficher l'erreur dans l'interface utilisateur si nécessaire
    alert(`Erreur réseau : ${error.message}`);
  }
}

export async function voterSondage(id_vote) {
  await fetch(`${API_BASE_URL}/sondages/voter_sondage/${id_vote}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  });
}

export async function requeteProposerSondage(question, reponses) {
  const res = await fetch(`${API_BASE_URL}/sondages/proposer_sondage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Si tu utilises des cookies de session
    body: JSON.stringify({ question, reponses })
  });

  const data = await res.json(); // Récupère la réponse JSON de l'API
  return data;
}

export async function obtenirScoresSondages() {
  const res = await fetch(`${API_BASE_URL}/sondages/scores`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON 
}

export async function obtenirHistoriqueSondages({ page = 1, parPage = 10, dateDebut, dateFin, q } = {}) {
  const params = new URLSearchParams({ page, par_page: parPage });
  if (dateDebut) params.set("date_debut", dateDebut);
  if (dateFin) params.set("date_fin", dateFin);
  if (q) params.set("q", q);

  const res = await fetch(`${API_BASE_URL}/sondages/historique?${params}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Erreur lors du chargement de l'historique");
  }
  return res.json();
}