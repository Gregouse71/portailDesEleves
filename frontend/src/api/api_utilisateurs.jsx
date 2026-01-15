import { API_BASE_URL, createApiPost, handleResponse } from "./base";


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

/** Creation d'une consommation
 * args :
 *  - data : { query, limit=None, offset=None }
 */
export const searchUsers = createApiPost(`${API_BASE_URL}/users/search`)

export async function ajouterContenuUtilisateur(id_utilisateur, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/users/${id_utilisateur}/add_content`, {
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

export async function changerPhotoUtilisateur(id_utilisateur, new_name) {
  const res = await fetch(`${API_BASE_URL}/users/${id_utilisateur}/modifier_photo/${new_name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse(res);
}
