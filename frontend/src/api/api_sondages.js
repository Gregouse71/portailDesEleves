import { API_BASE_URL, createApiGet, createApiPost } from "./base";

const SONDAGES_BASE_URL = `${API_BASE_URL}/sondages`;

/**
 * Récupère le sondage du jour (question, réponses, votes) ainsi que le résultat du sondage d'hier.
 */
export const obtenirSondageDuJour = () =>
    createApiGet(`${SONDAGES_BASE_URL}/sondage_du_jour`)();

/**
 * Récupère la liste des sondages en attente de validation et le nombre de sondages à venir.
 * @returns {Promise<{ sondages: Array<object>, a_venir: number }>}
 */
export const obtenirSondagesEnAttente = () =>
    createApiGet(`${SONDAGES_BASE_URL}/obtenir_sondages_en_attente`)();

/**
 * Valide un sondage proposé en attente (réservé au VP Sondaj).
 * @param {number} id_sondage - ID du sondage à valider
 */
export const validerSondage = (id_sondage) =>
    createApiPost(`${SONDAGES_BASE_URL}/route_valider_sondage`)({}, id_sondage);

/**
 * Supprime un sondage proposé en attente (réservé au VP Sondaj).
 * @param {number} id_sondage - ID du sondage à supprimer
 */
export const supprimerSondage = (id_sondage) =>
    createApiPost(`${SONDAGES_BASE_URL}/route_supprimer_sondage`)({}, id_sondage);

/**
 * Passe immédiatement au sondage suivant (réservé au VP Sondaj).
 */
export const sondageSuivant = () =>
    createApiPost(`${SONDAGES_BASE_URL}/sondage_suivant`)({});

/**
 * Enregistre le vote de l'utilisateur connecté pour le sondage du jour.
 * @param {number} id_vote - Indice de la réponse choisie
 */
export const voterSondage = (id_vote) =>
    createApiPost(`${SONDAGES_BASE_URL}/voter_sondage`)({}, id_vote);

/**
 * Soumet une proposition de nouveau sondage.
 * @param {string} question - Intitulé de la question
 * @param {Array<string>} reponses - Liste de 2 à 4 réponses possibles
 * @returns {Promise<{ etat: boolean, message: string }>}
 */
export const requeteProposerSondage = async (question, reponses) => {
    const data = await createApiPost(`${SONDAGES_BASE_URL}/proposer_sondage`)({ question, reponses });
    return data || { etat: false, message: "Erreur lors de la création du sondage." };
};

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

/**
 * Récupère les classements et statistiques des sondages.
 */
export const obtenirScoresSondages = () =>
    createApiGet(`${SONDAGES_BASE_URL}/scores`)();
