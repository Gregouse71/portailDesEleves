import { API_BASE_URL, createApiDelete, createApiGet, createApiPost, createApiPut, handleResponse } from "./base";

const UTILISATEUR_BASE_URL = `${API_BASE_URL}/users`;

/** Envoie le fichier pour vérification des infos
 * args :
 *  - data : { file : fichier csv }
 */
export async function processList(data) {
  const formData = new FormData();
  formData.append("file", data.file);
  const response = await fetch(`${UTILISATEUR_BASE_URL}/process_list`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  return handleResponse(response);
}

/** Envoie une liste d'utilisateurs à créer. Elle doit avoir été créée par processList
 * args :
 *  - data : { list: liste des utilisateurs }
 */
export const createBulk = createApiPost(`${UTILISATEUR_BASE_URL}/create_bulk`)

export async function ajouterUtilisateur(nomUtilisateur, email, prenom, nom, cycle, promotion, photo) {

  const formData = new FormData();
    formData.append("nom_utilisateur", nomUtilisateur);
    formData.append("prenom", prenom);
    formData.append("nom", nom);
    formData.append("cycle", cycle);
    formData.append("promotion", promotion)
    formData.append("email", email);
    formData.append("photo", photo);

    const res = await fetch(`${API_BASE_URL}/users/add_utilisateur`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (!res.ok) {
      let msg = "Erreur lors de l'ajout de l'utilisateur";
      try {
          const errData = await res.json();
          if (errData && errData.message) {
              msg = errData.message;
          }
      } catch (e) {
          msg += ` (Statut: ${res.status})`;
      }
      throw new Error(msg);
    }
    return res
}

export async function obtenirAssosUtilisateur(id_utilisateur) {
  const res = await fetch(`${API_BASE_URL}/users/assos_utilisateur/${id_utilisateur}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON
}

export async function obtenirDataUser(id_utilisateur) {
  const res = await fetch(`${API_BASE_URL}/users/obtenir_infos_profil/${id_utilisateur}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON 
}


export async function obtenirQuestionsReponses(id_utilisateur) {
  const res = await fetch(`${API_BASE_URL}/users/questions_reponses/${id_utilisateur}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON 
}

export async function modifierQuestionsReponses(id_utilisateur, new_QR) {
  await fetch(`${API_BASE_URL}/users/questions_reponses/${id_utilisateur}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(new_QR)
  });
}

export async function modifierInfos(id_utilisateur, new_info) {
  await fetch(`${API_BASE_URL}/users/infos/${id_utilisateur}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(new_info)
  });
}


export async function obtenirIdUserParNom(nom_utilisateur) {
  const res = await fetch(`${API_BASE_URL}/users/obtenir_id_par_nomutilisateur/${nom_utilisateur}`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data; // au format JSON 
}

export async function chargerUtilisateurs(promo = null) {
  let url = `${API_BASE_URL}/users/charger_utilisateurs`;
  if (promo) {
    url += `/${promo}`;
  }
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json();
  return data; // Retourne la liste des utilisateurs au format JSON
}

export async function obtenirListeDesPromos() {
  const res = await fetch(`${API_BASE_URL}/users/obtenir_liste_des_promos`,
    { credentials: "include" }
  );
  const data = await res.json();
  return data;
}

export async function obtenirListeDesUtilisateurs(promo, cycles) {
  let url = `${API_BASE_URL}/users/obtenir_liste_utilisateurs/${promo}`;
  url += `/${cycles.join(",")}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json();
  return data;
}


export async function obtenirProchainsAnnivs() {
  let url = `${API_BASE_URL}/users/prochains_anniv`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json();
  return data;
}

export async function selectionnerFillots(user_id, fillots_ids) {
  const response = await fetch(`${API_BASE_URL}/users/select_fillots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ user_id: user_id, fillots_ids: fillots_ids }),
  });
  return handleResponse(response);
}

export async function changerMarrain(marrain_id, fillot_id) {
  const response = await fetch(`${API_BASE_URL}/users/changer_marrain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ marrain_id: marrain_id, fillot_id: fillot_id }),
  });
  return handleResponse(response);
}

export async function changerCo(user_id, co_ids) {
  const response = await fetch(`${API_BASE_URL}/users/changer_co`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ user_id: user_id, co_ids: co_ids }),
  });
  return handleResponse(response);
}

export async function supprimerCo(co_id) {
  const response = await fetch(`${API_BASE_URL}/users/supprimer_co/${co_id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(response);
}

/** Renvoie les utilisateurs correspondants à la recherche
 * args :
 *  - data : { query, limit=None, offset=None }
 */
export const searchUsers = createApiPost(`${API_BASE_URL}/users/search`)

export async function ajouterContenuUtilisateur(id_utilisateur, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/users/content/${id_utilisateur}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors du téléversement du fichier");
    }
    return { success: true, message: data.message, fileName: data.file_name };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: error.message };
  }
}

export async function ajouterLienVideoUtilisateur(id_utilisateur, url) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/content/${id_utilisateur}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ url: url }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'ajout du lien vidéo");
    }
    return { success: true, message: data.message, fileName: data.file_name };
  } catch (error) {
    console.error("Erreur réseau :", error);
    return { success: false, message: error.message };
  }
}

export async function changerPhotoUtilisateur(id_utilisateur, new_name) {
  const res = await fetch(`${API_BASE_URL}/users/${id_utilisateur}/modifier_photo/${new_name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse(res);
}


export const changerBanniereUtilisateur = (id, fileName) =>
    createApiPost(`${API_BASE_URL}/users/${id}/modifier_banniere`)({ banniere: fileName });


export async function modifierOrdreAssos(id_utilisateur, ordre) {
  const res = await fetch(`${API_BASE_URL}/users/${id_utilisateur}/ordre_assos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(ordre)
  });
  return handleResponse(res);
}

/** Obtenir les photos d'un utilisateur
 * args :
 *  - user_id : id de l'utilisateur
 * 
 * renvoie :
 *  - la liste des photos de l'utilisateur
 */
export const obtenirPhotosUtilisateur = createApiGet(`${UTILISATEUR_BASE_URL}/content`)

/** Supprimer un media
 * 
 */
export const supprimerPhotoUtilisateur = createApiDelete(`${UTILISATEUR_BASE_URL}/content`)

/** Renommer un media
 * 
 */
export const renommerPhotoUtilisateur = createApiPut(`${UTILISATEUR_BASE_URL}/content`)

export async function obtenirFamilleUtilisateur(id_utilisateur) {
  const res = await fetch(`${API_BASE_URL}/users/famille/${id_utilisateur}`, {
    credentials: "include",
  });
  return handleResponse(res);
}
 
export async function obtenirCheminEntreUtilisateurs(id_depart, id_arrivee) {
  const res = await fetch(
    `${API_BASE_URL}/users/chemin?depart=${id_depart}&arrivee=${id_arrivee}`,
    { credentials: "include" }
  );
  return handleResponse(res);
}