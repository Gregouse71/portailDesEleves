import { API_BASE_URL, handleResponse } from "./base";

export async function estAuthentifie() {
  const res = await fetch(`${API_BASE_URL}/login/est_auth`, { credentials: "include" });
  const data = await res.json();
  return data.etat_connexion; // Flask renvoie { "etat_connexion": true/false }
}

export async function obtenirIdUser() {
  const res = await fetch(`${API_BASE_URL}/login/current_user_id`, { credentials: "include" });
  const data = await res.json();
  return data.id_utilisateur; // Flask renvoie { "id_utilisateur": int ou None si on connecte, ...}
}

export async function seDeconnecter() {
  await fetch(`${API_BASE_URL}/login/deconnexion`, {
    method: "POST",
    credentials: "include"
  });
}

export async function seConnecter(username, password) {
  const res = await fetch(`${API_BASE_URL}/login/connexion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important pour gérer les cookies de session
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  return data.connecte; // Flask renvoie { "connecte": true/false }
}

export async function resetMotDePasse(username) {
  const res = await fetch(`${API_BASE_URL}/login/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important pour gérer les cookies de session
    body: JSON.stringify({ username }),
  });

  const data = await res.json();
  return data.sent; // Flask renvoie { "connecte": true/false }
}

export async function setNouveauMDP(token, password) {
  const res = await fetch(`${API_BASE_URL}/login/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important pour gérer les cookies de session
    body: JSON.stringify({ token, password }),
  });

  const data = await res.json();
  return data.set; // Flask renvoie { "connecte": true/false }
}