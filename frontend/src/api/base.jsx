// Configuration de base pour l'api
import { _BASE_URL } from "./base_url";

export const BASE_URL = _BASE_URL;
export const API_BASE_URL = `${BASE_URL}/api`;
export const UPLOAD_BASE_URL = `${BASE_URL}/upload`;
export const SOIFGUARD_BASE_URL = `${API_BASE_URL}/soifguard`;
export const SOCKET_BASE_URL = `${BASE_URL}`

export async function handleResponse(response) {
  if (!response.ok) {
    const errorMessage = await response.json();
    console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
    throw new Error(errorMessage.message || "Erreur inconnue");
  }
  return response.json();
}

export function createApiPost(route) {
  return async (data, ...params) => {
    try {
      const url = [route, ...params].join('/');
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", }, credentials: "include",
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
        return
      }

      return await response.json();
    } catch (erreur) {
      console.error("Erreur réseau :", erreur);
      throw erreur;
    }
  };
}

export function createApiGet(route) {
  return async (...params) => {
    try {
      const url = [route, ...params].join('/');
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", }, credentials: "include",
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
        return
      }

      return await response.json();
    } catch (erreur) {
      console.error("Erreur réseau :", erreur);
      throw erreur;
    }
  };
}

export function createApiDelete(route) {
  return async (...params) => {
    try {
      const url = [route, ...params].join('/');
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", }, credentials: "include",
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
        return
      }

      return await response.json();
    } catch (erreur) {
      console.error("Erreur réseau :", erreur);
      throw erreur;
    }
  };
}

export function createApiPut(route) {
  return async (data, ...params) => {
    try {
      const url = [route, ...params].join('/');
      const response = await fetch(url, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", }, credentials: "include",
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        console.error("Erreur API :", errorMessage.message || "Erreur inconnue");
        return
      }

      return await response.json();
    } catch (erreur) {
      console.error("Erreur réseau :", erreur);
      throw erreur;
    }
  };
}