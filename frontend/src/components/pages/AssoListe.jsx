import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import { Container, Form } from 'react-bootstrap';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';
import '../../assets/styles/asso.scss';
import { useLayout } from '../../layouts/Layout';
import { useState } from 'react';
import DropdownEditer from '../elements/DropdownEditer';

String.prototype.localeContains = function (sub) {
    if (sub === "") return true;
    if (!sub || !this.length) return false;
    sub = "" + sub;
    if (sub.length > this.length) return false;
    let ascii = s => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return ascii(this).includes(ascii(sub));
}


export default function ListeAssos() {
    const navigate = useNavigate();
    const { userData } = useLayout();
    const [editMode, setEditMode] = useState(false);
    const [editingAssoId, setEditingAssoId] = useState(null);
    const [query, setQuery] = useState("");

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
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-3">
                <p className="text-muted mb-0">Retrouve ici toutes les assos</p>
                <div className="w-md-auto">
                    <Form onSubmit={e => { e.preventDefault(); }} className="w-100">
                        <Form.Group>
                            <Form.Control
                                type="text"
                                name="query"
                                placeholder="Rechercher"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </div>
            </div>

            <div className="asso-grid">
                {sortedAssos.filter(p => p.nom.localeContains(query, "fr", { sensitivity: "base" })).map((asso) => (
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