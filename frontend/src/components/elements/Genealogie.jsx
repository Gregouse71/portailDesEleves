import { useMemo } from 'react';

/**
 * Hash simple et déterministe d'une chaîne en entier 32 bits (djb2-like).
 * Utilisé pour dériver une graine à partir des données du graphe.
 */
function hashChaine(str) {
    let h = 0;
    for (let i = 0; i < str.length; i += 1) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h;
}

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32), seedé par un
 * entier.
 */
function creerGenerateurAleatoire(graine) {
    let etat = graine >>> 0;
    return function alea() {
        etat = (etat + 0x6d2b79f5) | 0;
        let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function graineDepuisGraphe(noeuds, liens) {
    const idsTries = noeuds.map((n) => n.id).sort((a, b) => a - b).join(',');
    const liensTries = liens
        .map((l) => `${l.source}-${l.cible}-${l.relation || l.type}`)
        .sort()
        .join(',');
    return hashChaine(`${idsTries}|${liensTries}`);
}

const LARGEUR_NOEUD = 100;
const HAUTEUR_NIVEAU = 80;
const LARGEUR_RECT = 80;
const HAUTEUR_RECT = 30;
const MARGE = 40;
const NB_PASSES_BARYCENTRE = 5;
const NB_TOURS_TASSEMENT_CO = 10;
const NB_TOURS_DECROISEMENT = 10;

// Profondeur maximale de propagation récursive du coût
const PROFONDEUR_MAX_PROPAGATION = 100;

const ESPACEMENT_MIN_PX = 20;
const ESPACEMENT_CO = (LARGEUR_RECT + ESPACEMENT_MIN_PX) / LARGEUR_NOEUD;
const NB_ESSAIS = 30;

function typeRelation(lien) {
    return lien.relation || lien.type;
}


//Regroupe les ids d'un même niveau reliés par des liens 'co' en clusters
function construireClustersCos(ids, cosDe) {
    const idsAuNiveau = new Set(ids);
    const visites = new Set();
    const clusters = [];

    const voisinsAuNiveau = (id) => (cosDe.get(id) || []).filter((v) => idsAuNiveau.has(v));

    ids.forEach((id) => {
        if (visites.has(id)) return;

        // Étape 1 : identifie tous les membres de cette composante connexe,
        const membres = new Set([id]);
        const pileMembres = [id];
        while (pileMembres.length) {
            const courant = pileMembres.pop();
            voisinsAuNiveau(courant).forEach((voisin) => {
                if (!membres.has(voisin)) {
                    membres.add(voisin);
                    pileMembres.push(voisin);
                }
            });
        }
        membres.forEach((m) => visites.add(m));

        // Étape 2 : on reconstruit l'ordre linéaire RÉEL de la chaîne en partant d'une extrémité (un membre avec un seul voisin)
        const degre = (m) => voisinsAuNiveau(m).filter((v) => membres.has(v)).length;
        const estUneChaine = [...membres].every((m) => degre(m) <= 2);

        if (estUneChaine && membres.size > 1) {
            const depart = [...membres].find((m) => degre(m) <= 1) ?? [...membres][0];
            const ordre = [depart];
            const vus = new Set([depart]);
            let precedent = null;
            let courant = depart;
            while (true) {
                const suivants = voisinsAuNiveau(courant).filter(
                    (v) => membres.has(v) && v !== precedent && !vus.has(v)
                );
                if (suivants.length === 0) break;
                const suivant = suivants[0];
                ordre.push(suivant);
                vus.add(suivant);
                precedent = courant;
                courant = suivant;
            }
            // Sécurité (cycle ou cas inattendu)
            membres.forEach((m) => { if (!vus.has(m)) ordre.push(m); });
            clusters.push(ordre);
        } else {
            // Composante avec ramification
            clusters.push([...membres]);
        }
    });

    return clusters;
}

// Calcule le niveau (hauteur) de chaque noeud à partir de la structure du graphe.
function calculerNiveaux(noeuds, liens) {
    const idsTous = noeuds.map((n) => n.id);

    const cosDe = new Map();
    liens.forEach((l) => {
        if (typeRelation(l) === 'co') {
            if (!cosDe.has(l.source)) cosDe.set(l.source, []);
            cosDe.get(l.source).push(l.cible);
            if (!cosDe.has(l.cible)) cosDe.set(l.cible, []);
            cosDe.get(l.cible).push(l.source);
        }
    });

    const clusterDe = new Map();
    const clusters = [];
    idsTous.forEach((id) => {
        if (clusterDe.has(id)) return;
        const idx = clusters.length;
        const cluster = [];
        const pile = [id];
        clusterDe.set(id, idx);
        while (pile.length) {
            const courant = pile.pop();
            cluster.push(courant);
            (cosDe.get(courant) || []).forEach((voisin) => {
                if (!clusterDe.has(voisin)) {
                    clusterDe.set(voisin, idx);
                    pile.push(voisin);
                }
            });
        }
        clusters.push(cluster);
    });

    const arcsClusters = new Map();
    const degreEntrant = new Array(clusters.length).fill(0);
    const arcsVus = new Set();
    liens.forEach((l) => {
        if (typeRelation(l) === 'co') return;
        const cSource = clusterDe.get(l.source);
        const cCible = clusterDe.get(l.cible);
        if (cSource === undefined || cCible === undefined || cSource === cCible) return;
        const cle = `${cSource}->${cCible}`;
        if (arcsVus.has(cle)) return;
        arcsVus.add(cle);
        if (!arcsClusters.has(cSource)) arcsClusters.set(cSource, []);
        arcsClusters.get(cSource).push(cCible);
        degreEntrant[cCible] += 1;
    });

    const niveauCluster = new Array(clusters.length).fill(0);
    const degreRestant = [...degreEntrant];
    const file = [];
    degreRestant.forEach((d, i) => { if (d === 0) file.push(i); });
    let curseur = 0;
    while (curseur < file.length) {
        const c = file[curseur];
        curseur += 1;
        (arcsClusters.get(c) || []).forEach((suivant) => {
            niveauCluster[suivant] = Math.max(niveauCluster[suivant], niveauCluster[c] + 1);
            degreRestant[suivant] -= 1;
            if (degreRestant[suivant] === 0) file.push(suivant);
        });
    }

    const niveauDe = new Map();
    idsTous.forEach((id) => niveauDe.set(id, niveauCluster[clusterDe.get(id)]));
    return niveauDe;
}

function essayerDisposition(noeuds, liens, randomiserOrientation, alea) {
    const parId = new Map(noeuds.map((n) => [n.id, n]));
    const niveauDe = calculerNiveaux(noeuds, liens);

    const idsParNiveau = new Map();
    noeuds.forEach((n) => {
        const niveau = niveauDe.get(n.id) ?? 0;
        if (!idsParNiveau.has(niveau)) idsParNiveau.set(niveau, []);
        idsParNiveau.get(niveau).push(n.id);
    });
    const niveauxTries = [...idsParNiveau.keys()].sort((a, b) => a - b);

    const enfantsDe = new Map();
    const parentsDe = new Map();
    const cosDe = new Map();
    liens.forEach((l) => {
        if (typeRelation(l) === 'co') {
            if (!cosDe.has(l.source)) cosDe.set(l.source, []);
            cosDe.get(l.source).push(l.cible);
            if (!cosDe.has(l.cible)) cosDe.set(l.cible, []);
            cosDe.get(l.cible).push(l.source);
        } else {
            if (!enfantsDe.has(l.source)) enfantsDe.set(l.source, []);
            enfantsDe.get(l.source).push(l.cible);
            if (!parentsDe.has(l.cible)) parentsDe.set(l.cible, []);
            parentsDe.get(l.cible).push(l.source);
        }
    });

    const tousVoisinsDe = new Map();
    new Set([...enfantsDe.keys(), ...parentsDe.keys()]).forEach((id) => {
        tousVoisinsDe.set(id, [...(enfantsDe.get(id) || []), ...(parentsDe.get(id) || [])]);
    });

    const clustersParNiveau = new Map();
    niveauxTries.forEach((niv) => {
        clustersParNiveau.set(niv, construireClustersCos(idsParNiveau.get(niv), cosDe));
    });

    const largeurCluster = (cluster) =>
        Math.max(1, (cluster.length - 1) * ESPACEMENT_CO + 1);

    const clefCluster = (cluster) => [...cluster].sort((a, b) => a - b).join(',');

    const clusterKeyDe = new Map();
    niveauxTries.forEach((niv) => {
        clustersParNiveau.get(niv).forEach((cluster) => {
            const clef = clefCluster(cluster);
            cluster.forEach((id) => clusterKeyDe.set(id, clef));
        });
    });

    const ordreFixeParClef = new Map();
    niveauxTries.forEach((niv) => {
        clustersParNiveau.get(niv).forEach((cluster) => {
            ordreFixeParClef.set(clefCluster(cluster), cluster);
        });
    });

    const parentsClusterDe = new Map(); // clefEnfant -> Set(clefParent)
    niveauxTries.forEach((niv) => {
        clustersParNiveau.get(niv).forEach((cluster) => {
            const clefEnfant = clefCluster(cluster);
            const parentsSet = parentsClusterDe.get(clefEnfant) ?? new Set();
            cluster.forEach((id) => {
                (parentsDe.get(id) || []).forEach((p) => {
                    const clefParent = clusterKeyDe.get(p);
                    if (clefParent) parentsSet.add(clefParent);
                });
            });
            parentsClusterDe.set(clefEnfant, parentsSet);
        });
    });

    const largeurSousArbreParClef = new Map();
    [...niveauxTries].reverse().forEach((niv) => {
        clustersParNiveau.get(niv).forEach((cluster) => {
            const clef = clefCluster(cluster);
            const clesEnfants = new Set();
            cluster.forEach((id) => {
                (enfantsDe.get(id) || []).forEach((fillotId) => {
                    const clefEnfant = clusterKeyDe.get(fillotId);
                    if (clefEnfant) clesEnfants.add(clefEnfant);
                });
            });
            const largeurEnfants = [...clesEnfants].reduce((somme, cle) => {
                const nbParents = (parentsClusterDe.get(cle) || new Set()).size;
                if (nbParents > 1) return somme; // cluster partagé : zéro réservation
                return somme + (largeurSousArbreParClef.get(cle) ?? 1);
            }, 0);
            largeurSousArbreParClef.set(clef, Math.max(largeurCluster(cluster), largeurEnfants));
        });
    });
    const largeurSousArbre = (cluster) => largeurSousArbreParClef.get(clefCluster(cluster)) ?? largeurCluster(cluster);

    const xDe = new Map();
    niveauxTries.forEach((niv) => {
        let x = 0;
        clustersParNiveau.get(niv).forEach((cluster) => {
            const ordre = randomiserOrientation && alea() < 0.5
                ? [...cluster].reverse()
                : cluster;
            ordre.forEach((id, i) => {
                xDe.set(id, x + i * ESPACEMENT_CO);
            });
            x += largeurSousArbre(cluster);
        });
    });

    const barycentreNoeud = (id, voisinsDe) => {
        const voisins = voisinsDe.get(id) || [];
        let somme = 0;
        let compte = 0;
        voisins.forEach((v) => {
            if (xDe.has(v)) {
                somme += xDe.get(v);
                compte += 1;
            }
        });
        return compte > 0 ? somme / compte : xDe.get(id) ?? 0;
    };

    const placerMembresCluster = (ordre, cibles) => {
        const n = ordre.length;
        if (n === 1) {
            return { relatives: new Map([[ordre[0], 0]]), largeur: 1 };
        }

        const desirees = ordre.map((id) => cibles.get(id));
        const finales = new Array(n);
        finales[0] = desirees[0];
        for (let i = 1; i < n; i++) {
            finales[i] = Math.max(desirees[i], finales[i - 1] + ESPACEMENT_CO);
        }
        for (let i = n - 2; i >= 0; i--) {
            finales[i] = Math.min(finales[i], finales[i + 1] - ESPACEMENT_CO);
        }

        const centreCluster = (finales[0] + finales[n - 1]) / 2;
        const relatives = new Map();
        ordre.forEach((id, i) => relatives.set(id, finales[i] - centreCluster));

        return { relatives, largeur: finales[n - 1] - finales[0] + 1 };
    };

    const ordonnerEtPlacerCluster = (cluster, voisinsDe, figerOrdre = false) => {
        const cibles = new Map(cluster.map((id) => [id, barycentreNoeud(id, voisinsDe)]));
        const centreCibles = cluster.reduce((s, id) => s + cibles.get(id), 0) / cluster.length;

        if (figerOrdre) {
            const { relatives, largeur } = placerMembresCluster(cluster, cibles);
            return { ordonne: cluster, centre: centreCibles, relatives, largeur };
        }

        const ciblesToutesDirections = new Map(
            cluster.map((id) => [id, barycentreNoeud(id, tousVoisinsDe)])
        );

        const ordreFixe = ordreFixeParClef.get(clefCluster(cluster)) ?? cluster;
        const ordreInverse = [...ordreFixe].reverse();

        const evaluer = (ordre) => {
            const { relatives, largeur } = placerMembresCluster(ordre, cibles);
            const cout = ordre.reduce(
                (s, id) => s + Math.abs(centreCibles + relatives.get(id) - ciblesToutesDirections.get(id)),
                0
            );
            return { ordre, relatives, largeur, cout };
        };

        const candidatDirect = evaluer(ordreFixe);
        const candidatInverse = ordreFixe.length > 1 ? evaluer(ordreInverse) : candidatDirect;
        const meilleur = candidatInverse.cout < candidatDirect.cout ? candidatInverse : candidatDirect;

        return {
            ordonne: meilleur.ordre,
            centre: centreCibles,
            relatives: meilleur.relatives,
            largeur: meilleur.largeur,
        };
    };

    const placerNiveau = (clusters, voisinsDe, figerOrdre = false) => {
        const items = clusters.map((cluster) => {
            const { ordonne, centre, relatives, largeur } = ordonnerEtPlacerCluster(cluster, voisinsDe, figerOrdre);
            const largeurReservee = Math.max(largeur, largeurSousArbre(cluster));
            return { clusterOrdonne: ordonne, cible: centre, relatives, largeur: largeurReservee };
        });
        if (!figerOrdre) {
            items.sort((a, b) => a.cible - b.cible || xDe.get(a.clusterOrdonne[0]) - xDe.get(b.clusterOrdonne[0]));
        }

        const EPSILON = 1e-6;
        const desirees = [];
        let i = 0;
        while (i < items.length) {
            let j = i;
            while (j + 1 < items.length && Math.abs(items[j + 1].cible - items[i].cible) < EPSILON) j += 1;
            const groupe = items.slice(i, j + 1);
            const k = groupe.length;
            groupe.forEach((item, pos) => desirees.push(item.cible + (pos - (k - 1) / 2)));
            i = j + 1;
        }

        const finales = new Array(items.length);
        finales[0] = desirees[0];

        for (let i = 1; i < items.length; i++) {
            const demiPrec = items[i - 1].largeur / 2;
            const demiCour = items[i].largeur / 2;
            finales[i] = Math.max(desirees[i], finales[i - 1] + demiPrec + demiCour);
        }
        for (let i = items.length - 2; i >= 0; i--) {
            const demiCour = items[i].largeur / 2;
            const demiSuiv = items[i + 1].largeur / 2;
            finales[i] = Math.min(finales[i], finales[i + 1] - demiCour - demiSuiv);
        }

        // Recentrage symétrique des groupes de clusters "collés"
        {
            const EPSILON_COLLE = 1e-6;
            let k = 0;
            while (k < items.length) {
                let l = k;
                while (
                    l + 1 < items.length &&
                    Math.abs(
                        finales[l + 1] - finales[l] - (items[l].largeur / 2 + items[l + 1].largeur / 2)
                    ) < EPSILON_COLLE
                ) {
                    l += 1;
                }

                if (l > k) {
                    const groupe = items.slice(k, l + 1);
                    const moyenneCibles = groupe.reduce((s, it) => s + it.cible, 0) / groupe.length;
                    const centreActuel = (finales[k] + finales[l]) / 2;
                    let decalage = moyenneCibles - centreActuel;

                    if (k > 0) {
                        const minPermis = finales[k - 1] + items[k - 1].largeur / 2 + items[k].largeur / 2;
                        decalage = Math.max(decalage, minPermis - finales[k]);
                    }
                    if (l < items.length - 1) {
                        const maxPermis = finales[l + 1] - items[l + 1].largeur / 2 - items[l].largeur / 2;
                        decalage = Math.min(decalage, maxPermis - finales[l]);
                    }

                    for (let idx = k; idx <= l; idx += 1) {
                        finales[idx] += decalage;
                    }
                }

                k = l + 1;
            }
        }

        items.forEach((item, idx) => {
            const centre = finales[idx];
            item.clusterOrdonne.forEach((id) => {
                xDe.set(id, centre + item.relatives.get(id));
            });
        });
        return items.map((item) => item.clusterOrdonne);
    };

    const calculerBloc = (depart, gauche) => {
        const bloc = new Set();
        const pile = [depart];
        while (pile.length) {
            const cur = pile.pop();
            if (cur === gauche || bloc.has(cur)) continue;
            bloc.add(cur);
            (cosDe.get(cur) || []).forEach((v) => { if (v !== gauche && !bloc.has(v)) pile.push(v); });
            (enfantsDe.get(cur) || []).forEach((v) => { if (v !== gauche && !bloc.has(v)) pile.push(v); });
            (parentsDe.get(cur) || []).forEach((v) => { if (v !== gauche && !bloc.has(v)) pile.push(v); });
        }
        return bloc;
    };

    const tasserLiensCo = () => {
        for (let tour = 0; tour < NB_TOURS_TASSEMENT_CO; tour += 1) {
            let aBouge = false;

            const pairesCo = [];
            const paireVue = new Set();
            cosDe.forEach((voisins, id) => {
                voisins.forEach((v) => {
                    const clef = id < v ? `${id}|${v}` : `${v}|${id}`;
                    if (paireVue.has(clef)) return;
                    paireVue.add(clef);
                    pairesCo.push([id, v]);
                });
            });
            pairesCo.sort((p1, p2) =>
                Math.max(xDe.get(p2[0]), xDe.get(p2[1])) - Math.max(xDe.get(p1[0]), xDe.get(p1[1]))
            );

            pairesCo.forEach(([a, b]) => {
                const gauche = xDe.get(a) <= xDe.get(b) ? a : b;
                const droite = gauche === a ? b : a;
                const gapActuel = xDe.get(droite) - xDe.get(gauche);
                if (gapActuel <= ESPACEMENT_CO + 1e-9) return;

                const calculerDeltaMax = (bloc, versLaGauche) => {
                    let delta = gapActuel - ESPACEMENT_CO;
                    niveauxTries.forEach((niv) => {
                        const ids = [...idsParNiveau.get(niv)].sort((x, y) => xDe.get(x) - xDe.get(y));
                        for (let i = 0; i + 1 < ids.length; i += 1) {
                            const g = ids[i];
                            const d = ids[i + 1];
                            const gEnBloc = bloc.has(g);
                            const dEnBloc = bloc.has(d);
                            const contrainte = versLaGauche
                                ? (!gEnBloc && dEnBloc)
                                : (gEnBloc && !dEnBloc);
                            if (!contrainte) continue;
                            const gap = xDe.get(d) - xDe.get(g);
                            delta = Math.min(delta, Math.max(0, gap - ESPACEMENT_CO));
                        }
                    });
                    return delta;
                };

                const blocDroite = calculerBloc(droite, gauche);
                const deltaDroite = calculerDeltaMax(blocDroite, true);

                const blocGauche = calculerBloc(gauche, droite);
                const deltaGauche = calculerDeltaMax(blocGauche, false);

                const versLaGauche = deltaDroite >= deltaGauche;
                const bloc = versLaGauche ? blocDroite : blocGauche;
                const deltaMax = versLaGauche ? deltaDroite : deltaGauche;

                if (deltaMax > 1e-9) {
                    const decalage = versLaGauche ? -deltaMax : deltaMax;
                    bloc.forEach((id) => {
                        xDe.set(id, xDe.get(id) + decalage);
                    });
                    aBouge = true;
                }
            });

            if (!aBouge) break;
        }
    };

    const coutMembreMarrainage = (id, xHypothetique) => {
        let cout = 0;
        (parentsDe.get(id) || []).forEach((p) => {
            if (xDe.has(p)) cout += Math.abs(xHypothetique - xDe.get(p));
        });
        (enfantsDe.get(id) || []).forEach((e) => {
            if (xDe.has(e)) cout += Math.abs(xHypothetique - xDe.get(e));
        });
        return cout;
    };

    const coutMembrePropage = (id, xHypothetique) => {
        const visites = new Set([id]);
        let cout = coutMembreMarrainage(id, xHypothetique);

        const propager = (depart, profondeur) => {
            if (profondeur > PROFONDEUR_MAX_PROPAGATION) return;
            const voisins = [
                ...(parentsDe.get(depart) || []),
                ...(enfantsDe.get(depart) || []),
            ];
            voisins.forEach((voisin) => {
                if (visites.has(voisin)) return;
                visites.add(voisin);

                (cosDe.get(voisin) || []).forEach((comate) => {
                    if (xDe.has(comate)) {
                        cout += Math.abs(xHypothetique - xDe.get(comate));
                    }
                });

                propager(voisin, profondeur + 1);
            });
        };

        propager(id, 0);

        return cout;
    };


    const coutGlobalMarrainage = () => {
        let cout = 0;

        enfantsDe.forEach((enfants, parent) => {
            enfants.forEach((enfant) => {
                if (xDe.has(parent) && xDe.has(enfant)) {
                    cout += Math.abs(xDe.get(parent) - xDe.get(enfant));
                }
            });
        });

        return cout;
    };

    const copierPositions = () => new Map(xDe);


    const restaurerPositions = (positions) => {
        xDe.clear();
        positions.forEach((x, id) => xDe.set(id, x));
    };


    const evaluerOrientationApresTassement = (modifierOrientation) => {
        const sauvegarde = copierPositions();

        modifierOrientation();

        tasserLiensCo();

        const cout = coutGlobalMarrainage();

        const resultat = copierPositions();

        restaurerPositions(sauvegarde);

        return {
            cout,
            positions: resultat,
        };
    };


    const inverserClustersSurPlace = (niv) => {
        let unChangement = false;
        clustersParNiveau.get(niv).forEach((cluster) => {
            if (cluster.length < 2) return;

            const creneaux = cluster.map((id) => xDe.get(id));
            const creneauxInverses = [...creneaux].reverse();

            const actuel = evaluerOrientationApresTassement(() => {
                cluster.forEach((id, i) => {
                    xDe.set(id, creneaux[i]);
                });
            });

            const inverse = evaluerOrientationApresTassement(() => {
                cluster.forEach((id, i) => {
                    xDe.set(id, creneauxInverses[i]);
                });
            });

            if (inverse.cout < actuel.cout - 1e-9) {
                restaurerPositions(inverse.positions);
                cluster.reverse();
                unChangement = true;
            } else {
                restaurerPositions(actuel.positions);
            }

        });
        return unChangement;
    };

    const decroiserNiveau = (niv) => {
        const clusters = clustersParNiveau.get(niv);
        let unEchange = false;

        for (let i = 0; i + 1 < clusters.length; i += 1) {
            const A = clusters[i];
            const B = clusters[i + 1];
            const xA = A.map((id) => xDe.get(id));
            const xB = B.map((id) => xDe.get(id));
            const minA = Math.min(...xA);
            const maxA = Math.max(...xA);
            const minB = Math.min(...xB);
            const maxB = Math.max(...xB);
            const gap = minB - maxA;
            if (gap < -1e-9) continue;

            const coutActuel =
                A.reduce((s, id) => s + coutMembrePropage(id, xDe.get(id)), 0) +
                B.reduce((s, id) => s + coutMembrePropage(id, xDe.get(id)), 0);

            const deltaB = minA - minB;
            const nouveauDebutA = minA + (maxB - minB) + gap;
            const deltaA = nouveauDebutA - minA;

            const coutHypothetique =
                A.reduce((s, id) => s + coutMembrePropage(id, xDe.get(id) + deltaA), 0) +
                B.reduce((s, id) => s + coutMembrePropage(id, xDe.get(id) + deltaB), 0);

            if (coutHypothetique < coutActuel - 1e-9) {
                A.forEach((id) => xDe.set(id, xDe.get(id) + deltaA));
                B.forEach((id) => xDe.set(id, xDe.get(id) + deltaB));
                clusters[i] = B;
                clusters[i + 1] = A;
                unEchange = true;
            }
        }

        return unEchange;
    };

    const decroiserTout = () => {
        for (let tour = 0; tour < NB_TOURS_DECROISEMENT; tour += 1) {
            let unChangement = false;
            niveauxTries.forEach((niv) => {
                if (inverserClustersSurPlace(niv)) unChangement = true;
                if (decroiserNiveau(niv)) unChangement = true;
            });
            if (!unChangement) break;
        }
    };

    for (let passe = 0; passe < NB_PASSES_BARYCENTRE; passe += 1) {
        const descendant = passe % 2 === 0;
        const ordreNiveaux = descendant
            ? niveauxTries.slice(1)
            : niveauxTries.slice(0, -1).reverse();

        ordreNiveaux.forEach((niv) => {
            const voisinsDe = descendant ? parentsDe : enfantsDe;
            const clustersOrdonnes = placerNiveau(clustersParNiveau.get(niv), voisinsDe);
            clustersParNiveau.set(niv, clustersOrdonnes);
        });

        decroiserTout();
        tasserLiensCo();
    }

    const decalageMin = Math.min(...[...xDe.values()]);
    if (decalageMin !== 0) {
        xDe.forEach((x, id) => xDe.set(id, x - decalageMin));
    }

    const paireVuesMarrainage = new Set();
    let coutMarrainage = 0;
    enfantsDe.forEach((enfants, parent) => enfants.forEach((enfant) => {
        const clef = parent < enfant ? `${parent}|${enfant}` : `${enfant}|${parent}`;
        if (paireVuesMarrainage.has(clef)) return;
        paireVuesMarrainage.add(clef);
        if (xDe.has(parent) && xDe.has(enfant)) {
            coutMarrainage += Math.abs(xDe.get(parent) - xDe.get(enfant));
        }
    }));

    const paireVuesCo = new Set();
    let coutCo = 0;
    cosDe.forEach((cos, id) => cos.forEach((c) => {
        const clef = id < c ? `${id}|${c}` : `${c}|${id}`;
        if (paireVuesCo.has(clef)) return;
        paireVuesCo.add(clef);
        if (xDe.has(id) && xDe.has(c)) {
            coutCo += Math.abs(xDe.get(id) - xDe.get(c));
        }
    }));

    const positions = new Map();
    niveauxTries.forEach((niv) => {
        idsParNiveau.get(niv).forEach((id) => {
            const n = parId.get(id);
            positions.set(id, {
                x: MARGE + (xDe.get(id) + 0.5) * LARGEUR_NOEUD,
                y: MARGE + (niv + 0.5) * HAUTEUR_NIVEAU,
                nom_utilisateur: n.nom_utilisateur,
            });
        });
    });

    const largeurMax = (Math.max(...[...xDe.values()]) + 1) * LARGEUR_NOEUD;

    return {
        positions,
        largeur: largeurMax + MARGE * 2,
        hauteur: niveauxTries.length * HAUTEUR_NIVEAU + MARGE * 2,
        coutMarrainage,
        coutCo,
    };
}

const EPSILON = 1e-6;
function estMeilleure(a, b) {
    if (a.coutMarrainage < b.coutMarrainage - EPSILON) return true;
    if (a.coutMarrainage > b.coutMarrainage + EPSILON) return false;
    return a.coutCo < b.coutCo - EPSILON;
}

function GenealogyTree({ noeuds = [], liens = [], noeudsChemin = [] }) {
    const { positions, largeur, hauteur } = useMemo(() => {
        if (!noeuds.length) {
            return { positions: new Map(), largeur: 0, hauteur: 0 };
        }

        const alea = creerGenerateurAleatoire(graineDepuisGraphe(noeuds, liens));

        let meilleur = essayerDisposition(noeuds, liens, false, alea);

        for (let essai = 1; essai < NB_ESSAIS; essai += 1) {
            const tentative = essayerDisposition(noeuds, liens, true, alea);
            if (estMeilleure(tentative, meilleur)) {
                meilleur = tentative;
            }
        }

        return meilleur;
    }, [noeuds, liens]);

    if (!noeuds.length) {
        return <p className="text-muted">Aucune donnée à afficher.</p>;
    }


    const classeDuLien = (lien) => {
        const relation = lien.relation || lien.type;
        const classes = [];

        if (lien.type === 'chemin') {
            classes.push('lien-chemin');
        } else if (relation === 'co') {
            classes.push('lien-co');
        } else {
            classes.push('lien-marrainage');
        }

        if (lien.type === 'chemin' && relation === 'co') {
            classes.push('lien-pointille');
        }

        return classes.join(' ');
    };

    const prioriteType = (type) => (type === 'chemin' ? 2 : type === 'co' ? 0 : 1);
    const liensAffiches = [...liens].sort((a, b) => prioriteType(a.type) - prioriteType(b.type));

    // Redirige vers la page de l'utilisateur cliqué. 
    const allerVersUtilisateur = (id, evenement) => {
        const url = `/utilisateur/${id}`;
        if (evenement.ctrlKey || evenement.metaKey || evenement.button === 1) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    };

    return (
        <div className="genealogy-scroll">
            <svg width={largeur} height={hauteur} className="genealogy-svg">
                {liensAffiches.map((lien, i) => {
                    const a = positions.get(lien.source);
                    const b = positions.get(lien.cible);
                    if (!a || !b) return null;
                    return (
                        <line
                            key={`lien-${i}`}
                            x1={a.x} y1={a.y}
                            x2={b.x} y2={b.y}
                            className={classeDuLien(lien)}
                        />
                    );
                })}
                {[...positions.entries()].map(([id, pos]) => (
                    <g
                        key={id}
                        className={noeudsChemin.includes(id) ? 'noeud noeud-chemin' : 'noeud'}
                        role="link"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => allerVersUtilisateur(id, e)}
                        onAuxClick={(e) => allerVersUtilisateur(id, e)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                allerVersUtilisateur(id, e);
                            }
                        }}
                    >
                        <rect
                            x={pos.x - LARGEUR_RECT / 2}
                            y={pos.y - HAUTEUR_RECT / 2}
                            width={LARGEUR_RECT}
                            height={HAUTEUR_RECT}
                            rx={8}
                        />

                        <text
                            x={pos.x}
                            y={pos.y + 1.5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {pos.nom_utilisateur}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export default GenealogyTree;