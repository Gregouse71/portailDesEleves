import React, { useState } from 'react';
import { obtenirListeDesUtilisateurs } from '../../api/api_utilisateurs';
import { useNavigate, useParams } from 'react-router-dom';
import UserCard from '../elements/UserCard';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import '../../assets/styles/asso.scss';
import { useQuery } from '@tanstack/react-query';

function TrombiPromo() {
    const [cyclesSelectionnes, setCyclesSelectionnes] = useState(["ic", "ast", "ev", "vs", "isup"]); // Les cycles sont pré-cochés
    const navigate = useNavigate();

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

    return (
        <Container className="py-4 trombi-promo-page">
            <Button variant="outline-secondary" onClick={() => navigate("/trombi")} className="mb-3">
                Retour
            </Button>
            <h1>Promotion {promo}</h1>
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
                <div className="member-grid">
                    {utilisateurs.map(user => (
                        <UserCard user={user} key={user.id} isGestion={false} isModifying={false} />
                    ))}
                </div>
            ) : (
                <p>Aucun cycle sélectionné.</p>
            )}
        </Container>
    );
}

export default TrombiPromo;
