import '../../../assets/styles/liste_assos.scss';
import '../../../assets/styles/asso.scss';

import { Container } from "react-bootstrap";
import { obtenirAssosUtilisateur, modifierOrdreAssos } from "../../../api/api_utilisateurs";
import AssoCard from "../../elements/AssoCard";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import OngletTemplate from '../../templates/ongletTab';
import Chargement from '../../elements/Chargement';

export default function TabAsso({ id, autoriseAModifier }) {
    const { data: assos = { actuel: [], ancien: [] }, isLoading } = useQuery({
        queryKey: ['assosUser', id],
        queryFn: () => obtenirAssosUtilisateur(id),
    });

    const [actuel, setActuel] = useState([]);
    const [ancien, setAncien] = useState([]);

    const dragIndex = useRef(null);
    const dragIndexAncien = useRef(null);

    useEffect(() => {
        setActuel(assos.actuel);
        setAncien(assos.ancien);
    }, [assos.actuel, assos.ancien]);

    const handleDragStart = (index) => {
        dragIndex.current = index;
    };
    const handleDragStartAncien = (index) => {
        dragIndexAncien.current = index;
    };

    const handleDrop = async (index) => {
        if (dragIndex.current === null || dragIndex.current === index) return;
        const nouvelOrdre = [...actuel];
        const [deplace] = nouvelOrdre.splice(dragIndex.current, 1);
        nouvelOrdre.splice(index, 0, deplace);
        dragIndex.current = null;
        setActuel(nouvelOrdre);
        await modifierOrdreAssos(id, nouvelOrdre.map((a, i) => ({ id: a.mandat_id, ordre: i })));
    };

    const handleDropAncien = async (index) => {
        if (dragIndexAncien.current === null || dragIndexAncien.current === index) return;
        const nouvelOrdre = [...ancien];
        const [deplace] = nouvelOrdre.splice(dragIndexAncien.current, 1);
        nouvelOrdre.splice(index, 0, deplace);
        dragIndexAncien.current = null;
        setAncien(nouvelOrdre);
        await modifierOrdreAssos(id, nouvelOrdre.map((a, i) => ({ id: a.mandat_id, ordre: i + 1000 })));
    };

    if (isLoading) return <Chargement/>

    return <>
        <OngletTemplate
            titre="Associations actuelles"
            contenu={
            <div className="asso-grid">
                {actuel.map((asso, index) => (
                    <div
                        key={asso.mandat_id || `${asso.asso_id}-${index}`}
                        draggable={autoriseAModifier}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        style={{ cursor: autoriseAModifier ? 'grab' : 'default' }}
                    >
                        <AssoCard asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} img={asso.img} isEditMode={false} onEditAsso={() => { }} />
                    </div>
                ))}
            </div>}
        />
        <OngletTemplate
            titre="Associations actuelles"
            contenu={
            <div className="asso-grid">
                {ancien.map((asso, index) => (
                    <div
                        key={asso.mandat_id || `${asso.asso_id}-${index}`}
                        draggable={autoriseAModifier}
                        onDragStart={() => handleDragStartAncien(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropAncien(index)}
                        style={{ cursor: autoriseAModifier ? 'grab' : 'default' }}
                    >
                        <AssoCard asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} img={asso.img} isEditMode={false} onEditAsso={() => { }} />
                    </div>
                ))}
            </div>}
        />
    </>
        ;
}