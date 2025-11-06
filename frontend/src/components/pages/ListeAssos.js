import { verifierSuperutilisateur } from '../../api/api_utilisateurs';
import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../api/base';
import { Container, Card } from 'react-bootstrap';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';
import '../../assets/styles/asso.scss';

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
      <div className="asso-grid">
        {assos.map((asso) => (
          <AssoCard key={asso.id} asso={asso} />
        ))}
        {isSuperUser && (
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
      </div>
    </Container>
  );
}