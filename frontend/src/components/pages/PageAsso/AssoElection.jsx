import { useState } from "react";
import RichEditor, { RichTextDisplay } from '../../elements/RichEditor';
import { Badge, Button, Card, Col, Form, Image, Row } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProtected } from "../../../Protected";
import { creerNouvelleElection, modifierElection, obtenirElection, obtenirElectionsAsso, resultatsElection, supprimerElection, voterElection, uploadElectionChoiceImage } from "../../../api/modules/api_elections";
import DropdownEditer from "../../elements/DropdownEditer";
import { obtenirListeDesPromos } from "../../../api/api_utilisateurs";
import { UPLOAD_BASE_URL } from "../../../api/base";

const format_date = (s) => s ? new Date(s).toLocaleString("fr-FR") : "Non précisé"

function Election({ isNew, id, canModify, asso_id, stopCreating }) {
    const { userData } = useProtected();
    const queryClient = useQueryClient();

    const { data: election, isLoading, isError } = useQuery({
        queryKey: ['election', id],
        queryFn: () => obtenirElection({}, id),
        enabled: !isNew,
    });
    const { data: listePromos = [] } = useQuery({
        queryKey: ['listePromos'],
        queryFn: () => obtenirListeDesPromos().then(r => r.filter(p => p !== null).sort((a, b) => b.localeCompare(a))),
    });

    const [isModifying, setIsModifying] = useState(isNew);
    const [files, setFiles] = useState([]);
    const [modifyingElection, setModifyingElection] = useState({
        nom: "",
        visible: false,
        options: [{ name: "", image: "" }, { name: "", image: "" }],
        promos: [],
        date_ouverture: null,
        date_fermeture: null
    });

    const handleOptionChange = (index, value) => {
        const newOptions = [...modifyingElection.options];
        newOptions[index] = { ...newOptions[index], name: value };
        setModifyingElection({ ...modifyingElection, options: newOptions });
    };

    const ajouterOption = () => {
        setModifyingElection({ ...modifyingElection, options: [...modifyingElection.options, { name: "", image: "" }] });
    }

    const supprimerOption = (index) => {
        const temp = [...files];
        temp.splice(index, 1);
        setFiles(temp);
        setModifyingElection({ ...modifyingElection, options: modifyingElection.options.filter((_, i) => i !== index) });
    };

    const setOptionFile = async (index, file) => {
        let newFiles = [...files];
        while (index > newFiles.length) newFiles.push(null);
        newFiles[index] = file;
        setFiles(newFiles);
    };

    const handleStartModifying = () => {
        if (!isNew) setModifyingElection(election);
        setIsModifying(true);
    }

    const mutation = useMutation({
        mutationFn: async () => {
            let newElection;
            if (isNew) {
                newElection = await creerNouvelleElection(modifyingElection, asso_id);
            }
            else {
                newElection = await modifierElection(modifyingElection, id);
            }
            files.forEach(async (file, index) => {
                if (!file) return
                const formData = new FormData();
                formData.append('file', file);
                await uploadElectionChoiceImage(formData, newElection.id, index);
            })
        },
        onSuccess: () => {
            if (isNew) {
                queryClient.invalidateQueries(['elections_asso', asso_id]);
                stopCreating();
            }
            else {
                queryClient.invalidateQueries(['election', id]);
            }
            setIsModifying(false);
        }
    });

    const voterMutation = useMutation({
        mutationFn: async (i) => {
            await voterElection({ choix: i }, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['election', id])
        }
    })

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
    if (isError) return <>Pas d&apos;élection à afficher.</>

    // L'utilisateur peut-il voter actuellement ?
    const canVote = election ? election.votant && !election.deja_vote && election.ouvert : false;

    return <Card><Card.Body>
        {!isModifying ?
            <>
                <div className="d-flex justify-content-between align-items-center">
                    {userData.is_superuser && (election.visible ? <Badge bg="success" className="me-3">visible</Badge> : <Badge bg="danger" className="me-3">cachée</Badge>)}
                    <Card.Title className="me-3 mb-0 d-flex align-items-center">
                        {election.nom}
                    </Card.Title>
                    {election.votant && <Badge bg="primary" className="me-4">Électeur</Badge>}
                    {election.deja_vote && <Badge bg="info" className="me-4">A voté</Badge>}
                    {election.ouvert && <Badge bg="warning" className="me-4">En cours</Badge>}
                    <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                        {canModify && <DropdownEditer list={[
                            { can: true, onClick: handleStartModifying, name: "Modifier" },
                            { can: true, onClick: () => resultatsElection({}, election.id), name: "Résultats" },
                            { can: true, onClick: () => { supprimerElection(election.id); queryClient.invalidateQueries(['elections_asso', asso_id]) }, name: "Supprimer" },
                        ]}
                        />
                        }
                    </div>
                </div>
                <div className="mb-3 mt-2">
                    <RichTextDisplay content={election.description} />
                </div>
                {userData.is_superuser && <Row md={12} className="mb-2">
                    <Col as="h6" md="auto">Collège électoral : </Col>
                    <Col>Promotions {election.promos.join(", ")}</Col>
                </Row>}
                <Row className="mb-2 g-4 justify-content-center">
                    {election.options.map((option, i) =>
                        <Col xs={12} sm={6} lg={4} xl={3} key={i} className="d-flex flex-column align-items-center text-center">
                            {option.image &&
                                <div className="d-flex align-items-center justify-content-center w-100" style={{ height: "250px" }}>
                                    <Image src={`${UPLOAD_BASE_URL}/${option.image}`} alt={option.name}
                                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                                    />
                                </div>
                            }
                            <Button disabled={!canVote} className="fs-5 mt-auto w-100"
                                onClick={() => voterMutation.mutate(i)}
                                style={{ whiteSpace: "normal", wordWrap: "break-word" }}
                            >
                                {option.name}
                            </Button>
                        </Col>)
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
                        <Button variant="danger" onClick={() => { if (isNew) { stopCreating() } setIsModifying(false) }}>Annuler</Button>
                    </div>
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="2">Nom</Form.Label>
                        <Col><Form.Control name="nom" value={modifyingElection.nom}
                            onChange={(e) => setModifyingElection({ ...modifyingElection, nom: e.target.value })} /></Col>
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
                            {modifyingElection.options && modifyingElection.options.map((option, ind) => (
                                <Row key={ind} className="mb-3 align-items-center">
                                    <Col>
                                        <Form.Control value={option.name}
                                            onChange={(e) => handleOptionChange(ind, e.target.value)} placeholder={`Option ${ind + 1}`}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Control type="file" accept="image/png, image/jpeg, image/jpg"
                                            onChange={(e) => setOptionFile(ind, e.target.files[0])}
                                        />
                                        {option.image && (
                                            <div className="mt-2">
                                                <img src={`${UPLOAD_BASE_URL}/${option.image}`} alt="Option"
                                                    style={{ maxWidth: "50px", maxHeight: "50px" }} />
                                            </div>
                                        )}
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
    const { userData } = useProtected();
    const [isCreating, setIsCreating] = useState(false);

    const { data: elections = [] } = useQuery({
        queryKey: ['elections_asso', asso_id],
        queryFn: () => obtenirElectionsAsso({}, asso_id),
    });

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Élections</h2>
                {userData.is_superuser && <Button variant='outline-secondary' onClick={() => setIsCreating(true)}>
                    <img src="/assets/icons/plus.svg" alt="ajouter" className="theme-icon" />
                </Button>}
            </div>
            {isCreating && <Election key="-1" canModify={userData.is_superuser} isNew={true} asso_id={asso_id} stopCreating={() => setIsCreating(false)} />}
            {elections.map(id => <Election key={id} id={id} canModify={userData.is_superuser} isNew={false} asso_id={asso_id} />)}
        </>
    )
}
