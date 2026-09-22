# app/services/modules/services_musiciens.py
from app import db
from app.models.models_utilisateurs import Utilisateur


def get_musiciens(instrument: str = None, search: str = None, niveau: str = None):
    """
    Récupère la liste des utilisateurs jouant d'un instrument.
    """
    # Récupérer les utilisateurs visibles ayant des instruments
    users = Utilisateur.query.filter(
        Utilisateur.est_visible.is_(True),
        Utilisateur.instruments.isnot(None)
    ).order_by(Utilisateur.nom.asc(), Utilisateur.prenom.asc()).all()

    instruments_counts = {}
    musiciens = []

    filter_instrument = instrument.strip().lower() if instrument else None
    filter_search = search.strip().lower() if search else None
    filter_niveau = niveau.strip().lower() if niveau else None

    for u in users:
        u_instruments = u.instruments or []
        if not isinstance(u_instruments, list) or len(u_instruments) == 0:
            continue

        # Comptabiliser les instruments disponibles
        for item in u_instruments:
            if isinstance(item, dict) and item.get("name"):
                name = item["name"].strip()
                if name:
                    instruments_counts[name] = instruments_counts.get(name, 0) + 1

        # Filtrage par instrument
        matches_instrument = True
        if filter_instrument:
            matches_instrument = any(
                isinstance(inst, dict) and filter_instrument in inst.get("name", "").lower()
                for inst in u_instruments
            )

        # Filtrage par niveau
        matches_niveau = True
        if filter_niveau:
            matches_niveau = any(
                isinstance(inst, dict) and (inst.get("niveau") or "").lower() == filter_niveau
                for inst in u_instruments
            )

        # Filtrage par recherche utilisateur (nom, prénom, username)
        matches_search = True
        if filter_search:
            name_str = f"{u.prenom} {u.nom} {u.nom_utilisateur}".lower()
            matches_search = filter_search in name_str

        if matches_instrument and matches_niveau and matches_search:
            musiciens.append({
                "id": u.id,
                "nom_utilisateur": u.nom_utilisateur,
                "prenom": u.prenom,
                "nom": u.nom,
                "promotion": u.promotion,
                "cycle": u.cycle,
                "photo": u.get_photo_file(),
                "instruments": u_instruments,
                "email": u.email,
                "telephone": u.telephone
            })

    sorted_instruments = sorted(
        [{"name": k, "count": v} for k, v in instruments_counts.items()],
        key=lambda x: (-x["count"], x["name"].lower())
    )

    return {
        "musiciens": musiciens,
        "available_instruments": sorted_instruments,
        "total_musiciens": len(musiciens)
    }, None, 200

