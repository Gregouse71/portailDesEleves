import { useState } from "react";
import {
    creerNouvelEvenement,
    modifierEvenement,
    obteniEvenement,
    obtenirEvenementsAsso,
    supprimerEvenement
} from "../../../api/api_evenements";
import { estUtilisateurDansAsso } from "../../../api/api_associations";
import { Card, Button, Form, Row, Col } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DropdownEditer from "../../elements/DropdownEditer";

const formatEventDate = (event) => {
    if (event.evenement_periodique) {
        const jours = event.jours_de_la_semaine.map(day => day + "s").join(', ');
        const debutHeure = event.heure_de_debut;
        const finHeure = event.heure_de_fin;
        return `Tous les ${jours} de ${debutHeure} à ${finHeure}`;
    } else {
        const dateDebut = new Date(event.date_de_debut);
        const dateFin = new Date(event.date_de_fin);
        const debutDateStr = dateDebut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const debutHeureStr = dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const finDateStr = dateFin.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const finHeureStr = dateFin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        if (dateDebut.toDateString() === dateFin.toDateString()) {
            return `Le ${debutDateStr} de ${debutHeureStr} à ${finHeureStr}`;
        } else {
            return `Du ${debutDateStr} à ${debutHeureStr} au ${finDateStr} à ${finHeureStr}`;
        }
    }
};


function Event({ id, canModify = false, isNew, asso_id, setIsNewEvent }) {
    const queryClient = useQueryClient();
    const [isModifying, setIsModifying] = useState(isNew);

    const { data: event, isLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => obteniEvenement({}, id),
        enabled: !isNew,
    });

    const DEFAULT_TEMPS = {
        "date_de_debut": "",
        "date_de_fin": "",
    };
    const DEFAULT_TEMPS_PERIODIQUE = {
        "jours_de_la_semaine": [],
        "heure_de_debut": "",
        "heure_de_fin": ""
    };
    const DEFAULT_EVENT = {
        "nom": "",
        "description": "",
        "lieu": "",
        "evenement_periodique": event ? event.evenement_periodique : false,
    }

    const [modifierEventTemps, setModifierEventTemps] = useState(DEFAULT_TEMPS);
    const [modifierEventTempsPeriodique, setModifierEventTempsPeriodique] = useState(DEFAULT_TEMPS_PERIODIQUE);
    const [modifierEvent, setModifierEvent] = useState(DEFAULT_EVENT);

    const clearModiferEvent = () => {
        setModifierEventTemps(DEFAULT_TEMPS);
        setModifierEventTempsPeriodique(DEFAULT_TEMPS_PERIODIQUE);
        setModifierEvent(DEFAULT_EVENT);
    };

    const handleSetModifierEventTemps = (e) => {
        const { name, value } = e.target;
        setModifierEventTemps(prevState => {
            return { ...prevState, [name]: value };
        });
    };

    const handleSetModifierEventTempsPeriodique = (e) => {
        const { name, value, checked } = e.target;
        setModifierEventTempsPeriodique(prevState => {
            // Les jours de la semaine pour un événement périodique
            if (name === 'jours_de_la_semaine') {
                const currentDays = modifierEventTempsPeriodique.jours_de_la_semaine;
                const updatedDays = checked ? [...currentDays, value] : currentDays.filter(day => day !== value);
                return { ...prevState, [name]: updatedDays };
            }
            return { ...prevState, [name]: value };
        });
    };

    const handleSetModifierEvent = (e) => {
        const { name, value, checked } = e.target;
        setModifierEvent(prevState => {
            // Événement périodique
            if (name === 'evenement_periodique') {
                return { ...prevState, [name]: checked };
            }
            return { ...prevState, [name]: value };
        });
    };

    const handleStartModifying = () => {
        clearModiferEvent();
        const { nom, description, lieu, evenement_periodique } = event;
        setModifierEvent({ nom, description, lieu, evenement_periodique })
        if (evenement_periodique) {
            const { jours_de_la_semaine, heure_de_debut, heure_de_fin } = event;
            setModifierEventTempsPeriodique({ jours_de_la_semaine, heure_de_debut, heure_de_fin })
        } else {
            setModifierEventTemps({
                date_de_debut: event.date_de_debut,
                date_de_fin: event.date_de_fin,
            })
        }
        setIsModifying(true);
    };

    const validerModifierEvent = async () => {
        try {
            const newEvent = {
                ...modifierEvent,
                ...modifierEventTempsPeriodique,
                ...modifierEventTemps
            };
            if (isNew) await creerNouvelEvenement(newEvent, asso_id);
            else await modifierEvenement(newEvent, event.id_association, event.id);

            clearModiferEvent();
            if (isNew) setIsNewEvent(false);
            setIsModifying(false);

            if (isNew) queryClient.invalidateQueries(['eventsAsso', asso_id]);
            else queryClient.invalidateQueries(['event', id]);
        } catch (error) {
            console.error(error);
        }
    };

    const removeEvent = async () => {
        try {
            await supprimerEvenement(event.id_association, event.id);
            queryClient.invalidateQueries(['eventsAsso', asso_id]);
        } catch (erreur) {
            console.error(erreur);
        }
    }

    if (isLoading) return <>Chargement...</>

    return <Card>
        <Card.Body>
            {!isModifying ?
                /* Affichage de l'événement */
                <>
                    <div className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0 d-flex align-items-center">
                            {event.nom}
                        </Card.Title>
                        <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                            {canModify && <DropdownEditer list={[
                                { can: true, onClick: handleStartModifying, name: "Modifier" },
                                { can: true, onClick: removeEvent, name: "Supprimer" },
                            ]}
                            />
                            }
                        </div>
                    </div>
                    <Card.Subtitle className="mb-2 text-muted">{formatEventDate(event)}</Card.Subtitle>
                    <Card.Text><strong>Où</strong> : {event.lieu}</Card.Text>
                    <Card.Text>{event.description}</Card.Text>
                </>

                /* Modification de l'événement */
                :
                <Form>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Titre</Form.Label>
                        <Col sm="10">
                            <Form.Control value={modifierEvent.nom} name='nom' onChange={handleSetModifierEvent} />
                        </Col>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check type="checkbox" label="Événement périodique" checked={modifierEvent.evenement_periodique} name='evenement_periodique' onChange={handleSetModifierEvent} />
                    </Form.Group>

                    {modifierEvent.evenement_periodique ?
                        <>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Jours</Form.Label>
                                <Col sm="10">
                                    {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => (
                                        <Form.Check inline key={day} type="checkbox" name="jours_de_la_semaine" value={day} label={day} checked={modifierEventTempsPeriodique.jours_de_la_semaine.includes(day)} onChange={handleSetModifierEventTempsPeriodique} />
                                    ))}
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Heure de début</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTempsPeriodique.heure_de_debut} name='heure_de_debut' type='time' onChange={handleSetModifierEventTempsPeriodique} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Heure de fin</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTempsPeriodique.heure_de_fin} name='heure_de_fin' type='time' onChange={handleSetModifierEventTempsPeriodique} />
                                </Col>
                            </Form.Group>
                        </>
                        :
                        <>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Début</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTemps.date_de_debut} name='date_de_debut' type='datetime-local' onChange={handleSetModifierEventTemps} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Fin</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTemps.date_de_fin} name='date_de_fin' type='datetime-local' onChange={handleSetModifierEventTemps} />
                                </Col>
                            </Form.Group>
                        </>}
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Lieu</Form.Label>
                        <Col sm="10">
                            <Form.Control value={modifierEvent.lieu} name='lieu' onChange={handleSetModifierEvent} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Description</Form.Label>
                        <Col sm="10">
                            <Form.Control as="textarea" value={modifierEvent.description} name='description' onChange={handleSetModifierEvent} />
                        </Col>
                    </Form.Group>
                    <div className="d-flex gap-2">
                        <Button variant="success" onClick={validerModifierEvent}>Valider</Button>
                        <Button variant="danger" onClick={() => setIsModifying(false)}>Annuler</Button>
                    </div>
                </Form>}
        </Card.Body>
    </Card>
}

export default function AssoEvents({ asso_id }) {
    const [isNewEvent, setIsNewEvent] = useState(false);

    function sortEvents(events) {
        return events.toSorted((a, b) => {
            // Les événements périodiques d'abord
            if (a.evenement_periodique && !b.evenement_periodique) {
                return -1;
            }
            if (!a.evenement_periodique && b.evenement_periodique) {
                return 1;
            }
            // Les événements récents d'abord
            if (!a.evenement_periodique && !b.evenement_periodique) {
                const dateA = new Date(a.date_de_debut);
                const dateB = new Date(b.date_de_debut);
                return dateB.getTime() - dateA.getTime();
            }
            return 0;
        });
    }

    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', asso_id],
        queryFn: () => estUtilisateurDansAsso(asso_id),
        enabled: !!asso_id,
    });

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['eventsAsso', asso_id],
        queryFn: () => obtenirEvenementsAsso({}, asso_id),
        enabled: !!asso_id,
    });

    if (isLoading) return <>Chargement...</>

    return <>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Les événements</h2>
            {membreData.autorise && <Button
                variant="outline-secondary"
                onClick={() => setIsNewEvent(!isNewEvent)}
            >
                <img src="/assets/icons/plus.svg" alt="ajouter" className="theme-icon" />
            </Button>}
        </div>
        <div className="d-flex flex-column gap-3">

            {/* formulaire pour un nouvel événement */}
            {isNewEvent && <Event key={-1} asso_id={asso_id} setIsNewEvent={setIsNewEvent} isNew={true} />}

            {/* Les événements existants */}
            {sortEvents(events).map((event) => (
                <Event key={event.id} id={event.id} canModify={membreData.autorise}
                    asso_id={asso_id} setIsNewEvent={setIsNewEvent} isNew={false} />
            ))}
        </div>
    </>

}
