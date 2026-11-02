import { chargerListeAssos } from '../../api/api_associations';
import { useNavigate } from 'react-router-dom';
import AssoCard from '../elements/AssoCard';
import { useQuery } from '@tanstack/react-query';
import { useProtected } from '../../Protected';
import { useState } from 'react';
import PageRandom from '../templates/PageRandom';

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
    const { userData } = useProtected();
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

    return <PageRandom
        titre="Associations"
        sousTitre="Retrouve ici toutes les assos"
        avecDrop={userData.is_superuser} paramsDrop={[
            { can: true, onClick: () => setEditMode(!editMode), name: "Modifier" },
            { can: true, onClick: () => navigate("/assos/ajouter"), name: "Ajouter" },
        ]}
        avecRequete={true} paramsReq={{ query, onChange: (e) => setQuery(e.target.value) }}
        contenu={<div className="cards-grid">
            {sortedAssos.filter(p => p.nom.localeContains(query, "fr", { sensitivity: "base" })).map((asso) => (
                <AssoCard
                    key={asso.id}
                    asso_id={asso.id}
                    isEditMode={editMode}
                    isEditingAsso={editingAssoId === asso.id}
                    onEditAsso={setEditingAssoId}
                />
            ))}
        </div>} />;
}
