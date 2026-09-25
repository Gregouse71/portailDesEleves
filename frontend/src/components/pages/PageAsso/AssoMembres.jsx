import { useState, useMemo } from "react";
import { ajouterMandat, chargerAsso, estUtilisateurDansAsso } from "../../../api/api_associations";
import { Card, Button, Form } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AssoMandat from "../../elements/AssoMandat";
import OngletTemplate from "../../templates/OngletTemplate";

function AssoMembres({ asso_id, membreData }) {
    const queryClient = useQueryClient();

    const [isAjoutMandat, setIsAjoutMandat] = useState(false);
    const [nomNouveauMandat, setNomNouveauMandat] = useState("");

    const { data: asso = { mandat: "" }, isLoading } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });

    const sortedMandats = useMemo(() => {
        if (!asso?.mandats) return [];
        return [...asso.mandats].sort((a, b) => {
            if (a.actuel) return -1;
            if (b.actuel) return 1;
            return b.position - a.position;
        });
    }, [asso]);

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

    return <OngletTemplate
        titre="Les membres"
        isLoading={isLoading}
        avecBouton={membreData.autorise} onButonClick={() => setIsAjoutMandat(!isAjoutMandat)}
        contenu={<>
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
                <AssoMandat key={i} id={mandat.id} asso={asso} membreData={membreData} />
            ))}
        </>} />
}

export default AssoMembres;