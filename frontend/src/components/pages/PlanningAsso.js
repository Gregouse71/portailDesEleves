import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert, ListGroup, Row, Col } from 'react-bootstrap';
import { getEvenementsMois } from '../../api/api_evenements';
import { chargerAsso } from '../../api/api_associations';
import { UPLOAD_BASE_URL } from '../../api/base';

const PlanningAsso = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = `${year}${month.toString().padStart(2, '0')}`;

    const { data: events, isLoading: isLoadingEvents, isError: isErrorEvents, error: errorEvents } = useQuery({ queryKey: ['evenements', date], queryFn: () => getEvenementsMois(date) });

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
                <img src={`${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}`} alt={`logo de ${asso.nom}`} className="me-2 object-fit-cover" style={{ width: '40px', height: '40px' }} />
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
            <ListGroup>
                <ListGroup.Item key="header">
                    <Row className="fw-bold align-items-center">
                        <Col md={2}>Quand</Col>
                        <Col md={2}>Asso</Col>
                        <Col md={3}>Nom de l'event</Col>
                        <Col md={2}>Où</Col>
                        <Col md={3}>Description</Col>
                    </Row>
                </ListGroup.Item>
                {events.map(event => (
                    <ListGroup.Item key={event.id}>
                        <Row className="align-items-start">
                            <Col md={2}>{formatDate(event.date_de_debut)}</Col>
                            <Col md={2}><GetAssoInfo assoId={event.id_association} /></Col>
                            <Col md={3}>{event.nom}</Col>
                            <Col md={2}>{event.lieu}</Col>
                            <Col md={3} className="text-break">{event.description}</Col>
                        </Row>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Container>
    );
};

export default PlanningAsso;
