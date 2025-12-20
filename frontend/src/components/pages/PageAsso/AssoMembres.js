import React, { useState, useEffect } from "react";
import Select from "react-select";
import { ajouterMandat, ajouterMembre, chargerAsso, estUtilisateurDansAsso, modifierMandat, modifierPositionMembre, modifierRoleMembre, retirerMembre, supprimerMandat } from "../../../api/api_associations";
import { obtenirListeDesPromos, chargerUtilisateurs } from "../../../api/api_utilisateurs";
import { Card, Button, Form, Row, Col } from "react-bootstrap";
import UserCard from "../../elements/UserCard";
import BoutonEditer from "../../elements/BoutonEditer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AssoMandat from "../../elements/AssoMandat";

function AssoMembres({ asso_id }) {
    const queryClient = useQueryClient();

    const [isGestionMembres, setIsGestionMembres] = useState(false);
    const [isAjoutMembre, setIsAjoutMembre] = useState(false);

    const [isAjoutMandat, setIsAjoutMandat] = useState(false);
    const [nomNouveauMandat, setNomNouveauMandat] = useState("");

    const [listeNouveauxMembres, setListeNouveauxMembres] = useState([]);

    const [promoAjoutMembre, setPromoAjoutMembre] = useState(null);
    const [idAjoutMembre, setIdAjoutMembre] = useState(null);
    const [mandatAjoutMembre, setMandatAjoutMembre] = useState(null);

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

    const handlePromoChange = async (selectedOption) => {
        setPromoAjoutMembre(selectedOption);
        setIdAjoutMembre(null); // Reset user selection
        setListeNouveauxMembres([]); // Reset user list

        if (selectedOption) {
            try {
                const listeMembres = await chargerUtilisateurs(selectedOption.value);
                setListeNouveauxMembres(listeMembres);
            } catch (erreur) {
                console.error(erreur);
            }
        }
    }

    useEffect(() => {
        if (isAjoutMembre) {
            if (asso.mandats && asso.mandats.length > 0 && !mandatAjoutMembre) {
                const latestMandat = asso.mandats[0];
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
    }, [isAjoutMembre, asso.mandats, listePromos]);


    const handleSetIsGestionMembres = (newState) => {
        if (!newState) {
            setIsAjoutMembre(false);
            setIsAjoutMandat(false);
        }
        setIsGestionMembres(newState);
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

    const handleNouveauMandat = async (nom) => {
        if (nom) {
            try {
                const maxPosition = asso.mandats.reduce((max, mandat) => Math.max(max, mandat.position), 0);
                await ajouterMandat(asso_id, nom, maxPosition + 1);
                queryClient.invalidateQueries(['asso', asso_id]);
                setNomNouveauMandat("");
            } catch (erreur) {
                console.error(erreur);
            }
        }
        setIsAjoutMandat(false);
    }
    

    const sortedMandats = [...asso.mandats].sort((a, b) => {
        if (a.actuel) return -1;
        if (b.actuel) return 1;
        return b.position - a.position;
    });

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
                                            options={asso.mandats.map(m => ({ value: m.id, label: m.nom }))}
                                            value={mandatAjoutMembre}
                                            onChange={setMandatAjoutMembre}
                                            placeholder="Choisir un mandat..."
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
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
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
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
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
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

            {sortedMandats.map((mandat) => (
                <AssoMandat mandat={mandat} asso={asso} isGestion={isGestionMembres}/>
            ))}
        </div>
    )
}

export default AssoMembres;