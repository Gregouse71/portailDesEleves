import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Row, Col, Image, Button } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../../../api/base";
import { ajouterContenuAsso, changerPhotoAsso, obtenirPhotosAsso, supprimerPhotoAsso } from "../../../api/api_associations";

export default function AssosMedia({ asso_id, membreData }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);

    const { data: photos = [], isLoading } = useQuery({
        queryKey: ['photosAsso', asso_id],
        queryFn: () => obtenirPhotosAsso({}, asso_id),
    });

    const ajouterPhoto = () => {
        document.getElementById('photo-upload').click();
    };
    const handleAjouterPhoto = async () => {
        const file = event.target.files[0];

        if (file) {
            try {
                const result = await ajouterContenuAsso(asso_id, file);
                queryClient.invalidateQueries(['photosAsso', asso_id]);
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
    };

    const mutationPhoto = useMutation({
        mutationFn: async ({ type, id }) => await changerPhotoAsso(asso_id, type, id),
        onSuccess: () => {
            queryClient.invalidateQueries(['asso', asso_id]);
        }
    });

    const mutationSupprimer = useMutation({
        mutationFn: async (id_photo) => {
            const res = await supprimerPhotoAsso(asso_id, id_photo);
            console.log(res);
            if (!res) {
                window.confirm("Impossible de supprimer le logo.")
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['photosAsso', asso_id]);
        }
    })

    if (isLoading) return <>Loading...</>

    return (<>
        <input
            type="file"
            id="photo-upload"
            className="d-none"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleAjouterPhoto}
        />
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Mes photos</h2>
            {membreData.autorise && (<DropdownEditer list={[
                { can: true, onClick: () => setIsGestion(!isGestion), name: "Modifier" },
                { can: true, onClick: ajouterPhoto, name: "Ajouter" },
            ]} />
            )}
        </div>

        <Row xs={2} sm={3} md={4} lg={5} className="g-3">
            {photos.map((elt, i) =>
                <Col key={i}>
                    <div className="ratio ratio-1x1">
                        <Image
                            src={`${UPLOAD_BASE_URL}/${elt.file_path}`}
                            alt="Photo"
                            style={{ objectFit: 'scale-down' }}
                        />
                        {membreData.autorise && isGestion && (
                            <div className="position-absolute top-0 end-0 p-1">
                                <DropdownEditer list={[
                                    { can: true, onClick: () => mutationPhoto.mutate({ type: "logo", id: elt.id }), name: "Mettre logo" },
                                    { can: true, onClick: () => mutationPhoto.mutate({ type: "banniere", id: elt.id }), name: "Mettre en bannière" },
                                    "divider",
                                    { can: true, onClick: () => mutationSupprimer.mutate(elt.id), name: "Supprimer" },
                                ]} />
                            </div>
                        )}
                    </div>
                </Col>
            )}
        </Row>
    </>)
}