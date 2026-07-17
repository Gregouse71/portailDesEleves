import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Button, Alert, Table } from "react-bootstrap";
import { useProtected } from "../../../../Protected";
import { SOCKET_BASE_URL } from "../../../../api/base";
import Leaderboard from "../../../elements/Leaderboard";
import "../../../../assets/styles/echecs.css";

export default function EchecsLobby() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = useProtected();

    const socketRef = useRef(null);
    const partieQuitteeId = useRef(location.state?.quitte_partie_id ?? null);

    const [defisData, setDefisData] = useState(null);
    const [eloData, setEloData] = useState(null);
    const [erreur, setErreur] = useState(null);
    const [creationEnCours, setCreationEnCours] = useState(false);
    const [annulationEnCours, setAnnulationEnCours] = useState(false);
    const [acceptationEnCours, setAcceptationEnCours] = useState(null); // id du défi en cours d'acceptation

    useEffect(() => {
        const socket = io(`${SOCKET_BASE_URL}`, {
            withCredentials: true,
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("echecs_lobby_rejoindre");
        });

        socket.on("echecs_defis", (data) => {
            setDefisData(data);
            setAcceptationEnCours(null);
            setAnnulationEnCours(false);
            setCreationEnCours(false);

            if (data.partie_id && data.partie_id !== partieQuitteeId.current) {
                navigate(`/jeux/echecs/partie/${data.partie_id}`);
                return;
            }
            if (data.partie_en_cours && data.partie_en_cours !== partieQuitteeId.current) {
                navigate(`/jeux/echecs/partie/${data.partie_en_cours}`);
            }
        });

        socket.on("echecs_leaderboard", (data) => setEloData(data));

        socket.on("echecs_lobby_maj", () => {
            socket.emit("echecs_lobby_demander_maj");
        });

        socket.on("echecs_defi_cree", (data) => {
            setCreationEnCours(false);
            if (data?.partie_id) navigate(`/jeux/echecs/partie/${data.partie_id}`);
        });

        socket.on("echecs_defi_accepte_moi", (data) => {
            setAcceptationEnCours(null);
            if (data?.partie_id) navigate(`/jeux/echecs/partie/${data.partie_id}`);
        });

        socket.on("echecs_erreur", (data) => {
            setErreur(data.erreur);
            setCreationEnCours(false);
            setAnnulationEnCours(false);
            setAcceptationEnCours(null);
        });

        return () => {
            if (socket.connected) {
                socket.emit("echecs_lobby_quitter");
            }
            socket.disconnect();
        };
    }, [navigate]);

    const creerDefi = (body) => {
        setCreationEnCours(true);
        setErreur(null);
        socketRef.current?.emit("echecs_lobby_creer_defi", body);
    };

    const annulerDefi = (id) => {
        setAnnulationEnCours(true);
        socketRef.current?.emit("echecs_lobby_annuler_defi", { defi_id: id });
    };

    const accepterDefi = (id) => {
        setAcceptationEnCours(id);
        setErreur(null);
        socketRef.current?.emit("echecs_lobby_accepter_defi", { defi_id: id });
    };

    if (!defisData) return <Container className="py-5 text-center">Chargement…</Container>;

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
                                        onClick={() => annulerDefi(le_mien.id)}
                                        disabled={annulationEnCours}>
                                        Annuler
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="primary" size="lg"
                                    disabled={creationEnCours}
                                    onClick={() => creerDefi({ mode: "humain" })}>
                                    {creationEnCours ? "Envoi…" : "⚔️ Lancer un défi"}
                                </Button>
                            )}

                            {/* Contre l'IA */}
                            <Button variant="outline-secondary" size="lg"
                                disabled={creationEnCours}
                                onClick={() => creerDefi({ mode: "ia", niveau_ia: 10 })}>
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
                                        disabled={acceptationEnCours === d.id}
                                        onClick={() => accepterDefi(d.id)}>
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
                                        disabled={acceptationEnCours === d.id}
                                        onClick={() => accepterDefi(d.id)}>
                                        Accepter
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Colonne droite : classement ELO ── */}
                <div className="col-lg-5">
                    {!eloData ? (
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

                            {eloData.eligible && !eloData.dans_top10 && (
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