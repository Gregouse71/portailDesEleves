import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';
import '../../assets/styles/asso.scss';
import { useLayout } from '../../layouts/Layout';
import { useState } from 'react';
import BoutonEditer from '../elements/BoutonEditer';

export default function ListeAssos() {
  const navigate = useNavigate();
  const { userData } = useLayout();
  const [editMode, setEditMode] = useState(false);
  const [editingAssoId, setEditingAssoId] = useState(null);

  const { data: assos = [] } = useQuery({
    queryKey: ['listeAssos'],
    queryFn: chargerListeAssos,
  });

  const sortedAssos = [...assos].sort((a, b) => {
    if (a.ordre_importance === null) return 1;
    if (b.ordre_importance === null) return -1;
    return b.ordre_importance - a.ordre_importance;
  });

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Associations</h1>
        {userData.is_superuser && <BoutonEditer onClick={() => setEditMode(!editMode)} />}
      </div>

      <p className="text-muted">Ici tu peux retrouver toutes les associations des Mines</p>

      {editMode && (
        <div className="d-flex gap-2 mb-3">
          <Button variant="success" onClick={() => navigate("/assos/ajouter")}>
            <img src="/assets/icons/plus.svg" alt="Creer une nouvelle asso" />
            {" "}Creer une nouvelle asso
          </Button>
        </div>
      )}

      <div className="asso-grid">
        {sortedAssos.map((asso) => (
          <AssoCard 
            key={asso.id} 
            asso_id={asso.id} 
            isEditMode={editMode} 
            isEditingAsso={editingAssoId === asso.id}
            onEditAsso={setEditingAssoId}
          />
        ))}
      </div>
    </Container>
  );
}