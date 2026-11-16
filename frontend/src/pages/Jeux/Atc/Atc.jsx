/*!
 * @license BSD-3-Clause
 * Copyright (c) 1990, 1993
 *	The Regents of the University of California.  All rights reserved.
 *
 * This code is derived from software contributed to Berkeley by
 * Ed James.
 *
 * Copyright (c) 1987 by Ed James, UC Berkeley.  All rights reserved.
 *
 * Copy permission is hereby granted provided that this notice is
 * retained on all partial or complete copies.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, Button, Table, Alert, Row, Col } from "react-bootstrap";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nouvellePartie, faireUnCoup, leaderboardJeu } from "../../../api/api_jeux";
import Leaderboard from "../../../components/elements/Leaderboard";
import JeuxTemplate from "../../../components/templates/JeuxTemplate";
import {
    PLANE_COLS,
    S_MARKED,
    T_AIRPORT,
    DEFAULT_SCREEN,
    planeName,
    formatCommand,
    buildCleanRadarGrid,
    createInitialGame,
    stepUpdate,
    createInitialInputState,
    getInputPromptText,
    handleInputKey,
} from "./atcEngine";
import "../../../assets/styles/atc.scss";

const RADAR_COLS = DEFAULT_SCREEN.width * 2; // 60 colonnes

// Couleurs distinctes pour chaque porte de sortie (S0..S7) et aéroport (A0..A1)
const EXIT_COLORS = [
    "#ff595e", // 0 : Rouge
    "#ff924c", // 1 : Orange
    "#ffca3a", // 2 : Jaune
    "#8ac926", // 3 : Vert
    "#2ec4b6", // 4 : Turquoise
    "#4cc9f0", // 5 : Bleu ciel
    "#c77dff", // 6 : Violet
    "#ff70a6", // 7 : Rose
];

const AIRPORT_COLORS = [
    "#a8dadc", // A0
    "#ffd166", // A1
];

function getPlaneDestColor(pp) {
    if (pp.dest_type === T_AIRPORT) {
        return AIRPORT_COLORS[pp.dest_no % AIRPORT_COLORS.length];
    }
    return EXIT_COLORS[pp.dest_no % EXIT_COLORS.length];
}

const COMPASS_KEYS = [
    { key: "a", arrow: "↖", deg: "315°" },
    { key: "z", arrow: "↑", deg: "0°" },
    { key: "e", arrow: "↗", deg: "45°" },
    { key: "q", arrow: "←", deg: "270°" },
    { key: "s", arrow: "•", deg: "centre", center: true },
    { key: "d", arrow: "→", deg: "90°" },
    { key: "w", arrow: "↙", deg: "225°" },
    { key: "x", arrow: "↓", deg: "180°" },
    { key: "c", arrow: "↘", deg: "135°" },
];

const QUICK_ACTIONS = [
    { touche: "a [0-9]", action: "Altitude cible" },
    { touche: "t [cap]", action: "Virer vers cap" },
    { touche: "tv b/s/a #", action: <>Cap <b>v</b>ers <b>b</b>alise, <b>s</b>ortie, <b>a</b>éroport</> },
    { touche: "ab #", action: "Différer le virage/cercle à la balise" },
    { touche: "m/u/i", action: "Marquer / Démarquer / Ignorer" },
    { touche: "?", action: "Aide" },
    { touche: "Entrée", action: "Tour suivant" },
];

const CONSIGNES = [
    {
        titre: <>Avions</>,
        texte: <><code>A7</code> (majuscule = hélice, avance 1 tour sur 2), <code>b7</code> (minuscule = jet, avance à chaque tour). Le chiffre indique l&apos;altitude (en milliers de pieds).</>,
    },
    {
        titre: <>Sorties (<code>0</code>–<code>7</code>)</>,
        texte: <>les avions entrent à <strong>altitude 7</strong> et doivent sortir par leur porte de destination à <strong>altitude 9</strong>.</>,
    },
    {
        titre: <>Aéroports (<code>^0</code>, <code>&gt;1</code>)</>,
        texte: <>décollage en donnant une altitude &gt; 0. Atterrissage à <strong>altitude 0</strong> dans la direction de la piste (<code>^</code> = Nord, <code>&gt;</code> = Est).</>,
    },
    {
        titre: <>Balises (<code>*0</code>, <code>*1</code>)</>,
        texte: <>points de repère pour différer un ordre.</>,
    },
    {
        titre: <>Collision</>,
        texte: <>fin de partie si deux avions sont simultanément à distance ≤ 1 en X, Y et altitude.</>,
    },
];

const COMMANDES = [
    {
        titre: <><code>a[0-9]</code></>,
        texte: <>changer d&apos;altitude (ex: <code>aa9</code> pour monter à 9000 ft, <code>ac2</code> / <code>ad2</code> pour +2000 / -2000 ft).</>,
    },
    {
        titre: <><code>t[zedcxwqa]</code></>,
        texte: <>tourner vers une direction absolue (<code>z</code> = 0° N, <code>e</code> = 45° NE, <code>d</code> = 90° E, <code>c</code> = 135° SE, <code>x</code> = 180° S, <code>w</code> = 225° SO, <code>q</code> = 270° O, <code>a</code> = 315° NO).</>,
    },
    {
        titre: <><code>tl</code> / <code>tr</code> (<code>tL</code> / <code>tR</code>)</>,
        texte: <>tourner de 45° (90°) à gauche / droite.</>,
    },
    {
        titre: <><code>tvb0</code> / <code>tvs2</code></>,
        texte: <>tourner vers (<code>v</code>) une balise (<code>b</code>/<code>*</code>), une sortie (<code>s</code>) ou un aéroport (<code>a</code>).</>,
    },
    {
        titre: <><code>c</code></>,
        texte: <>décrire un cercle.</>,
    },
    {
        titre: <><code>ab0</code> (à la fin d&apos;une commande de virage ou cercle)</>,
        texte: <>différer l&apos;ordre au passage sur la balise.</>,
    },
    {
        titre: <><code>m</code> / <code>u</code> / <code>i</code></>,
        texte: <>marquer (surbrillance), démarquer (réactivé à la prochaine balise) ou ignorer.</>,
    },
    {
        titre: <><code>Entrée</code></>,
        texte: <>avancer immédiatement d&apos;un tour.</>,
    },
];

export default function Atc() {
    const queryClient = useQueryClient();
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches
    );
    const [gameState, setGameState] = useState(() => ({
        clck: 0,
        safe_planes: 0,
        last_plane: -1,
        air: [],
        ground: [],
        loser_msg: null,
    }));
    const [inputState, setInputState] = useState(() => createInitialInputState());
    const [gameStarted, setGameStarted] = useState(false);
    const [showQuickHelp, setShowQuickHelp] = useState(true);

    const commandsRef = useRef([]);
    const forcedUpdatesRef = useRef(0);
    const submittedRef = useRef(false);

    const cleanRadar = useMemo(() => buildCleanRadarGrid(DEFAULT_SCREEN), []);

    const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
        queryKey: ["leaderboard", "atc"],
        queryFn: () => leaderboardJeu({}, "atc"),
    });

    const submitScoreMutation = useMutation({
        mutationFn: async (payload) => {
            return await faireUnCoup(payload, "atc");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leaderboard", "atc"] });
        },
    });

    const startNewGameMutation = useMutation({
        mutationFn: async () => {
            return await nouvellePartie({ jeu: "atc" });
        },
        onSuccess: (data) => {
            const seed = data?.etat?.seed ?? 4;
            commandsRef.current = [];
            forcedUpdatesRef.current = 0;
            submittedRef.current = false;
            setGameState(createInitialGame(DEFAULT_SCREEN, seed));
            setInputState(createInitialInputState());
            setGameStarted(true);
        },
    });

    useEffect(() => {
        const mql = window.matchMedia("(max-width: 767.98px)");
        const onChange = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    // Envoyer le replay au serveur dès que la partie se termine
    useEffect(() => {
        if (gameStarted && gameState.loser_msg && !submittedRef.current) {
            submittedRef.current = true;
            submitScoreMutation.mutate({
                ticks: gameState.clck,
                forced_updates: forcedUpdatesRef.current,
                commands: commandsRef.current,
            });
        }
    }, [gameStarted, gameState.loser_msg, gameState.clck, submitScoreMutation]);

    const triggerUpdate = useCallback(() => {
        setGameState((prev) => stepUpdate(prev, DEFAULT_SCREEN));
    }, []);

    // Timer périodique (désactivé sur mobile, avant le début ou en fin de partie)
    useEffect(() => {
        if (isMobile || !gameStarted || gameState.loser_msg) return;
        const timer = setInterval(() => {
            triggerUpdate();
        }, DEFAULT_SCREEN.update_secs * 1000);
        return () => clearInterval(timer);
    }, [isMobile, gameStarted, gameState.clck, gameState.loser_msg, triggerUpdate]);

    useEffect(() => {
        if (isMobile || !gameStarted) return;

        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

            // En fin de partie, Espace relance une partie via le serveur
            if (gameState.loser_msg) {
                if (e.key === " ") {
                    e.preventDefault();
                    startNewGameMutation.mutate();
                }
                return;
            }

            if (e.key === "Backspace" || e.key === "Enter" || e.key.length === 1) {
                e.preventDefault();
                const {
                    inputState: nextInput,
                    gameState: nextGame,
                    forceUpdate,
                    executedCommand,
                } = handleInputKey(e.key, inputState, gameState, DEFAULT_SCREEN);

                if (executedCommand) {
                    commandsRef.current.push({
                        clck: gameState.clck,
                        keys: executedCommand,
                    });
                }

                setInputState(nextInput);
                if (forceUpdate) {
                    forcedUpdatesRef.current += 1;
                    setGameState(stepUpdate(nextGame, DEFAULT_SCREEN));
                } else {
                    setGameState(nextGame);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isMobile, gameStarted, gameState, inputState, startNewGameMutation]);

    const handleRestart = () => {
        startNewGameMutation.mutate();
    };

    const handleFinishGame = () => {
        if (!gameStarted || gameState.loser_msg) return;
        setGameState((prev) => ({
            ...prev,
            loser_msg: "Partie terminée volontairement.",
        }));
    };

    // Construction des 21 lignes de la fenêtre "planes" (à droite du radar, 20 colonnes)
    const planeLines = useMemo(() => {
        const lines = Array.from({ length: DEFAULT_SCREEN.height }, () => ({
            text: "",
            color: null,
        }));
        lines[0] = {
            text: `Tps : ${String(gameState.clck).padEnd(4, " ")} Sûrs : ${gameState.safe_planes}`,
            color: null,
        };
        lines[1] = { text: "", color: null };
        lines[2] = { text: "av dst consigne", color: null };

        let row = 3;
        for (const pp of gameState.air) {
            if (row >= DEFAULT_SCREEN.height) break;
            lines[row++] = { text: formatCommand(pp), color: getPlaneDestColor(pp) };
        }
        if (row < DEFAULT_SCREEN.height) {
            lines[row++] = { text: "", color: null };
        }
        for (const pp of gameState.ground) {
            if (row >= DEFAULT_SCREEN.height) break;
            lines[row++] = { text: formatCommand(pp), color: getPlaneDestColor(pp) };
        }
        return lines.map((l) => ({
            text: l.text.slice(0, PLANE_COLS).padEnd(PLANE_COLS, " "),
            color: l.color,
        }));
    }, [gameState]);

    // Construction des 21 lignes du radar avec les sorties et avions colorés
    const radarRows = useMemo(() => {
        const planesByRow = new Map();
        for (const pp of gameState.air) {
            if (!planesByRow.has(pp.ypos)) planesByRow.set(pp.ypos, []);
            planesByRow.get(pp.ypos).push(pp);
        }

        const exitsByRow = new Map();
        DEFAULT_SCREEN.exit.forEach((e, idx) => {
            if (!exitsByRow.has(e.y)) exitsByRow.set(e.y, []);
            exitsByRow.get(e.y).push({ x: e.x, color: EXIT_COLORS[idx % EXIT_COLORS.length] });
        });

        const airportsByRow = new Map();
        DEFAULT_SCREEN.airport.forEach((a, idx) => {
            if (!airportsByRow.has(a.y)) airportsByRow.set(a.y, []);
            airportsByRow.get(a.y).push({ x: a.x, color: AIRPORT_COLORS[idx % AIRPORT_COLORS.length] });
        });

        return cleanRadar.map((rowChars, y) => {
            const rowPlanes = planesByRow.get(y);
            const rowExits = exitsByRow.get(y);
            const rowAirports = airportsByRow.get(y);

            if (!rowPlanes && !rowExits && !rowAirports) {
                return <span key={`r-${y}`}>{rowChars.join("")}</span>;
            }

            const cells = rowChars.map((ch) => ({ ch, color: null, standout: false, bold: false }));

            if (rowExits) {
                for (const ex of rowExits) {
                    const col = ex.x * 2;
                    if (col >= 0 && col < RADAR_COLS) {
                        cells[col] = { ...cells[col], color: ex.color, bold: true };
                    }
                }
            }

            if (rowAirports) {
                for (const ap of rowAirports) {
                    const col = ap.x * 2;
                    if (col >= 0 && col + 1 < RADAR_COLS) {
                        cells[col] = { ...cells[col], color: ap.color, bold: true };
                        cells[col + 1] = { ...cells[col + 1], color: ap.color, bold: true };
                    }
                }
            }

            if (rowPlanes) {
                for (const pp of rowPlanes) {
                    const col = pp.xpos * 2;
                    const isMarked = pp.status === S_MARKED;
                    const color = getPlaneDestColor(pp);
                    if (col >= 0 && col + 1 < RADAR_COLS) {
                        cells[col] = { ch: planeName(pp), color, standout: isMarked, bold: true };
                        cells[col + 1] = { ch: String(pp.altitude), color, standout: isMarked, bold: true };
                    }
                }
            }

            const segments = [];
            let cur = { color: cells[0].color, standout: cells[0].standout, bold: cells[0].bold };
            let curStr = "";
            for (let x = 0; x < cells.length; x++) {
                const c = cells[x];
                if (c.color === cur.color && c.standout === cur.standout && c.bold === cur.bold) {
                    curStr += c.ch;
                } else {
                    segments.push({ text: curStr, ...cur });
                    cur = { color: c.color, standout: c.standout, bold: c.bold };
                    curStr = c.ch;
                }
            }
            if (curStr) segments.push({ text: curStr, ...cur });

            return (
                <span key={`r-${y}`}>
                    {segments.map((seg, i) => {
                        if (!seg.color && !seg.standout && !seg.bold) {
                            return <span key={i}>{seg.text}</span>;
                        }
                        const style = seg.standout
                            ? {
                                backgroundColor: seg.color || "#e6e6e6",
                                color: "#000000",
                                fontWeight: "bold",
                            }
                            : {
                                color: seg.color || undefined,
                                fontWeight: seg.bold ? "bold" : undefined,
                            };
                        return (
                            <span key={i} style={style}>
                                {seg.text}
                            </span>
                        );
                    })}
                </span>
            );
        });
    }, [cleanRadar, gameState.air]);

    const promptText = "> " + getInputPromptText(inputState);

    let inputLines;
    if (!gameStarted) {
        inputLines = [
            "Cliquez sur « Commencer » pour lancer une partie.".slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            "".padEnd(RADAR_COLS, " "),
            "".padEnd(RADAR_COLS, " "),
        ];
    } else if (gameState.loser_msg) {
        inputLines = [
            gameState.loser_msg.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            "".padEnd(RADAR_COLS, " "),
            "Appuyez sur Espace pour rejouer...".padEnd(RADAR_COLS, " "),
        ];
    } else {
        const errLine1 = inputState.errorLine1 ? `  ${inputState.errorLine1}` : "";
        inputLines = [
            promptText,
            errLine1.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            inputState.errorLine2.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
        ];
    }

    if (isMobile) {
        return (
            <JeuxTemplate
                titre="Contrôleur de l'air"
                contenu={
                    <Alert variant="warning" className="mt-3">
                        <strong>Jeu non disponible sur mobile.</strong>
                        <p className="mb-0 mt-1">
                            Ce jeu doit se jouer depuis un ordinateur.
                        </p>
                    </Alert>
                }
            />
        );
    }

    return (
        <JeuxTemplate
            titre="Contrôleur de l'air"
            fluid={true}
            contenu={
                <div className="w-100">
                    <div className="d-flex flex-nowrap justify-content-between align-items-start gap-3 mb-3 w-100">
                        <div className="atc-terminal-wrapper d-flex flex-column align-items-center">
                            <div className="atc-terminal">
                                {radarRows.map((radarRow, y) => (
                                    <div key={`line-${y}`}>
                                        {radarRow}
                                        <span
                                            style={
                                                planeLines[y].color
                                                    ? { color: planeLines[y].color }
                                                    : undefined
                                            }
                                        >
                                            {planeLines[y].text}
                                        </span>
                                    </div>
                                ))}
                                <div>
                                    {!gameStarted || gameState.loser_msg ? (
                                        <span>{inputLines[0]}</span>
                                    ) : (
                                        <>
                                            <span>{inputLines[0]}</span>
                                            <span className="atc-cursor">&nbsp;</span>
                                            <span>
                                                {" ".repeat(
                                                    Math.max(0, RADAR_COLS - inputLines[0].length - 1)
                                                )}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <span>{inputLines[1]}</span>
                                </div>
                                <div>
                                    <span>{inputLines[2]}</span>
                                </div>
                            </div>

                            <div className="mt-2 d-flex align-items-center gap-2">
                                <Button
                                    variant={gameStarted ? "secondary" : "primary"}
                                    size="sm"
                                    onClick={handleRestart}
                                    disabled={startNewGameMutation.isPending}
                                >
                                    {gameStarted ? "Nouvelle partie" : "Commencer"}
                                </Button>
                                {gameStarted && !gameState.loser_msg && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleFinishGame}
                                    >
                                        Terminer la partie
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="d-flex align-items-start">
                            <button
                                type="button"
                                className="atc-quick-help-tab"
                                onClick={() => setShowQuickHelp((prev) => !prev)}
                                title={showQuickHelp ? "Réduire l'aide rapide" : "Afficher l'aide rapide"}
                            >
                                <span>{showQuickHelp ? "▶" : "◀"} Aide rapide</span>
                            </button>

                            {showQuickHelp && (
                                <div className="atc-quick-help ms-2 d-flex flex-column align-items-stretch flex-grow-1">
                                    <Card className="mb-3 w-100">
                                        <Card.Header className="fw-bold py-2">
                                            Caps
                                        </Card.Header>
                                        <Card.Body className="p-1">
                                            <div className="atc-compass-keys">
                                                {COMPASS_KEYS.map((item) => (
                                                    <div
                                                        key={item.key}
                                                        className={`atc-compass-cell ${item.center ? "atc-compass-center" : ""
                                                            }`}
                                                    >
                                                        <div className="atc-key">
                                                            {item.arrow} {item.key}
                                                        </div>
                                                        <div className="atc-deg">{item.deg}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    <Card className="w-100">
                                        <Card.Header className="fw-bold py-2">
                                            Commandes essentielles
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table size="sm" striped className="mb-0">
                                                <tbody>
                                                    {QUICK_ACTIONS.map((row, idx) => (
                                                        <tr key={idx}><td className="py-0">
                                                            <code>{row.touche}</code><br />
                                                            {row.action}
                                                        </td></tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                    <Row>
                        <Col sm={7}>
                            <div className="atc-consignes">
                                <Card>
                                    <Card.Header className="fw-bold py-2">Consignes</Card.Header>
                                    <Card.Body className="py-2">
                                        <p className="mb-2">
                                            <strong>But :</strong> Guider les avions à travers l&apos;espace aérien sans collision ni panne de carburant.
                                        </p>
                                        <ul className="ps-3 mb-2">
                                            {CONSIGNES.map((elt, ind) => (
                                                <li key={ind}>
                                                    <strong>{elt.titre} :</strong> {elt.texte}
                                                </li>
                                            ))}
                                        </ul>

                                        <p className="mb-1 fw-bold">Commandes (commencent par la lettre de l&apos;avion) :</p>
                                        <ul className="ps-3 mb-2">
                                            {COMMANDES.map((elt, ind) => (
                                                <li key={ind}>
                                                    {elt.titre} : {elt.texte}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            </div>
                        </Col>
                        <Col sm={5}>
                            <Leaderboard
                                data={leaderboardData}
                                title="Meilleurs contrôleurs"
                                titleRow={true}
                                format={[
                                    { nom: "Avions", scoreKey: "score", formatScore: (s) => s },
                                    { nom: "Tours", scoreKey: "ticks", formatScore: (t) => t ?? 0 },
                                ]}
                                isLoading={isLoadingLeaderboard}
                            />
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col>
                            <div className="atc-manpage">
                                <Card>
                                    <Card.Header className="fw-bold py-2">
                                        Manuel du jeu — <code>man atc(6)</code>
                                    </Card.Header>
                                    <Card.Body className="py-2">
                                        <h6 className="mt-1">Nom</h6>
                                        <p className="mb-2">
                                            <code>atc</code> — Jeu de simulation de contrôle du trafic aérien
                                        </p>

                                        <h6>Description</h6>
                                        <p className="mb-2">
                                            <strong>Contrôleur de l&apos;air</strong> (<code>atc</code>) vous permet de vous essayer au métier éprouvant de contrôleur aérien sans mettre en danger la vie de millions de voyageurs chaque année. Votre mission consiste à diriger le vol d&apos;avions à réaction (<em>jets</em>) et d&apos;avions à hélices entrant et sortant de l&apos;espace aérien contrôlé et des aéroports. Un tour d&apos;horloge (mise à jour du radar) s&apos;écoule toutes les <strong>5 secondes</strong>.
                                        </p>

                                        <h6>Objectifs</h6>
                                        <p className="mb-2">
                                            Votre objectif est de faire durer la partie le plus longtemps possible et d&apos;acheminer un maximum d&apos;avions à bon port. Il n&apos;y a pas d&apos;état de victoire final, si ce n&apos;est de battre le score des autres joueurs. Vous devrez :
                                        </p>
                                        <ul className="ps-3 mb-2">
                                            <li>
                                                <strong>faire décoller</strong> les avions en attente aux aéroports (en leur ordonnant d&apos;augmenter leur altitude) ;
                                            </li>
                                            <li>
                                                <strong>faire atterrir</strong> les avions aux aéroports (en leur ordonnant de descendre à l&apos;altitude <code>0</code> lorsqu&apos;ils arrivent exactement au-dessus de l&apos;aéroport, alignés dans le sens de la piste) ;
                                            </li>
                                            <li>
                                                <strong>faire sortir</strong> les avions en transit par leur porte de sortie à la bonne altitude (<code>9000</code> pieds).
                                            </li>
                                        </ul>
                                        <p className="mb-2">
                                            Plusieurs événements provoquent la fin immédiate de la partie :
                                        </p>
                                        <ul className="ps-3 mb-2">
                                            <li>envoyer un avion vers une mauvaise destination (mauvaise porte de sortie ou mauvais aéroport) ;</li>
                                            <li>laisser un avion quitter l&apos;espace aérien en dehors de sa porte de sortie de destination, ou à une altitude différente de <code>9</code> (9000 pieds) ;</li>
                                            <li>faire atterrir un avion dans le mauvais sens de la piste, ou le faire descendre à l&apos;altitude <code>0</code> en dehors d&apos;un aéroport (crash), ou dépasser l&apos;altitude <code>9</code> ;</li>
                                            <li>laisser un avion tomber en panne sèche de carburant ;</li>
                                            <li>
                                                provoquer une <strong>collision</strong> : une collision est définie par la proximité immédiate (distance ≤ 1) de deux avions simultanément dans les trois dimensions (X, Y et altitude).
                                            </li>
                                        </ul>
                                        <p className="mb-2">
                                            Les scores sont classés d&apos;abord par le <strong>nombre d&apos;avions sécurisés</strong>, puis par le <strong>nombre de tours</strong> (<em>ticks</em>) en cas d&apos;égalité. Mettre une partie en pause n&apos;est pas permis — quand a-t-on vu un contrôleur aérien s&apos;absenter pour répondre au téléphone ? Vous pouvez toutefois clore votre service à tout moment avec le bouton <strong>Terminer la partie</strong>.
                                        </p>

                                        <h6>L&apos;affichage</h6>
                                        <p className="mb-1">
                                            L&apos;écran du terminal est divisé en trois zones :
                                        </p>
                                        <ul className="ps-3 mb-2">
                                            <li className="mb-1">
                                                <strong>Le radar :</strong> affiche la position des avions, des aéroports, des portes d&apos;entrée/sortie, des balises radar et des « lignes » de couloirs aériens (<code>+</code>) qui servent de repères visuels pour vous aider à guider les avions.
                                                <ul className="ps-3 mt-1">
                                                    <li>
                                                        <strong>Avions :</strong> représentés par une lettre suivie d&apos;un chiffre indiquant l&apos;altitude en milliers de pieds (<code>0</code> à <code>9</code>). Les avions à hélices sont représentés par une lettre <strong>majuscule</strong> (<code>A</code>–<code>Z</code>) et les avions à réaction (<em>jets</em>) par une lettre <strong>minuscule</strong> (<code>a</code>–<code>z</code>). Chaque avion est affiché de la même couleur que sa destination.
                                                    </li>
                                                    <li>
                                                        <strong>Aéroports (<code>^0</code>, <code>&gt;1</code>) :</strong> représentés par un numéro précédé d&apos;un symbole indiquant la direction de la piste : <code>^</code> pour le Nord (0°), <code>&gt;</code> pour l&apos;Est (90°), <code>v</code> pour le Sud (180°) et <code>&lt;</code> pour l&apos;Ouest (270°). Les avions décollent dans cette direction et doivent impérativement voler dans ce même cap pour atterrir.
                                                    </li>
                                                    <li>
                                                        <strong>Balises (<code>*0</code>, <code>*1</code>) :</strong> représentées par un astérisque et un numéro. Elles offrent un point de référence aux pilotes pour différer un changement de cap ou une mise en attente (voir <em>La commande de délai</em>).
                                                    </li>
                                                    <li>
                                                        <strong>Portes d&apos;entrée/sortie (<code>0</code> à <code>7</code>) :</strong> affichées le long de la bordure du radar. Les avions y entrent sans préavis à <strong>7000 pieds</strong> (<code>7</code>) suivant le cap d&apos;entrée propre à cette porte. Pour sortir avec succès par sa porte de destination, un avion doit voler à <strong>9000 pieds</strong> (<code>9</code>) (aucune direction particulière n&apos;est exigée pour la sortie).
                                                    </li>
                                                </ul>
                                            </li>
                                            <li className="mb-1">
                                                <strong>La zone d&apos;information (à droite du radar) :</strong> indique le temps écoulé (<code>Tps</code>, en nombre de tours) et le nombre d&apos;avions sortis ou posés sains et saufs (<code>Sûrs</code>). En dessous figure la liste des avions actuellement en vol, suivie d&apos;une ligne vide, puis la liste des avions au sol (en attente aux aéroports). Chaque ligne mentionne l&apos;avion et son altitude, un astérisque éventuel <code>*</code> signalant un carburant faible (&lt; 15 tours), sa destination (<code>A0</code>..<code>A1</code> ou <code>S0</code>..<code>S7</code>) et sa consigne de navigation actuelle (le changement d&apos;altitude n&apos;y est pas affiché). Exemples :
                                                <pre className="mt-1">{`B4*A0: Cercle @ B1\ng7 S4: 225`}</pre>
                                                Le premier exemple montre un avion à hélices nommé <code>B</code> volant à 4000 pieds, à court de carburant (notez le <code>*</code>), à destination de l&apos;aéroport <code>#0</code>, qui a pour consigne de décrire un cercle dès qu&apos;il atteindra la balise <code>#1</code>. Le second exemple montre un jet nommé <code>g</code> à 7000 pieds, à destination de la sortie <code>#4</code>, en train d&apos;exécuter un virage vers le cap 225° (Sud-Ouest).
                                            </li>
                                            <li>
                                                <strong>La zone de saisie (en bas du radar) :</strong> affiche la commande en cours de composition ainsi que les aides contextuelles ou messages d&apos;erreur.
                                            </li>
                                        </ul>

                                        <h6>Saisie et commandes</h6>
                                        <p className="mb-2">
                                            Une interface de complétion automatique est intégrée au jeu. À tout moment, appuyer sur <code>?</code> affiche les caractères possibles à l&apos;étape courante. Appuyer sur <code>Retour arrière</code> (<code>Backspace</code>) efface la dernière partie de la commande. Lorsque votre commande est complète, appuyez sur <code>Entrée</code> : la vérification sémantique est alors effectuée. Si aucune erreur n&apos;est détectée, l&apos;ordre est envoyé à l&apos;avion ; en cas d&apos;erreur, la partie fautive est soulignée par des accents circonflexes (<code>^^^</code>) accompagnés d&apos;un message explicatif.
                                        </p>
                                        <p className="mb-2">
                                            Dans les tables ci-dessous, <code>[0-9]</code> désigne un chiffre unique, et <code>&lt;cap&gt;</code> désigne une direction indiquée par les 8 touches entourant la touche <code>s</code> du clavier AZERTY : <code>zedcxwqa</code>. En valeur absolue, <code>a</code> désigne le Nord-Ouest (315°) et <code>z</code> le Nord (0°). En valeur relative, <code>a</code> désigne -45° (45° à gauche) et <code>z</code> désigne 0° (aucun changement de cap). Toutes les commandes commencent par la lettre de l&apos;avion destinataire (insensible à la casse).
                                        </p>

                                        <p className="mb-1 fw-bold">1. Commandes immédiates uniquement (prennent effet au prochain tour) :</p>
                                        <ul className="ps-3 mb-2">
                                            <li>
                                                <code>a [cd+-] nombre</code> — <strong>Altitude :</strong> change l&apos;altitude d&apos;un avion (et fait décoller un avion au sol si l&apos;altitude cible est &gt; 0).
                                                <ul className="ps-3">
                                                    <li><code>a [0-9]</code> : monter ou descendre vers l&apos;altitude donnée (en milliers de pieds).</li>
                                                    <li><code>ac [1-9]</code> ou <code>a+ [1-9]</code> : monter (gain d&apos;altitude relatif en milliers de pieds).</li>
                                                    <li><code>ad [1-9]</code> ou <code>a- [1-9]</code> : descendre (perte d&apos;altitude relative en milliers de pieds).</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <code>m</code> — <strong>Marquer :</strong> afficher l&apos;avion en surbrillance (état par défaut à l&apos;entrée dans la zone).
                                            </li>
                                            <li>
                                                <code>i</code> — <strong>Ignorer :</strong> ne plus afficher l&apos;avion en surbrillance ; le champ de consigne affiche une ligne de tirets (<code>---------</code>) s&apos;il n&apos;y a pas de commande en cours.
                                            </li>
                                            <li>
                                                <code>u</code> — <strong>Démarquer :</strong> identique à ignorer, mais si une commande différée est déclenchée au passage d&apos;une balise, l&apos;avion redevient automatiquement marqué (en surbrillance). Idéal pour oublier temporairement un avion pendant une partie seulement de son trajet.
                                            </li>
                                        </ul>

                                        <p className="mb-1 fw-bold">2. Commandes différables (immédiates, ou différées avec le suffixe de délai) :</p>
                                        <ul className="ps-3 mb-2">
                                            <li>
                                                <code>c</code> — <strong>Cercle :</strong> ordonne à l&apos;avion de décrire des cercles sur place (rotation de 90° dans le sens horaire à chaque déplacement).
                                            </li>
                                            <li>
                                                <code>t [lrLR] [cap]</code> ou <code>tv [bsa*] nombre</code> — <strong>Tourner :</strong> changer de direction.
                                                <ul className="ps-3">
                                                    <li><code>t&lt;cap&gt;</code> : virer vers le cap absolu donné (<code>z</code> = 0°, <code>e</code> = 45°, <code>d</code> = 90°, <code>c</code> = 135°, <code>x</code> = 180°, <code>w</code> = 225°, <code>q</code> = 270°, <code>a</code> = 315°). Le virage le plus court est choisi automatiquement.</li>
                                                    <li><code>tl [cap]</code> : tourner à gauche (sens anti-horaire) de 45° par défaut, ou de l&apos;angle relatif indiqué par <code>&lt;cap&gt;</code> (<em>et non vers le cap <code>&lt;cap&gt;</code></em>).</li>
                                                    <li><code>tr [cap]</code> : tourner à droite (sens horaire) de 45° par défaut, ou de l&apos;angle relatif indiqué par <code>&lt;cap&gt;</code>.</li>
                                                    <li><code>tL</code> : virage serré de 90° à gauche (anti-horaire).</li>
                                                    <li><code>tR</code> : virage serré de 90° à droite (horaire).</li>
                                                    <li><code>tvb#</code> (ou <code>tv*#</code>), <code>tvs#</code>, <code>tva#</code> : tourner <strong>v</strong>ers la <strong>b</strong>alise, la <strong>s</strong>ortie ou l&apos;<strong>a</strong>éroport indiqué (cap estimé au plus proche).</li>
                                                </ul>
                                            </li>
                                        </ul>

                                        <p className="mb-1 fw-bold">3. La commande de délai (<code>ab#</code> / <code>@b#</code>) :</p>
                                        <p className="mb-2">
                                            Le suffixe <code>ab [0-9]</code> (ou <code>@b [0-9]</code>, <code>a* [0-9]</code>, <code>@* [0-9]</code>) peut être ajouté à la fin de n&apos;importe quelle commande différable (<code>c</code> ou <code>t...</code>). Il ordonne à l&apos;avion d&apos;exécuter cette manœuvre lorsqu&apos;il atteindra la balise spécifiée (celle-ci doit se trouver dans l&apos;axe de vol actuel de l&apos;avion).
                                        </p>

                                        <h6>Exemples</h6>
                                        <ul className="ps-3 mb-2">
                                            <li><code>atlab1</code> — Avion A : tourner à gauche à la balise #1</li>
                                            <li><code>cc</code> — Avion C : décrire un cercle</li>
                                            <li><code>gtvs4ab0</code> — Avion G : tourner vers la sortie #4 à la balise #0</li>
                                            <li><code>ma+2</code> — Avion M : altitude : monter de 2000 pieds</li>
                                            <li><code>sta</code> — Avion S : tourner vers le cap 315° (Nord-Ouest)</li>
                                            <li><code>xi</code> — Avion X : ignorer</li>
                                        </ul>

                                        <h6>Autres informations</h6>
                                        <ul className="ps-3 mb-2">
                                            <li>Les <em>jets</em> (minuscules) avancent à chaque tour ; les avions à hélices (majuscules) avancent un tour sur deux (tours pairs).</li>
                                            <li>Tous les avions tournent au maximum de 90° par déplacement et changent d&apos;altitude d&apos;au plus 1000 pieds par déplacement.</li>
                                            <li>Les avions entrent à 7000 pieds et doivent sortir à 9000 pieds.</li>
                                            <li>Les avions volant à l&apos;altitude 0 s&apos;écrasent s&apos;ils ne sont pas exactement au-dessus d&apos;un aéroport.</li>
                                            <li>Les avions en attente aux aéroports (<code>Attente @ A0</code>) ne peuvent recevoir qu&apos;un ordre de décollage (monter en altitude).</li>
                                            <li>Appuyer sur <code>Entrée</code> à vide déclenche immédiatement le tour suivant, ce qui permet d&apos;accélérer l&apos;horloge lorsque tout est sous contrôle.</li>
                                        </ul>

                                        <h6>Auteur original</h6>
                                        <p className="mb-0 text-muted">
                                            Ed James, UC Berkeley (1987) — BSD Games <code>atc(6)</code>.
                                        </p>
                                    </Card.Body>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </div>
            }
        />
    );
}
