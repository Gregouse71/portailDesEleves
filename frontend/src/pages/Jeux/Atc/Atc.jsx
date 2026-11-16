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

// Couleurs distinctes pour chaque porte de sortie (E0..E7) et aéroport (A0..A1)
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
    { touche: "t [dir]", action: "Virer vers cap" },
    { touche: "tt b/e/a #", action: <>Cap vers <b>b</b>alise, sorti<b>e</b>, <b>a</b>éroport</> },
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
        titre: <><code>ttb0</code> / <code>tte2</code></>,
        texte: <>tourner vers une balise (<code>b</code>/<code>*</code>), une sortie (<code>e</code>) ou un aéroport (<code>a</code>).</>,
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
        inputLines = [
            promptText,
            inputState.errorLine1.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            inputState.errorLine2.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
        ];
    }

    if (isMobile) {
        return (
            <JeuxTemplate
                titre="ATC"
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
                    <div className="d-flex flex-nowrap justify-content-between align-items-center gap-3 mb-3 w-100">
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
                        <div className="atc-quick-help d-flex flex-column align-items-center">
                            <Card className="mb-3">
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

                            <Card>
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
                                    { nom: "Ticks", scoreKey: "ticks", formatScore: (t) => t ?? 0 },
                                ]}
                                isLoading={isLoadingLeaderboard}
                            />
                        </Col>
                    </Row>
                </div>
            }
        />
    );
}
