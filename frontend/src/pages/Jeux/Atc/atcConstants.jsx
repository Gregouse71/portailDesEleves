import { T_AIRPORT, DEFAULT_SCREEN, planeName } from "./atcEngine";

export const RADAR_COLS = DEFAULT_SCREEN.width * 2; // 60 colonnes

// Couleurs distinctes pour chaque porte de sortie (S0..S7) et aéroport (A0..A1)
export const EXIT_COLORS = [
    "#ff595e", // 0 : Rouge
    "#ff924c", // 1 : Orange
    "#ffca3a", // 2 : Jaune
    "#8ac926", // 3 : Vert
    "#2ec4b6", // 4 : Turquoise
    "#4cc9f0", // 5 : Bleu ciel
    "#c77dff", // 6 : Violet
    "#ff70a6", // 7 : Rose
];

export const AIRPORT_COLORS = [
    "#a8dadc", // A0
    "#ffd166", // A1
];

export function getPlaneDestColor(pp) {
    if (pp.dest_type === T_AIRPORT) {
        return AIRPORT_COLORS[pp.dest_no % AIRPORT_COLORS.length];
    }
    return EXIT_COLORS[pp.dest_no % EXIT_COLORS.length];
}

// Pré-calcul statique des sorties, aéroports et balises par ligne pour éviter de reconstruire les Maps à chaque tick
export const EXITS_BY_ROW = (() => {
    const map = new Map();
    DEFAULT_SCREEN.exit.forEach((e, idx) => {
        if (!map.has(e.y)) map.set(e.y, []);
        map.get(e.y).push({ x: e.x, num: idx, color: EXIT_COLORS[idx % EXIT_COLORS.length] });
    });
    return map;
})();

export const AIRPORTS_BY_ROW = (() => {
    const map = new Map();
    DEFAULT_SCREEN.airport.forEach((a, idx) => {
        if (!map.has(a.y)) map.set(a.y, []);
        map.get(a.y).push({ x: a.x, num: idx, color: AIRPORT_COLORS[idx % AIRPORT_COLORS.length] });
    });
    return map;
})();

export const BEACONS_BY_ROW = (() => {
    const map = new Map();
    DEFAULT_SCREEN.beacon.forEach((beacon, idx) => {
        if (!map.has(beacon.y)) map.set(beacon.y, []);
        map.get(beacon.y).push({ x: beacon.x, num: idx });
    });
    return map;
})();

const b = (key, text = key, title) => ({ key, text, title });
const t = (text) => ({ text });

const COMPASS_ROWS = [
    [t(" "), b("a", "↖a", "315° NO"), t("  "), b("z", "↑z", "0° N"), t("  "), b("e", "↗e", "45° NE")],
    [t(" "), b("q", "←q", "270° O"), t("  "), t("• "), t("  "), b("d", "→d", "90° E")],
    [t(" "), b("w", "↙w", "225° SO"), t("  "), b("x", "↓x", "180° S"), t("  "), b("c", "↘c", "135° SE")],
];

const DIGITS_0_9 = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => b(k));
const DIGITS_1_9 = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => b(k));

export function getInputActionLines(inputState, gameState, gameStarted, sp = DEFAULT_SCREEN) {
    if (!gameStarted || gameState.loser_msg) {
        return [];
    }

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
                ...COMPASS_ROWS,
                [b("l"), t("/"), b("r"), t(" 45°  "), b("L"), t("/"), b("R"), t(" 90°")],
                [b("v", "v vers"), t("   "), b("Backspace", "⌫ retour")],
            ];
        case 3:
            return [
                DIGITS_0_9,
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
                ...COMPASS_ROWS,
                [b("Enter", "Entrée : valider")],
                [b("a", "a bal."), t("   "), b("Backspace", "⌫ retour")],
            ];
        case 7:
            return [
                [b("Enter", "Entrée : valider")],
                [b("Backspace", "⌫ retour")],
            ];
        case 8:
            return [DIGITS_0_9, [b("Backspace", "⌫ retour")]];
        case 9:
            return [[b("b", "b : balise")], [b("Backspace", "⌫ retour")]];
        case 10:
            return [DIGITS_1_9, [t("(x1000ft) "), b("Backspace", "⌫ retour")]];
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

export const CONSIGNES = [
    {
        titre: <>Avions</>,
        texte: (
            <>
                <code>A7</code> (majuscule = hélice, avance 1 tour sur 2), <code>b7</code> (minuscule = jet, avance à chaque tour). Le chiffre indique l&apos;altitude (en milliers de pieds).
            </>
        ),
    },
    {
        titre: (
            <>
                Sorties (<code>0</code>–<code>7</code>)
            </>
        ),
        texte: (
            <>
                les avions entrent à <strong>altitude 7</strong> et doivent sortir par leur porte de destination à <strong>altitude 9</strong>.
            </>
        ),
    },
    {
        titre: (
            <>
                Aéroports (<code>^0</code>, <code>&gt;1</code>)
            </>
        ),
        texte: (
            <>
                décollage en donnant une altitude &gt; 0. Atterrissage à <strong>altitude 0</strong> dans la direction de la piste (<code>^</code> = Nord, <code>&gt;</code> = Est).
            </>
        ),
    },
    {
        titre: (
            <>
                Balises (<code>*0</code>, <code>*1</code>)
            </>
        ),
        texte: <>points de repère pour différer un ordre.</>,
    },
    {
        titre: <>Collision</>,
        texte: <>fin de partie si deux avions sont simultanément à distance ≤ 1 en X, Y et altitude.</>,
    },
];
