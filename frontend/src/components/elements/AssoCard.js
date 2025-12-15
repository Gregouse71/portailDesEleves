import { Card } from "react-bootstrap"
import { useNavigate } from "react-router-dom";
import { UPLOAD_BASE_URL } from "../../api/base";
import { useQuery } from "@tanstack/react-query";
import { chargerAsso } from "../../api/api_associations";

export default function AssoCard({ asso_id, mandat, role }) {
    const navigate = useNavigate();

    const { data: asso, isLoading } = useQuery({
        queryKey: ['asso', asso_id],
        queryFn: () => chargerAsso(asso_id),
    });

    return (isLoading
        ? <div> Chargement ...</div>
        : <Card
            className="h-100 text-center"
            onClick={() => navigate(`/assos/get/${asso.id}`)}
            style={{ cursor: 'pointer' }}
        >
            {asso.img !== null && <Card.Img
                variant="top"
                className="mt-3 object-fit-contain"
                src={`${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}`}
                alt={asso.nom}
                style={{ height: '120px' }}
            />}
            < Card.Body className="px-2">
                <Card.Title>{asso.nom}</Card.Title>
                {role && <> <hr /><Card.Text>{role}</Card.Text></>}
            </Card.Body >
            {mandat && <Card.Footer><Card.Text>{mandat}</Card.Text></Card.Footer>}
        </Card >);
}
