import { API_BASE_URL, handleResponse } from "./base";

export async function obtenirPlusDeMessages(last_sent) {
  try {
    const res = await fetch(`${API_BASE_URL}/chat/more/${last_sent}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    return handleResponse(res);
  } catch (erreur) {
    console.error("Erreur réseau :", erreur)
    throw erreur;
  }
}