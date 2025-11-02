import React, { useState, useEffect } from "react";
import { ajouterMembre, chargerAsso, estUtilisateurDansAsso, modifierPositionMembre, modifierRoleMembre, retirerMembre } from "../../../api/api_associations";
import { obtenirListeDesPromos, chargerUtilisateursParPromo } from "../../../api/api_utilisateurs";
import { BASE_URL } from "../../../api/base";
import { useNavigate } from "react-router-dom";
import { Card, Button, Form } from "react-bootstrap";
import UserCard from "../../elements/UserCard";
import BoutonEditer from "../../elements/BoutonEditer";
import { useQuery } from "@tanstack/react-query";

function AssoMembres({ asso_id }) {
    const [listeMembres, setListeMembres] = useState([]);
    const [isGestionMembres, setIsGestionMembres] = useState(false);
    const [isAjoutMembre, setIsAjoutMembre] = useState(false);
    const [listeNouveauxMembres, setListeNouveauxMembres] = useState([]);
    const [promoAjoutMembre, setPromoAjoutMembre] = useState("");
    const [idAjoutMembre, setIdAjoutMembre] = useState("");
    const [idMembreModifier, setIdMembreModifier] = useState(null);
    const [nouveauRole, setNouveauRole] = useState(null);
    const [nouvellePosition, setNouvellePosition] = useState("");
    const navigate = useNavigate();

    const { data: asso = null } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
    });
    const { data: listePromos = null } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

    useEffect(() => {
        if (asso) { setListeMembres(asso.membres) };
    }, [asso]);

    const handleSetIsGestionMembres = (newState) => {
        if (!newState) {
            setIdMembreModifier(null);
            setPromoAjoutMembre("");
            setIdAjoutMembre("");
            setIsAjoutMembre(false);
        }
        setIsGestionMembres(newState);
    }

    const handleRetirerMembre = async (membreId) => {
        try {
            await retirerMembre(asso_id, membreId);
            const asso = await chargerAsso(asso_id);
            setListeMembres(asso.membres);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMembreChange = async (membreId) => {
        if (nouveauRole != null) {
            try {
                await modifierRoleMembre(asso_id, membreId, nouveauRole);
                const asso = await chargerAsso(asso_id);
                setListeMembres(asso.membres);
            } catch (erreur) {
                console.error(erreur);
            }
        }
        if (nouvellePosition != null) {
            try {
                await modifierPositionMembre(asso_id, membreId, parseInt(nouvellePosition));
                const asso = await chargerAsso(asso_id);
                setListeMembres(asso.membres)
            } catch (erreur) {
                console.error(erreur)
            }
        }
        setIdMembreModifier(null);
    }

    const handleSetPromoAjoutMembre = async (promo) => {
        if (promo !== "") {
            try {
                const listeMembres = await chargerUtilisateursParPromo(promo);
                setListeNouveauxMembres(listeMembres);
                setPromoAjoutMembre(promo);
            } catch (erreur) {
                console.error(erreur);
            }
        }
        else {
            setPromoAjoutMembre(promo);
            setIdAjoutMembre("");
        }
    }

    const handleAjoutMembre = async (userId) => {
        if (idAjoutMembre != null) {
            try {
                await ajouterMembre(asso_id, userId);
                setIsAjoutMembre(false);
                setIdAjoutMembre("");
                const asso = await chargerAsso(asso_id);
                setListeMembres(asso.membres);
            } catch (erreur) {
                console.error(erreur);
            }
        }
        setIsAjoutMembre(false);
        setIdAjoutMembre("");
    }

    const handleModifierParametres = (userId, userRole, userPosition) => {
        if (idMembreModifier === userId) {
            setIdMembreModifier(null);
        }
        else {
            setNouveauRole(userRole);
            setNouvellePosition(userPosition);
            setIdMembreModifier(userId);
        }
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Les membres</h2>
                {membreData.autorise && <BoutonEditer onClick={() => handleSetIsGestionMembres(!isGestionMembres)} />}
            </div>
            <div className="member-grid">
                {listeMembres.map((user) => (
                    <UserCard user={user} isGestion={isGestionMembres} isModifying={idMembreModifier === user.id}
                        f1={() => handleRetirerMembre(user.id)}
                        t1="Supprimer ce membre"
                        f2={() => { handleModifierParametres(user.id, user.role, user.position) }}
                        t2="Modifier les paramètres"
                        values={[
                            { label: "Rôle", value: nouveauRole, onChange: (e) => setNouveauRole(e.target.value) },
                            { label: "Position", value: nouvellePosition, onChange: (e) => setNouvellePosition(e.target.value) }
                        ]}
                        validate={() => handleMembreChange(user.id)}
                    />
                ))}

                {membreData.autorise && isGestionMembres &&
                    <Card
                        className="text-center h-100"
                        onClick={!isAjoutMembre ? () => setIsAjoutMembre(true) : undefined}
                        style={!isAjoutMembre ? { cursor: 'pointer' } : {}}
                    >
                        <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                            {!isAjoutMembre && <>
                                <img src='/assets/icons/plus.svg' alt="Ajouter un membre" style={{ width: "50px" }} />
                                <Card.Title className="mt-2">Ajouter un membre</Card.Title>
                            </>}
                            {isAjoutMembre && <>
                                <Form.Group className="mb-2">
                                    <Form.Label>Promotion</Form.Label>
                                    <Form.Select value={promoAjoutMembre} onChange={(e) => handleSetPromoAjoutMembre(e.target.value)}>
                                        <option value="">---</option>
                                        {listePromos.map((promoId) => <option key={promoId}>{promoId}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Nom</Form.Label>
                                    <Form.Select value={idAjoutMembre} onChange={(e) => setIdAjoutMembre(e.target.value)}>
                                        <option value="">---</option>
                                        {listeNouveauxMembres.map((user) => <option key={user.id} value={user.id}>{user.nom_utilisateur}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Button variant="primary" onClick={() => handleAjoutMembre(idAjoutMembre)}>Ajouter</Button>
                            </>}
                        </Card.Body>
                    </Card>
                }
            </div>
        </div>
    )
}

export default AssoMembres;