/*!
 * @license BSD-3-Clause
 * Copyright (c) 1990, 1993
 *	The Regents of the University of California.  All rights reserved.
 *
 * This code is derived from software contributed to Berkeley by
 * Ed James.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * Copyright (c) 1987 by Ed James, UC Berkeley.  All rights reserved.
 *
 * Copy permission is hereby granted provided that this notice is
 * retained on all partial or complete copies.
 *
 * For more info on this and all of my stuff, mail edjames@berkeley.edu.
 */

export const AUTHOR_STR = "ATC - by Ed James";
export const LOWFUEL = 15;
export const MAXDIR = 8;
export const INPUT_LINES = 3;
export const PLANE_COLS = 20;

export const D_LEFT = 1;
export const D_RIGHT = 2;
export const D_UP = 3;
export const D_DOWN = 4;

export const T_NODEST = 0;
export const T_BEACON = 1;
export const T_EXIT = 2;
export const T_AIRPORT = 3;

export const S_NONE = 0;
export const S_GONE = 1;
export const S_MARKED = 2;
export const S_UNMARKED = 3;
export const S_IGNORED = 4;

export const DISPLACEMENT = [
    { dx: 0, dy: -1 },  // 0: w (N, 0°)
    { dx: 1, dy: -1 },  // 1: e (NE, 45°)
    { dx: 1, dy: 0 },   // 2: d (E, 90°)
    { dx: 1, dy: 1 },   // 3: c (SE, 135°)
    { dx: 0, dy: 1 },   // 4: x (S, 180°)
    { dx: -1, dy: 1 },  // 5: z (SW, 225°)
    { dx: -1, dy: 0 },  // 6: a (W, 270°)
    { dx: -1, dy: -1 }, // 7: q (NW, 315°)
];

// Carte "default" de atc/games/default
export const DEFAULT_SCREEN = {
    width: 30,
    height: 21,
    update_secs: 5,
    newplane_time: 10,
    exit: [
        { x: 12, y: 0, dir: 4 },  // ( 12  0 x )
        { x: 29, y: 0, dir: 5 },  // ( 29  0 z )
        { x: 29, y: 7, dir: 6 },  // ( 29  7 a )
        { x: 29, y: 17, dir: 6 }, // ( 29 17 a )
        { x: 9, y: 20, dir: 1 },  // (  9 20 e )
        { x: 0, y: 13, dir: 2 },  // (  0 13 d )
        { x: 0, y: 7, dir: 2 },   // (  0  7 d )
        { x: 0, y: 0, dir: 3 },   // (  0  0 c )
    ],
    beacon: [
        { x: 12, y: 7 },
        { x: 12, y: 17 },
    ],
    airport: [
        { x: 20, y: 15, dir: 0 }, // ( 20 15 w )
        { x: 20, y: 18, dir: 2 }, // ( 20 18 d )
    ],
    line: [
        { p1: { x: 1, y: 1 }, p2: { x: 6, y: 6 } },
        { p1: { x: 12, y: 1 }, p2: { x: 12, y: 6 } },
        { p1: { x: 13, y: 7 }, p2: { x: 28, y: 7 } },
        { p1: { x: 28, y: 1 }, p2: { x: 13, y: 16 } },
        { p1: { x: 1, y: 13 }, p2: { x: 11, y: 13 } },
        { p1: { x: 12, y: 8 }, p2: { x: 12, y: 16 } },
        { p1: { x: 11, y: 18 }, p2: { x: 10, y: 19 } },
        { p1: { x: 13, y: 17 }, p2: { x: 28, y: 17 } },
        { p1: { x: 1, y: 7 }, p2: { x: 11, y: 7 } },
    ],
};

/**
 * PRNG de type Mulberry 32 bits
 * Le pseudo-aléatoire permet la vérification de la partie a
 */
function mulberry32(seed) {
    let t = seed >>> 0; // force seed into uint32

    const next = () => {
        t = (t + 0x6D2B79F5) >>> 0; // advance internal state (uint32 wrap)

        // Mix bits using xor-shifts and 32-bit multiplication.
        let x = Math.imul(t ^ (t >>> 15), t | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);

        // Convert uint32 to float in [0, 1).
        return ((x ^ (x >>> 14)) >>> 0) / 2**32;
    };

    return next;
}
let RNG = mulberry32(4); // https://xkcd.com/221/

export function sgn(x) {
    return x < 0 ? -1 : x > 0 ? 1 : 0;
}

export function dirFromDxDy(dx, dy) {
    return Math.floor((Math.atan2(dy, dx) * MAXDIR) / (2 * Math.PI) + 2.5 + MAXDIR) % MAXDIR;
}

export function dirNo(ch) {
    switch (ch) {
        case "z": return 0;
        case "e": return 1;
        case "d": return 2;
        case "c": return 3;
        case "x": return 4;
        case "w": return 5;
        case "q": return 6;
        case "a": return 7;
        default: return -1;
    }
}

export function dirDeg(d) {
    return d >= 0 && d < 8 ? d * 45 : -1;
}

export function planeName(p) {
    // Dans update.c : plane_type == 0 -> 'A' + plane_no (prop), sinon 'a' + plane_no (jet)
    return String.fromCharCode((p.plane_type === 0 ? 65 : 97) + p.plane_no);
}

export function planeNumber(l) {
    if (l >= "a" && l <= "z") return l.charCodeAt(0) - 97;
    if (l >= "A" && l <= "Z") return l.charCodeAt(0) - 65;
    return -1;
}

export function tooClose(p1, p2, dist) {
    return (
        Math.abs(p1.altitude - p2.altitude) <= dist &&
        Math.abs(p1.xpos - p2.xpos) <= dist &&
        Math.abs(p1.ypos - p2.ypos) <= dist
    );
}

export function formatCommand(pp) {
    const fuelChar = pp.fuel < LOWFUEL ? "*" : " ";
    const destChar = pp.dest_type === T_AIRPORT ? "A" : "E";
    const prefix = `${planeName(pp)}${pp.altitude}${fuelChar}${destChar}${pp.dest_no}: `;

    let comm = "";
    if (pp.altitude === 0) {
        comm += `Holding @ A${pp.orig_no}`;
    } else if (pp.new_dir >= MAXDIR || pp.new_dir < 0) {
        comm += "Circle";
    } else if (pp.new_dir !== pp.dir) {
        comm += `${dirDeg(pp.new_dir)}`;
    }

    if (pp.delayd) {
        comm += ` @ B${pp.delayd_no}`;
    }

    if (comm === "" && (pp.status === S_UNMARKED || pp.status === S_IGNORED)) {
        comm = "---------";
    }

    return prefix + comm;
}

function insertSortedByPlaneNo(list, plane) {
    const next = [...list, plane];
    next.sort((a, b) => a.plane_no - b.plane_no);
    return next;
}

export function nextPlaneNo(air, ground, lastPlane) {
    let cur = lastPlane;
    const startPlane = lastPlane;
    do {
        let found = false;
        cur++;
        if (cur >= 26) cur = 0;
        if (air.some((p) => p.plane_no === cur) || ground.some((p) => p.plane_no === cur)) {
            found = true;
        }
        if (!found) return cur;
    } while (cur !== startPlane);
    return -1;
}

export function addPlane(state, sp = DEFAULT_SCREEN) {
    const air = state.air.map((p) => ({ ...p }));
    const ground = state.ground.map((p) => ({ ...p }));

    const p = {
        status: S_MARKED,
        plane_no: 0,
        plane_type: Math.floor(RNG() * 2),
        orig_no: 0,
        orig_type: T_NODEST,
        dest_no: 0,
        dest_type: T_NODEST,
        altitude: 0,
        new_altitude: 0,
        dir: 0,
        new_dir: 0,
        fuel: sp.width + sp.height,
        xpos: 0,
        ypos: 0,
        delayd: false,
        delayd_no: 0,
    };

    const numStarts = sp.exit.length + sp.airport.length;
    const rnd = Math.floor(RNG() * numStarts);

    if (rnd < sp.exit.length) {
        p.dest_type = T_EXIT;
        p.dest_no = rnd;
    } else {
        p.dest_type = T_AIRPORT;
        p.dest_no = rnd - sp.exit.length;
    }

    let placed = false;
    for (let i = 0; i < numStarts; i++) {
        let rnd2 = Math.floor(RNG() * numStarts);
        while (rnd2 === rnd) {
            rnd2 = Math.floor(RNG() * numStarts);
        }
        if (rnd2 < sp.exit.length) {
            p.orig_type = T_EXIT;
            p.orig_no = rnd2;
            p.xpos = sp.exit[rnd2].x;
            p.ypos = sp.exit[rnd2].y;
            p.new_dir = p.dir = sp.exit[rnd2].dir;
            p.altitude = p.new_altitude = 7;
            const close = air.some((p1) => tooClose(p1, p, 4));
            if (close) continue;
        } else {
            p.orig_type = T_AIRPORT;
            p.orig_no = rnd2 - sp.exit.length;
            p.xpos = sp.airport[p.orig_no].x;
            p.ypos = sp.airport[p.orig_no].y;
            p.new_dir = p.dir = sp.airport[p.orig_no].dir;
            p.altitude = p.new_altitude = 0;
        }
        placed = true;
        break;
    }

    if (!placed) return state;

    const pnum = nextPlaneNo(air, ground, state.last_plane);
    if (pnum < 0) return state;
    p.plane_no = pnum;

    if (p.orig_type === T_AIRPORT) {
        return {
            ...state,
            last_plane: pnum,
            ground: insertSortedByPlaneNo(ground, p),
        };
    }
    return {
        ...state,
        last_plane: pnum,
        air: insertSortedByPlaneNo(air, p),
    };
}

export function createInitialGame(sp = DEFAULT_SCREEN) {
    RNG = mulberry32(4);
    const base = {
        clck: 0,
        safe_planes: 0,
        last_plane: -1,
        air: [],
        ground: [],
        loser_msg: null,
    };
    return addPlane(base, sp);
}

/**
 * Exécute un tour d'horloge `update()` exactement comme dans `atc/update.c`.
 */
export function stepUpdate(state, sp = DEFAULT_SCREEN) {
    if (state.loser_msg) return state;

    const clck = state.clck + 1;
    let air = state.air.map((p) => ({ ...p }));
    const ground = [];
    let safe_planes = state.safe_planes;

    // 1. Faire décoller les avions au sol dont new_altitude > 0
    for (const pp of state.ground) {
        if (pp.new_altitude > 0) {
            air = insertSortedByPlaneNo(air, { ...pp });
        } else {
            ground.push({ ...pp });
        }
    }

    // 2. Changement d'altitude et déplacement des avions en vol
    for (const pp of air) {
        // Les avions de type 0 (prop) ne bougent qu'un tour sur deux (tours pairs)
        if (pp.plane_type === 0 && (clck & 1) === 1) {
            continue;
        }

        pp.fuel -= 1;
        if (pp.fuel < 0) {
            return {
                ...state,
                clck,
                air,
                ground,
                loser_msg: `Plane '${planeName(pp)}' ran out of fuel.`,
            };
        }

        pp.altitude += sgn(pp.new_altitude - pp.altitude);

        if (!pp.delayd) {
            let dir_diff = pp.new_dir - pp.dir;
            if (pp.new_dir >= 0 && pp.new_dir < MAXDIR) {
                if (dir_diff > MAXDIR / 2) dir_diff -= MAXDIR;
                else if (dir_diff < -(MAXDIR / 2)) dir_diff += MAXDIR;
            }
            if (dir_diff > 2) dir_diff = 2;
            else if (dir_diff < -2) dir_diff = -2;
            pp.dir += dir_diff;
            if (pp.dir >= MAXDIR) pp.dir -= MAXDIR;
            else if (pp.dir < 0) pp.dir += MAXDIR;
        }

        pp.xpos += DISPLACEMENT[pp.dir].dx;
        pp.ypos += DISPLACEMENT[pp.dir].dy;

        if (
            pp.delayd &&
            pp.xpos === sp.beacon[pp.delayd_no].x &&
            pp.ypos === sp.beacon[pp.delayd_no].y
        ) {
            pp.delayd = false;
            if (pp.status === S_UNMARKED) {
                pp.status = S_MARKED;
            }
        }

        if (pp.dest_type === T_AIRPORT) {
            if (
                pp.xpos === sp.airport[pp.dest_no].x &&
                pp.ypos === sp.airport[pp.dest_no].y &&
                pp.altitude === 0
            ) {
                if (pp.dir !== sp.airport[pp.dest_no].dir) {
                    return {
                        ...state,
                        clck,
                        air,
                        ground,
                        loser_msg: `Plane '${planeName(pp)}' landed in the wrong direction.`,
                    };
                }
                pp.status = S_GONE;
                continue;
            }
        } else if (pp.dest_type === T_EXIT) {
            if (
                pp.xpos === sp.exit[pp.dest_no].x &&
                pp.ypos === sp.exit[pp.dest_no].y
            ) {
                if (pp.altitude !== 9) {
                    return {
                        ...state,
                        clck,
                        air,
                        ground,
                        loser_msg: `Plane '${planeName(pp)}' exited at the wrong altitude.`,
                    };
                }
                pp.status = S_GONE;
                continue;
            }
        }

        if (pp.altitude > 9) {
            return {
                ...state,
                clck,
                air,
                ground,
                loser_msg: `Plane '${planeName(pp)}' exceded flight ceiling.`,
            };
        }

        if (pp.altitude <= 0) {
            for (let i = 0; i < sp.airport.length; i++) {
                if (pp.xpos === sp.airport[i].x && pp.ypos === sp.airport[i].y) {
                    const msg =
                        pp.dest_type === T_AIRPORT
                            ? `Plane '${planeName(pp)}' landed at the wrong airport.`
                            : `Plane '${planeName(pp)}' landed instead of exited.`;
                    return { ...state, clck, air, ground, loser_msg: msg };
                }
            }
            return {
                ...state,
                clck,
                air,
                ground,
                loser_msg: `Plane '${planeName(pp)}' crashed on the ground.`,
            };
        }

        if (
            pp.xpos < 1 ||
            pp.xpos >= sp.width - 1 ||
            pp.ypos < 1 ||
            pp.ypos >= sp.height - 1
        ) {
            for (let i = 0; i < sp.exit.length; i++) {
                if (pp.xpos === sp.exit[i].x && pp.ypos === sp.exit[i].y) {
                    const msg =
                        pp.dest_type === T_EXIT
                            ? `Plane '${planeName(pp)}' exited via the wrong exit.`
                            : `Plane '${planeName(pp)}' exited instead of landed.`;
                    return { ...state, clck, air, ground, loser_msg: msg };
                }
            }
            return {
                ...state,
                clck,
                air,
                ground,
                loser_msg: `Plane '${planeName(pp)}' illegally left the flight arena.`,
            };
        }
    }

    // 3. Retirer les avions arrivés à bon port (S_GONE)
    const nextAir = [];
    for (const pp of air) {
        if (pp.status === S_GONE) {
            safe_planes += 1;
        } else {
            nextAir.push(pp);
        }
    }
    air = nextAir;

    // 4. Vérifier les collisions entre avions en vol
    for (let i = 0; i < air.length; i++) {
        for (let j = i + 1; j < air.length; j++) {
            if (tooClose(air[i], air[j], 1)) {
                return {
                    ...state,
                    clck,
                    safe_planes,
                    air,
                    ground,
                    loser_msg: `Plane '${planeName(air[i])}' collided with plane '${planeName(air[j])}'.`,
                };
            }
        }
    }

    let nextState = {
        ...state,
        clck,
        safe_planes,
        air,
        ground,
        loser_msg: null,
    };

    // 5. Apparition aléatoire d'un nouvel avion
    if (Math.floor(RNG() * sp.newplane_time) === 0) {
        nextState = addPlane(nextState, sp);
    }

    return nextState;
}

/**
 * Construit la grille de base du radar (`cleanradar` dans `graphics.c`),
 * de dimensions `height` lignes × `width * 2` colonnes.
 */
export function buildCleanRadarGrid(sp = DEFAULT_SCREEN) {
    const cols = sp.width * 2;
    const rows = sp.height;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(" "));

    // Fond de points '.'
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < sp.width - 1; x++) {
            grid[y][x * 2] = ".";
        }
    }

    // Lignes '+'
    for (const ln of sp.line) {
        let x = ln.p1.x;
        let y = ln.p1.y;
        const dx = sgn(ln.p2.x - x);
        const dy = sgn(ln.p2.y - y);
        for (;;) {
            grid[y][x * 2] = "+";
            grid[y][x * 2 + 1] = " ";
            if (x === ln.p2.x && y === ln.p2.y) break;
            x += dx;
            y += dy;
        }
    }

    // Bordures horizontales '-'
    for (let x = 0; x < sp.width - 1; x++) {
        grid[0][x * 2] = "-";
        grid[0][x * 2 + 1] = "-";
        grid[rows - 1][x * 2] = "-";
        grid[rows - 1][x * 2 + 1] = "-";
    }
    grid[0][(sp.width - 1) * 2] = "-";
    grid[rows - 1][(sp.width - 1) * 2] = "-";

    // Bordures verticales '|'
    for (let y = 1; y < rows - 1; y++) {
        grid[y][0] = "|";
        grid[y][(sp.width - 1) * 2] = "|";
    }

    // Balises '*0', '*1'
    for (let i = 0; i < sp.beacon.length; i++) {
        const b = sp.beacon[i];
        grid[b.y][b.x * 2] = "*";
        grid[b.y][b.x * 2 + 1] = String(i);
    }

    // Portes de sortie '0'..'7'
    for (let i = 0; i < sp.exit.length; i++) {
        const e = sp.exit[i];
        grid[e.y][e.x * 2] = String(i);
    }

    // Aéroports '^0', '>1'
    const airstr = "^?>?v?<?";
    for (let i = 0; i < sp.airport.length; i++) {
        const a = sp.airport[i];
        grid[a.y][a.x * 2] = airstr[a.dir];
        grid[a.y][a.x * 2 + 1] = String(i);
    }

    return grid;
}

// --- Automate d'entrée caractère par caractère (port fidèle de atc/input.c) ---

const ALPHATOKEN = 256;
const NUMTOKEN = 257;
const RETTOKEN = "\n";
const HELPTOKEN = "?";

const STATES = [
    // state 0 : début de la commande : choix de l'avion ou aller au tick suivant
    [
        { token: ALPHATOKEN, to_state: 1, str: "%c:", func: "setplane" },
        { token: RETTOKEN, to_state: -1, str: "", func: null },
        { token: HELPTOKEN, to_state: 12, str: " choisir un avion : [a-z]", func: null },
    ],
    // state 1 : choix de l'action à réaliser
    [
        { token: "t", to_state: 2, str: " turn", func: "turn" },
        { token: "a", to_state: 3, str: " altitude:", func: null },
        { token: "c", to_state: 4, str: " circle", func: "circle" },
        { token: "m", to_state: 7, str: " mark", func: "mark" },
        { token: "u", to_state: 7, str: " unmark", func: "unmark" },
        { token: "i", to_state: 7, str: " ignore", func: "ignore" },
        { token: HELPTOKEN, to_state: 12, str: " tacmui", func: null },
    ],
    // state 2 : action turn : direction
    [
        { token: "l", to_state: 6, str: " left", func: "left" },
        { token: "r", to_state: 6, str: " right", func: "right" },
        { token: "L", to_state: 4, str: " left 90", func: "Left" },
        { token: "R", to_state: 4, str: " right 90", func: "Right" },
        { token: "t", to_state: 11, str: " towards", func: null },
        { token: "z", to_state: 4, str: " to 0", func: "to_dir" },
        { token: "e", to_state: 4, str: " to 45", func: "to_dir" },
        { token: "d", to_state: 4, str: " to 90", func: "to_dir" },
        { token: "c", to_state: 4, str: " to 135", func: "to_dir" },
        { token: "x", to_state: 4, str: " to 180", func: "to_dir" },
        { token: "w", to_state: 4, str: " to 225", func: "to_dir" },
        { token: "q", to_state: 4, str: " to 270", func: "to_dir" },
        { token: "a", to_state: 4, str: " to 315", func: "to_dir" },
        { token: HELPTOKEN, to_state: 12, str: " lrLRt<dir>", func: null },
    ],
    // state 3 : action altitude : choix de l'altitude
    [
        { token: "+", to_state: 10, str: " climb", func: "climb" },
        { token: "c", to_state: 10, str: " climb", func: "climb" },
        { token: "-", to_state: 10, str: " descend", func: "descend" },
        { token: "d", to_state: 10, str: " descend", func: "descend" },
        { token: NUMTOKEN, to_state: 7, str: " %c000 feet", func: "setalt" },
        { token: HELPTOKEN, to_state: 12, str: " +-cd[0-9]", func: null },
    ],
    // state 4 : action turn / circle : lieu d'éxecution de l'action
    [
        { token: "@", to_state: 9, str: " at", func: null },
        { token: "a", to_state: 9, str: " at", func: null },
        { token: RETTOKEN, to_state: -1, str: "", func: null },
        { token: HELPTOKEN, to_state: 12, str: " @a<ret>", func: null },
    ],
    // state 5 : éxecution à une balise : choix de la balise
    [
        { token: NUMTOKEN, to_state: 7, str: "%c", func: "delayb" },
        { token: HELPTOKEN, to_state: 12, str: " [0-9]", func: null },
    ],
    // state 6 : turn left/right : choix de la direction ou du lieu d'execution
    [
        { token: "@", to_state: 9, str: " at", func: null },
        { token: "a", to_state: 9, str: " at", func: null },
        { token: "z", to_state: 4, str: " 0", func: "rel_dir" },
        { token: "e", to_state: 4, str: " 45", func: "rel_dir" },
        { token: "d", to_state: 4, str: " 90", func: "rel_dir" },
        { token: "c", to_state: 4, str: " 135", func: "rel_dir" },
        { token: "x", to_state: 4, str: " 180", func: "rel_dir" },
        { token: "w", to_state: 4, str: " 225", func: "rel_dir" },
        { token: "q", to_state: 4, str: " 270", func: "rel_dir" },
        { token: "a", to_state: 4, str: " 315", func: "rel_dir" },
        { token: RETTOKEN, to_state: -1, str: "", func: null },
        { token: HELPTOKEN, to_state: 12, str: " @a<dir><ret>", func: null },
    ],
    // state 7 : fin de la commande
    [
        { token: RETTOKEN, to_state: -1, str: "", func: null },
        { token: HELPTOKEN, to_state: 12, str: " <ret>", func: null },
    ],
    // state 8
    [
        { token: NUMTOKEN, to_state: 4, str: "%c", func: "benum" },
        { token: HELPTOKEN, to_state: 12, str: " [0-9]", func: null },
    ],
    // state 9 : lieu d'éxecution de l'action : à une balise
    [
        { token: "b", to_state: 5, str: " beacon #", func: null },
        { token: "*", to_state: 5, str: " beacon #", func: null },
        { token: HELPTOKEN, to_state: 12, str: " b*", func: null },
    ],
    // state 10 : altitude à gagner / perdre
    [
        { token: NUMTOKEN, to_state: 7, str: " %c000 ft", func: "setrelalt" },
        { token: HELPTOKEN, to_state: 12, str: " [0-9]", func: null },
    ],
    // state 11 : turn : direction à prendre
    [
        { token: "b", to_state: 8, str: " beacon #", func: "beacon" },
        { token: "*", to_state: 8, str: " beacon #", func: "beacon" },
        { token: "e", to_state: 8, str: " exit #", func: "ex_it" },
        { token: "a", to_state: 8, str: " airport #", func: "airport" },
        { token: HELPTOKEN, to_state: 12, str: " b*ea", func: null },
    ],
    // state 12 : aide : il faut revenir en arrière
    [
        { token: -1, to_state: -1, str: "", func: null },
    ],
];

export function createInitialInputState() {
    return {
        stack: [{ state: 0, rule: -1, ch: null, pos: 0, str: "" }],
        level: 0,
        errorLine1: "",
        errorLine2: "",
    };
}

export function getInputPromptText(inputState) {
    return inputState.stack
        .slice(0, inputState.level)
        .map((item) => item.str)
        .join("");
}

function findPlaneInState(gameState, planeNo) {
    return (
        gameState.air.find((p) => p.plane_no === planeNo) ||
        gameState.ground.find((p) => p.plane_no === planeNo) ||
        null
    );
}

/**
 * Traite une touche clavier dans l'automate d'entrée (`input.c`).
 * Renvoie `{ inputState, gameState, forceUpdate }`.
 */
export function handleInputKey(key, inputState, gameState, sp = DEFAULT_SCREEN) {
    if (gameState.loser_msg) {
        return { inputState, gameState, forceUpdate: false };
    }

    // Backspace -> pop()
    if (key === "Backspace") {
        if (inputState.level === 0) {
            return { inputState, gameState, forceUpdate: false };
        }
        const newLevel = inputState.level - 1;
        const nextStack = inputState.stack.slice(0, newLevel + 1);
        nextStack[newLevel] = {
            ...nextStack[newLevel],
            str: "",
            rule: -1,
            ch: null,
        };
        return {
            inputState: {
                stack: nextStack,
                level: newLevel,
                errorLine1: "",
                errorLine2: "",
            },
            gameState,
            forceUpdate: false,
        };
    }

    const tval = key === "Enter" ? "\n" : key;
    if (tval.length !== 1) {
        return { inputState, gameState, forceUpdate: false };
    }

    let c = tval;
    if (tval >= "0" && tval <= "9") c = NUMTOKEN;
    else if ((tval >= "a" && tval <= "z") || (tval >= "A" && tval <= "Z")) c = ALPHATOKEN;

    const currentTop = inputState.stack[inputState.level];
    const rules = STATES[currentTop.state] || [];
    const ruleIdx = rules.findIndex((r) => r.token === c || r.token === tval);

    if (ruleIdx === -1) {
        return { inputState, gameState, forceUpdate: false };
    }

    const rule = rules[ruleIdx];
    const formattedStr = rule.str.replace("%c", tval);
    const chVal = c === ALPHATOKEN || c === NUMTOKEN ? tval : c;
    const newPos = currentTop.pos + formattedStr.length;

    const nextStack = inputState.stack.slice(0, inputState.level + 1);
    nextStack[inputState.level] = {
        ...currentTop,
        str: formattedStr,
        rule: ruleIdx,
        ch: chVal,
    };

    const nextLevel = inputState.level + 1;
    nextStack[nextLevel] = {
        state: rule.to_state,
        rule: -1,
        ch: null,
        pos: newPos,
        str: "",
    };

    // Si on n'a pas encore atteint l'état final (-1), on met simplement à jour la ligne de saisie
    if (rule.to_state !== -1) {
        return {
            inputState: {
                stack: nextStack,
                level: nextLevel,
                errorLine1: inputState.level === 0 ? "" : inputState.errorLine1,
                errorLine2: inputState.level === 0 ? "" : inputState.errorLine2,
            },
            gameState,
            forceUpdate: false,
        };
    }

    // État -1 atteint (touche Entrée validée)
    if (nextLevel === 1) {
        // Entrée sur ligne vide -> force immédiatement le prochain update()
        return {
            inputState: createInitialInputState(),
            gameState,
            forceUpdate: true,
        };
    }

    // Exécution et validation sémantique de la pile de règles (comme dans getcommand() de input.c)
    let p = null;
    let dir = 0;
    let dest_type = T_NODEST;
    let dest_no = 0;

    const runFunc = (funcName, ch) => {
        switch (funcName) {
            case "setplane": {
                const pp = findPlaneInState(gameState, planeNumber(ch));
                if (!pp) return "Unknown Plane";
                p = { ...pp, delayd: false };
                return null;
            }
            case "turn":
                if (p.altitude === 0) return "Planes at airports may not change direction";
                return null;
            case "circle":
                if (p.altitude === 0) return "Planes cannot circle on the ground";
                p.new_dir = MAXDIR;
                return null;
            case "left":
                dir = D_LEFT;
                p.new_dir = p.dir - 1;
                if (p.new_dir < 0) p.new_dir += MAXDIR;
                return null;
            case "right":
                dir = D_RIGHT;
                p.new_dir = p.dir + 1;
                if (p.new_dir >= MAXDIR) p.new_dir -= MAXDIR;
                return null;
            case "Left":
                p.new_dir = p.dir - 2;
                if (p.new_dir < 0) p.new_dir += MAXDIR;
                return null;
            case "Right":
                p.new_dir = p.dir + 2;
                if (p.new_dir >= MAXDIR) p.new_dir -= MAXDIR;
                return null;
            case "delayb": {
                const bnum = ch.charCodeAt(0) - 48;
                if (bnum >= sp.beacon.length) return "Unknown beacon";
                const xdiff = sgn(sp.beacon[bnum].x - p.xpos);
                const ydiff = sgn(sp.beacon[bnum].y - p.ypos);
                if (xdiff !== DISPLACEMENT[p.dir].dx || ydiff !== DISPLACEMENT[p.dir].dy) {
                    return "Beacon is not in flight path";
                }
                p.delayd = true;
                p.delayd_no = bnum;
                if (dest_type !== T_NODEST) {
                    let dx = 0;
                    let dy = 0;
                    if (dest_type === T_BEACON) {
                        dx = sp.beacon[dest_no].x - sp.beacon[bnum].x;
                        dy = sp.beacon[dest_no].y - sp.beacon[bnum].y;
                    } else if (dest_type === T_EXIT) {
                        dx = sp.exit[dest_no].x - sp.beacon[bnum].x;
                        dy = sp.exit[dest_no].y - sp.beacon[bnum].y;
                    } else if (dest_type === T_AIRPORT) {
                        dx = sp.airport[dest_no].x - sp.beacon[bnum].x;
                        dy = sp.airport[dest_no].y - sp.beacon[bnum].y;
                    }
                    if (dx === 0 && dy === 0) return "Would already be there";
                    p.new_dir = dirFromDxDy(dx, dy);
                    if (p.new_dir === p.dir) return "Already going in that direction";
                }
                return null;
            }
            case "beacon":
                dest_type = T_BEACON;
                return null;
            case "ex_it":
                dest_type = T_EXIT;
                return null;
            case "airport":
                dest_type = T_AIRPORT;
                return null;
            case "climb":
                dir = D_UP;
                return null;
            case "descend":
                dir = D_DOWN;
                return null;
            case "setalt": {
                const alt = ch.charCodeAt(0) - 48;
                if (p.altitude === alt && p.new_altitude === p.altitude) {
                    return "Already at that altitude";
                }
                p.new_altitude = alt;
                return null;
            }
            case "setrelalt": {
                const delta = ch.charCodeAt(0) - 48;
                if (delta === 0) return "altitude not changed";
                if (dir === D_UP) p.new_altitude = p.altitude + delta;
                else if (dir === D_DOWN) p.new_altitude = p.altitude - delta;
                if (p.new_altitude < 0) return "Altitude would be too low";
                if (p.new_altitude > 9) return "Altitude would be too high";
                return null;
            }
            case "benum": {
                const num = ch.charCodeAt(0) - 48;
                dest_no = num;
                if (dest_type === T_BEACON) {
                    if (num >= sp.beacon.length) return "Unknown beacon";
                    p.new_dir = dirFromDxDy(
                        sp.beacon[num].x - p.xpos,
                        sp.beacon[num].y - p.ypos
                    );
                } else if (dest_type === T_EXIT) {
                    if (num >= sp.exit.length) return "Unknown exit";
                    p.new_dir = dirFromDxDy(
                        sp.exit[num].x - p.xpos,
                        sp.exit[num].y - p.ypos
                    );
                } else if (dest_type === T_AIRPORT) {
                    if (num >= sp.airport.length) return "Unknown airport";
                    p.new_dir = dirFromDxDy(
                        sp.airport[num].x - p.xpos,
                        sp.airport[num].y - p.ypos
                    );
                }
                return null;
            }
            case "to_dir":
                p.new_dir = dirNo(ch);
                return null;
            case "rel_dir": {
                const angle = dirNo(ch);
                if (dir === D_LEFT) {
                    p.new_dir = p.dir - angle;
                    if (p.new_dir < 0) p.new_dir += MAXDIR;
                } else if (dir === D_RIGHT) {
                    p.new_dir = p.dir + angle;
                    if (p.new_dir >= MAXDIR) p.new_dir -= MAXDIR;
                }
                return null;
            }
            case "mark":
                if (p.altitude === 0) return "Cannot mark planes on the ground";
                if (p.status === S_MARKED) return "Already marked";
                p.status = S_MARKED;
                return null;
            case "unmark":
                if (p.altitude === 0) return "Cannot unmark planes on the ground";
                if (p.status === S_UNMARKED) return "Already unmarked";
                p.status = S_UNMARKED;
                return null;
            case "ignore":
                if (p.altitude === 0) return "Cannot ignore planes on the ground";
                if (p.status === S_IGNORED) return "Already ignored";
                p.status = S_IGNORED;
                return null;
            default:
                return null;
        }
    };

    for (let i = 0; i < nextLevel; i++) {
        const item = nextStack[i];
        const r = STATES[item.state][item.rule];
        if (r && r.func) {
            const err = runFunc(r.func, item.ch);
            if (err) {
                const carets = " ".repeat(item.pos) + "^".repeat(Math.max(1, item.str.length));
                return {
                    inputState: {
                        ...createInitialInputState(),
                        errorLine1: carets,
                        errorLine2: err,
                    },
                    gameState,
                    forceUpdate: false,
                };
            }
        }
    }

    // Appliquer les modifications à l'avion dans air ou ground (comme dans input.c lignes 274-283)
    const updatePlaneInList = (list) =>
        list.map((pp) => {
            if (pp.plane_no !== p.plane_no) return pp;
            if (pp.new_altitude !== p.new_altitude) {
                return { ...pp, new_altitude: p.new_altitude };
            }
            if (pp.status !== p.status) {
                return { ...pp, status: p.status };
            }
            return {
                ...pp,
                new_dir: p.new_dir,
                delayd: p.delayd,
                delayd_no: p.delayd_no,
            };
        });

    return {
        inputState: createInitialInputState(),
        gameState: {
            ...gameState,
            air: updatePlaneInList(gameState.air),
            ground: updatePlaneInList(gameState.ground),
        },
        forceUpdate: false,
    };
}
