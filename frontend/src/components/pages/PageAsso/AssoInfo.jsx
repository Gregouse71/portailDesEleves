import { useState } from "react";
import { chargerAsso, estUtilisateurDansAsso, modifierDescriptionAsso } from "../../../api/api_associations";
import RichEditor, { RichTextDisplay } from '../../elements/RichEditor';
import { Button } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DropdownEditer from "../../elements/DropdownEditer";

function AssoInfo({ id, membreData }) {
    const queryClient = useQueryClient();
    const [isEdition, setIsEdition] = useState(false);
    const [description, setDescription] = useState("");

    const { data: asso, isLoading } = useQuery({
        queryKey: ['asso', id],
        queryFn: () => chargerAsso(id),
    });

    const mutation = useMutation({
        mutationFn: async () => { await modifierDescriptionAsso(id, description); },
        onSuccess: () => {
            queryClient.invalidateQueries(['asso', id]);
            setIsEdition(false);
        }
    });

    const handleToggleEdition = () => {
        if (!isEdition && asso) {
            setDescription(asso.description);
        }
        setIsEdition(!isEdition);
    };

    if (isLoading) return <>Loading...</>;

    return (
        <>
            {/* Description de l'asso */}
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Description de l&apos;association</h2>

                    <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                        {membreData.autorise && <DropdownEditer list={[
                            { can: true, onClick: handleToggleEdition, name: "Modifier" },
                        ]}
                        />}
                    </div>
                </div>
                {/*  */}
                {!isEdition && <div>
                    <RichTextDisplay content={asso.description}></RichTextDisplay>
                </div>}
                {/* Modification de description */}
                {isEdition && <>
                    <RichEditor value={description} onChange={setDescription} />
                    <div className="d-flex gap-2 mt-3">
                        <Button variant="success" onClick={mutation.mutate}>
                            <img src="/assets/icons/check-mark.svg" alt="Valider" />
                            Valider
                        </Button>
                        <Button variant="danger" onClick={() => setIsEdition(false)}>
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