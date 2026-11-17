import { obtenirAssosUtilisateur, modifierOrdreAssos } from "../../api/api_utilisateurs";
import AssoCard from "../../components/elements/AssoCard";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import OngletTemplate from '../../components/templates/OngletTemplate';
import Chargement from '../../components/elements/Chargement';

export default function TabAsso({ id, autoriseAModifier }) {
    const { data: assos = { actuel: [], ancien: [] }, isLoading } = useQuery({
        queryKey: ['assosUser', id],
        queryFn: () => obtenirAssosUtilisateur(id),
    });

    if (isLoading) return <Chargement />;
    return <AssosDnd id={id} autoriseAModifier={autoriseAModifier} initActuel={assos.actuel} initAncien={assos.ancien} />;
}

function AssosList({ id, autoriseAModifier, list, setList, type }) {
    const [dragState, setDragState] = useState(null); // { from, over }
    const dragIdxRef = useRef(null);
    const touchStartRef = useRef(null);

    const reorder = async (from, to) => {
        if (from === null || to === null || from === to) return;
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setList(next);
        await modifierOrdreAssos(id, next.map((a, i) => ({ id: a.mandat_id, ordre: i })));
    };

    return (
        <div className="cards-grid">
            {list.map((asso, index) => {
                const isDragging = dragState?.from === index;
                const isOver = dragState?.over === index && dragState?.from !== index;

                return (
                    <div
                        key={asso.mandat_id || `${asso.asso_id}-${index}`}
                        data-idx={index}
                        data-type={type}
                        draggable={autoriseAModifier}
                        onDragStart={() => { dragIdxRef.current = index; }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                            reorder(dragIdxRef.current, index);
                            dragIdxRef.current = null;
                        }}
                        onTouchStart={(e) => {
                            if (!autoriseAModifier) return;
                            const t = e.touches[0];
                            touchStartRef.current = { x: t.clientX, y: t.clientY, from: index };
                            setDragState({ from: index, over: index });
                        }}
                        onTouchMove={(e) => {
                            if (!touchStartRef.current) return;
                            const t = e.touches[0];
                            const target = document.elementFromPoint(t.clientX, t.clientY)?.closest(`[data-type="${type}"][data-idx]`);
                            const over = target ? Number(target.dataset.idx) : null;
                            setDragState((prev) => prev ? { ...prev, over } : null);
                        }}
                        onTouchEnd={(e) => {
                            if (!touchStartRef.current) return;
                            const { x, y, from } = touchStartRef.current;
                            touchStartRef.current = null;
                            setDragState(null);

                            const t = e.changedTouches[0];
                            const dist = Math.hypot(t.clientX - x, t.clientY - y);
                            if (dist < 8) return; // Simple tap: let click event fire to navigate

                            e.preventDefault(); // Drag gesture: prevent click navigation
                            const target = document.elementFromPoint(t.clientX, t.clientY)?.closest(`[data-type="${type}"][data-idx]`);
                            if (target?.dataset?.idx !== undefined) {
                                reorder(from, Number(target.dataset.idx));
                            }
                        }}
                        style={{
                            cursor: autoriseAModifier ? 'grab' : 'default',
                            touchAction: autoriseAModifier ? 'none' : 'auto',
                            opacity: isDragging ? 0.4 : 1,
                            outline: isOver ? '2px dashed var(--primary-color)' : 'none',
                            outlineOffset: '2px',
                            borderRadius: '8px',
                            transition: 'opacity 0.15s ease',
                        }}
                    >
                        <AssoCard asso_id={asso.asso_id} mandat={asso.mandat} role={asso.role} img={asso.img} isEditMode={false} onEditAsso={() => { }} />
                    </div>
                );
            })}
        </div>
    );
}

function AssosDnd({ id, autoriseAModifier, initActuel, initAncien }) {
    const [actuel, setActuel] = useState(initActuel);
    const [ancien, setAncien] = useState(initAncien);

    return <>
        <OngletTemplate
            titre="Associations"
            avecTooltip={true}
            tooltipContent="Cliquez-glissez les associations pour les réordonner"
        >
            <AssosList id={id} autoriseAModifier={autoriseAModifier} list={actuel} setList={setActuel} type="actuel" />
        </OngletTemplate >

        <OngletTemplate
            titre="Associations passées"
            avecTooltip={true}
            tooltipContent="Cliquez-glissez les associations pour les réordonner"
        >
            <AssosList id={id} autoriseAModifier={autoriseAModifier} list={ancien} setList={setAncien} type="ancien" />
        </OngletTemplate >
    </>;
}
