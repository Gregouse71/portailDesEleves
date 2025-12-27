import { useState, useEffect } from "react";
import {
    creerNouvelEvenement,
    modifierEvenement,
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

function NewEvent({ asso_id, setIsNewEvent }) {
    const queryClient = useQueryClient();
    const [newEventTemps, setNewEventTemps] = useState({
        "date_de_debut": "",
        "heure_de_debut": "",
        "date_de_fin": "",
        "heure_de_fin": ""
    });
    const [newEventTempsPeriodique, setNewEventTempsPeriodique] = useState({
        "jours_de_la_semaine": [],
        "heure_de_debut": "",
        "heure_de_fin": ""
    });
    const [nouvelEvent, setNouvelEvent] = useState({
        "nom": "",
        "description": "",
        "lieu": "",
        "evenement_periodique": false,
    });

    // La création d'un nouvel événement
    const clearNewEvent = () => {
        setNewEventTemps({
            "date_de_debut": "",
            "heure_de_debut": "",
            "date_de_fin": "",
            "heure_de_fin": ""
        });
        setNewEventTempsPeriodique({
            "jours_de_la_semaine": [],
            "heure_de_debut": "",
            "heure_de_fin": ""
        });
        setNouvelEvent({
            "nom": "",
            "description": "",
            "lieu": "",
            "evenement_periodique": false,
        });
    }

    const handleSetNouvelEvent = (e) => {
        const { name, value, checked } = e.target;
        setNouvelEvent(prevState => {
            if (name === 'evenement_periodique') {
                return { ...prevState, [name]: checked };
            }
            return { ...prevState, [name]: value };
        });
    };

    const handleSetNewEventTempsPeriodique = (e) => {
        const { name, value, checked } = e.target;
        setNewEventTempsPeriodique(prevState => {
            // Les jours de la semaine pour un événement périodique
            if (name === 'jours_de_la_semaine') {
                const currentDays = newEventTempsPeriodique.jours_de_la_semaine;
                const updatedDays = checked ? [...currentDays, value] : currentDays.filter(day => day !== value);
                return { ...prevState, [name]: updatedDays };
            }
            return { ...prevState, [name]: value };
        });
    };

    const handleSetNewEventTemps = (e) => {
        const { name, value } = e.target;
        setNewEventTemps(prevState => {
            return { ...prevState, [name]: value };
        });
    }

    const validerNouvelEvent = async () => {
        try {
            const newEvent = {
                ...nouvelEvent,
                ...newEventTempsPeriodique,
                ...{
                    date_de_debut: `${newEventTemps.date_de_debut}T${newEventTemps.heure_de_debut}:00`,
                    date_de_fin: `${newEventTemps.date_de_fin}T${newEventTemps.heure_de_fin}:00`
                }
            };
            await creerNouvelEvenement(asso_id, newEvent);
            clearNewEvent();
            setIsNewEvent(false);
            queryClient.invalidateQueries(['eventsData', asso_id]);
        } catch (error) {
            console.error(error);
        }
    };

    return <Card>
        <Card.Body>
            <Form>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Titre</Form.Label>
                    <Col sm="10">
                        <Form.Control value={nouvelEvent.nom} name='nom' onChange={handleSetNouvelEvent} />
                    </Col>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Événement périodique" checked={nouvelEvent.evenement_periodique} name='evenement_periodique' onChange={handleSetNouvelEvent} />
                </Form.Group>

                {nouvelEvent.evenement_periodique && <>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Jours</Form.Label>
                        <Col sm="10">
                            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => (
                                <Form.Check inline key={day} type="checkbox" name="jours_de_la_semaine" value={day} label={day} checked={newEventTempsPeriodique.jours_de_la_semaine.includes(day)} onChange={handleSetNewEventTempsPeriodique} />
                            ))}
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Heure de début</Form.Label>
                        <Col sm="10">
                            <Form.Control value={newEventTempsPeriodique.heure_de_debut} name='heure_de_debut' type='time' onChange={handleSetNewEventTempsPeriodique} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Heure de fin</Form.Label>
                        <Col sm="10">
                            <Form.Control value={newEventTempsPeriodique.heure_de_fin} name='heure_de_fin' type='time' onChange={handleSetNewEventTempsPeriodique} />
                        </Col>
                    </Form.Group>
                </>}

                {!nouvelEvent.evenement_periodique && <>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Date de début</Form.Label>
                        <Col sm="10">
                            <Form.Control value={newEventTemps.date_de_debut} name='date_de_debut' type='date' onChange={handleSetNewEventTemps} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Heure de début</Form.Label>
                        <Col sm="10">
                            <Form.Control value={newEventTemps.heure_de_debut} name='heure_de_debut' type='time' onChange={handleSetNewEventTemps} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Date de fin</Form.Label>
                        <Col sm="10">
                            <Form.Control value={newEventTemps.date_de_fin} name='date_de_fin' type='date' onChange={handleSetNewEventTemps} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Heure de fin</Form.Label>
                        <Col sm="10">
                            <Form.Control value={newEventTemps.heure_de_fin} name='heure_de_fin' type='time' onChange={handleSetNewEventTemps} />
                        </Col>
                    </Form.Group>
                </>}
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Lieu</Form.Label>
                    <Col sm="10">
                        <Form.Control value={nouvelEvent.lieu} name='lieu' onChange={handleSetNouvelEvent} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Description</Form.Label>
                    <Col sm="10">
                        <Form.Control as="textarea" value={nouvelEvent.description} name='description' onChange={handleSetNouvelEvent} />
                    </Col>
                </Form.Group>
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={validerNouvelEvent}>Ajouter</Button>
                    <Button variant="danger" onClick={() => setIsNewEvent(false)}>Annuler</Button>
                </div>
            </Form>
        </Card.Body>
    </Card>
}

function Event({ event, canModify = false }) {
    const queryClient = useQueryClient();
    const [isModifying, setIsModifying] = useState(false);

    const [modifierEventTemps, setModifierEventTemps] = useState({
        "date_de_debut": "",
        "heure_de_debut": "",
        "date_de_fin": "",
        "heure_de_fin": ""
    });
    const [modifierEventTempsPeriodique, setModifierEventTempsPeriodique] = useState({
        "jours_de_la_semaine": [],
        "heure_de_debut": "",
        "heure_de_fin": ""
    });
    const [modifierEvent, setModifierEvent] = useState({
        "nom": "",
        "description": "",
        "lieu": "",
        "evenement_periodique": event.evenement_periodique,
    });

    const clearModiferEvent = () => {
        setModifierEventTemps({
            "date_de_debut": "",
            "heure_de_debut": "",
            "date_de_fin": "",
            "heure_de_fin": ""
        });
        setModifierEventTempsPeriodique({
            "jours_de_la_semaine": [],
            "heure_de_debut": "",
            "heure_de_fin": ""
        });
        setModifierEvent({
            "nom": "",
            "description": "",
            "lieu": "",
            "evenement_periodique": false,
        });
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
            const dateDebut = new Date(event.date_de_debut);
            const dateFin = new Date(event.date_de_fin);

            const getParisPart = (date, options) => new Intl.DateTimeFormat('fr-CA', { ...options, timeZone: 'Europe/Paris' }).format(date).replace(' h ', ':');
            setModifierEventTemps({
                date_de_debut: getParisPart(dateDebut, { year: 'numeric', month: '2-digit', day: '2-digit' }),
                heure_de_debut: getParisPart(dateDebut, { hour: '2-digit', minute: '2-digit', hour12: false }),
                date_de_fin: getParisPart(dateFin, { year: 'numeric', month: '2-digit', day: '2-digit' }),
                heure_de_fin: getParisPart(dateFin, { hour: '2-digit', minute: '2-digit', hour12: false })
            })
        }
        setIsModifying(true);
    };

    const validerModifierEvent = async () => {
        try {
            const newEvent = {
                ...modifierEvent,
                ...modifierEventTempsPeriodique,
                ...{
                    date_de_debut: `${modifierEventTemps.date_de_debut}T${modifierEventTemps.heure_de_debut}:00`,
                    date_de_fin: `${modifierEventTemps.date_de_fin}T${modifierEventTemps.heure_de_fin}:00`
                }
            };
            await modifierEvenement(event.id_association, event.id, newEvent);
            clearModiferEvent();
            setIsModifying(false);
            queryClient.invalidateQueries(['eventsData', event.id_association]);
        } catch (error) {
            console.error(error);
        }
    };

    const removeEvent = async () => {
        try {
            await supprimerEvenement(event.id_association, event.id);
            queryClient.invalidateQueries(['eventsData', event.id_association]);
        } catch (erreur) {
            console.error(erreur);
        }
    }

    return <Card key={event.id}>
        <Card.Body>
            {!isModifying ?
                /* Affichage de l'événement */
                <>
                    <div className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0 d-flex align-items-center">
                            {event.nom}
                        </Card.Title>
                        <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                            {canModify && <DropdownEditer
                                canModify={true} modify={handleStartModifying}
                                canRemove={true} remove={() => removeEvent()}
                            />}
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
                                <Form.Label column sm="2">Date de début</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTemps.date_de_debut} name='date_de_debut' type='date' onChange={handleSetModifierEventTemps} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Heure de début</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTemps.heure_de_debut} name='heure_de_debut' type='time' onChange={handleSetModifierEventTemps} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Date de fin</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTemps.date_de_fin} name='date_de_fin' type='date' onChange={handleSetModifierEventTemps} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="mb-3">
                                <Form.Label column sm="2">Heure de fin</Form.Label>
                                <Col sm="10">
                                    <Form.Control value={modifierEventTemps.heure_de_fin} name='heure_de_fin' type='time' onChange={handleSetModifierEventTemps} />
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
    const [listeEvents, setListeEvents] = useState([]);
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

    const { data: eventsData } = useQuery({
        queryKey: ['eventsData', asso_id],
        queryFn: () => obtenirEvenementsAsso(asso_id),
        enabled: !!asso_id,
    });

    useEffect(() => {
        if (eventsData) { setListeEvents(sortEvents(eventsData.evenements)) };
    }, [eventsData]);



    return <>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Les publications</h2>
            {membreData.autorise && <Button
                variant="light"
                onClick={() => setIsNewEvent(true)}
            >
                <img src="/assets/icons/plus.svg" alt="ajouter" style={{ filter: "brightness(0) saturate(100%)", transition: "transform 0.2s ease" }} />
            </Button>}
        </div>
        <div className="d-flex flex-column gap-3">

            {/* formulaire pour un nouvel événement */}
            {isNewEvent && <NewEvent asso_id={asso_id} setIsNewEvent={setIsNewEvent} />}

            {/* Les événements existants */}
            {listeEvents.map((event) => (
                <Event event={event} canModify={membreData.autorise} />
            ))}
        </div>
    </>

}
