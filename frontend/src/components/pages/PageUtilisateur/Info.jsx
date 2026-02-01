import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { Link } from "react-router-dom";
import { chargerUtilisateurs, modifierInfos, obtenirDataUser, changerMarrain, selectionnerFillots, changerCo } from "../../../api/api_utilisateurs";
import { Row, Col, Button, Form, InputGroup } from "react-bootstrap";
import DropdownEditer from "../../elements/DropdownEditer";

export default function TabInfo({ id, autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);

    const { data: donneesUtilisateur, isPending: isPendingUser } = useQuery({
        queryKey: ['donneesUtilisateur', id],
        queryFn: () => obtenirDataUser(id),
    });

    const [selectedP, setSelectedP] = useState();
    const [selectedC, setSelectedC] = useState();
    const [selectedF, setSelectedF] = useState();
    const [instruments, setInstruments] = useState(donneesUtilisateur?.instruments);

    const [userInfos, setUserInfos] = useState(donneesUtilisateur);

    const { data: allUsers = [] } = useQuery({
        queryKey: ["allUsers"],
        queryFn: () => chargerUtilisateurs(),
    });
    const options = allUsers.map(u => ({ value: u.id, label: u.nom_utilisateur }));

    const copyToClipboard = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
            }).catch((err) => {
                console.error("Erreur lors de la copie : ", err);
            });
        } else {
            console.err("La fonctionnalité de copier dans le presse-papiers n'est pas supportée.");
        }
    };


    const mutation = useMutation({
        mutationFn: async (updatedInfos) => {
            const { marrain, ...otherInfos } = updatedInfos;
            await modifierInfos(id, { ...otherInfos, instruments });

            const newCoIds = selectedC.map(c => c.value);
            await changerCo(id, newCoIds);

            const newMarrainId = selectedP?.value ?? null;
            if (marrain?.id !== newMarrainId) await changerMarrain(newMarrainId, id);

            await selectionnerFillots(id, selectedF.map(f => f.value));
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['donneesUtilisateur', id]);
            setIsGestion(false);
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserInfos({ ...userInfos, [name]: value });
    };

    const handleInstruChange = (index, field, value) => {
        const newInstruments = [...instruments];
        newInstruments[index] = { ...newInstruments[index], [field]: value };
        setInstruments(newInstruments);
    };

    const ajouterInstru = () => {
        setInstruments([...instruments, { name: "Piano", niveau: "Débutant" }]);
    };

    const supprimerInstru = (index) => {
        setInstruments(instruments.filter((_, i) => i !== index));
    };

    const handleCancel = () => {
        setUserInfos(donneesUtilisateur);
        setInstruments(donneesUtilisateur.instruments || []);
        setSelectedC(donneesUtilisateur.cos?.map(c => ({ value: c.id, label: c.nom_utilisateur })) || []);
        setSelectedP(donneesUtilisateur.marrain ? { value: donneesUtilisateur.marrain.id, label: donneesUtilisateur.marrain.nom_utilisateur } : null);
        setSelectedF(donneesUtilisateur.fillots?.map(f => ({ value: f.id, label: f.nom_utilisateur })) || []);
        setIsGestion(false);
    };

    const toggleGestion = () => {
        if (isGestion) {
            handleCancel();
        } else {
            setSelectedP({ value: donneesUtilisateur?.marrain?.id, label: donneesUtilisateur?.marrain?.nom_utilisateur });
            setSelectedC(donneesUtilisateur?.cos.map(c => ({ value: c.id, label: c.nom_utilisateur })));
            setSelectedF(donneesUtilisateur?.fillots.map(f => ({ value: f.id, label: f.nom_utilisateur })))
            setUserInfos(donneesUtilisateur);
            setInstruments(donneesUtilisateur?.instruments);
            setIsGestion(true);
        }
    };

    const formaterDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formaterDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    if (isPendingUser || !donneesUtilisateur) {
        return <p>Chargement des informations...</p>
    }

    return (<>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Informations</h2>
            <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                {autoriseAModifier && <DropdownEditer list={[
                    { can: true, onClick: toggleGestion, name: "Modifier" },
                ]}
                />}
            </div>
        </div>

        <Row>
            <Col md={6}>
                <InputGroup className="mb-3">
                    <InputGroup.Text><img src="/assets/icons/phone.svg" alt="Phone" style={{ width: '20px' }} /></InputGroup.Text>
                    <Form.Control
                        name="telephone"
                        value={(isGestion ? userInfos?.telephone : donneesUtilisateur.telephone) || ''}
                        placeholder="01 23 45 67 89"
                        disabled={!isGestion}
                        onChange={handleChange}
                    />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard((isGestion ? userInfos?.telephone : donneesUtilisateur.telephone) || '')}>Copier</Button>
                </InputGroup>
            </Col>
            <Col md={6}>
                <InputGroup className="mb-3">
                    <InputGroup.Text><img src="/assets/icons/mail.svg" alt="Mail" style={{ width: '20px' }} /></InputGroup.Text>
                    <Form.Control
                        name="email"
                        value={(isGestion ? userInfos?.email : donneesUtilisateur.email) || ''}
                        placeholder="example@mail.com"
                        disabled={!isGestion}
                        onChange={handleChange}
                    />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard((isGestion ? userInfos?.email : donneesUtilisateur.email) || '')}>Copier</Button>
                </InputGroup>
            </Col>
        </Row>

        {!isGestion ?
            <div className="list-question">
                <div><b>Promo :</b> {donneesUtilisateur.cycle !== "ic" && donneesUtilisateur.cycle}{donneesUtilisateur.promotion}</div>
                <div><b>Date de naissance :</b> {formaterDate(donneesUtilisateur.date_de_naissance)}</div>
                <div><b>Ville d&apos;origine :</b> {donneesUtilisateur.ville_origine}</div>
                <div><b>Chambre :</b> {donneesUtilisateur.chambre}</div>
                {donneesUtilisateur.instruments && donneesUtilisateur.instruments.length > 0 &&
                    <div>
                        <b>Instruments :</b>{' '}
                        {donneesUtilisateur.instruments.map((instrument, index) => (
                            <span key={index}>
                                {instrument.name}{instrument.niveau ? ` (${instrument.niveau})` : ''}
                                {index < donneesUtilisateur.instruments.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                }
                <div>
                    {donneesUtilisateur.cos && donneesUtilisateur.cos.length > 0 &&
                        <div><b>Cos :</b>{' '}
                            {donneesUtilisateur.cos.map((co, index) => (
                                <span key={co.id}>
                                    <Link to={`/utilisateur/${co.id}`}>{co.nom_utilisateur}</Link>
                                    {index < donneesUtilisateur.cos.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                    }
                    {donneesUtilisateur.marrain &&
                        <div><b>Marrain :</b> <Link to={`/utilisateur/${donneesUtilisateur.marrain.id}`}>{donneesUtilisateur.marrain.nom_utilisateur}</Link></div>
                    }
                    {donneesUtilisateur.fillots && donneesUtilisateur.fillots.length > 0 &&
                        <div>
                            <b>Fillots :</b>{' '}
                            {donneesUtilisateur.fillots.map((fillot, index) => (
                                <span key={fillot.id}>
                                    <Link to={`/utilisateur/${fillot.id}`}>{fillot.nom_utilisateur}</Link>
                                    {index < donneesUtilisateur.fillots.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                    }
                </div>
            </div>
            :
            <Form>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Surnom</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" name="surnom" value={userInfos.surnom} onChange={handleChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Pronoms</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" name="pronoms" value={userInfos.pronoms} onChange={handleChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Promo</Form.Label>
                    <Col sm="10">
                        <Form.Control value={userInfos.promotion} disabled />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Date de naissance</Form.Label>
                    <Col sm="10">
                        <Form.Control
                            type="date"
                            name="date_de_naissance"
                            value={formaterDateForInput(userInfos.date_de_naissance)}
                            onChange={handleChange}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Ville d&apos;origine</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" name="ville_origine" value={userInfos.ville_origine} onChange={handleChange} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Chambre</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" name="chambre" value={userInfos.chambre} onChange={handleChange} />
                    </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Instruments</Form.Label>
                    <Col sm="10">
                        {instruments && instruments.map((elt, ind) => (
                            <Row key={ind} className="mb-2 align-items-center">
                                <Col>
                                    <Form.Control
                                        value={elt.name}
                                        onChange={(e) => handleInstruChange(ind, 'name', e.target.value)}
                                        placeholder="Instrument"
                                    />
                                </Col>
                                <Col>
                                    <Form.Control
                                        value={elt.niveau}
                                        onChange={(e) => handleInstruChange(ind, 'niveau', e.target.value)}
                                        placeholder="Niveau (ex: Débutant)"
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button variant="danger" onClick={() => supprimerInstru(ind)}>
                                        <img src="/assets/icons/delete.svg" alt="Supprimer" />
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                        <Button variant="outline-primary" size="sm" onClick={ajouterInstru}>Ajouter instrument</Button>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Co</Form.Label>
                    <Col sm="10">
                        <Select
                            isMulti
                            options={options}
                            value={selectedC}
                            onChange={setSelectedC}
                            isClearable
                            classNamePrefix="react-select"
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Marrain</Form.Label>
                    <Col sm="10">
                        <Select
                            options={options}
                            value={selectedP}
                            onChange={setSelectedP}
                            isClearable
                            classNamePrefix="react-select"
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Fillots</Form.Label>
                    <Col sm="10">
                        <Select
                            isMulti
                            options={options}
                            value={selectedF}
                            onChange={setSelectedF}
                            classNamePrefix="react-select"
                        />
                    </Col>
                </Form.Group>

                <div className="d-flex gap-2 mt-3">
                    <Button variant="success" onClick={() => mutation.mutate(userInfos)}>Valider</Button>
                    <Button variant="danger" onClick={handleCancel}>Annuler</Button>
                </div>
            </Form>
        }
    </>
    );
}