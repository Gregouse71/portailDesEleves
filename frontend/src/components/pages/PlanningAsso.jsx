import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert, Table, Dropdown } from 'react-bootstrap';
import { getEvenementsMois } from '../../api/api_evenements';
import { chargerAsso } from '../../api/api_associations';
import { UPLOAD_BASE_URL } from '../../api/base';
import { useState } from 'react';

const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
};

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

const Tableau = ({ value }) => {
    const { data: events, isLoading } = useQuery({
        queryKey: ['evenements', value],
        queryFn: () => getEvenementsMois({}, value)
    });

    console.log(events)

    return <>
        <h3>Événements sporadiques</h3>
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
                {isLoading ?
                    <tr>
                        <td>Chargement</td>
                    </tr>
                    :
                    events.filter(e => !e.evenement_periodique).map(event => <tr key={event.id} className="align-items-start">
                        <td>{formatDate(event.date_de_debut)}</td>
                        <td><GetAssoInfo assoId={event.id_association} /></td>
                        <td>{event.nom}</td>
                        <td>{event.lieu}</td>
                        <td className="text-break">{event.description}</td>
                    </tr>
                    )}
            </tbody >
        </Table>
        <h3>Événements périodiques</h3>
        <Table responsive hover>
            <thead key="header">
                <tr className="fw-bold align-items-center">
                    <th>Quel(s) jour(s)</th>
                    <th>Asso</th>
                    <th>Quoi</th>
                    <th>Où</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {isLoading ?
                    <tr>
                        <td>Chargement</td>
                    </tr>
                    :
                    events.filter(e => e.evenement_periodique).map(event => <tr key={event.id} className="align-items-start">
                        <td>{formatDate(event.date_de_debut)}</td>
                        <td><GetAssoInfo assoId={event.id_association} /></td>
                        <td>{event.nom}</td>
                        <td>{event.lieu}</td>
                        <td className="text-break">{event.description}</td>
                    </tr>
                    )}
            </tbody >
        </Table></>
}

const PlanningAsso = () => {
    const choix = [
        { value: "next_week", label: "Cette semaine" },
        { value: "next_month", label: "Ce mois" }
    ]

    const [aAfficher, setAAfficher] = useState(0)

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="my-4">Événements à venir</h1>
                <Dropdown>
                    <Dropdown.Toggle as="div">{choix[aAfficher].label}</Dropdown.Toggle>
                    <Dropdown.Menu>
                        {choix.map((elt, ind) => <Dropdown.Item key={ind} onClick={() => setAAfficher(ind)}>{elt.label}</Dropdown.Item>)}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            <Tableau value={choix[aAfficher].value} />
        </Container>
    );
};

export default PlanningAsso;
