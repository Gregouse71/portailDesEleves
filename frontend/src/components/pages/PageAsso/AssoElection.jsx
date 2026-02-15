import { useState } from "react";
import RichEditor, { RichTextDisplay } from '../../elements/RichEditor';
import { Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLayout } from "../../../layouts/Layout";
import { creerNouvelleElection, modifierElection, obtenirElection, obtenirElectionsAsso, resultatsElection, supprimerElection, voterElection } from "../../../api/modules/api_elections";
import DropdownEditer from "../../elements/DropdownEditer";
import { obtenirListeDesPromos } from "../../../api/api_utilisateurs";

const format_date = (s) => s ? new Date(s).toLocaleString("fr-FR") : "Non précisé"

function Election({ isNew, id, canModify, asso_id, stopCreating }) {
    const { userData } = useLayout();
    const queryClient = useQueryClient();

    const { data: election, isLoading } = useQuery({
        queryKey: ['election', id],
        queryFn: () => obtenirElection({}, id),
        enabled: !isNew,
    });
    const { data: listePromos = [] } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

    const [isModifying, setIsModifying] = useState(isNew);
    const [modifyingElection, setModifyingElection] = useState({
        nom: "",
        visible: false,
        options: ["", ""],
        promos: [],
        date_ouverture: null,
        date_fermeture: null
    });

    const handleOptionChange = (index, value) => {
        const newOption = [...modifyingElection.options];
        newOption[index] = value;
        setModifyingElection({ ...modifyingElection, options: newOption })
    };

    const ajouterOption = () => {
        setModifyingElection({ ...modifyingElection, options: [...modifyingElection.options, ""] });
    }

    const supprimerOption = (index) => {
        setModifyingElection({ ...modifyingElection, options: modifyingElection.options.filter((_, i) => i !== index) });
    };

    const handleStartModifying = () => {
        if (!isNew) setModifyingElection(election);
        setIsModifying(true);
    }

    const mutation = useMutation({
        mutationFn: async () => {
            if (isNew) {
                await creerNouvelleElection(modifyingElection, asso_id);
            }
            else await modifierElection(modifyingElection, id);
        },
        onSuccess: () => {
            if (!isNew) queryClient.invalidateQueries(['election', id]);
            else {
                queryClient.invalidateQueries(['elections_asso', asso_id]);
                stopCreating();
            }
            setIsModifying(false);
        }
    });

    const handleChangeSelectedPromo = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setModifyingElection({ ...modifyingElection, promos: [...modifyingElection.promos, value] });
        }
        else {
            setModifyingElection({ ...modifyingElection, promos: modifyingElection.promos.filter(i => i !== value) });
        }
    }

    if (isLoading) return <>Chargement...</>;

    // L'utilisateur peut-il voter actuellement ?
    const canVote = election ? election.votant && !election.deja_vote && election.ouvert : false;

    return <Card><Card.Body>
        {!isModifying ?
            <>
                <div className="d-flex justify-content-between align-items-center">
                    {userData.is_superuser && election.visible ? <Badge bg="success" className="m-2">visible</Badge> : <Badge bg="danger" className="m-2">cachée</Badge>}
                    <Card.Title className="mb-0 d-flex align-items-center">
                        {election.nom}
                    </Card.Title>
                    {election.votant && <Badge bg="primary" className="m-2">Électeur</Badge>}
                    {election.deja_vote && <Badge bg="info" className="m-2">A voté</Badge>}
                    {election.ouvert && <Badge bg="warning" className="m-2">En cours</Badge>}
                    <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                        {canModify && <DropdownEditer list={[
                            { can: true, onClick: handleStartModifying, name: "Modifier" },
                            { can: true, onClick: () => resultatsElection({}, election.id), name: "Résultats" },
                            { can: true, onClick: () => { supprimerElection(election.id); queryClient.invalidateQueries(['election', id]) }, name: "Supprimer" },
                        ]}
                        />
                        }
                    </div>
                </div>
                <div>
                    <RichTextDisplay content={election.description} />
                </div>
                {userData.is_superuser && <Row md="10">
                    <Col as="h6" md="auto">Collège électoral : </Col>
                    <Col>Promotions {election.promos.join(", ")}</Col>
                </Row>}
                <Row>
                    {election.options.map((options, i) =>
                        <Col key={i} className="d-flex justify-content-center"><Button key={i} disabled={!canVote} className="m-2"
                            onClick={() => { voterElection({ choix: i }, id); queryClient.invalidateQueries(['election', id]) }}                        >
                            {options}
                        </Button></Col>)
                    }
                </Row>
                Début des votes : {format_date(election.date_ouverture)}<br />
                Fin des votes : {format_date(election.date_fermeture)}
            </>
            :
            <>
                <Form>
                    <div className="d-flex gap-2 mb-3">
                        <Button variant="success" onClick={mutation.mutate}>Valider</Button>
                        <Button variant="danger" onClick={() => {if(isNew){stopCreating()} setIsModifying(false)}}>Annuler</Button>
                    </div>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Nom</Form.Label>
                        <Col><Form.Control name="nom" value={modifyingElection.nom}
                        onChange={(e) => setModifyingElection({ ...modifyingElection, nom: e.target.value })}/></Col>
                    </Form.Group>
                    <RichEditor value={modifyingElection.description}
                        onChange={(e) => setModifyingElection({ ...modifyingElection, description: e })} />
                    <Form.Group className="mb-3">
                        <Form.Check type="checkbox" label="Visible des utilisateurs" name='visible'
                            checked={modifyingElection.visible}
                            onChange={(e) => setModifyingElection({ ...modifyingElection, visible: e.target.checked })} />
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Collège électoral</Form.Label>
                        <Col>
                            {listePromos.map(p => <Form.Check inline key={p} name="promo" value={p} label={p}
                                checked={modifyingElection.promos.includes(p)}
                                onChange={handleChangeSelectedPromo} />)}
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3">
                        <Form.Label as={Col} sm="2" column>Options</Form.Label>
                        <Col>
                            {modifyingElection.options && modifyingElection.options.map((elt, ind) => (
                                <Row key={ind} className="mb-3 align-items-center">
                                    <Col>
                                        <Form.Control value={elt}
                                            onChange={(e) => handleOptionChange(ind, e.target.value)} placeholder={`Option ${ind + 1}`}
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button variant="danger" onClick={() => supprimerOption(ind)}>
                                            <img src="/assets/icons/delete.svg" alt="Supprimer" />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Button variant="outline-primary" size="sm" onClick={ajouterOption}>Ajouter options</Button>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Début des votes</Form.Label>
                        <Col><Form.Control type="datetime-local" name="debut"
                            value={modifyingElection.date_ouverture}
                            onChange={(e) => setModifyingElection(prev => { return { ...prev, date_ouverture: e.target.value } })} /></Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Fin des votes</Form.Label>
                        <Col><Form.Control type="datetime-local" name="debut"
                            value={modifyingElection.date_fermeture}
                            onChange={(e) => setModifyingElection(prev => { return { ...prev, date_fermeture: e.target.value } })} /></Col>
                    </Form.Group>
                </Form>
            </>
        }
    </Card.Body></Card>;
}

export default function AssoElection({ asso_id }) {
    const { userData } = useLayout();
    const [isCreating, setIsCreating] = useState(false);

    const { data: elections = [] } = useQuery({
        queryKey: ['elections_asso', asso_id],
        queryFn: () => obtenirElectionsAsso({}, asso_id),
    });

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Élections</h2>
                <Button variant='outline-secondary' onClick={() => setIsCreating(true)}>
                    <img src="/assets/icons/plus.svg" alt="ajouter" className="theme-icon" />
                </Button>
            </div>
            {isCreating && <Election key="-1" canModify={userData.is_superuser} isNew={true} asso_id={asso_id} stopCreating={() => setIsCreating(false)} />}
            {elections.map(id => <Election key={id} id={id} canModify={userData.is_superuser} isNew={false} asso_id={asso_id} />)}
        </>
    )
}
