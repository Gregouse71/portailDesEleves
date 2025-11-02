import { verifierSuperutilisateur } from '../../api/api_utilisateurs';
import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/base';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';

export default function ListeAssos() {
  const navigate = useNavigate();

  const { data: isSuperUser = false } = useQuery({
    queryKey: ['estSuperutilisateur'],
    queryFn: verifierSuperutilisateur,
  });
  const { data: assos = [] } = useQuery({
    queryKey: ['listeAssos'],
    queryFn: chargerListeAssos,
  });

  return (
    <Container className="py-4">
      <h1 className="mb-3">Associations</h1>
      <p className="text-muted">Ici tu peux retrouver toutes les associations des Mines</p>
      <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 justify-content-center">
        {assos.map((asso) => (
          <Col key={asso.id}>
            <AssoCard asso={asso} />
          </Col>
        ))}
        {isSuperUser && (
          <Col>
            <Card
              className="h-100 text-center hover-overlay"
              onClick={() => navigate("/assos/ajouter")}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <img src='/assets/icons/plus.svg' alt="Ajouter une association" style={{ width: "50px" }} />
                <Card.Title className="mt-2">Ajouter</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}