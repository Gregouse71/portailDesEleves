import React, { useState, useEffect } from "react";
import Select from "react-select";
import { ajouterMandat, ajouterMembre, chargerAsso, estUtilisateurDansAsso, modifierNomMandat, modifierPositionMembre, modifierRoleMembre, retirerMembre, supprimerMandat } from "../../../api/api_associations";
import { obtenirListeDesPromos, chargerUtilisateursParPromo } from "../../../api/api_utilisateurs";
import { BASE_URL } from "../../../api/base";
import { useNavigate } from "react-router-dom";
import { Card, Button, Form } from "react-bootstrap";
import UserCard from "../../elements/UserCard";
import BoutonEditer from "../../elements/BoutonEditer";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function AssoMembres({ asso_id }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [listeMandats, setListeMandats] = useState([]);
    const [isGestionMembres, setIsGestionMembres] = useState(false);
    const [isAjoutMembre, setIsAjoutMembre] = useState(false);

    const [isAjoutMandat, setIsAjoutMandat] = useState(false);
    const [nomNouveauMandat, setNomNouveauMandat] = useState("");

    const [listeNouveauxMembres, setListeNouveauxMembres] = useState([]);

    const [promoAjoutMembre, setPromoAjoutMembre] = useState(null);
    const [idAjoutMembre, setIdAjoutMembre] = useState(null);
    const [mandatAjoutMembre, setMandatAjoutMembre] = useState(null);

    const [idMembreModifier, setIdMembreModifier] = useState(null);
    const [nouveauRole, setNouveauRole] = useState("");
    const [nouvellePosition, setNouvellePosition] = useState("");
    const [editingMandatId, setEditingMandatId] = useState(null);

    const { data: asso = { mandats: [] } } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
    });
    const { data: listePromos = [] } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

    useEffect(() => {
        if (asso && asso.mandats) {
            const sortedMandats = [...asso.mandats].sort((a, b) => b.id - a.id);
            setListeMandats(sortedMandats);
        };
    }, [asso]);

    const handlePromoChange = async (selectedOption) => {
        setPromoAjoutMembre(selectedOption);
        setIdAjoutMembre(null); // Reset user selection
        setListeNouveauxMembres([]); // Reset user list

        if (selectedOption) {
            try {
                const listeMembres = await chargerUtilisateursParPromo(selectedOption.value);
                setListeNouveauxMembres(listeMembres);
            } catch (erreur) {
                console.error(erreur);
            }
        }
    }

    useEffect(() => {
        if (isAjoutMembre) {
            if (listeMandats && listeMandats.length > 0 && !mandatAjoutMembre) {
                const latestMandat = listeMandats[0];
                setMandatAjoutMembre({ value: latestMandat.id, label: latestMandat.nom });
            }
            if (listePromos && listePromos.length > 0 && !promoAjoutMembre) {
                const latestPromo = listePromos[0];
                handlePromoChange({ value: latestPromo, label: latestPromo });
            }
        } else {
            // Reset when closing the form
            setPromoAjoutMembre(null);
            setIdAjoutMembre(null);
            setMandatAjoutMembre(null);
            setListeNouveauxMembres([]);
        }
    }, [isAjoutMembre, listeMandats, listePromos]);


    const handleSetIsGestionMembres = (newState) => {
        if (!newState) {
            setIdMembreModifier(null);
            setIsAjoutMembre(false);
            setIsAjoutMandat(false);
        }
        setIsGestionMembres(newState);
    }

    const handleRetirerMembre = async (mandatId, membreId) => {
        try {
            await retirerMembre(asso_id, mandatId, membreId);
            queryClient.invalidateQueries(['asso', asso_id]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMembreChange = async (mandatId, membreId) => {
        const memberToModify = listeMandats.flatMap(m => m.membres).find(u => u.id === membreId);
        if (!memberToModify) return;

        const originalRole = memberToModify.role || "";
        const originalPosition = memberToModify.position?.toString() || "";

        let roleChanged = nouveauRole !== originalRole;
        let positionChanged = nouvellePosition !== originalPosition;

        if (roleChanged) {
            try {
                await modifierRoleMembre(asso_id, mandatId, membreId, nouveauRole);
            } catch (erreur) {
                console.error(erreur);
            }
        }
        if (positionChanged) {
            try {
                await modifierPositionMembre(asso_id, mandatId, membreId, parseInt(nouvellePosition));
            } catch (erreur) {
                console.error(erreur)
            }
        }

        if (roleChanged || positionChanged) {
            queryClient.invalidateQueries(['asso', asso_id]);
        }

        setIdMembreModifier(null);
    }

    const handleAjoutMembre = async () => {
        if (idAjoutMembre && mandatAjoutMembre) {
            try {
                await ajouterMembre(asso_id, mandatAjoutMembre.value, idAjoutMembre.value);
                setIsAjoutMembre(false);
                queryClient.invalidateQueries(['asso', asso_id]);
            } catch (erreur) {
                console.error(erreur);
            }
        }
    }

    const handleModifierParametres = (userId, userRole, userPosition) => {
        if (idMembreModifier === userId) {
            setIdMembreModifier(null);
        }
        else {
            setNouveauRole(userRole || "");
            setNouvellePosition(userPosition?.toString() || "");
            setIdMembreModifier(userId);
        }
    }

    const handleNouveauMandat = async (nom) => {
        if (nom) {
            try {
                await ajouterMandat(asso_id, nom);
                queryClient.invalidateQueries(['asso', asso_id]);
                setNomNouveauMandat("");
            } catch (erreur) {
                console.error(erreur);
            }
        }
        setIsAjoutMandat(false);
    }

    const handleEditMandatName = async (mandatId, newName) => {
        if (editingMandatId === mandatId) {
            // Save logic
            try {
                await modifierNomMandat(asso_id, mandatId, newName);
                queryClient.invalidateQueries(['asso', asso_id]);
                setEditingMandatId(null);
            } catch (error) {
                console.error(error);
            }
        } else {
            // Enable editing
            setEditingMandatId(mandatId);
        }
    };

    const handleDelMandat = async (id) => {
        try {
            await supprimerMandat(asso_id, id);
            queryClient.invalidateQueries(['asso', asso_id]);
        } catch (erreur) {
            console.error(erreur);
        }
    }

    const setNomMandat = async (i, nom) => {
        let newListe = [...listeMandats];
        newListe[i] = { ...newListe[i], "nom": nom };
        setListeMandats(newListe);
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Les membres</h2>
                {membreData.autorise && <BoutonEditer onClick={() => handleSetIsGestionMembres(!isGestionMembres)} />}
            </div>

            {isGestionMembres && (
                <div className="mb-3">
                    {!isAjoutMembre && !isAjoutMandat && (
                        <div className="d-flex gap-2">
                            <Button onClick={() => setIsAjoutMembre(true)}>
                                <img src='/assets/icons/plus.svg' alt="Ajouter un membre" />
                                Ajouter un membre
                            </Button>
                            <Button variant="info" onClick={() => setIsAjoutMandat(true)}>
                                <img src='/assets/icons/plus.svg' alt="Ajouter un mandat" />
                                Ajouter un mandat
                            </Button>
                        </div>
                    )}

                    {isAjoutMembre && (
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Ajouter un membre</Card.Title>
                                <div className="w-100 p-2">
                                    <Form.Group className="mb-3 text-start">
                                        <Form.Label>Mandat</Form.Label>
                                        <Select
                                            options={listeMandats.map(m => ({ value: m.id, label: m.nom }))}
                                            value={mandatAjoutMembre}
                                            onChange={setMandatAjoutMembre}
                                            placeholder="Choisir un mandat..."
                                            menuPortalTarget={document.body} 
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 1 }) }}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3 text-start">
                                        <Form.Label>Promotion</Form.Label>
                                        <Select
                                            options={listePromos.map(p => ({ value: p, label: p }))}
                                            value={promoAjoutMembre}
                                            onChange={handlePromoChange}
                                            placeholder="Choisir une promo..."
                                            menuPortalTarget={document.body} 
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 1 }) }}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3 text-start">
                                        <Form.Label>Utilisateur</Form.Label>
                                        <Select
                                            options={listeNouveauxMembres.map(u => ({ value: u.id, label: u.nom_utilisateur }))}
                                            value={idAjoutMembre}
                                            onChange={setIdAjoutMembre}
                                            placeholder="Choisir un utilisateur..."
                                            isDisabled={!promoAjoutMembre || listeNouveauxMembres.length === 0}
                                            menuPortalTarget={document.body} 
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 1 }) }}
                                        />
                                    </Form.Group>
                                    <Button variant="primary" onClick={handleAjoutMembre} disabled={!idAjoutMembre || !mandatAjoutMembre}>Ajouter</Button>
                                    <Button variant="secondary" onClick={() => setIsAjoutMembre(false)} className="ms-2">Annuler</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {isAjoutMandat && (
                        <Card>
                            <Card.Body>
                                <Card.Title>Ajouter un mandat</Card.Title>
                                <div className="w-100 p-2">
                                    <Form.Group className="mb-2 text-start">
                                        <Form.Label>Nom du mandat</Form.Label>
                                        <Form.Control value={nomNouveauMandat} onChange={(e) => setNomNouveauMandat(e.target.value)} />
                                    </Form.Group>
                                    <Button variant="primary" onClick={() => handleNouveauMandat(nomNouveauMandat)} disabled={!nomNouveauMandat}>Ajouter</Button>
                                    <Button variant="secondary" onClick={() => setIsAjoutMandat(false)} className="ms-2">Annuler</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            )}

            {listeMandats.map((mandat, i) => (
                <div key={mandat.id} className="mb-4">
                    {!isGestionMembres ?
                        <h4 className="mb-3">{mandat.nom}</h4>
                        :
                        <div className="d-flex align-items-center mb-3">
                            <Form.Control value={listeMandats[i].nom} onChange={(e) => setNomMandat(i, e.target.value)} className="me-2" disabled={editingMandatId !== mandat.id} />
                            <Button
                                variant={editingMandatId === mandat.id ? "success" : "primary"}
                                onClick={() => handleEditMandatName(mandat.id, listeMandats[i].nom)}
                                className="me-2 text-nowrap"
                            >
                                {editingMandatId === mandat.id ? "Valider" : "Changer le nom"}
                            </Button>
                            <Button variant="danger" className="text-nowrap" onClick={() => handleDelMandat(mandat.id)}>Supprimer le mandat</Button>
                        </div>
                    }
                    <div className="member-grid">
                        {mandat.membres.map((user) => (
                            <UserCard user={user} isGestion={isGestionMembres} isModifying={idMembreModifier === user.id}
                                f1={() => handleRetirerMembre(mandat.id, user.id)}
                                t1="Supprimer ce membre"
                                f2={() => { handleModifierParametres(user.id, user.role, user.position) }}
                                t2="Modifier les paramètres"
                                values={[
                                    { label: "Rôle", value: nouveauRole, onChange: (e) => setNouveauRole(e.target.value) },
                                    { label: "Position", value: nouvellePosition, onChange: (e) => setNouvellePosition(e.target.value) }
                                ]}
                                validate={() => handleMembreChange(mandat.id, user.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default AssoMembres;