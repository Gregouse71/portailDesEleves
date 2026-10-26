import { Alert, Spinner } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { getEvenementsMois } from '../../api/api_evenements';
import { chargerAsso } from "../../api/api_associations";
import { UPLOAD_BASE_URL } from "../../api/base";
import { Link } from "react-router-dom";
import BlocTemplate from "../templates/BlocTemplate";

export default function BlocEvents() {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['evenements', 'next_week'],
        queryFn: () => getEvenementsMois({}, 'next_week')
    });

    const formatDate = (dateString) => {
        if (!dateString) return "Date inconnue";
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', options);
    };

    if (isLoading) {
        return <Spinner animation="border" size="sm" />;
    }

    const eventsByDate = Object.groupBy(events, ({ date_de_debut }) => formatDate(date_de_debut)) || [];

    const GetAssoInfo = ({ event }) => {
        const { data: asso, isLoading, isError, error } = useQuery({
            queryKey: ['asso', event.id_association],
            queryFn: () => chargerAsso(event.id_association)
        });

        if (isLoading) {
            return <Spinner animation="border" size="sm" />;
        }

        if (isError) {
            return <Alert variant="danger">{error.message}</Alert>;
        }

        return (<>
            <div>
                <img src={`${UPLOAD_BASE_URL}/${asso.img}`} alt={`logo de ${asso.nom}`} className="me-2 object-fit-cover" style={{ width: '20px', height: '20px' }} />
                <Link className="interactive-link" to={`/assos/get/${event.id_association}/events`}>{event.nom}</Link>
            </div>
        </>);
    };

    return <BlocTemplate
        titre={
            <span className="d-flex justify-content-between align-items-baseline">
                <span>Événements</span>
                <Link to="/assos/planning" className="see-more-link">
                    Voir plus
                </Link>
            </span>
        }
        contenu={<>
            {Object.keys(eventsByDate).length > 0 ? (
                Object.keys(eventsByDate).map((key) => (
                    <div key={key} className="mb-2">
                        <div className="text-muted small">{key}</div>
                        {eventsByDate[key].map((event, i) => (
                            <GetAssoInfo key={i} event={event} />
                        ))}
                    </div>
                ))
            ) : (
                <p className="text-muted small mb-2">Aucun événement à venir.</p>
            )}
        </>} />;
}
