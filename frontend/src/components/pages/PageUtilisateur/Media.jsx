import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { obtenirPhotosUtilisateur, changerPhotoUtilisateur, changerBanniereUtilisateur, ajouterContenuUtilisateur, supprimerPhotoUtilisateur } from "../../../api/api_utilisateurs";
import { Row, Col, Image, Button } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";
import { UPLOAD_BASE_URL } from "../../../api/base";

export default function TabMedia({ id, autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);

    const { data: photos = [], isLoading } = useQuery({
        queryKey: ['photosUtilisateur', id],
        queryFn: () => obtenirPhotosUtilisateur({}, id),
    });

    const ajouterPhoto = () => {
        document.getElementById('photo-upload').click();
    };
    const handleAjouterPhoto = async () => {
        const file = event.target.files[0];

        if (file) {
            try {
                const result = await ajouterContenuUtilisateur(id, file);
                queryClient.invalidateQueries(['photos', id]);
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
    };

    const mutationPhoto = useMutation({
        mutationFn: (id_photo) => changerPhotoUtilisateur(id, id_photo),
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
        }
    });

    const mutationBanniere = useMutation({
        mutationFn: (id_photo) => changerBanniereUtilisateur(id, id_photo),
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
        }
    });

    const mutationSupprimer = useMutation({
        mutationFn: async (id_photo) => {
            const res = await supprimerPhotoUtilisateur(id_photo);
            console.log(res);
            if (!res) {
                window.confirm("Impossible de supprimer la photo de profil.")
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
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
            {autoriseAModifier && (<DropdownEditer list={[
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
                        {autoriseAModifier && isGestion && (
                            <div className="position-absolute top-0 end-0 p-1">
                                <DropdownEditer list={[
                                    { can: true, onClick: () => mutationPhoto.mutate(elt.id), name: "Mettre en photo de profil" },
                                    { can: true, onClick: () => mutationBanniere.mutate(elt.id), name: "Mettre en bannière" },
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