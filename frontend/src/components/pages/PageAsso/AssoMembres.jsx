import { useState, useMemo } from "react";
import { ajouterMandat, chargerAsso, estUtilisateurDansAsso } from "../../../api/api_associations";
import { Card, Button, Form } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AssoMandat from "../../elements/AssoMandat";

function AssoMembres({ asso_id }) {
    const queryClient = useQueryClient();

    const [isAjoutMandat, setIsAjoutMandat] = useState(false);
    const [nomNouveauMandat, setNomNouveauMandat] = useState("");

    const { data: asso = {mandat: ""}, isLoading } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
    });

    const sortedMandats = useMemo(() => {
        if (!asso?.mandats) return [];
        return [...asso.mandats].sort((a, b) => {
            if (a.actuel) return -1;
            if (b.actuel) return 1;
            return b.position - a.position;
        });
    }, [asso]);

    if (isLoading) return <>Chargement...</>

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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Les membres</h2>
                {membreData.autorise &&
                    <Button variant="outline-secondary" onClick={() => setIsAjoutMandat(!isAjoutMandat)}>
                        <img src="/assets/icons/plus.svg" alt="ajouter" className="theme-icon" />
                    </Button>}
            </div>

            <div className="mb-3">
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

            {sortedMandats.map((mandat, i) => (
                <AssoMandat key={i} mandat={mandat} asso={asso} canModify={membreData.autorise} />
            ))}
        </div>
    )
}

export default AssoMembres;