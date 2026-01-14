import { useNavigate } from "react-router-dom";
import { verifierPermission } from "../../api/api_soifguard";
import { useQuery } from "@tanstack/react-query";

function AccueilSoifguard() {
  const navigate = useNavigate();

  const { data: octoPermission = false } = useQuery({
    queryKey: ['permOcto'],
    queryFn: () => verifierPermission("octo"),
  });
  const { data: bieroPermission = false } = useQuery({
    queryKey: ['permBiero'],
    queryFn: () => verifierPermission("biero"),
  });

  return (
    <div>
      <h1>Soifguard</h1>
      <p>Soifguard est le logiciel qui gère les comptes de l&apos;octo et de la biéro</p>

      {octoPermission || bieroPermission ? (
        <button onClick={() => navigate("/soifguard")}>
          Lancer SoifGuard
        </button>
      ) : (
        <p>Vous n&apos;avez pas les permissions nécessaires pour accéder à Soifguard.</p>
      )}

      <button onClick={() => navigate("/")}>
        Retour
      </button>
    </div>
  );
}

export default AccueilSoifguard;
