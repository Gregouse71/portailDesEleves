# /*-
#  * Copyright (c) 1990, 1993
#  *	The Regents of the University of California.  All rights reserved.
#  *
#  * This code is derived from software contributed to Berkeley by
#  * Ed James.
#  *
#  * Redistribution and use in source and binary forms, with or without
#  * modification, are permitted provided that the following conditions
#  * are met:
#  * 1. Redistributions of source code must retain the above copyright
#  *    notice, this list of conditions and the following disclaimer.
#  * 2. Redistributions in binary form must reproduce the above copyright
#  *    notice, this list of conditions and the following disclaimer in the
#  *    documentation and/or other materials provided with the distribution.
#  * 3. Neither the name of the University nor the names of its contributors
#  *    may be used to endorse or promote products derived from this software
#  *    without specific prior written permission.
#  *
#  * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
#  * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
#  * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
#  * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
#  * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
#  * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
#  * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
#  * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
#  * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
#  * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
#  * SUCH DAMAGE.
#  */

# /*
#  * Copyright (c) 1987 by Ed James, UC Berkeley.  All rights reserved.
#  *
#  * Copy permission is hereby granted provided that this notice is
#  * retained on all partial or complete copies.
#  *
#  * For more info on this and all of my stuff, mail edjames@berkeley.edu.
#  */

import math
import time

MAXDIR = 8

D_LEFT = 1
D_RIGHT = 2
D_UP = 3
D_DOWN = 4

T_NODEST = 0
T_BEACON = 1
T_EXIT = 2
T_AIRPORT = 3

S_NONE = 0
S_GONE = 1
S_MARKED = 2
S_UNMARKED = 3
S_IGNORED = 4

DISPLACEMENT = [
    {"dx": 0, "dy": -1},   # 0: z (N, 0°)
    {"dx": 1, "dy": -1},   # 1: e (NE, 45°)
    {"dx": 1, "dy": 0},    # 2: d (E, 90°)
    {"dx": 1, "dy": 1},    # 3: c (SE, 135°)
    {"dx": 0, "dy": 1},    # 4: x (S, 180°)
    {"dx": -1, "dy": 1},   # 5: w (SW, 225°)
    {"dx": -1, "dy": 0},   # 6: q (W, 270°)
    {"dx": -1, "dy": -1},  # 7: a (NW, 315°)
]

DEFAULT_SCREEN = {
    "width": 30,
    "height": 21,
    "update_secs": 5,
    "newplane_time": 10,
    "exit": [
        {"x": 12, "y": 0, "dir": 4},
        {"x": 29, "y": 0, "dir": 5},
        {"x": 29, "y": 7, "dir": 6},
        {"x": 29, "y": 17, "dir": 6},
        {"x": 9, "y": 20, "dir": 1},
        {"x": 0, "y": 13, "dir": 2},
        {"x": 0, "y": 7, "dir": 2},
        {"x": 0, "y": 0, "dir": 3},
    ],
    "beacon": [
        {"x": 12, "y": 7},
        {"x": 12, "y": 17},
    ],
    "airport": [
        {"x": 20, "y": 15, "dir": 0},
        {"x": 20, "y": 18, "dir": 2},
    ],
}


def _imul32(a: int, b: int) -> int:
    return ((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF


class Mulberry32:
    """Générateur pseudo-aléatoire Mulberry32 32 bits identique à celui de atcEngine.js."""

    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def __call__(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        u_n = self.state ^ (self.state >> 15)
        v_n = _imul32(u_n, self.state | 1)
        w_n = (v_n ^ (v_n + _imul32(v_n ^ (v_n >> 7), v_n | 61))) & 0xFFFFFFFF
        u32 = (w_n ^ (w_n >> 14)) & 0xFFFFFFFF
        return u32 / (2**32)


def sgn(x: int) -> int:
    return -1 if x < 0 else (1 if x > 0 else 0)


def dir_from_dxdy(dx: int, dy: int) -> int:
    return int(math.floor((math.atan2(dy, dx) * MAXDIR) / (2 * math.pi) + 2.5 + MAXDIR)) % MAXDIR


def dir_no(ch: str) -> int:
    mapping = {
        "z": 0,
        "e": 1,
        "d": 2,
        "c": 3,
        "x": 4,
        "w": 5,
        "q": 6,
        "a": 7,
    }
    return mapping.get(ch, -1)


def plane_name(p: dict) -> str:
    return chr((65 if p["plane_type"] == 0 else 97) + p["plane_no"])


def plane_number(l: str) -> int:
    if "a" <= l <= "z":
        return ord(l) - 97
    if "A" <= l <= "Z":
        return ord(l) - 65
    return -1


def too_close(p1: dict, p2: dict, dist: int) -> bool:
    return (
        abs(p1["altitude"] - p2["altitude"]) <= dist
        and abs(p1["xpos"] - p2["xpos"]) <= dist
        and abs(p1["ypos"] - p2["ypos"]) <= dist
    )


def _insert_sorted_by_plane_no(lst: list, plane: dict) -> list:
    nxt = [*lst, plane]
    nxt.sort(key=lambda p: p["plane_no"])
    return nxt


def _next_plane_no(air: list, ground: list, last_plane: int) -> int:
    cur = last_plane
    start_plane = last_plane
    while True:
        found = False
        cur += 1
        if cur >= 26:
            cur = 0
        if any(p["plane_no"] == cur for p in air) or any(p["plane_no"] == cur for p in ground):
            found = True
        if not found:
            return cur
        if cur == start_plane:
            break
    return -1


def add_plane(state: dict, rng: Mulberry32, sp: dict = DEFAULT_SCREEN) -> dict:
    air = [dict(p) for p in state["air"]]
    ground = [dict(p) for p in state["ground"]]

    p = {
        "status": S_MARKED,
        "plane_no": 0,
        "plane_type": int(math.floor(rng() * 2)),
        "orig_no": 0,
        "orig_type": T_NODEST,
        "dest_no": 0,
        "dest_type": T_NODEST,
        "altitude": 0,
        "new_altitude": 0,
        "dir": 0,
        "new_dir": 0,
        "fuel": sp["width"] + sp["height"],
        "xpos": 0,
        "ypos": 0,
        "delayd": False,
        "delayd_no": 0,
    }

    num_starts = len(sp["exit"]) + len(sp["airport"])
    rnd = int(math.floor(rng() * num_starts))

    if rnd < len(sp["exit"]):
        p["dest_type"] = T_EXIT
        p["dest_no"] = rnd
    else:
        p["dest_type"] = T_AIRPORT
        p["dest_no"] = rnd - len(sp["exit"])

    placed = False
    for _ in range(num_starts):
        rnd2 = int(math.floor(rng() * num_starts))
        while rnd2 == rnd:
            rnd2 = int(math.floor(rng() * num_starts))
        if rnd2 < len(sp["exit"]):
            p["orig_type"] = T_EXIT
            p["orig_no"] = rnd2
            p["xpos"] = sp["exit"][rnd2]["x"]
            p["ypos"] = sp["exit"][rnd2]["y"]
            p["new_dir"] = p["dir"] = sp["exit"][rnd2]["dir"]
            p["altitude"] = p["new_altitude"] = 7
            if any(too_close(p1, p, 4) for p1 in air):
                continue
        else:
            p["orig_type"] = T_AIRPORT
            p["orig_no"] = rnd2 - len(sp["exit"])
            p["xpos"] = sp["airport"][p["orig_no"]]["x"]
            p["ypos"] = sp["airport"][p["orig_no"]]["y"]
            p["new_dir"] = p["dir"] = sp["airport"][p["orig_no"]]["dir"]
            p["altitude"] = p["new_altitude"] = 0
        placed = True
        break

    if not placed:
        return state

    pnum = _next_plane_no(air, ground, state["last_plane"])
    if pnum < 0:
        return state
    p["plane_no"] = pnum

    if p["orig_type"] == T_AIRPORT:
        return {
            **state,
            "last_plane": pnum,
            "ground": _insert_sorted_by_plane_no(ground, p),
        }
    return {
        **state,
        "last_plane": pnum,
        "air": _insert_sorted_by_plane_no(air, p),
    }


def step_update(state: dict, rng: Mulberry32, sp: dict = DEFAULT_SCREEN) -> dict:
    if state.get("loser_msg"):
        return state

    clck = state["clck"] + 1
    air = [dict(p) for p in state["air"]]
    ground = []
    safe_planes = state["safe_planes"]

    for pp in state["ground"]:
        if pp["new_altitude"] > 0:
            air = _insert_sorted_by_plane_no(air, dict(pp))
        else:
            ground.append(dict(pp))

    for pp in air:
        if pp["plane_type"] == 0 and (clck & 1) == 1:
            continue

        pp["fuel"] -= 1
        if pp["fuel"] < 0:
            return {
                **state,
                "clck": clck,
                "air": air,
                "ground": ground,
                "loser_msg": f"L'avion '{plane_name(pp)}' est à court de carburant.",
            }

        pp["altitude"] += sgn(pp["new_altitude"] - pp["altitude"])

        if not pp["delayd"]:
            dir_diff = pp["new_dir"] - pp["dir"]
            if 0 <= pp["new_dir"] < MAXDIR:
                if dir_diff > MAXDIR / 2:
                    dir_diff -= MAXDIR
                elif dir_diff < -(MAXDIR / 2):
                    dir_diff += MAXDIR
            if dir_diff > 2:
                dir_diff = 2
            elif dir_diff < -2:
                dir_diff = -2
            pp["dir"] += dir_diff
            if pp["dir"] >= MAXDIR:
                pp["dir"] -= MAXDIR
            elif pp["dir"] < 0:
                pp["dir"] += MAXDIR

        pp["xpos"] += DISPLACEMENT[pp["dir"]]["dx"]
        pp["ypos"] += DISPLACEMENT[pp["dir"]]["dy"]

        if (
            pp["delayd"]
            and pp["xpos"] == sp["beacon"][pp["delayd_no"]]["x"]
            and pp["ypos"] == sp["beacon"][pp["delayd_no"]]["y"]
        ):
            pp["delayd"] = False
            if pp["status"] == S_UNMARKED:
                pp["status"] = S_MARKED

        if pp["dest_type"] == T_AIRPORT:
            if (
                pp["xpos"] == sp["airport"][pp["dest_no"]]["x"]
                and pp["ypos"] == sp["airport"][pp["dest_no"]]["y"]
                and pp["altitude"] == 0
            ):
                if pp["dir"] != sp["airport"][pp["dest_no"]]["dir"]:
                    return {
                        **state,
                        "clck": clck,
                        "air": air,
                        "ground": ground,
                        "loser_msg": f"L'avion '{plane_name(pp)}' a atterri dans le mauvais sens.",
                    }
                pp["status"] = S_GONE
                continue
        elif pp["dest_type"] == T_EXIT:
            if (
                pp["xpos"] == sp["exit"][pp["dest_no"]]["x"]
                and pp["ypos"] == sp["exit"][pp["dest_no"]]["y"]
            ):
                if pp["altitude"] != 9:
                    return {
                        **state,
                        "clck": clck,
                        "air": air,
                        "ground": ground,
                        "loser_msg": f"L'avion '{plane_name(pp)}' est sorti à la mauvaise altitude.",
                    }
                pp["status"] = S_GONE
                continue

        if pp["altitude"] > 9:
            return {
                **state,
                "clck": clck,
                "air": air,
                "ground": ground,
                "loser_msg": f"L'avion '{plane_name(pp)}' a dépassé le plafond de vol.",
            }

        if pp["altitude"] <= 0:
            for i in range(len(sp["airport"])):
                if pp["xpos"] == sp["airport"][i]["x"] and pp["ypos"] == sp["airport"][i]["y"]:
                    msg = (
                        f"L'avion '{plane_name(pp)}' a atterri sur le mauvais aéroport."
                        if pp["dest_type"] == T_AIRPORT
                        else f"L'avion '{plane_name(pp)}' a atterri au lieu de sortir."
                    )
                    return {**state, "clck": clck, "air": air, "ground": ground, "loser_msg": msg}
            return {
                **state,
                "clck": clck,
                "air": air,
                "ground": ground,
                "loser_msg": f"L'avion '{plane_name(pp)}' s'est écrasé au sol.",
            }

        if (
            pp["xpos"] < 1
            or pp["xpos"] >= sp["width"] - 1
            or pp["ypos"] < 1
            or pp["ypos"] >= sp["height"] - 1
        ):
            for i in range(len(sp["exit"])):
                if pp["xpos"] == sp["exit"][i]["x"] and pp["ypos"] == sp["exit"][i]["y"]:
                    msg = (
                        f"L'avion '{plane_name(pp)}' a emprunté la mauvaise sortie."
                        if pp["dest_type"] == T_EXIT
                        else f"L'avion '{plane_name(pp)}' est sorti au lieu d'atterrir."
                    )
                    return {**state, "clck": clck, "air": air, "ground": ground, "loser_msg": msg}
            return {
                **state,
                "clck": clck,
                "air": air,
                "ground": ground,
                "loser_msg": f"L'avion '{plane_name(pp)}' a quitté illégalement la zone de vol.",
            }

    next_air = []
    for pp in air:
        if pp["status"] == S_GONE:
            safe_planes += 1
        else:
            next_air.append(pp)
    air = next_air

    for i in range(len(air)):
        for j in range(i + 1, len(air)):
            if too_close(air[i], air[j], 1):
                return {
                    **state,
                    "clck": clck,
                    "safe_planes": safe_planes,
                    "air": air,
                    "ground": ground,
                    "loser_msg": f"L'avion '{plane_name(air[i])}' est entré en collision avec l'avion '{plane_name(air[j])}'.",
                }

    next_state = {
        **state,
        "clck": clck,
        "safe_planes": safe_planes,
        "air": air,
        "ground": ground,
        "loser_msg": None,
    }

    if int(math.floor(rng() * sp["newplane_time"])) == 0:
        next_state = add_plane(next_state, rng, sp)

    return next_state


# --- Automate de commandes (identique à atcEngine.js / input.c) ---

ALPHATOKEN = 256
NUMTOKEN = 257
RETTOKEN = "\n"

STATES = [
    # state 0
    [
        {"token": ALPHATOKEN, "to_state": 1, "func": "setplane"},
        {"token": RETTOKEN, "to_state": -1, "func": None},
    ],
    # state 1
    [
        {"token": "t", "to_state": 2, "func": "turn"},
        {"token": "a", "to_state": 3, "func": None},
        {"token": "c", "to_state": 4, "func": "circle"},
        {"token": "m", "to_state": 7, "func": "mark"},
        {"token": "u", "to_state": 7, "func": "unmark"},
        {"token": "i", "to_state": 7, "func": "ignore"},
    ],
    # state 2
    [
        {"token": "l", "to_state": 6, "func": "left"},
        {"token": "r", "to_state": 6, "func": "right"},
        {"token": "L", "to_state": 4, "func": "Left"},
        {"token": "R", "to_state": 4, "func": "Right"},
        {"token": "v", "to_state": 11, "func": None},
        {"token": "z", "to_state": 4, "func": "to_dir"},
        {"token": "e", "to_state": 4, "func": "to_dir"},
        {"token": "d", "to_state": 4, "func": "to_dir"},
        {"token": "c", "to_state": 4, "func": "to_dir"},
        {"token": "x", "to_state": 4, "func": "to_dir"},
        {"token": "w", "to_state": 4, "func": "to_dir"},
        {"token": "q", "to_state": 4, "func": "to_dir"},
        {"token": "a", "to_state": 4, "func": "to_dir"},
    ],
    # state 3
    [
        {"token": "+", "to_state": 10, "func": "climb"},
        {"token": "c", "to_state": 10, "func": "climb"},
        {"token": "-", "to_state": 10, "func": "descend"},
        {"token": "d", "to_state": 10, "func": "descend"},
        {"token": NUMTOKEN, "to_state": 7, "func": "setalt"},
    ],
    # state 4
    [
        {"token": "@", "to_state": 9, "func": None},
        {"token": "a", "to_state": 9, "func": None},
        {"token": RETTOKEN, "to_state": -1, "func": None},
    ],
    # state 5
    [
        {"token": NUMTOKEN, "to_state": 7, "func": "delayb"},
    ],
    # state 6
    [
        {"token": "@", "to_state": 9, "func": None},
        {"token": "a", "to_state": 9, "func": None},
        {"token": "z", "to_state": 4, "func": "rel_dir"},
        {"token": "e", "to_state": 4, "func": "rel_dir"},
        {"token": "d", "to_state": 4, "func": "rel_dir"},
        {"token": "c", "to_state": 4, "func": "rel_dir"},
        {"token": "x", "to_state": 4, "func": "rel_dir"},
        {"token": "w", "to_state": 4, "func": "rel_dir"},
        {"token": "q", "to_state": 4, "func": "rel_dir"},
        {"token": "a", "to_state": 4, "func": "rel_dir"},
        {"token": RETTOKEN, "to_state": -1, "func": None},
    ],
    # state 7
    [
        {"token": RETTOKEN, "to_state": -1, "func": None},
    ],
    # state 8
    [
        {"token": NUMTOKEN, "to_state": 4, "func": "benum"},
    ],
    # state 9
    [
        {"token": "b", "to_state": 5, "func": None},
        {"token": "*", "to_state": 5, "func": None},
    ],
    # state 10
    [
        {"token": NUMTOKEN, "to_state": 7, "func": "setrelalt"},
    ],
    # state 11
    [
        {"token": "b", "to_state": 8, "func": "beacon"},
        {"token": "*", "to_state": 8, "func": "beacon"},
        {"token": "s", "to_state": 8, "func": "ex_it"},
        {"token": "a", "to_state": 8, "func": "airport"},
    ],
    # state 12
    [
        {"token": -1, "to_state": -1, "func": None},
    ],
]


def _find_plane_in_state(game_state: dict, plane_no: int):
    for p in game_state["air"]:
        if p["plane_no"] == plane_no:
            return p
    for p in game_state["ground"]:
        if p["plane_no"] == plane_no:
            return p
    return None


def apply_command_keys(cmd_str: str, game_state: dict, sp: dict = DEFAULT_SCREEN) -> dict:
    """
    Exécute une chaîne de touches de commande (ex: "aa9", "atb0@b0") sur `game_state`.
    """
    if not isinstance(cmd_str, str) or not cmd_str or game_state.get("loser_msg"):
        return game_state

    state_idx = 0
    steps = []
    for ch in cmd_str + "\n":
        if "0" <= ch <= "9":
            c = NUMTOKEN
        elif ("a" <= ch <= "z") or ("A" <= ch <= "Z"):
            c = ALPHATOKEN
        else:
            c = ch

        rules = STATES[state_idx] if 0 <= state_idx < len(STATES) else []
        rule = next((r for r in rules if r["token"] == c or r["token"] == ch), None)
        if rule is None:
            return game_state

        steps.append((rule["func"], ch))
        state_idx = rule["to_state"]
        if state_idx == -1:
            break

    if state_idx != -1 or len(steps) <= 1:
        return game_state

    p = None
    dir_mode = 0
    dest_type = T_NODEST
    dest_no = 0

    for func_name, ch in steps:
        if not func_name:
            continue
        if func_name == "setplane":
            pp = _find_plane_in_state(game_state, plane_number(ch))
            if pp is None:
                return game_state
            p = {**pp, "delayd": False}
        elif func_name == "turn":
            if p["altitude"] == 0:
                return game_state
        elif func_name == "circle":
            if p["altitude"] == 0:
                return game_state
            p["new_dir"] = MAXDIR
        elif func_name == "left":
            dir_mode = D_LEFT
            p["new_dir"] = (p["dir"] - 1 + MAXDIR) % MAXDIR
        elif func_name == "right":
            dir_mode = D_RIGHT
            p["new_dir"] = (p["dir"] + 1) % MAXDIR
        elif func_name == "Left":
            p["new_dir"] = (p["dir"] - 2 + MAXDIR) % MAXDIR
        elif func_name == "Right":
            p["new_dir"] = (p["dir"] + 2) % MAXDIR
        elif func_name == "delayb":
            bnum = ord(ch) - 48
            if bnum < 0 or bnum >= len(sp["beacon"]):
                return game_state
            xdiff = sgn(sp["beacon"][bnum]["x"] - p["xpos"])
            ydiff = sgn(sp["beacon"][bnum]["y"] - p["ypos"])
            if xdiff != DISPLACEMENT[p["dir"]]["dx"] or ydiff != DISPLACEMENT[p["dir"]]["dy"]:
                return game_state
            p["delayd"] = True
            p["delayd_no"] = bnum
            if dest_type != T_NODEST:
                if dest_type == T_BEACON:
                    dx = sp["beacon"][dest_no]["x"] - sp["beacon"][bnum]["x"]
                    dy = sp["beacon"][dest_no]["y"] - sp["beacon"][bnum]["y"]
                elif dest_type == T_EXIT:
                    dx = sp["exit"][dest_no]["x"] - sp["beacon"][bnum]["x"]
                    dy = sp["exit"][dest_no]["y"] - sp["beacon"][bnum]["y"]
                elif dest_type == T_AIRPORT:
                    dx = sp["airport"][dest_no]["x"] - sp["beacon"][bnum]["x"]
                    dy = sp["airport"][dest_no]["y"] - sp["beacon"][bnum]["y"]
                else:
                    return game_state
                if dx == 0 and dy == 0:
                    return game_state
                p["new_dir"] = dir_from_dxdy(dx, dy)
                if p["new_dir"] == p["dir"]:
                    return game_state
        elif func_name == "beacon":
            dest_type = T_BEACON
        elif func_name == "ex_it":
            dest_type = T_EXIT
        elif func_name == "airport":
            dest_type = T_AIRPORT
        elif func_name == "climb":
            dir_mode = D_UP
        elif func_name == "descend":
            dir_mode = D_DOWN
        elif func_name == "setalt":
            alt = ord(ch) - 48
            if p["altitude"] == alt and p["new_altitude"] == p["altitude"]:
                return game_state
            p["new_altitude"] = alt
        elif func_name == "setrelalt":
            delta = ord(ch) - 48
            if delta == 0:
                return game_state
            if dir_mode == D_UP:
                p["new_altitude"] = p["altitude"] + delta
            elif dir_mode == D_DOWN:
                p["new_altitude"] = p["altitude"] - delta
            if p["new_altitude"] < 0 or p["new_altitude"] > 9:
                return game_state
        elif func_name == "benum":
            num = ord(ch) - 48
            dest_no = num
            if dest_type == T_BEACON:
                if num >= len(sp["beacon"]):
                    return game_state
                p["new_dir"] = dir_from_dxdy(
                    sp["beacon"][num]["x"] - p["xpos"],
                    sp["beacon"][num]["y"] - p["ypos"],
                )
            elif dest_type == T_EXIT:
                if num >= len(sp["exit"]):
                    return game_state
                p["new_dir"] = dir_from_dxdy(
                    sp["exit"][num]["x"] - p["xpos"],
                    sp["exit"][num]["y"] - p["ypos"],
                )
            elif dest_type == T_AIRPORT:
                if num >= len(sp["airport"]):
                    return game_state
                p["new_dir"] = dir_from_dxdy(
                    sp["airport"][num]["x"] - p["xpos"],
                    sp["airport"][num]["y"] - p["ypos"],
                )
        elif func_name == "to_dir":
            p["new_dir"] = dir_no(ch)
        elif func_name == "rel_dir":
            angle = dir_no(ch)
            if dir_mode == D_LEFT:
                p["new_dir"] = (p["dir"] - angle + MAXDIR) % MAXDIR
            elif dir_mode == D_RIGHT:
                p["new_dir"] = (p["dir"] + angle) % MAXDIR
        elif func_name == "mark":
            if p["altitude"] == 0 or p["status"] == S_MARKED:
                return game_state
            p["status"] = S_MARKED
        elif func_name == "unmark":
            if p["altitude"] == 0 or p["status"] == S_UNMARKED:
                return game_state
            p["status"] = S_UNMARKED
        elif func_name == "ignore":
            if p["altitude"] == 0 or p["status"] == S_IGNORED:
                return game_state
            p["status"] = S_IGNORED

    if p is None:
        return game_state

    def update_list(lst: list) -> list:
        res = []
        for pp in lst:
            if pp["plane_no"] != p["plane_no"]:
                res.append(pp)
            elif pp["new_altitude"] != p["new_altitude"]:
                res.append({**pp, "new_altitude": p["new_altitude"]})
            elif pp["status"] != p["status"]:
                res.append({**pp, "status": p["status"]})
            else:
                res.append({
                    **pp,
                    "new_dir": p["new_dir"],
                    "delayd": p["delayd"],
                    "delayd_no": p["delayd_no"],
                })
        return res

    return {
        **game_state,
        "air": update_list(game_state["air"]),
        "ground": update_list(game_state["ground"]),
    }


def simulate_atc(seed: int, total_ticks: int, commands: list) -> dict:
    """
    Rejoue intégralement une partie d'ATC à partir de `seed`, `total_ticks` et la liste `commands`
    (`list[list[str]]`, une liste de commandes par cycle).
    """
    rng = Mulberry32(seed)
    state = add_plane(
        {
            "clck": 0,
            "safe_planes": 0,
            "last_plane": -1,
            "air": [],
            "ground": [],
            "loser_msg": None,
        },
        rng,
        DEFAULT_SCREEN,
    )

    max_ticks = min(max(0, int(total_ticks)), 10000)

    for current_clck in range(max_ticks):
        tick_cmds = (
            commands[current_clck]
            if isinstance(commands, list)
            and current_clck < len(commands)
            and isinstance(commands[current_clck], list)
            else []
        )
        for cmd_str in tick_cmds:
            if isinstance(cmd_str, str):
                state = apply_command_keys(cmd_str, state, DEFAULT_SCREEN)

        state = step_update(state, rng, DEFAULT_SCREEN)
        if state.get("loser_msg"):
            break

    return {
        "score": state["safe_planes"],
        "tick": state["clck"],
        "game_over": bool(state.get("loser_msg")),
        "reason": state.get("loser_msg"),
    }


def verify_and_score_atc(partie_etat: dict, data: dict) -> dict:
    """
    Vérifie la légitimité temporelle et rejoue la partie d'ATC côté serveur.
    """
    seed = partie_etat.get("seed")
    started_at = partie_etat.get("started_at", 0)
    update_sec = partie_etat.get("update_sec", DEFAULT_SCREEN["update_secs"])

    ticks = max(0, int(data.get("ticks", 0)))
    forced_updates = max(0, min(ticks, int(data.get("forced_updates", 0))))
    commands = data.get("commands", [])

    elapsed = time.time() - started_at
    min_expected_duration = max(0, ticks - forced_updates) * update_sec
    max_expected_duration = ticks * update_sec

    # Tolérance réseau : pas d'accélération par rapport aux tours d'horloge non forcés,
    # ni de pause/ralenti au-delà de la durée maximale théorique
    if ticks > 0 and (elapsed < min_expected_duration - 5 or elapsed > max_expected_duration + 25):
        return {
            "valid": False,
            "score": 0,
            "reason": "Durée de partie incohérente avec le nombre de tours (pause ou altération de la vitesse détectée).",
        }

    sim = simulate_atc(seed, ticks, commands)
    return {
        "valid": True,
        "score": sim["score"],
        "tick": sim["tick"],
        "game_over": sim["game_over"],
        "reason": sim["reason"],
    }
