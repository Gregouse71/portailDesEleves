import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenirPermissionsSoifguard, ajouterPermission } from '../api/api_soifguard';
import { obtenirIdUserParNom } from "../api/api_utilisateurs";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [asso, setAsso] = useState("octo"); // Valeur par défaut
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  // Récupérer toutes les permissions à afficher
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const data = await obtenirPermissionsSoifguard();
      return Array.isArray(data) ? data : [];
    }
  });

  // Ajouter une permission
  const handleAjouterPermission = async () => {
    if (!nomUtilisateur.trim()) {
      setErreur("Veuillez entrer un nom d'utilisateur.");
      return;
    }

    // Rechercher l'ID de l'utilisateur par son nom
    const data = await obtenirIdUserParNom(nomUtilisateur);

    if (!data.success) {
      setErreur("Utilisateur introuvable.");
      setMessage("");
      return;
    }

    // Utilisateur trouvé, on peut ajouter la permission
    const idUtilisateur = data.id_utilisateur;

    const response = await ajouterPermission(idUtilisateur, asso);
    if (response.success) {
      setMessage("Permission ajoutée avec succès.");
      setErreur(""); // Réinitialiser les erreurs
      // Recharger les permissions après ajout
      queryClient.invalidateQueries(['permissions']);
    } else {
      setMessage(response.message || "Erreur lors de l'ajout de la permission.");
      setErreur(""); // Réinitialiser les erreurs
    }
  };

  return (
    <div>
      <h1>Menu administrateur</h1>

      <div>
        <h2>Ajouter une permission</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Nom d&apos;utilisateur"
            value={nomUtilisateur}
            onChange={(e) => setNomUtilisateur(e.target.value)}
          />
          <select
            value={asso}
            onChange={(e) => setAsso(e.target.value)}
          >
            <option value="octo">Octo</option>
            <option value="biero">Biero</option>
            {/* Ajoutez d'autres options si nécessaire */}
          </select>
          <button onClick={handleAjouterPermission}>Ajouter</button>
        </div>
        {message && <p>{message}</p>}
        {erreur && <p style={{ color: "red" }}>{erreur}</p>}
      </div>

      <div>
        <h2>Utilisateurs avec leurs permissions</h2>
        <table>
          <thead>
            <tr>
              <th>Nom d&apos;utilisateur</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {permissions.length > 0 ? (
              permissions.map((utilisateur, index) => (
                <tr key={index}>
                  <td>{utilisateur.nom_utilisateur}</td>
                  <td>{utilisateur.assos}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">Aucun utilisateur trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button onClick={() => navigate("/direction")}>Retour au portail</button>
    </div>
  );
}
