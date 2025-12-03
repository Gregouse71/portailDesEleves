import "../../assets/styles/events.scss"
import { Alert, Card, Spinner } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { getEvenementsMois } from '../../api/api_evenements';
import { chargerAsso } from "../../api/api_associations";
import { BASE_URL, UPLOAD_BASE_URL } from "../../api/base";
import { Link } from "react-router-dom";

export default function BlocEvents() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = `${year}${month.toString().padStart(2, '0')}`;

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['evenements', date],
        queryFn: () => getEvenementsMois(date)
    });

    const formatDate = (dateString) => {
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', options);
    };

    if (isLoading) {
        return <Spinner animation="border" size="sm" />;
    }

    const eventsByDate = Object.groupBy(events, ({ date_de_debut }) => formatDate(date_de_debut));

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
                <img src={`${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}`} alt={`logo de ${asso.nom}`} className="me-2 object-fit-cover" style={{ width: '20px', height: '20px' }} />
                <Link to={`/assos/get/${event.id_association}?tab=events`}>{event.nom}</Link>
            </div>
        </>);
    };

    return (
        <Card id="bloc-events" className="bloc-global mb-3">
            <Card.Header as="h5" className="text-center">Événements</Card.Header>
            <Card.Body>
                {Object.keys(eventsByDate).map((key) => (<div key={key}>
                    <div className="event-date">{key}</div>
                    {eventsByDate[key].map(event => (
                        <GetAssoInfo event={event} />)
                    )}
                </div>)
                )}
            </Card.Body>
        </Card>
    );
}
