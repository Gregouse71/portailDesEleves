import { useState, useEffect } from "react";
import { chargerAsso, estUtilisateurDansAsso, modifierDescriptionAsso } from "../../../api/api_associations";
import RichEditor, { RichTextDisplay } from '../../elements/RichEditor';
import { Button } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DropdownEditer from "../../elements/DropdownEditer";

function AssoInfo({ id }) {
    const queryClient = useQueryClient();
    const [isEdition, setIsEdition] = useState(false);
    const [description, setDescription] = useState("");
    const [newDescription, setNewDescription] = useState("");

    const { data: asso = null } = useQuery({
        queryKey: ['asso', id],
        queryFn: () => chargerAsso(id),
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', id],
        queryFn: () => estUtilisateurDansAsso(id),
    });

    useEffect(() => {
        if (asso) { setDescription(asso.description); setNewDescription(asso.description) };
    }, [asso]);

    const mutation = useMutation({
        mutationFn: async () => { modifierDescriptionAsso(id, newDescription); },
        onSuccess: () => {
            queryClient.invalidateQueries(['asso', id]);
            setDescription(newDescription);
            setIsEdition(false);
        }
    });

    const annulerModifierDescription = () => {
        setNewDescription(description);
        setIsEdition(false);
    };

    return (
        <>
            {/* Description de l'asso */}
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Description de l'association</h2>

                    <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                        {membreData.autorise && <DropdownEditer list={[
                            { can: true, onClick: () => setIsEdition(!isEdition), name: "Modifier" },
                        ]}
                        />}
                    </div>
                </div>
                {/*  */}
                {!isEdition && <div>
                    <RichTextDisplay content={description}></RichTextDisplay>
                </div>}
                {/* Modification de description */}
                {isEdition && <>
                    <RichEditor value={newDescription} onChange={setNewDescription} />
                    <div className="d-flex gap-2 mt-3">
                        <Button variant="success" onClick={mutation.mutate}>
                            <img src="/assets/icons/check-mark.svg" alt="Valider" />
                            Valider
                        </Button>
                        <Button variant="danger" onClick={annulerModifierDescription}>
                            <img src="/assets/icons/cross-mark.svg" alt="Annuler" />
                            Annuler
                        </Button>
                    </div>
                </>}
            </div>
        </>
    )
}

export default AssoInfo;