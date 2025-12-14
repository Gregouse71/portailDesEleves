import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';
import '../../assets/styles/asso.scss';
import { useLayout } from '../../layouts/Layout';

export default function ListeAssos() {
  const navigate = useNavigate();
  const { userData } = useLayout();

  const { data: assos = [] } = useQuery({
    queryKey: ['listeAssos'],
    queryFn: chargerListeAssos,
  });

  return (
    <Container className="py-4">
      <h1 className="mb-3">Associations</h1>
      <p className="text-muted">Ici tu peux retrouver toutes les associations des Mines</p>
      <div className="asso-grid">
        {userData.is_superuser && (
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
        )}
        {assos.map((asso_id) => (
          <AssoCard key={asso_id} asso_id={asso_id} />
        ))}
      </div>
    </Container>
  );
}