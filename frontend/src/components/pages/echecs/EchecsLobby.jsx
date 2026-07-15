import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Container, Button, Alert, Table } from "react-bootstrap";
import { useProtected } from "../../../Protected";
import { getDefis, creerDefi, annulerDefi, accepterDefi, getLeaderboard } from "../../../api/api_echecs";
import "../../../assets/styles/echecs.css";
import Leaderboard from "../../elements/Leaderboard";

export default function EchecsLobby() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { userData } = useProtected();

  const [erreur, setErreur] = useState(null);

  const { data: defisData, isLoading } = useQuery({
    queryKey:        ["echecs-defis"],
    queryFn:         () => getDefis({}),
    refetchInterval: 4000,
  });

  // Redirection automatique si partie en cours
  const location = useLocation();
  const partieQuitteeId = useRef(location.state?.quitte_partie_id ?? null);

  useEffect(() => {
    if (!defisData) return;
    
    // Défi fraîchement accepté → redirection prioritaire
    if (defisData.partie_id && defisData.partie_id !== partieQuitteeId.current) {
      navigate(`/jeux/echecs/partie/${defisData.partie_id}`);
      return;
    }
    
    // Partie en cours (retour après déconnexion)
    if (defisData.partie_en_cours && defisData.partie_en_cours !== partieQuitteeId.current) {
      navigate(`/jeux/echecs/partie/${defisData.partie_en_cours}`);
    }
  }, [defisData?.partie_id, defisData?.partie_en_cours]);

  const { data: eloData, isLoading: loadingElo } = useQuery({
    queryKey: ["echecs-leaderboard"],
    queryFn:  () => getLeaderboard({}),
    refetchInterval: 2000,
  });

  const creerMutation = useMutation({
    mutationFn: (body) => creerDefi(body),
    onSuccess: (data) => {
      setErreur(null);
      if (data?.partie_id) navigate(`/jeux/echecs/partie/${data.partie_id}`);
      else queryClient.invalidateQueries({ queryKey: ["echecs-defis"] });
    },
    onError: (e) => setErreur(e.message),
  });

  const annulerMutation = useMutation({
    mutationFn: (id) => annulerDefi(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["echecs-defis"] }),
  });

  const accepterMutation = useMutation({
    mutationFn: (id) => accepterDefi(id),
    onSuccess:  (data) => navigate(`/jeux/echecs/partie/${data.partie_id}`),
    onError:    (e)    => setErreur(e.message),
  });

  if (isLoading || !defisData) return <Container className="py-5 text-center">Chargement…</Container>;

  const { ouverts, recus, le_mien } = defisData;

  return (
    <Container className="echecs-lobby py-4">
      <h1 className="mb-4">♟ Échecs</h1>

      {erreur && <Alert variant="danger" onClose={() => setErreur(null)} dismissible>{erreur}</Alert>}

      <div className="row g-4">

        {/* ── Colonne gauche : jeu ── */}
        <div className="col-lg-7">

          {/* Boutons de lancement */}
          <div className="echecs-section mb-3">
            <h5>Jouer</h5>
            <div className="d-flex gap-3 flex-wrap">

              {/* Défi ouvert ou annulation */}
              {le_mien ? (
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <span className="text-muted small">Défi ouvert en attente d'un adversaire…</span>
                  <Button variant="outline-danger" size="sm"
                    onClick={() => annulerMutation.mutate(le_mien.id)}
                    disabled={annulerMutation.isPending}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="lg"
                  disabled={creerMutation.isPending}
                  onClick={() => creerMutation.mutate({ mode: "humain" })}>
                  {creerMutation.isPending ? "Envoi…" : "⚔️ Lancer un défi"}
                </Button>
              )}

              {/* Contre l'IA */}
              <Button variant="outline-secondary" size="lg"
                disabled={creerMutation.isPending}
                onClick={() => creerMutation.mutate({ mode: "ia", niveau_ia: 10 })}>
                🤖 Jouer contre l'IA
              </Button>

            </div>
          </div>

          {/* Défis reçus */}
          {recus.length > 0 && (
            <div className="echecs-section mb-3">
              <h5>Défis reçus</h5>
              {recus.map((d) => (
                <div key={d.id} className="echecs-defi-card recu d-flex align-items-center justify-content-between">
                  <span><strong>{d.createur_pseudo}</strong> te défie !</span>
                  <Button variant="success" size="sm"
                    disabled={accepterMutation.isPending}
                    onClick={() => accepterMutation.mutate(d.id)}>
                    Accepter
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Défis ouverts */}
          <div className="echecs-section">
            <h5>Défis ouverts</h5>
            {ouverts.length === 0 ? (
              <p className="text-muted">Aucun défi en attente.</p>
            ) : (
              ouverts.map((d) => (
                <div key={d.id} className="echecs-defi-card ouvert d-flex align-items-center justify-content-between">
                  <div>
                    <strong>{d.createur_pseudo}</strong>
                    <small className="text-muted ms-2">{new Date(d.cree_le).toLocaleTimeString()}</small>
                  </div>
                  <Button variant="primary" size="sm"
                    disabled={accepterMutation.isPending}
                    onClick={() => accepterMutation.mutate(d.id)}>
                    Accepter
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Colonne droite : classement ELO ── */}
        <div className="col-lg-5">
          {loadingElo || !eloData ? (
            <Leaderboard title="🏆 Classement ELO" isLoading />
          ) : (
            <>
              <Leaderboard
                title="🏆 Classement ELO"
                isLoading={false}
                data={eloData.top10.map((e) => ({ ...e, id: e.utilisateur_id }))}
                format={[
                  { nom: "ELO", scoreKey: "rating", formatScore: (s) => <strong>{s}</strong> },
                  { nom: "Parties Jouées", scoreKey: "nb_parties", formatScore: (s) => s },
                ]}
                titleRow
              />

              {!eloData.mon_elo && (
                <p className="text-muted small mt-2 text-center">
                  Joue ta première partie pour apparaître au classement !
                </p>
              )}

              {eloData.mon_elo && !eloData.eligible && (
                <p className="text-muted small mt-2 text-center">
                  Joue plus de parties pour apparaître au classement.
                </p>
              )}

              {eloData.eligible && eloData.ma_position > 10 && (
                <div className="echecs-ma-position mt-2">
                  <span className="text-muted">Ma position : </span>
                  <strong>#{eloData.ma_position}</strong>
                  <span className="ms-2 text-muted">
                    — {eloData.mon_elo.rating} ELO (top {eloData.mon_percentile}%)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </Container>
  );
}