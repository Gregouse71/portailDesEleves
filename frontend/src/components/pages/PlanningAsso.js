import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert, Table } from 'react-bootstrap';
import { getEvenementsMois } from '../../api/api_evenements';
import { chargerAsso } from '../../api/api_associations';
import { UPLOAD_BASE_URL } from '../../api/base';

const PlanningAsso = () => {
    const { data: events, isLoading: isLoadingEvents, isError: isErrorEvents, error: errorEvents } = useQuery({ queryKey: ['evenements', 'next_week'], queryFn: () => getEvenementsMois('next_week') });

    const GetAssoInfo = ({ assoId }) => {
        const { data: asso, isLoading, isError, error } = useQuery({ queryKey: ['association', assoId], queryFn: () => chargerAsso(assoId) });

        if (isLoading) {
            return <Spinner animation="border" size="sm" />;
        }

        if (isError) {
            return <Alert variant="danger">{error.message}</Alert>;
        }

        return (
            <div className="d-flex align-items-center">
                <img src={`${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}`} alt={`logo`} className="me-2 object-fit-cover" style={{ width: '40px', height: '40px' }} />
                <span>{asso.nom}</span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', options);
    };

    if (isLoadingEvents) {
        return <Spinner animation="border" />;
    }

    if (isErrorEvents) {
        return <Alert variant="danger">{errorEvents.message}</Alert>;
    }
    if (!events || events.length === 0) {
        return (
            <Container>
                <h1 className="my-4">Événements à venir</h1>
                <Alert variant="info">Aucun événement à venir pour le moment.</Alert>
            </Container>
        );
    }
    return (
        <Container>
            <h1 className="my-4">Événements à venir</h1>
            <Table responsive hover>
                <thead key="header">
                    <tr className="fw-bold align-items-center">
                        <th>Quand</th>
                        <th>Asso</th>
                        <th>Quoi</th>
                        <th>Où</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                {events.map(event => (
                        <tr key={event.id} className="align-items-start">
                            <td>{formatDate(event.date_de_debut)}</td>
                            <td><GetAssoInfo assoId={event.id_association} /></td>
                            <td>{event.nom}</td>
                            <td>{event.lieu}</td>
                            <td className="text-break">{event.description}</td>
                        </tr>
                ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default PlanningAsso;
