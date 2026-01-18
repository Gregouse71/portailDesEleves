import { SOIFGUARD_BASE_URL, createApiPost, createApiDelete, createApiPut, createApiGet } from "./base";

/** Fait l'encaissement pour une des assos
 * args :
 *  - data : { id_utilisateur, somme }
 *  - asso : "octo" ou "biero"
 */
export const encaisserAsso = createApiPost(`${SOIFGUARD_BASE_URL}/encaisser`)

/** Ajoute de l'argent sur un compte
 * args :
 *  - data : { id_utilisateur, somme }
 *  - asso : "octo" ou "biero"
 */
export const crediterAsso = createApiPost(`${SOIFGUARD_BASE_URL}/crediter`)

/** Ajoute de l'argent sur un compte
 * args :
 *  - data : { maximum }
 *  - asso : "octo" ou "biero"
 */
export const fixerDetteMax = createApiPost(`${SOIFGUARD_BASE_URL}/fixer_negatif_maximum`)

/** Creation d'une consommation
 * args :
 *  - data : { nom_conso, prix, prix_cotisant, asso : "octo" ou "biero" }
 */
export const ajouterConso = createApiPost(`${SOIFGUARD_BASE_URL}/conso`)

/** Suppression d'une consommation
 * args :
 *  - id : id a supprimer
 */
export const supprimerConso = createApiDelete(`${SOIFGUARD_BASE_URL}/conso`)

/** Modification d'une consommation
 * args :
 *  - data : { nom_conso, prix, prix_cotisant }
 *  - id : id de la conso
 */
export const modifierConso = createApiPut(`${SOIFGUARD_BASE_URL}/conso`)

/** Recupere la liste des consos
 */
export const getListeConsos = createApiGet(`${SOIFGUARD_BASE_URL}/liste_consos`)

export async function ajouterPermission(id_utilisateur, asso = "octo") {
  try {
    const response = await fetch(`${SOIFGUARD_BASE_URL}/ajouter_permission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_utilisateur, asso }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Erreur lors de l'ajout de la permission :", data.message);
      return { success: false, message: data.message };
    }
    return { success: true, message: data.message };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: "Erreur réseau" };
  }
}

/** Modification de la cotiz
 * args :
 *  - data : { asso }
 *  - id : id de l'utilisateur
 */
export const toggleCotisation = createApiPut(`${SOIFGUARD_BASE_URL}/toggle_cotisation`)

export async function obtenirDetteMaxi(asso) {
  const res = await fetch(`${SOIFGUARD_BASE_URL}/get_negatif_max/${asso}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data;
}

/** Liste des dernières opérations
 * args :
 *  - data : { asso : "octo" ou "biero", offset, limit }
 */
export const listeOperations = createApiPost(`${SOIFGUARD_BASE_URL}/operations`)