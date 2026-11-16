import { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import JeuxTemplate from "../../../components/templates/JeuxTemplate";
import {
    AUTHOR_STR,
    PLANE_COLS,
    S_MARKED,
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

const CONSIGNES = [
    {
        titre: <>Avions</>,
        texte: <><code>A7</code> (majuscule = hélice, avance 1 tour sur 2), <code>b7</code> (minuscule = jet, avance à chaque tour). Le chiffre indique l&apos;altitude (en milliers de pieds).</>
    },
    {
        titre: <>Sorties (<code>0</code>–<code>7</code>)</>,
        texte: <>les avions entrent à < strong > altitude 7</strong > et doivent sortir par leur porte de destination à < strong > altitude 9</strong ></>
    },
    {
        titre: <>Aéroports (<code>^0</code>, <code>&gt;1</code>)</>,
        texte: <>décollage en donnant une altitude & gt; 0. Atterrissage à < strong > altitude 0</strong > dans la direction de la piste(<code>^</code> = Nord, <code>&gt;</code> = Est).</>
    },
    {
        titre: <>Balises (<code>*0</code>, <code>*1</code>)</>,
        texte: <>points de repère pour différer un ordre.</>
    },
    {
        titre: <>Collision</>,
        texte: <>fin de partie si deux avions sont simultanément à distance ≤ 1 en X, Y et altitude.</>
    },
]
const COMMANDES = [
    {
        titre: <><code>a[0-9]</code></>,
        texte: <>changer d&apos;altitude (ex: <code>aa9</code> pour monter à 9000 ft, <code>ac2</code> / <code>ad2</code> pour +2000 / -2000 ft).</>
    },
    {
        titre: <><code>t[zedcxwqa]</code></>,
        texte: <>tourner vers une direction absolue < code > s</code > (<code>w</code> = 0° N, <code>e</code> = 45° NE, <code>d</code> = 90° E, <code>c</code> = 135° SE, <code>x</code> = 180° S, <code>w</code> = 225° SO, <code>q</code> = 270° O, <code>a</code> = 315° NO).</>
    },
    {
        titre: <><code>tl</code> / <code>tr</code> (<code>tL</code> / <code>tR</code>)</>,
        texte: <>tourner de 45° (90°) à gauche / droite.</>
    },
    {
        titre: <><code>ttb0</code> / <code>tte2</code></>,
        texte: <>tourner vers une balise (<code>b</code>/<code>*</code>), une sortie (<code>e</code>) ou un aéroport (<code>a</code>).</>
    },
    {
        titre: <><code>c</code></>,
        texte: <>décrire un cercle.</>
    },
    {
        titre: <><code>ab0</code> (à la fin d&apos;une commande de virage ou cercle)</>,
        texte: <>différer l&apos;ordre au passage sur la balise.</>
    },
    {
        titre: <><code>m</code></>,
        texte: <>marquer (surbrillance), démarquer (réactivé à la prochaine balise) ou ignorer.</>
    },
    {
        titre: <><code>Entrée</code></>,
        texte: <>avancer immédiatement d&apos;un tour.</>
    },
]

export default function Atc() {
    const [gameState, setGameState] = useState(() => createInitialGame(DEFAULT_SCREEN));
    const [inputState, setInputState] = useState(() => createInitialInputState());

    const cleanRadar = useMemo(() => buildCleanRadarGrid(DEFAULT_SCREEN), []);

    const triggerUpdate = useCallback(() => {
        setGameState((prev) => stepUpdate(prev, DEFAULT_SCREEN));
    }, []);

    // Timer périodique (update_secs = 5s par défaut, réinitialisé si update forcé avec Entrée)
    useEffect(() => {
        if (gameState.loser_msg) return;
        const timer = setInterval(() => {
            triggerUpdate();
        }, DEFAULT_SCREEN.update_secs * 1000);
        return () => clearInterval(timer);
    }, [gameState.clck, gameState.loser_msg, triggerUpdate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

            // En fin de partie, Espace relance une partie
            if (gameState.loser_msg) {
                if (e.key === " ") {
                    e.preventDefault();
                    setGameState(createInitialGame(DEFAULT_SCREEN));
                    setInputState(createInitialInputState());
                }
                return;
            }

            if (e.key === "Backspace" || e.key === "Enter" || e.key.length === 1) {
                e.preventDefault();
                const { inputState: nextInput, gameState: nextGame, forceUpdate } = handleInputKey(
                    e.key,
                    inputState,
                    gameState,
                    DEFAULT_SCREEN
                );
                setInputState(nextInput);
                if (forceUpdate) {
                    setGameState(stepUpdate(nextGame, DEFAULT_SCREEN));
                } else {
                    setGameState(nextGame);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [gameState, inputState]);

    const handleRestart = () => {
        setGameState(createInitialGame(DEFAULT_SCREEN));
        setInputState(createInitialInputState());
    };

    // Construction des 21 lignes de la fenêtre "planes" (à droite du radar, 20 colonnes)
    const planeLines = useMemo(() => {
        const lines = Array(DEFAULT_SCREEN.height).fill("");
        lines[0] = `Time: ${String(gameState.clck).padEnd(4, " ")} Safe: ${gameState.safe_planes}`;
        lines[1] = "";
        lines[2] = "pl dt  comm";

        let row = 3;
        for (const pp of gameState.air) {
            if (row >= DEFAULT_SCREEN.height) break;
            lines[row++] = formatCommand(pp);
        }
        if (row < DEFAULT_SCREEN.height) {
            lines[row++] = "";
        }
        for (const pp of gameState.ground) {
            if (row >= DEFAULT_SCREEN.height) break;
            lines[row++] = formatCommand(pp);
        }
        return lines.map((l) => l.slice(0, PLANE_COLS).padEnd(PLANE_COLS, " "));
    }, [gameState]);

    // Construction des 21 lignes du radar avec les avions superposés
    const radarRows = useMemo(() => {
        const planesByRow = new Map();
        for (const pp of gameState.air) {
            if (!planesByRow.has(pp.ypos)) planesByRow.set(pp.ypos, []);
            planesByRow.get(pp.ypos).push(pp);
        }

        return cleanRadar.map((rowChars, y) => {
            const rowPlanes = planesByRow.get(y);
            if (!rowPlanes || rowPlanes.length === 0) {
                return <span key={`r-${y}`}>{rowChars.join("")}</span>;
            }

            // Surcharger les cellules (xpos * 2, xpos * 2 + 1) pour chaque avion sur cette ligne
            const cells = rowChars.map((ch) => ({ ch, standout: false }));
            for (const pp of rowPlanes) {
                const col = pp.xpos * 2;
                const isMarked = pp.status === S_MARKED;
                if (col >= 0 && col + 1 < RADAR_COLS) {
                    cells[col] = { ch: planeName(pp), standout: isMarked };
                    cells[col + 1] = { ch: String(pp.altitude), standout: isMarked };
                }
            }

            // Regrouper les segments consécutifs de même style
            const segments = [];
            let curStandout = cells[0].standout;
            let curStr = "";
            for (let x = 0; x < cells.length; x++) {
                if (cells[x].standout === curStandout) {
                    curStr += cells[x].ch;
                } else {
                    segments.push({ text: curStr, standout: curStandout });
                    curStandout = cells[x].standout;
                    curStr = cells[x].ch;
                }
            }
            if (curStr) segments.push({ text: curStr, standout: curStandout });

            return (
                <span key={`r-${y}`}>
                    {segments.map((seg, i) =>
                        seg.standout ? (
                            <span key={i} className="atc-standout">
                                {seg.text}
                            </span>
                        ) : (
                            <span key={i}>{seg.text}</span>
                        )
                    )}
                </span>
            );
        });
    }, [cleanRadar, gameState.air]);

    // Construction des 3 lignes du bas (fenêtre "input" 60 cols + fenêtre "credit" 20 cols)
    const creditLines = [
        "*".repeat(PLANE_COLS - 1) + " ",
        ` ${AUTHOR_STR}`.padEnd(PLANE_COLS, " "),
        "*".repeat(PLANE_COLS - 1) + " ",
    ];

    const promptText = getInputPromptText(inputState);

    let inputLines;
    if (gameState.loser_msg) {
        inputLines = [
            gameState.loser_msg.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            "".padEnd(RADAR_COLS, " "),
            "Hit space for a new game...".padEnd(RADAR_COLS, " "),
        ];
    } else {
        inputLines = [
            promptText,
            inputState.errorLine1.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            inputState.errorLine2.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
        ];
    }

    return (
        <JeuxTemplate
            titre="ATC"
            fluid={true}
            contenu={
                <div>
                    <div className="d-flex flex-xs-wrap flex-row justify-content-between align-items-top gap-2 mb-3">
                        <div className="d-flex flex-column align-items-start flex-grow-1">
                            <div className="atc-terminal">
                                {radarRows.map((radarRow, y) => (
                                    <div key={`line-${y}`}>
                                        {radarRow}
                                        {planeLines[y]}
                                    </div>
                                ))}
                                <div>
                                    {gameState.loser_msg ? (
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
                                    {/* <span>{creditLines[0]}</span> */}
                                </div>
                                <div>
                                    <span>{inputLines[1]}</span>
                                    {/* <span>{creditLines[1]}</span> */}
                                </div>
                                <div>
                                    <span>{inputLines[2]}</span>
                                    {/* <span>{creditLines[2]}</span> */}
                                </div>
                            </div>

                            <div className="mt-2">
                                <Button variant="secondary" size="sm" onClick={handleRestart}>
                                    Nouvelle partie
                                </Button>
                            </div>
                        </div>
                        <div>
                            Aides
                        </div>
                    </div>

                    <div className="atc-consignes">
                        <Card>
                            <Card.Header className="fw-bold py-2">Consignes</Card.Header>
                            <Card.Body className="py-2">
                                <p className="mb-2">
                                    <strong>But :</strong> Guider les avions à travers l&apos;espace aérien sans collision ni panne de carburant.
                                </p>
                                <ul className="ps-3 mb-2">
                                    {CONSIGNES.map((elt, ind) =>
                                        <li key={ind}>
                                            <strong>{elt.titre} :</strong> {elt.texte}
                                        </li>
                                    )}
                                </ul>

                                <p className="mb-1 fw-bold">Commandes (commencent par la lettre de l&apos;avion) :</p>
                                <ul className="ps-3 mb-2">
                                    {COMMANDES.map((elt, ind) =>
                                        <li key={ind}>
                                            {elt.titre} : {elt.texte}
                                        </li>
                                    )}
                                </ul>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            }
        />
    );
}
