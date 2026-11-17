import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, Button, Alert, Row, Col, Modal } from "react-bootstrap";
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

function getInputActionLines(inputState, gameState, gameStarted, sp = DEFAULT_SCREEN) {
    if (!gameStarted || gameState.loser_msg) {
        return [];
    }

    const b = (key, text = key, title) => ({ key, text, title });
    const t = (text) => ({ text });

    const compassRows = [
        [t(" "), b("a", "↖a", "315° NO"), t("  "), b("z", "↑z", "0° N"), t("  "), b("e", "↗e", "45° NE")],
        [t(" "), b("q", "←q", "270° O"), t("  "), t("• "), t("  "), b("d", "→d", "90° E")],
        [t(" "), b("w", "↙w", "225° SO"), t("  "), b("x", "↓x", "180° S"), t("  "), b("c", "↘c", "135° SE")],
    ];

    const stateId = inputState.stack[inputState.level]?.state ?? 0;
    switch (stateId) {
        case 0: {
            const planes = [...gameState.air, ...gameState.ground]
                .map((pp) => planeName(pp).toLowerCase())
                .sort();
            const planeRow =
                planes.length > 0
                    ? [
                        ...planes.slice(0, 6).flatMap((ch, idx) =>
                            idx > 0
                                ? [t(","), b(ch, ch, `Sélectionner l'avion ${ch}`)]
                                : [b(ch, ch, `Sélectionner l'avion ${ch}`)]
                        ),
                        t(planes.length > 6 ? "[a-z] : choisir avion" : " : choisir avion"),
                    ]
                    : [t("Aucun avion")];
            return [
                [t("Actions disp. :")],
                planeRow,
                [b("Enter", "Entrée", "Avancer d'un tour"), t(" : tour suiv.")],
            ];
        }
        case 1:
            return [
                [b("t", "t tourner"), t("   "), b("u", "u démarquer")],
                [b("a", "a altitude"), t("  "), b("m", "m marquer")],
                [b("c", "c cercle"), t("    "), b("i", "i ignorer")],
                [b("Backspace", "⌫ retour")],
            ];
        case 2:
            return [
                ...compassRows,
                [b("l"), t("/"), b("r"), t(" 45°  "), b("L"), t("/"), b("R"), t(" 90°")],
                [b("v", "v vers"), t("   "), b("Backspace", "⌫ retour")],
            ];
        case 3:
            return [
                ["2", "3", "4", "6", "8"].map((k) => b(k, " " + k)),
                ["0", "1", "5", "7", "9"].map((k) => b(k, " " + k)),
                [b("c", "c monter"), t("  "), b("d", "d desc.")],
                [b("Backspace", "⌫ retour")],
            ];
        case 4:
            return [
                [b("Enter", "Entrée : valider")],
                [b("a", "a : à balise")],
                [b("Backspace", "⌫ retour")],
            ];
        case 5:
            return [
                [
                    t("balise "),
                    ...Array.from({ length: sp.beacon.length }, (_, i) =>
                        i > 0 ? [t(" "), b(String(i))] : [b(String(i))]
                    ).flat(),
                ],
                [b("Backspace", "⌫ retour")],
            ];
        case 6:
            return [
                ...compassRows,
                [b("Enter", "Entrée : valider")],
                [b("a", "a bal."), t("   "), b("Backspace", "⌫ retour")],
            ];
        case 7:
            return [
                [b("Enter", "Entrée : valider")],
                [b("Backspace", "⌫ retour")],
            ];
        case 8:
            return [
                ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => b(k)),
                [b("Backspace", "⌫ retour")],
            ];
        case 9:
            return [
                [b("b", "b : balise")],
                [b("Backspace", "⌫ retour")],
            ];
        case 10:
            return [
                ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => b(k)),
                [t("(x1000ft) "), b("Backspace", "⌫ retour")],
            ];
        case 11:
            return [
                [b("b", "b balise"), t("  "), b("s", "s sortie")],
                [b("a", "a aéroport")],
                [b("Backspace", "⌫ retour")],
            ];
        case 12:
            return [[b("Backspace", "⌫ effacer '?'")]];
        default:
            return [];
    }
}

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
    const [showManual, setShowManual] = useState(false);

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
            while (commandsRef.current.length < gameState.clck) {
                commandsRef.current.push([]);
            }
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

    const processKey = useCallback(
        (key) => {
            if (isMobile || !gameStarted || gameState.loser_msg) return;
            const {
                inputState: nextInput,
                gameState: nextGame,
                forceUpdate,
                executedCommand,
            } = handleInputKey(key, inputState, gameState, DEFAULT_SCREEN);

            if (executedCommand) {
                while (commandsRef.current.length <= gameState.clck) {
                    commandsRef.current.push([]);
                }
                commandsRef.current[gameState.clck].push(executedCommand);
            }

            setInputState(nextInput);
            if (forceUpdate) {
                forcedUpdatesRef.current += 1;
                setGameState(stepUpdate(nextGame, DEFAULT_SCREEN));
            } else {
                setGameState(nextGame);
            }
        },
        [isMobile, gameStarted, gameState, inputState]
    );

    const selectPlane = useCallback(
        (planeKey) => {
            if (isMobile || !gameStarted || gameState.loser_msg) return;
            const { inputState: nextInput, gameState: nextGame } = handleInputKey(
                planeKey,
                createInitialInputState(),
                gameState,
                DEFAULT_SCREEN
            );
            setInputState(nextInput);
            setGameState(nextGame);
        },
        [isMobile, gameStarted, gameState]
    );

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
                processKey(e.key);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isMobile, gameStarted, gameState.loser_msg, processKey, startNewGameMutation]);

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

    const rawActionLines = getInputActionLines(inputState, gameState, gameStarted, DEFAULT_SCREEN);

    // Zone droite unifiée (24 lignes au total) : priorité à la liste des avions, on rogne sur l'aide en bas s'il y a trop d'avions
    const totalTerminalRows = DEFAULT_SCREEN.height + 3; // 21 radar + 3 saisie = 24
    const maxPlaneListRows = totalTerminalRows - 3;

    const planeRowsList = useMemo(() => {
        const list = [];
        for (const pp of gameState.air) {
            list.push({
                text: formatCommand(pp),
                color: getPlaneDestColor(pp),
                planeKey: planeName(pp).toLowerCase(),
            });
        }
        if (gameState.air.length > 0 && gameState.ground.length > 0) {
            list.push({ text: "", color: null, planeKey: null });
        }
        for (const pp of gameState.ground) {
            list.push({
                text: formatCommand(pp),
                color: getPlaneDestColor(pp),
                planeKey: planeName(pp).toLowerCase(),
            });
        }
        return list.map((l) => ({
            text: l.text.slice(0, PLANE_COLS).padEnd(PLANE_COLS, " "),
            color: l.color,
            planeKey: l.planeKey,
        }));
    }, [gameState.air, gameState.ground]);

    const visiblePlaneRows = planeRowsList.slice(0, maxPlaneListRows);
    const remainingRows = totalTerminalRows - 3 - visiblePlaneRows.length;
    const availActionRows = remainingRows >= 2 ? remainingRows - 1 : 0;
    const displayedActionLines =
        availActionRows > 0 ? rawActionLines.slice(-availActionRows) : [];
    const planeHeaderRows = [
        {
            text: `Tps : ${String(gameState.clck).padEnd(4, " ")} Sûrs : ${gameState.safe_planes}`
                .slice(0, PLANE_COLS)
                .padEnd(PLANE_COLS, " "),
            color: null,
        },
        { text: "".padEnd(PLANE_COLS, " "), color: null },
        { text: "av dst consigne".padEnd(PLANE_COLS, " "), color: null },
    ];

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

            const cells = rowChars.map((ch) => ({
                ch,
                color: null,
                standout: false,
                bold: false,
                planeKey: null,
            }));

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
                    const pKey = planeName(pp).toLowerCase();
                    if (col >= 0 && col + 1 < RADAR_COLS) {
                        cells[col] = {
                            ch: planeName(pp),
                            color,
                            standout: isMarked,
                            bold: true,
                            planeKey: pKey,
                        };
                        cells[col + 1] = {
                            ch: String(pp.altitude),
                            color,
                            standout: isMarked,
                            bold: true,
                            planeKey: pKey,
                        };
                    }
                }
            }

            const segments = [];
            let cur = {
                color: cells[0].color,
                standout: cells[0].standout,
                bold: cells[0].bold,
                planeKey: cells[0].planeKey,
            };
            let curStr = "";
            for (let x = 0; x < cells.length; x++) {
                const c = cells[x];
                if (
                    c.color === cur.color &&
                    c.standout === cur.standout &&
                    c.bold === cur.bold &&
                    c.planeKey === cur.planeKey
                ) {
                    curStr += c.ch;
                } else {
                    segments.push({ text: curStr, ...cur });
                    cur = {
                        color: c.color,
                        standout: c.standout,
                        bold: c.bold,
                        planeKey: c.planeKey,
                    };
                    curStr = c.ch;
                }
            }
            if (curStr) segments.push({ text: curStr, ...cur });

            return (
                <span key={`r-${y}`}>
                    {segments.map((seg, i) => {
                        if (!seg.color && !seg.standout && !seg.bold && !seg.planeKey) {
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
                        if (seg.planeKey) {
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className="atc-plane-btn"
                                    style={style}
                                    onClick={() => selectPlane(seg.planeKey)}
                                    title={`Sélectionner l'avion ${seg.planeKey}`}
                                >
                                    {seg.text}
                                </button>
                            );
                        }
                        return (
                            <span key={i} style={style}>
                                {seg.text}
                            </span>
                        );
                    })}
                </span>
            );
        });
    }, [cleanRadar, gameState.air, selectPlane]);

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

    const actionHints = displayedActionLines.map((items) =>
        items.map((item, idx) =>
            item.key ? (
                <button
                    key={`${item.key}-${idx}`}
                    type="button"
                    className="atc-hint-btn"
                    onClick={() => processKey(item.key)}
                    title={item.title}
                >
                    {item.text}
                </button>
            ) : (
                <span key={idx}>{item.text}</span>
            )
        )
    );

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
                    <div className="d-flex justify-content-center mb-3 w-100">
                        <div className="atc-terminal-wrapper d-flex flex-column align-items-center">
                            <div className="atc-terminal d-flex">
                                <div className="atc-terminal-left">
                                    {radarRows.map((radarRow, y) => (
                                        <div key={`line-${y}`}>{radarRow}</div>
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
                                <div className="atc-terminal-right d-flex flex-column justify-content-between">
                                    <div>
                                        {planeHeaderRows.map((row, idx) => (
                                            <div key={`ph-${idx}`}>{row.text}</div>
                                        ))}
                                        {visiblePlaneRows.map((row, idx) => (
                                            <div
                                                key={`pr-${idx}`}
                                                style={row.color ? { color: row.color } : undefined}
                                            >
                                                {row.planeKey ? (
                                                    <button
                                                        type="button"
                                                        className="atc-plane-btn"
                                                        onClick={() => selectPlane(row.planeKey)}
                                                        title={`Sélectionner l'avion ${row.planeKey}`}
                                                    >
                                                        {row.text}
                                                    </button>
                                                ) : (
                                                    row.text
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {actionHints.length > 0 && (
                                        <div className="atc-action-hint">
                                            {actionHints.map((row, idx) => (
                                                <div key={`ah-${idx}`}>{row}</div>
                                            ))}
                                        </div>
                                    )}
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
                    </div>
                    <Row>
                        <Col sm={7}>
                            <div className="atc-consignes">
                                <Card>
                                    <Card.Header className="fw-bold py-2 d-flex justify-content-between align-items-center">
                                        <span>Consignes</span>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setShowManual(true)}
                                        >
                                            Manuel complet
                                        </Button>
                                    </Card.Header>
                                    <Card.Body className="py-2">
                                        <p className="mb-2">
                                            <strong>But :</strong> Guider les avions à travers l&apos;espace aérien sans collision ni panne de carburant. Donnez des consignes au clavier ou en cliquant sur les avions.
                                        </p>
                                        <ul className="ps-3 mb-2">
                                            {CONSIGNES.map((elt, ind) => (
                                                <li key={ind}>
                                                    <strong>{elt.titre} :</strong> {elt.texte}
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

                    <Modal
                        show={showManual}
                        onHide={() => setShowManual(false)}
                        size="lg"
                        scrollable
                    >
                        <Modal.Header closeButton>
                            <Modal.Title className="fs-5 fw-bold">
                                Manuel du jeu
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="atc-manpage">
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
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" size="sm" onClick={() => setShowManual(false)}>
                                Fermer
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            }
        />
    );
}
