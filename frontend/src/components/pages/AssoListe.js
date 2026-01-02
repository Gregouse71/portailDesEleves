import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';
import '../../assets/styles/asso.scss';
import { useLayout } from '../../layouts/Layout';
import { useState } from 'react';
import DropdownEditer from '../elements/DropdownEditer';

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
                <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                    {userData.is_superuser && <DropdownEditer list={[
                        { can: true, onClick: () => setEditMode(!editMode), name: "Modifier" },
                        { can: true, onClick: () => navigate("/assos/ajouter"), name: "Ajouter" },
                    ]}
                    />
                    }
                </div>
            </div>

            <p className="text-muted">Ici tu peux retrouver toutes les associations des Mines</p>

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