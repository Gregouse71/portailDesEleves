import { useMemo } from "react";
import {
    PLANE_COLS,
    S_MARKED,
    DEFAULT_SCREEN,
    planeName,
    formatCommand,
    buildCleanRadarGrid,
    getInputPromptText,
} from "./atcEngine";
import {
    RADAR_COLS,
    EXITS_BY_ROW,
    AIRPORTS_BY_ROW,
    getPlaneDestColor,
    getInputActionLines,
} from "./atcConstants";

const CLEAN_RADAR = buildCleanRadarGrid(DEFAULT_SCREEN);
const TOTAL_TERMINAL_ROWS = DEFAULT_SCREEN.height + 3; // 21 radar + 3 saisie = 24
const MAX_PLANE_LIST_ROWS = TOTAL_TERMINAL_ROWS - 3;

export default function AtcTerminal({
    gameState,
    inputState,
    gameStarted,
    isPaused,
    onKey,
    onSelectPlane,
}) {
    const radarRows = useMemo(() => {
        const planesByRow = new Map();
        for (const pp of gameState.air) {
            if (!planesByRow.has(pp.ypos)) planesByRow.set(pp.ypos, []);
            planesByRow.get(pp.ypos).push(pp);
        }

        return CLEAN_RADAR.map((rowChars, y) => {
            const rowPlanes = planesByRow.get(y);
            const rowExits = EXITS_BY_ROW.get(y);
            const rowAirports = AIRPORTS_BY_ROW.get(y);

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
                                    onClick={() => onSelectPlane(seg.planeKey)}
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
    }, [gameState.air, onSelectPlane]);

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

    const visiblePlaneRows = planeRowsList.slice(0, MAX_PLANE_LIST_ROWS);
    const remainingRows = TOTAL_TERMINAL_ROWS - 3 - visiblePlaneRows.length;
    const availActionRows = remainingRows >= 2 ? remainingRows - 1 : 0;

    const rawActionLines = useMemo(
        () => getInputActionLines(inputState, gameState, gameStarted, DEFAULT_SCREEN),
        [inputState, gameState, gameStarted]
    );
    const displayedActionLines = availActionRows > 0 ? rawActionLines.slice(-availActionRows) : [];

    const planeHeaderRows = [
        `Tps : ${String(gameState.clck).padEnd(4, " ")} Sûrs : ${gameState.safe_planes}`
            .slice(0, PLANE_COLS)
            .padEnd(PLANE_COLS, " "),
        "".padEnd(PLANE_COLS, " "),
        "av dst consigne".padEnd(PLANE_COLS, " "),
    ];

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
        const promptText = "> " + getInputPromptText(inputState);
        const errLine1 = inputState.errorLine1 ? `  ${inputState.errorLine1}` : "";
        inputLines = [
            promptText,
            errLine1.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
            inputState.errorLine2.slice(0, RADAR_COLS).padEnd(RADAR_COLS, " "),
        ];
    }

    if (isPaused) {
        return (
            <div className="atc-terminal atc-paused-screen d-flex flex-column justify-content-center align-items-center text-center">
                <div className="fw-bold fs-5 mb-2">PARTIE EN PAUSE</div>
                <div className="text-secondary small mb-1">
                    Cliquez sur « Reprendre » pour continuer.
                </div>
                <div>
                    Tour {gameState.clck} — Avions sécurisés : {gameState.safe_planes}
                </div>
            </div>
        );
    }

    return (
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
                                {" ".repeat(Math.max(0, RADAR_COLS - inputLines[0].length - 1))}
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
                    {planeHeaderRows.map((text, idx) => (
                        <div key={`ph-${idx}`}>{text}</div>
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
                                    onClick={() => onSelectPlane(row.planeKey)}
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
                {displayedActionLines.length > 0 && (
                    <div className="atc-action-hint">
                        {displayedActionLines.map((items, rowIdx) => (
                            <div key={`ah-${rowIdx}`}>
                                {items.map((item, idx) =>
                                    item.key ? (
                                        <button
                                            key={`${item.key}-${idx}`}
                                            type="button"
                                            className="atc-hint-btn"
                                            onClick={() => onKey(item.key)}
                                            title={item.title}
                                        >
                                            {item.text}
                                        </button>
                                    ) : (
                                        <span key={idx}>{item.text}</span>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
