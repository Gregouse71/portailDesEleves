import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { Link } from "react-router-dom";
import { chargerUtilisateurs, modifierInfos, obtenirDataUser, changerMarrain, selectionnerFillots, changerCo } from "../../../api/api_utilisateurs";
import { Row, Col, Button, Form, InputGroup } from "react-bootstrap";
import BoutonEditer from "../../elements/BoutonEditer";

export default function TabInfo({ id, autoriseAModifier }) {
    const queryClient = useQueryClient();
    const [isGestion, setIsGestion] = useState(false);

    const { data: donneesUtilisateur, isPending: isPendingUser } = useQuery({
        queryKey: ['donneesUtilisateur', id],
        queryFn: () => obtenirDataUser(id),
    });

    const [userInfos, setUserInfos] = useState(null);

    useEffect(() => {
        if (donneesUtilisateur) {
            setUserInfos(donneesUtilisateur);
        }
    }, [donneesUtilisateur]);


    const promo = Number(userInfos?.promotion);
    const { data: parrains } = useQuery({
        queryKey: ["promoUsers", promo - 1],
        queryFn: () => chargerUtilisateurs(promo - 1),
        enabled: !!promo, // only run if promo is defined
    });
    const { data: coUsers } = useQuery({
        queryKey: ["allUsers"],
        queryFn: () => chargerUtilisateurs(),
    });
    const { data: fillots } = useQuery({
        queryKey: ["promoUsers", promo + 1],
        queryFn: () => chargerUtilisateurs(promo + 1),
        enabled: !!promo,
    });

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


    const [selectedP, setSelectedP] = useState(null);
    const [optionsP, setOptionsP] = useState([]);
    const [selectedC, setSelectedC] = useState([]);
    const [optionsC, setOptionsC] = useState([]);
    const [selectedF, setSelectedF] = useState([]);
    const [optionsF, setOptionsF] = useState([]);
    const [instruments, setInstruments] = useState([]);

    useEffect(() => {
        if (!donneesUtilisateur) return;

        if (parrains) setOptionsP(parrains.map(u => ({ value: u.id, label: u.nom_utilisateur })));
        if (coUsers) setOptionsC(coUsers.map(u => ({ value: u.id, label: u.nom_utilisateur })));
        if (fillots) setOptionsF(fillots.map(u => ({ value: u.id, label: u.nom_utilisateur })));
    }, [parrains, coUsers, fillots, donneesUtilisateur]);

    useEffect(() => {
        if (!donneesUtilisateur) return;

        if (donneesUtilisateur.cos) setSelectedC(donneesUtilisateur.cos.map(c => ({ value: c.id, label: c.nom_utilisateur })));
        if (donneesUtilisateur.marrain) setSelectedP({ value: donneesUtilisateur.marrain.id, label: donneesUtilisateur.marrain.nom_utilisateur });
        if (donneesUtilisateur.fillots) setSelectedF(donneesUtilisateur.fillots.map(f => ({ value: f.id, label: f.nom_utilisateur })));
        if (donneesUtilisateur.instruments) setInstruments(donneesUtilisateur.instruments);
    }, [donneesUtilisateur]);

    const mutation = useMutation({
        mutationFn: async (updatedInfos) => {
            const { cos, marrain, fillots, ...otherInfos } = updatedInfos;
            await modifierInfos(id, { ...otherInfos, instruments });

            const newCoIds = selectedC.map(c => c.value);
            await changerCo(id, newCoIds);

            const newMarrainId = selectedP?.value ?? null;
            if (marrain?.id !== newMarrainId) await changerMarrain(newMarrainId, id);

            await selectionnerFillots(id, selectedF.map(f => f.value));
        },
        onSuccess: (updatedUser) => {
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

    if (isPendingUser || !userInfos) {
        return <p>Chargement des informations...</p>
    }

    return (<>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Informations</h2>
            {autoriseAModifier && <BoutonEditer onClick={toggleGestion} />}
        </div>

        <Row>
            <Col md={6}>
                <InputGroup className="mb-3">
                    <InputGroup.Text><img src="/assets/icons/phone.svg" alt="Phone" style={{ width: '20px' }} /></InputGroup.Text>
                    <Form.Control
                        name="telephone"
                        value={userInfos.telephone || ''}
                        placeholder="01 23 45 67 89"
                        disabled={!isGestion}
                        onChange={handleChange}
                    />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard(userInfos.telephone || '')}>Copier</Button>
                </InputGroup>
            </Col>
            <Col md={6}>
                <InputGroup className="mb-3">
                    <InputGroup.Text><img src="/assets/icons/mail.svg" alt="Mail" style={{ width: '20px' }} /></InputGroup.Text>
                    <Form.Control
                        name="email"
                        value={userInfos.email || ''}
                        placeholder="example@mail.com"
                        disabled={!isGestion}
                        onChange={handleChange}
                    />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard(userInfos.email || '')}>Copier</Button>
                </InputGroup>
            </Col>
        </Row>

        {!isGestion ?
            <>
                <p><b>Promo :</b> {userInfos.promotion}</p>
                <p><b>Date de naissance :</b> {formaterDate(userInfos.date_de_naissance)}</p>
                <p><b>Ville d'origine :</b> {userInfos.ville_origine}</p>
                <p><b>Chambre :</b> {userInfos.chambre}</p>
                {userInfos.instruments && userInfos.instruments.length > 0 &&
                    <p>
                        <b>Instruments :</b>{' '}
                        {userInfos.instruments.map((instrument, index) => (
                            <span key={index}>
                                {instrument.name}{instrument.niveau ? ` (${instrument.niveau})` : ''}
                                {index < userInfos.instruments.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </p>
                }
                <div>
                    {userInfos.cos && userInfos.cos.length > 0 &&
                        <p><b>Cos :</b>{' '}
                            {userInfos.cos.map((co, index) => (
                                <span key={co.id}>
                                    <Link to={`/utilisateur/${co.id}`}>{co.nom_utilisateur}</Link>
                                    {index < userInfos.cos.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </p>
                    }
                    {userInfos.marrain &&
                        <p><b>Marrain :</b> <Link to={`/utilisateur/${userInfos.marrain.id}`}>{userInfos.marrain.nom_utilisateur}</Link></p>
                    }
                    {userInfos.fillots && userInfos.fillots.length > 0 &&
                        <p>
                            <b>Fillots :</b>{' '}
                            {userInfos.fillots.map((fillot, index) => (
                                <span key={fillot.id}>
                                    <Link to={`/utilisateur/${fillot.id}`}>{fillot.nom_utilisateur}</Link>
                                    {index < userInfos.fillots.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </p>
                    }
                </div>
            </>
            :
            <Form>
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
                    <Form.Label column sm="2">Ville d'origine</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" name="ville_origine" value={userInfos.ville_origine} onChange={e => handleChange(e)} />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Chambre</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text" name="chambre" value={userInfos.chambre} onChange={e => handleChange(e)} />
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
                            options={optionsC}
                            value={selectedC}
                            onChange={setSelectedC}
                            isClearable
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Marrain</Form.Label>
                    <Col sm="10">
                        <Select
                            options={optionsP}
                            value={selectedP}
                            onChange={setSelectedP}
                            isClearable
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Fillots</Form.Label>
                    <Col sm="10">
                        <Select
                            isMulti
                            options={optionsF}
                            value={selectedF}
                            onChange={setSelectedF}
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