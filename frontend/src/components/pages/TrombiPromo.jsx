import { useState } from 'react';
import { obtenirListeDesUtilisateurs } from '../../api/api_utilisateurs';
import { useParams } from 'react-router-dom';
import UserCard from '../elements/UserCard';
import { Form, Row, Col } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import PageRandom from '../templates/PageRandom';

export default function TrombiPromo() {
    const [cyclesSelectionnes, setCyclesSelectionnes] = useState(["ic", "ast", "ev", "vs", "isup"]); // Les cycles sont pré-cochés

    const cyclesDisponibles = ["ic", "ast", "ev", "vs", "isup"];
    const { promo } = useParams();

    const { data: utilisateurs = [] } = useQuery({
        queryKey: ['listePromo', promo, cyclesSelectionnes],
        queryFn: () => obtenirListeDesUtilisateurs(promo, cyclesSelectionnes),
    });

    const toggleCycle = (cycle) => {
        setCyclesSelectionnes(prev =>
            prev.includes(cycle) ? prev.filter(c => c !== cycle) : [...prev, cycle]
        );
    };

    return <PageRandom
        titre={`Promotion ${promo}`}
        avecBoutonRetour destRetour={"/trombi"}
        contenu={<>
            <Form className="mb-4">
                <Row>
                    <Col>
                        {cyclesDisponibles.map(cycle => (
                            <Form.Check
                                inline
                                key={cycle}
                                type="checkbox"
                                id={`cycle-${cycle}`}
                                label={cycle.toUpperCase()}
                                value={cycle}
                                checked={cyclesSelectionnes.includes(cycle)}
                                onChange={() => toggleCycle(cycle)}
                            />
                        ))}
                    </Col>
                </Row>
            </Form>

            {cyclesSelectionnes.length > 0 ? (
                <div className="avatars-grid">
                    {utilisateurs.map(user => (
                        <UserCard user={user} key={user.id} isGestion={false} isModifying={false} />
                    ))}
                </div>
            ) : (
                <p>Aucun cycle sélectionné.</p>
            )}
        </>} />;
}
