import math
import os
import random
import gevent
import chess
from datetime import datetime, timedelta, timezone
from stockfish import Stockfish
import shutil

from app import db
from app.models.models_echecs import EchecsDefi, EchecsPartie, EchecsElo

STOCKFISH_PATH = 'stockfish'
EXPIRY_DEFIS   = timedelta(minutes=30)


# ── ELO ───────────────────────────────────────────────────────────────────────

def get_ou_creer_elo(utilisateur_id: int) -> EchecsElo:
    elo = EchecsElo.query.filter_by(utilisateur_id=utilisateur_id).first()
    if not elo:
        elo = EchecsElo(utilisateur_id=utilisateur_id, rating=1500, rd=350, volatilite=0.06)
        db.session.add(elo)
        db.session.flush()
    return elo

# Constantes Glicko-2
TAU    = 0.5    # contrainte sur la volatilité (0.3-1.2, 0.5 recommandé)
EPSILON = 0.000001

def _g(rd):
    return 1 / math.sqrt(1 + 3 * rd**2 / math.pi**2)

def _E(r, ri, rdi):
    return 1 / (1 + math.exp(-_g(rdi) * (r - ri)))

def glicko2_update(r, rd, sigma, opponents):
    """
    Met à jour le rating Glicko-2 d'un joueur.
    
    r, rd, sigma : rating, RD et volatilité du joueur (échelle Glicko-2)
    opponents    : liste de tuples (ri, rdi, score)
                   ri, rdi = rating et RD de l'adversaire (échelle Glicko-2)
                   score   = 1.0 victoire, 0.5 nulle, 0.0 défaite
    
    Retourne (r_new, rd_new, sigma_new) en échelle Glicko-2
    """
    if not opponents:
        # Pas de partie : RD augmente (inactivité)
        rd_new = min(math.sqrt(rd**2 + sigma**2), 350)
        return r, rd_new, sigma

    # Étape 3 : calculer v (variance estimée)
    v = 0
    for ri, rdi, _ in opponents:
        g_rdi = _g(rdi)
        E_val = _E(r, ri, rdi)
        v += g_rdi**2 * E_val * (1 - E_val)
    v = 1 / v

    # Étape 4 : calculer delta
    delta = 0
    for ri, rdi, s in opponents:
        g_rdi = _g(rdi)
        E_val = _E(r, ri, rdi)
        delta += g_rdi * (s - E_val)
    delta *= v

    # Étape 5 : nouvelle volatilité via algorithme Illinois
    a = math.log(sigma**2)
    phi = rd

    def f(x):
        ex = math.exp(x)
        d2 = phi**2 + v + ex
        return (ex * (delta**2 - phi**2 - v - ex) / (2 * d2**2)
                - (x - a) / TAU**2)

    A = a
    B = math.log(delta**2 - phi**2 - v) if delta**2 > phi**2 + v else a - TAU
    max_iter = 100
    i = 0
    while abs(B - A) > EPSILON and i < max_iter:
        C = A + (A - B) * f(A) / (f(B) - f(A))
        fC = f(C)
        if fC * f(B) < 0:
            A = B
        else:
            f_A = f(A) / 2
        B = C
        i += 1
        if abs(B - A) <= EPSILON:
            break

    sigma_new = math.exp(A / 2)

    # Étape 6 : nouveau RD
    phi_star = math.sqrt(rd**2 + sigma_new**2)

    # Étape 7 : nouveau rating et RD
    rd_new = 1 / math.sqrt(1/phi_star**2 + 1/v)
    r_new  = r + rd_new**2 * sum(
        _g(rdi) * (s - _E(r, ri, rdi))
        for ri, rdi, s in opponents
    )

    return r_new, rd_new, sigma_new


def _to_glicko2(r, rd):
    """Convertit rating/RD de l'échelle classique (1500 base) vers Glicko-2."""
    return (r - 1500) / 173.7178, rd / 173.7178

def _from_glicko2(r, rd):
    """Convertit rating/RD de l'échelle Glicko-2 vers l'échelle classique."""
    return round(173.7178 * r + 1500), round(173.7178 * rd)


def mettre_a_jour_elo(partie: EchecsPartie):
    if partie.elo_calcule or partie.statut not in ('mat', 'pat'):
        return

    variations = {}

    if partie.mode == 'ia':
        id_humain  = _id_humain(partie)
        elo_humain = get_ou_creer_elo(id_humain)
        ancien_r   = elo_humain.rating
        ancien_rd  = elo_humain.rd

        couleur_humain = 'blanc' if partie.blanc_id == id_humain else 'noir'
        if partie.gagnant == couleur_humain: score = 1.0
        elif partie.statut == 'pat':         score = 0.5
        else:                                score = 0.0

        # L'IA a un RD fixe de 100 (rating assez certain) et rating = humain + 10
        rating_ia = elo_humain.rating + 10
        r_h, rd_h = _to_glicko2(elo_humain.rating, elo_humain.rd)
        r_ia, rd_ia = _to_glicko2(rating_ia, 100)

        r_new, rd_new, sigma_new = glicko2_update(
            r_h, rd_h, elo_humain.volatilite,
            [(r_ia, rd_ia, score)]
        )
        nouveau_r, nouveau_rd = _from_glicko2(r_new, rd_new)
        nouveau_r = max(100, nouveau_r)

        elo_humain.rating      = nouveau_r
        elo_humain.rd          = max(30, nouveau_rd)
        elo_humain.volatilite  = sigma_new
        elo_humain.nb_parties += 1
        elo_humain.derniere_partie = datetime.now(timezone.utc)
        if elo_humain.parties_retour > 0: elo_humain.parties_retour -= 1
        if score == 1.0:   elo_humain.victoires += 1
        elif score == 0.5: elo_humain.nulles    += 1
        else:              elo_humain.defaites  += 1

        variations[str(id_humain)] = {'avant': ancien_r, 'apres': nouveau_r}

    else:
        elo_blanc = get_ou_creer_elo(partie.blanc_id)
        elo_noir  = get_ou_creer_elo(partie.noir_id)
        ancien_rb, ancien_rdb = elo_blanc.rating, elo_blanc.rd
        ancien_rn, ancien_rdn = elo_noir.rating,  elo_noir.rd

        if partie.gagnant == 'blanc':   sb, sn = 1.0, 0.0
        elif partie.gagnant == 'noir':  sb, sn = 0.0, 1.0
        else:                           sb, sn = 0.5, 0.5

        r_b, rd_b = _to_glicko2(elo_blanc.rating, elo_blanc.rd)
        r_n, rd_n = _to_glicko2(elo_noir.rating,  elo_noir.rd)

        r_b_new, rd_b_new, sigma_b_new = glicko2_update(r_b, rd_b, elo_blanc.volatilite, [(r_n, rd_n, sb)])
        r_n_new, rd_n_new, sigma_n_new = glicko2_update(r_n, rd_n, elo_noir.volatilite,  [(r_b, rd_b, sn)])

        nouveau_rb, nouveau_rdb = _from_glicko2(r_b_new, rd_b_new)
        nouveau_rn, nouveau_rdn = _from_glicko2(r_n_new, rd_n_new)
        nouveau_rb = max(100, nouveau_rb)
        nouveau_rn = max(100, nouveau_rn)

        elo_blanc.rating     = nouveau_rb
        elo_blanc.rd         = max(30, nouveau_rdb)
        elo_blanc.volatilite = sigma_b_new
        elo_noir.rating      = nouveau_rn
        elo_noir.rd          = max(30, nouveau_rdn)
        elo_noir.volatilite  = sigma_n_new

        for elo, score in [(elo_blanc, sb), (elo_noir, sn)]:
            elo.nb_parties += 1
            elo.derniere_partie = datetime.now(timezone.utc)
            if elo.parties_retour > 0: elo.parties_retour -= 1
            if score == 1.0:   elo.victoires += 1
            elif score == 0.5: elo.nulles    += 1
            else:              elo.defaites  += 1

        variations[str(partie.blanc_id)] = {'avant': ancien_rb, 'apres': nouveau_rb}
        variations[str(partie.noir_id)]  = {'avant': ancien_rn, 'apres': nouveau_rn}

    partie.elo_calcule   = True
    partie.elo_variation = variations
    db.session.commit()


RD_SEUIL_CLASSEMENT = 250  # RD en dessous duquel un rating est jugé assez fiable pour être classé

def leaderboard_elo(utilisateur_id: int) -> dict:
    classement_fiable = EchecsElo.query.filter(EchecsElo.rd <= RD_SEUIL_CLASSEMENT)

    top10 = classement_fiable.order_by(EchecsElo.rating.desc()).limit(10).all()
    nb_classes = classement_fiable.count()

    mon_elo = EchecsElo.query.filter_by(utilisateur_id=utilisateur_id).first()

    eligible = bool(mon_elo) and mon_elo.rd <= RD_SEUIL_CLASSEMENT
    ma_position = None
    mon_percentile = None

    if eligible:
        ma_position = EchecsElo.query.filter(
            EchecsElo.rd <= RD_SEUIL_CLASSEMENT,
            EchecsElo.rating > mon_elo.rating,
        ).count() + 1
        if nb_classes:
            mon_percentile = max(1, math.ceil(100 * ma_position / nb_classes))

    return {
        'top10':          [e.to_dict() for e in top10],
        'mon_elo':        mon_elo.to_dict() if mon_elo else None,
        'ma_position':    ma_position,
        'mon_percentile': mon_percentile,
        'eligible':       eligible,
        'nb_classes':     nb_classes,
    }


# ── Helpers internes ──────────────────────────────────────────────────────────

def _id_humain(partie: EchecsPartie) -> int:
    """Retourne l'id du joueur humain (l'autre est l'IA)."""
    return partie.blanc_id if partie.blanc_id else partie.noir_id


def _spawn_stockfish(app, partie_id: int, fen: str, rating_ia: int):
    """Lance Stockfish en arrière-plan via gevent."""
    def bg():
        with app.app_context():
            coup_ia = _stockfish(fen, elo_cible=rating_ia)
            p = EchecsPartie.query.get(partie_id)
            if p and p.statut in ('en_cours', 'echec'):
                b = chess.Board(p.fen)
                b.push(coup_ia)
                _sauvegarder(p, b, coup_ia)
                if p.statut in ('mat', 'pat'):
                    mettre_a_jour_elo(p)
    gevent.spawn(bg)


# ── Conversion plateau ────────────────────────────────────────────────────────

def fen_vers_plateau(fen: str) -> dict:
    board = chess.Board(fen)
    noms  = {
        chess.PAWN: 'p', chess.KNIGHT: 'n', chess.BISHOP: 'b',
        chess.ROOK: 'r', chess.QUEEN:  'q', chess.KING:   'k',
    }
    result = {}
    for sq, piece in board.piece_map().items():
        col = chess.square_file(sq)
        row = 7 - chess.square_rank(sq)
        idx = row * 8 + col
        sym = noms[piece.piece_type]
        result[str(idx)] = {
            'piece':   sym.upper() if piece.color == chess.WHITE else sym,
            'couleur': 'blanc'     if piece.color == chess.WHITE else 'noir',
        }
    return result


def statut_partie(board: chess.Board) -> str:
    if board.is_checkmate():             return 'mat'
    if board.is_check():                 return 'echec'
    if (board.is_stalemate() or
        board.is_insufficient_material() or
        board.is_seventyfive_moves() or
        board.is_fivefold_repetition()): return 'pat'
    return 'en_cours'                                       # J'appelle PAT les nulles en général


def idx_vers_sq(idx: int) -> chess.Square:
    return chess.square(idx % 8, 7 - idx // 8)


def sq_vers_idx(sq: chess.Square) -> int:
    return (7 - chess.square_rank(sq)) * 8 + chess.square_file(sq)


# ── Défis ─────────────────────────────────────────────────────────────────────

def liste_defis(utilisateur_id: int) -> dict:
    expiry = datetime.now(timezone.utc) - EXPIRY_DEFIS

    ouverts = EchecsDefi.query.filter(
        EchecsDefi.statut        == 'en_attente',
        EchecsDefi.mode          == 'humain',
        EchecsDefi.adversaire_id == None,
        EchecsDefi.createur_id   != utilisateur_id,
        EchecsDefi.cree_le       >  expiry,
    ).order_by(EchecsDefi.cree_le.desc()).all()

    recus = EchecsDefi.query.filter(
        EchecsDefi.statut        == 'en_attente',
        EchecsDefi.mode          == 'humain',
        EchecsDefi.adversaire_id == utilisateur_id,
        EchecsDefi.cree_le       >  expiry,
    ).all()

    mon_defi = EchecsDefi.query.filter_by(
        createur_id=utilisateur_id, statut='en_attente'
    ).first()

    mon_defi_accepte = EchecsDefi.query.filter_by(
        createur_id=utilisateur_id, statut='accepte'
    ).join(EchecsPartie, EchecsPartie.defi_id == EchecsDefi.id).filter(
        EchecsPartie.statut.in_(['en_cours', 'echec'])
    ).first()

    partie_en_cours = EchecsPartie.query.filter(
        EchecsPartie.statut.in_(['en_cours', 'echec']),
        db.or_(
            EchecsPartie.blanc_id == utilisateur_id,
            EchecsPartie.noir_id  == utilisateur_id,
        )
    ).first()

    def fmt(d):
        return {
            'id':              d.id,
            'createur_id':     d.createur_id,
            'createur_pseudo': d.createur.nom_utilisateur,
            'adversaire_id':   d.adversaire_id,
            'cree_le':         d.cree_le.isoformat() + 'Z',
        }

    return {
        'ouverts':         [fmt(d) for d in ouverts],
        'recus':           [fmt(d) for d in recus],
        'le_mien':         fmt(mon_defi) if mon_defi else None,
        'partie_id':       mon_defi_accepte.partie.id if mon_defi_accepte and mon_defi_accepte.partie else None,
        'partie_en_cours': partie_en_cours.id if partie_en_cours else None,
    }


def creer_defi(utilisateur, data: dict) -> dict:
    from flask import current_app
    EchecsDefi.query.filter_by(
        createur_id=utilisateur.id, statut='en_attente'
    ).update({'statut': 'annule'})

    mode = data.get('mode', 'humain')

    if mode == 'ia':
        # Vérifier que Stockfish est disponible avant de créer la partie
        if not shutil.which(STOCKFISH_PATH):
            raise ValueError("Stockfish introuvable. Le mode IA est indisponible.")
        niveau = max(1, min(int(data.get('niveau_ia', 10)), 20))
        defi = EchecsDefi(createur_id=utilisateur.id, mode='ia', statut='accepte')
        db.session.add(defi)
        db.session.flush()

        if random.random() < 0.5:
            blanc_id_ia, noir_id_ia = utilisateur.id, None  # joueur blanc, IA noire
        else:
            blanc_id_ia, noir_id_ia = None, utilisateur.id  # IA blanche, joueur noir

        partie = EchecsPartie(
            defi_id=defi.id, mode='ia',
            niveau_ia=niveau, blanc_id=blanc_id_ia, noir_id=noir_id_ia,
        )
        db.session.add(partie)
        db.session.commit()

        # Si IA est blanche, elle joue le premier coup
        if blanc_id_ia is None:
            elo_h = EchecsElo.query.filter_by(utilisateur_id=utilisateur.id).first()
            rating_ia = (elo_h.rating if elo_h else 500) + 10
            app = current_app._get_current_object()
            _spawn_stockfish(app, partie.id, partie.fen, rating_ia)

        return {'partie_id': partie.id, 'mode': 'ia'}

    adversaire_id = None
    if data.get('pseudo_adversaire'):
        from app.models.models_utilisateur import Utilisateur
        cible = Utilisateur.query.filter_by(nom_utilisateur=data['pseudo_adversaire']).first()
        if not cible:
            raise ValueError('Utilisateur introuvable')
        if cible.id == utilisateur.id:
            raise ValueError('Tu ne peux pas te défier toi-même')
        adversaire_id = cible.id

    defi = EchecsDefi(createur_id=utilisateur.id, adversaire_id=adversaire_id, mode='humain')
    db.session.add(defi)
    db.session.commit()
    return {'defi_id': defi.id, 'mode': 'humain'}


def annuler_defi(defi_id: int, utilisateur_id: int):
    defi = EchecsDefi.query.get_or_404(defi_id)
    if defi.createur_id != utilisateur_id:
        raise PermissionError('Pas ton défi')
    defi.statut = 'annule'
    db.session.commit()


def accepter_defi(defi_id: int, utilisateur) -> dict:
    defi = EchecsDefi.query.get_or_404(defi_id)
    if defi.statut != 'en_attente':
        raise ValueError('Défi plus disponible')
    if defi.createur_id == utilisateur.id:
        raise ValueError('Tu ne peux pas accepter ton propre défi')
    if defi.adversaire_id and defi.adversaire_id != utilisateur.id:
        raise PermissionError("Ce défi ne t'est pas destiné")

    joueurs = [defi.createur_id, utilisateur.id]
    random.shuffle(joueurs)
    blanc_id, noir_id = joueurs

    partie = EchecsPartie(
        defi_id=defi.id, mode='humain',
        blanc_id=blanc_id, noir_id=noir_id,
    )
    defi.statut = 'accepte'
    db.session.add(partie)
    db.session.commit()
    return {'partie_id': partie.id}


# ── Partie ────────────────────────────────────────────────────────────────────

def get_partie(partie_id: int) -> dict:
    partie = EchecsPartie.query.get_or_404(partie_id)
    board  = chess.Board(partie.fen)
    d = partie.to_dict()
    d['plateau'] = fen_vers_plateau(partie.fen)
    d['trait']   = 'blanc' if board.turn == chess.WHITE else 'noir'
    d['elo_variation'] = partie.elo_variation

    if partie.mode == 'ia':
        hum_id    = _id_humain(partie)
        elo_h     = EchecsElo.query.filter_by(utilisateur_id=hum_id).first()
        rating_h  = elo_h.rating if elo_h else 500
        rating_ia = rating_h + 10
        if partie.blanc_id == hum_id:
            d['elo_blanc'] = rating_h
            d['elo_noir']  = rating_ia
        else:
            d['elo_blanc'] = rating_ia
            d['elo_noir']  = rating_h
    else:
        elo_b = EchecsElo.query.filter_by(utilisateur_id=partie.blanc_id).first() if partie.blanc_id else None
        elo_n = EchecsElo.query.filter_by(utilisateur_id=partie.noir_id).first()  if partie.noir_id  else None
        d['elo_blanc'] = elo_b.rating if elo_b else 500
        d['elo_noir']  = elo_n.rating if elo_n else 500

    return d


def coups_legaux(partie_id: int, case_idx: int, utilisateur_id: int) -> list:
    partie = EchecsPartie.query.get_or_404(partie_id)
    board  = chess.Board(partie.fen)

    est_blanc = partie.blanc_id == utilisateur_id
    est_noir  = partie.noir_id  == utilisateur_id

    if not (est_blanc or est_noir):
        return []
    if board.turn == chess.WHITE and not est_blanc:
        return []
    if board.turn == chess.BLACK and not est_noir:
        return []

    from_sq = idx_vers_sq(case_idx)
    return [sq_vers_idx(m.to_square) for m in board.legal_moves if m.from_square == from_sq]


def jouer_coup(partie_id: int, utilisateur_id: int, data: dict) -> dict:
    from flask import current_app
    partie = EchecsPartie.query.get_or_404(partie_id)
    board  = chess.Board(partie.fen)

    if partie.statut not in ('en_cours', 'echec'):
        raise ValueError('Partie terminée')

    est_blanc = partie.blanc_id == utilisateur_id
    est_noir  = partie.noir_id  == utilisateur_id

    if not (est_blanc or est_noir):
        raise PermissionError('Tu ne participes pas à cette partie')
    if board.turn == chess.WHITE and not est_blanc:
        raise PermissionError('Pas ton tour')
    if board.turn == chess.BLACK and not est_noir:
        raise PermissionError('Pas ton tour')

    from_sq = idx_vers_sq(data['de'])
    to_sq   = idx_vers_sq(data['vers'])

    piece = board.piece_at(from_sq)
    besoin_promo = (
        piece and piece.piece_type == chess.PAWN
        and chess.square_rank(to_sq) in (0, 7)
    )
    if besoin_promo and not data.get('promotion'):
        return {'besoin_promotion': True, 'de': data['de'], 'vers': data['vers']}

    promo_type = None
    if data.get('promotion'):
        promo_type = chess.Piece.from_symbol(data['promotion'].lower()).piece_type

    move = chess.Move(from_sq, to_sq, promotion=promo_type)
    if move not in board.legal_moves:
        raise ValueError('Coup illégal')

    board.push(move)
    _sauvegarder(partie, board, move)

    if partie.statut in ('mat', 'pat'):
        mettre_a_jour_elo(partie)
        return get_partie(partie_id)

    # Mode IA : Stockfish répond en arrière-plan
    if partie.mode == 'ia' and partie.statut in ('en_cours', 'echec'):
        hum_id    = _id_humain(partie)
        elo_h     = EchecsElo.query.filter_by(utilisateur_id=hum_id).first()
        rating_ia = (elo_h.rating if elo_h else 1500) + 10
        app = current_app._get_current_object()
        _spawn_stockfish(app, partie.id, partie.fen, rating_ia)

    return get_partie(partie_id)


def abandonner(partie_id: int, utilisateur_id: int) -> dict:
    partie = EchecsPartie.query.get_or_404(partie_id)
    if partie.statut not in ('en_cours', 'echec'):
        raise ValueError('Partie déjà terminée')
    est_blanc = partie.blanc_id == utilisateur_id
    est_noir  = partie.noir_id  == utilisateur_id
    if not (est_blanc or est_noir):
        raise PermissionError('Tu ne participes pas à cette partie')

    partie.statut  = 'mat'
    partie.gagnant = 'noir' if est_blanc else 'blanc'
    db.session.commit()
    mettre_a_jour_elo(partie)
    return get_partie(partie_id)


def proposer_nulle(partie_id: int, utilisateur_id: int) -> dict:
    partie = EchecsPartie.query.get_or_404(partie_id)
    if partie.statut not in ('en_cours', 'echec'):
        raise ValueError('Partie déjà terminée')
    if partie.mode == 'ia':
        raise ValueError("Pas de nulle contre l'IA")
    est_blanc = partie.blanc_id == utilisateur_id
    est_noir  = partie.noir_id  == utilisateur_id
    if not (est_blanc or est_noir):
        raise PermissionError('Tu ne participes pas à cette partie')

    partie.nulle_proposee_par = utilisateur_id
    db.session.commit()
    return {'ok': True}


def accepter_nulle(partie_id: int, utilisateur_id: int) -> dict:
    partie = EchecsPartie.query.get_or_404(partie_id)
    if partie.nulle_proposee_par is None:
        raise ValueError('Aucune proposition de nulle')
    if partie.nulle_proposee_par == utilisateur_id:
        raise ValueError('Tu ne peux pas accepter ta propre proposition')

    partie.statut             = 'pat'
    partie.gagnant            = None
    partie.nulle_proposee_par = None
    db.session.commit()
    mettre_a_jour_elo(partie)
    return get_partie(partie_id)


# ── Helpers bas niveau ────────────────────────────────────────────────────────

def statut_partie_avec_historique(partie) -> str:
    board = chess.Board()
    for uci in (partie.historique_coups or []):
        try:
            board.push(chess.Move.from_uci(uci))
        except Exception:
            break
    # print(f'Répétition: {board.is_repetition(3)}, 75 coups: {board.is_seventyfive_moves()}')
    if board.is_checkmate():               return 'mat'
    if board.is_check():                   return 'echec'
    if board.is_stalemate():               return 'pat'
    if board.is_insufficient_material():   return 'pat'
    if board.is_seventyfive_moves():       return 'pat'
    if board.is_fivefold_repetition():     return 'pat'
    # Répétition threefold (proposable) — on la détecte comme pat automatique
    if board.is_repetition(3):             return 'pat'
    return 'en_cours'


def _sauvegarder(partie, board, move):
    partie.fen          = board.fen()
    partie.dernier_coup = move.uci()
    # Historique pour détecter les répétitions
    historique = list(partie.historique_coups or [])
    historique.append(move.uci())
    partie.historique_coups = historique
    partie.statut       = statut_partie_avec_historique(partie)
    partie.gagnant      = None
    if partie.statut == 'mat':
        partie.gagnant = 'noir' if board.turn == chess.WHITE else 'blanc'
    db.session.commit()


def _stockfish(fen: str, elo_cible: int = 1320) -> chess.Move:
    """Demande le meilleur coup à Stockfish via le wrapper Python."""
    elo_sf = max(1320, min(elo_cible, 3190))

    sf = Stockfish(
        path=STOCKFISH_PATH,
        parameters={
            'UCI_LimitStrength': True,
            'UCI_Elo': elo_sf,
        },
    )
    sf.set_fen_position(fen)
    # get_best_move_time() prend un délai en millisecondes
    bestmove = sf.get_best_move_time(500)

    if bestmove is None:
        raise ValueError('Stockfish n\'a pas retourné de coup')

    return chess.Move.from_uci(bestmove)