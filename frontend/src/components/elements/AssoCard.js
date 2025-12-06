import { Card } from "react-bootstrap"
import { useNavigate } from "react-router-dom";
import { BASE_URL, UPLOAD_BASE_URL } from "../../api/base";
import { useQuery } from "@tanstack/react-query";
import { chargerAsso } from "../../api/api_associations";

export default function AssoCard({ asso_id, mandat, role }) {
    const navigate = useNavigate();

    const { data: asso, isLoading } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });

    return (isLoading
        ? <div>Loading ...</div>
        : <Card
            className="h-100 text-center"
            onClick={() => navigate(`/assos/get/${asso.id}`)}
            style={{ cursor: 'pointer' }}
        >
            {asso.img !== null && <Card.Img
                variant="top"
                src={`${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}`}
                alt={asso.nom}
                style={{ height: '120px', objectFit: 'cover' }}
            />}
            < Card.Body >
                <Card.Title>{asso.nom}</Card.Title>
                {mandat && <Card.Text>{mandat}</Card.Text>}
                {role && <Card.Text>{role}</Card.Text>}
            </Card.Body >
        </Card >);
}
