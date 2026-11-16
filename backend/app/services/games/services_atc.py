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

import time

WIDTH = 30
HEIGHT = 21
UPDATE_SEC = 4
NEWPLANE_TIME = 5
MAX_FUEL = WIDTH + HEIGHT

# 8 directions de la boussole : N, NE, E, SE, S, SW, W, NW
DX = [0, 1, 1, 1, 0, -1, -1, -1]
DY = [-1, -1, 0, 1, 1, 1, 0, -1]

EXITS = [
    {"x": 12, "y": 0, "dir": 3},
    {"x": 29, "y": 0, "dir": 5},
    {"x": 29, "y": 7, "dir": 6},
    {"x": 29, "y": 17, "dir": 6},
    {"x": 9, "y": 20, "dir": 1},
    {"x": 0, "y": 13, "dir": 2},
    {"x": 0, "y": 7, "dir": 2},
    {"x": 0, "y": 0, "dir": 3},
]

BEACONS = [
    {"x": 12, "y": 7},
    {"x": 12, "y": 17},
]

AIRPORTS = [
    {"x": 20, "y": 15, "dir": 0},
    {"x": 20, "y": 18, "dir": 2},
]

LETTERS = "abcdefghijklmnopqrstuvwxyz"


def _imul32(a: int, b: int) -> int:
    return ((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF


class Mulberry32:
    """Générateur pseudo-aléatoire Mulberry32 32 bits."""

    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def next_int(self) -> int:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        u_n = self.state ^ (self.state >> 15)
        v_n = _imul32(u_n, self.state | 1)
        w_n = v_n ^ (v_n + _imul32(v_n ^ (v_n >> 7), v_n | 61)) & 0xFFFFFFFF
        u32 = (w_n ^ (w_n >> 14)) & 0xFFFFFFFF
        return u32


def simulate_atc(seed: int, total_ticks: int, commands: list) -> dict:
    """
    Rejoue intégralement une partie d'ATC de manière déterministe.
    Renvoie { "score": int, "tick": int, "game_over": bool, "reason": str | None }.
    """


def verify_and_score_atc(partie_etat: dict, data: dict) -> dict:
    """
    Vérifie la légitimité temporelle et rejoue la partie d'ATC côté serveur.
    """
    seed = partie_etat.get("seed")
    started_at = partie_etat.get("started_at", 0)
    update_sec = partie_etat.get("update_sec", UPDATE_SEC)

    ticks = int(data.get("ticks", 0))
    commands = data.get("commands", [])

    elapsed = time.time() - started_at
    expected_duration = max(0, ticks - 1) * update_sec

    # Tolérance réseau/chargement : pas d'accélération (>5s d'avance) ni de pause/ralenti (>25s de retard)
    if ticks > 1 and (elapsed < expected_duration - 5 or elapsed > expected_duration + 25):
        return {
            "valid": False,
            "score": 0,
            "reason": "Durée de partie incohérente avec le nombre de ticks (pause ou altération de la vitesse détectée).",
        }

    sim = simulate_atc(seed, ticks, commands)
    return {
        "valid": True,
        "score": sim["score"],
        "tick": sim["tick"],
        "game_over": sim["game_over"],
        "reason": sim["reason"],
    }
