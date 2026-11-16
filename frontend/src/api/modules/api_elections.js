import { API_BASE_URL, createApiDelete, createApiGet, createApiPost, createApiPostFormData, createApiPut } from "../base";

const ELECTIONS_BASE_URL = `${API_BASE_URL}/elections`;

/** Créer une nouvelle élection
 * args :
 *  - data  : données de l'élection à créer
 *  - asso_id : id de l'asso
 * 
 * renvoie :
 *  - l'id de l'élection créee
 */
export const creerNouvelleElection = createApiPost(`${ELECTIONS_BASE_URL}/election`)

/** Supprimer une élection
 * args :
 *  - id : id de l'election
 */
export const supprimerElection = createApiDelete(`${ELECTIONS_BASE_URL}/election`)

/** Obtenir les elections de l'asso
 * args :
 *  - asso_id : id de l'asso
 * 
 * renvoie: une liste des id des elections de l'asso
 */
export const obtenirElectionsAsso = createApiGet(`${ELECTIONS_BASE_URL}/asso`)

/** Obtenir les détails d'une élection
 * args :
 *  - election_id : id de l'election
 */
export const obtenirElection = createApiGet(`${ELECTIONS_BASE_URL}/election`)

/** Modifier les détails d'une élection
 * args :
 *  - data  : nouveau paramètres de l'élection
 *  - id    : id de l'élection
 */
export const modifierElection = createApiPut(`${ELECTIONS_BASE_URL}/election`)

/** Vote à l'élection
 * args :
 *  - data  : json avec comme ppté *choix* l'index du vote
 *  - id    : id de l'election
 */
export const voterElection = createApiPost(`${ELECTIONS_BASE_URL}/voter`)

/** Obtenir les résultats d'une élection sous forme de fichier csv
 * args :
 *  - election_id : id de l'election
 */
export const resultatsElection = createApiGet(`${ELECTIONS_BASE_URL}/resultats`, true)

/** Upload une image pour une option d'élection
 * args :
 *  - file : fichier image à uploader
 *  - election_id : id de l'election
 *  - option : numero de l'option
 * 
 * renvoie :
 *  - le path de l'image uploadée
 */
export const uploadElectionChoiceImage = createApiPostFormData(`${ELECTIONS_BASE_URL}/election/image`);
