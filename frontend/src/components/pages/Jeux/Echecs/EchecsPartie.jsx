import { useState, useCallback, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Container, Alert, Button } from "react-bootstrap";
import { useProtected } from "../../../../Protected";
import { getPartie, getCoupsLegaux } from "../../../../api/api_echecs";
import { SOCKET_BASE_URL } from "../../../../api/base";
import "../../../../assets/styles/echecs.css";

const BASE = "https://lichess1.org/assets/piece/cburnett/";
const IMG = {
    K: BASE + "wK.svg", Q: BASE + "wQ.svg", R: BASE + "wR.svg",
    B: BASE + "wB.svg", N: BASE + "wN.svg", P: BASE + "wP.svg",
    k: BASE + "bK.svg", q: BASE + "bQ.svg", r: BASE + "bR.svg",
    b: BASE + "bB.svg", n: BASE + "bN.svg", p: BASE + "bP.svg",
};

const PROMO = ["Q", "R", "B", "N"];
const PROMO_NOMS = { Q: "Dame", R: "Tour", B: "Fou", N: "Cavalier" };

function uciVersIdx(uci) {
    return (8 - parseInt(uci[1])) * 8 + (uci.charCodeAt(0) - 97);
}

export default function EchecsPartie() {
    const { partieId } = useParams();
    const navigate = useNavigate();
    const { userData } = useProtected();
    const queryClient = useQueryClient();

    const socketRef = useRef(null);
    const coupsLegauxRef = useRef([]);
    const selectionRef = useRef(null);

    const [selection, setSelection] = useState(null);
    const [coupsLegaux, setCoupsLegaux] = useState([]);
    const [promotion, setPromotion] = useState(null);
    const [erreur, setErreur] = useState(null);
    const [coupEnCours, setCoupEnCours] = useState(false);
    const [actionEnCours, setActionEnCours] = useState(null); // 'abandon' | 'nulle' | 'accepterNulle' | null

    const setCoupsLegauxSync = (coups) => {
        coupsLegauxRef.current = coups;
        setCoupsLegaux(coups);
    };

    const setSelectionSync = (val) => {
        selectionRef.current = val;
        setSelection(val);
    };

    // Chargement initial (fallback), plus de refetchInterval : la suite vient du socket
    const { data: partie, isLoading } = useQuery({
        queryKey: ["echecs-partie", partieId],
        queryFn: () => getPartie(partieId),
    });

    // ── Connexion socket ──────────────────────────────────────────────
    useEffect(() => {
        const socket = io(`${SOCKET_BASE_URL}`, {
            withCredentials: true,
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("echecs_rejoindre", { partie_id: partieId });
        });

        socket.on("echecs_etat", (nouvelEtat) => {
            queryClient.setQueryData(["echecs-partie", partieId], nouvelEtat);
            setCoupEnCours(false);
            setActionEnCours(null);
            if (nouvelEtat.statut === "mat" || nouvelEtat.statut === "pat") {
                queryClient.invalidateQueries({ queryKey: ["echecs-leaderboard"] });
            }
        });

        socket.on("echecs_promotion", (data) => {
            setPromotion({ de: data.de, vers: data.vers });
            setCoupEnCours(false);
        });

        socket.on("echecs_erreur", (data) => {
            setErreur(data.erreur);
            setCoupEnCours(false);
            setActionEnCours(null);
        });

        return () => {
            socket.emit("echecs_quitter", { partie_id: partieId });
            socket.disconnect();
        };
    }, [partieId, queryClient]);

    const maCouleur = partie
        ? userData.id === partie.blanc_id ? "blanc"
            : userData.id === partie.noir_id ? "noir"
                : null
        : null;

    // ELO affiché
    const monElo = partie ? (maCouleur === "blanc" ? partie.elo_blanc : partie.elo_noir) : null;
    const sonElo = partie ? (maCouleur === "blanc" ? partie.elo_noir : partie.elo_blanc) : null;

    const onCaseClick = useCallback(async (idx) => {
        if (!maCouleur || !partie) return;
        if (maCouleur !== partie.trait) return;
        if (partie.statut !== "en_cours" && partie.statut !== "echec") return;
        if (coupEnCours) return;

        const piece = partie.plateau[String(idx)];

        if (selectionRef.current !== null && coupsLegauxRef.current.includes(idx)) {
            setCoupEnCours(true);
            setErreur(null);
            socketRef.current?.emit("echecs_coup", {
                partie_id: partieId, de: selectionRef.current, vers: idx,
            });
            setSelectionSync(null);
            setCoupsLegauxSync([]);
            return;
        }

        if (piece && piece.couleur === maCouleur) {
            setSelectionSync(idx);
            setErreur(null);
            const data = await getCoupsLegaux(partieId, idx); // ponctuel, pas de polling → HTTP conservé
            setCoupsLegauxSync(data?.coups || []);
            return;
        }

        setSelectionSync(null);
        setCoupsLegauxSync([]);
    }, [maCouleur, partie, partieId, coupEnCours]);

    const onPromotion = (piece) => {
        if (!promotion) return;
        setCoupEnCours(true);
        socketRef.current?.emit("echecs_coup", {
            partie_id: partieId, de: promotion.de, vers: promotion.vers,
            promotion: piece.toLowerCase(),
        });
        setPromotion(null);
    };

    const onAbandonner = () => {
        if (!window.confirm("Abandonner la partie ?")) return;
        setActionEnCours("abandon");
        setErreur(null);
        socketRef.current?.emit("echecs_abandonner", { partie_id: partieId });
    };

    const onProposerNulle = () => {
        setActionEnCours("nulle");
        setErreur(null);
        socketRef.current?.emit("echecs_proposer_nulle", { partie_id: partieId });
    };

    const onAccepterNulle = () => {
        setActionEnCours("accepterNulle");
        setErreur(null);
        socketRef.current?.emit("echecs_accepter_nulle", { partie_id: partieId });
    };

    if (isLoading || !partie) return <Container className="py-5 text-center">Chargement…</Container>;

    const estTerminee = partie.statut === "mat" || partie.statut === "pat";
    const monTour = maCouleur === partie.trait && !estTerminee;

    const eloBlancAffiche = (() => {
        if (!estTerminee || !partie.elo_variation) return partie.elo_blanc;
        if (partie.blanc_id === null) {
            const v = partie.elo_variation['ia'];
            return v ? v.avant : partie.elo_blanc;
        }
        const v = partie.elo_variation[String(partie.blanc_id)];
        return v ? v.avant : partie.elo_blanc;
    })();

    const eloNoirAffiche = (() => {
        if (!estTerminee || !partie.elo_variation) return partie.elo_noir;
        if (partie.noir_id === null) {
            const v = partie.elo_variation['ia'];
            return v ? v.avant : partie.elo_noir;
        }
        const v = partie.elo_variation[String(partie.noir_id)];
        return v ? v.avant : partie.elo_noir;
    })();

    return (
        <Container className="echecs-partie py-3">

            {/* Barre joueurs avec ELO */}
            <div className="echecs-joueurs-bar mb-2">
                <BadgeJoueur
                    pseudo={partie.noir_pseudo}
                    couleur="noir"
                    actif={partie.trait === "noir" && !estTerminee}
                    estIA={partie.mode === "ia"}
                    elo={eloNoirAffiche}
                />
                <span className="echecs-vs">vs</span>
                <BadgeJoueur
                    pseudo={partie.blanc_pseudo}
                    couleur="blanc"
                    actif={partie.trait === "blanc" && !estTerminee}
                    elo={eloBlancAffiche}
                />
            </div>

            {/* Plateau */}
            <Plateau
                plateau={partie.plateau}
                selection={selection}
                coupsLegaux={coupsLegaux}
                dernierCoup={partie.dernier_coup}
                maCouleur={maCouleur}
                onCaseClick={onCaseClick}
            />

            {maCouleur && !estTerminee && (
                <div className="d-flex gap-2 mt-2">
                    <Button
                        variant="outline-danger" size="sm"
                        onClick={onAbandonner}
                        disabled={actionEnCours === "abandon"}
                    >
                        Abandonner
                    </Button>

                    {partie.mode === 'humain' && (
                        <>
                            {partie.nulle_proposee_par && partie.nulle_proposee_par !== userData.id ? (
                                <Button
                                    variant="outline-success" size="sm"
                                    onClick={onAccepterNulle}
                                    disabled={actionEnCours === "accepterNulle"}
                                >
                                    Accepter la nulle
                                </Button>
                            ) : (
                                <Button
                                    variant="outline-secondary" size="sm"
                                    onClick={onProposerNulle}
                                    disabled={actionEnCours === "nulle" || partie.nulle_proposee_par === userData.id}
                                >
                                    {partie.nulle_proposee_par === userData.id ? 'Nulle proposée…' : 'Proposer nulle'}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Messages sous le plateau */}
            <div className="mt-2" style={{ width: '100%', maxWidth: 'calc(var(--taille-case, 60px) * 8 + 22px)' }}>
                {partie.statut === "echec" && (
                    <Alert variant="warning" className="py-1 px-2 mb-1 text-center small">⚠ Échec !</Alert>
                )}
                {!monTour && !estTerminee && maCouleur && (
                    <Alert variant="secondary" className="py-1 px-2 mb-1 text-center small">En attente du coup adverse…</Alert>
                )}
                {erreur && (
                    <Alert variant="danger" className="py-1 px-2 mb-1 text-center small">{erreur}</Alert>
                )}
            </div>

            {/* Modal promotion */}
            {promotion && (
                <div className="echecs-promo-overlay">
                    <div className="echecs-promo-modal">
                        <h5 className="mb-3">Promotion du pion</h5>
                        <div className="echecs-promo-choix">
                            {PROMO.map((p) => (
                                <button key={p} className="echecs-promo-btn" title={PROMO_NOMS[p]}
                                    onClick={() => onPromotion(p)}>
                                    <img src={IMG[maCouleur === "blanc" ? p : p.toLowerCase()]} alt={PROMO_NOMS[p]} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Game over */}
            {estTerminee && (
                <div className="text-center mt-1" style={{ width: '100%', maxWidth: 'calc(var(--taille-case, 52px) * 8 + 22px)' }}>
                    <div className="py-1 px-3 mb-1" style={{
                        background: 'rgba(var(--bs-success-rgb), 0.1)',
                        border: '1px solid var(--bs-success)',
                        borderRadius: 8,
                        fontSize: '1rem'
                    }}>
                        {partie.statut === "mat"
                            ? (partie.gagnant === "blanc" ? "♔ Victoire des blancs !" : "♚ Victoire des noirs !")
                            : "Match nul"}
                    </div>

                    {partie.elo_variation && (() => {
                        const variation = partie.elo_variation[String(userData.id)];
                        if (!variation) return null;
                        const diff = variation.apres - variation.avant;
                        return (
                            <div className="mb-1" style={{ fontSize: '0.85rem' }}>
                                ELO : {variation.avant} → <strong>{variation.apres}</strong>
                                <span style={{ color: diff >= 0 ? 'green' : 'red', marginLeft: 4 }}>
                                    ({diff >= 0 ? '+' : ''}{diff})
                                </span>
                            </div>
                        );
                    })()}

                    <Button size="sm" variant="primary" onClick={() => navigate("/jeux/echecs", { state: { quitte_partie_id: partie.id } })}>
                        Retour au lobby
                    </Button>
                </div>
            )}

        </Container>
    );
}

function BadgeJoueur({ pseudo, couleur, actif, estIA, elo }) {
    const nomAffiche = pseudo || (estIA ? 'Stockfish' : '…');
    const isStockfish = nomAffiche === 'Stockfish';
    return (
        <div className={`echecs-badge-joueur ${actif ? "actif" : ""}`}>
            <span className={`echecs-point-couleur ${couleur}`} />
            <span>{isStockfish ? "🤖 " : ""}{nomAffiche}</span>
            {elo !== undefined && elo !== null && (
                <span className="echecs-elo-badge">{elo}</span>
            )}
            {actif && <span className="echecs-pulse" />}
        </div>
    );
}

function Plateau({ plateau, selection, coupsLegaux, dernierCoup, maCouleur, onCaseClick }) {
    const indices = maCouleur === "noir"
        ? Array.from({ length: 64 }, (_, i) => 63 - i)
        : Array.from({ length: 64 }, (_, i) => i);

    const rangs = maCouleur === "noir" ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const cols = maCouleur === "noir" ? "hgfedcba" : "abcdefgh";

    let dernierDe = null, dernierVers = null;
    if (dernierCoup?.length >= 4) {
        dernierDe = uciVersIdx(dernierCoup.slice(0, 2));
        dernierVers = uciVersIdx(dernierCoup.slice(2, 4));
    }

    return (
        <div className="echecs-plateau-wrapper">
            <div className="echecs-rangs">
                {rangs.map((r) => <div key={r} className="echecs-rang-label">{r}</div>)}
            </div>
            <div>
                <div className="echecs-plateau">
                    {indices.map((i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const piece = plateau[String(i)];
                        const classes = [
                            "echecs-case",
                            (row + col) % 2 === 0 ? "claire" : "sombre",
                            i === selection ? "selectionnee" : "",
                            i === dernierDe ? "dernier-de" : "",
                            i === dernierVers ? "dernier-vers" : "",
                            coupsLegaux.includes(i) && piece ? "prise-legale" : "",
                            coupsLegaux.includes(i) && !piece ? "coup-legal" : "",
                        ].filter(Boolean).join(" ");

                        return (
                            <div key={i} className={classes} onClick={() => onCaseClick(i)}>
                                {piece && (
                                    <img className="echecs-piece" src={IMG[piece.piece]}
                                        alt={piece.piece} draggable={false} />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="echecs-cols">
                    {cols.split("").map((c) => <div key={c} className="echecs-col-label">{c}</div>)}
                </div>
            </div>
        </div>
    );
}