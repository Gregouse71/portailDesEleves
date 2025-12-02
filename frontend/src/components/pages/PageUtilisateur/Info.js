import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Select from "react-select";
import { Link } from "react-router-dom";
import { chargerUtilisateursParPromo, modifierInfos, obtenirDataUser, changerMarrain, selectionnerFillots, changerCo } from "../../../api/api_utilisateurs";
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
        queryFn: () => chargerUtilisateursParPromo(promo - 1),
        enabled: !!promo, // only run if promo is defined
    });
    const { data: coUsers } = useQuery({
        queryKey: ["promoUsers", promo],
        queryFn: () => chargerUtilisateursParPromo(promo),
        enabled: !!promo,
    });
    const { data: fillots } = useQuery({
        queryKey: ["promoUsers", promo + 1],
        queryFn: () => chargerUtilisateursParPromo(promo + 1),
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
    const [selectedC, setSelectedC] = useState(null);
    const [optionsC, setOptionsC] = useState([]);
    const [selectedF, setSelectedF] = useState([]);
    const [optionsF, setOptionsF] = useState([]);

    useEffect(() => {
        if (!userInfos?.promotion) return;

        const fetchOptions = async () => {
            if (parrains) setOptionsP(parrains.map(u => ({ value: u.id, label: u.nom_utilisateur })));
            if (coUsers) setOptionsC(coUsers.map(u => ({ value: u.id, label: u.nom_utilisateur })));
            if (fillots) setOptionsF(fillots.map(u => ({ value: u.id, label: u.nom_utilisateur })));

            if (userInfos.co) setSelectedC({ value: userInfos.co.id, label: userInfos.co.nom_utilisateur });
            if (userInfos.marrain) setSelectedP({ value: userInfos.marrain.id, label: userInfos.marrain.nom_utilisateur });
            if (userInfos.fillots) setSelectedF(userInfos.fillots.map(f => ({ value: f.id, label: f.nom_utilisateur })));
        };
        fetchOptions();
    }, [userInfos, parrains, coUsers, fillots]);

    const mutation = useMutation({
        mutationFn: async (updatedInfos) => {
            const { co, marrain, fillots, ...otherInfos } = updatedInfos;
            await modifierInfos(id, otherInfos);

            const newCoId = selectedC?.value ?? null;
            if (co?.id !== newCoId) await changerCo(id, newCoId);

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
        const newInstruments = [...userInfos.instruments];
        newInstruments[index] = { ...newInstruments[index], [field]: value };
        setUserInfos({ ...userInfos, instruments: newInstruments });
    };
    
    const ajouterInstru = () => {
        const newInstruments = [...(userInfos.instruments || []), { name: "Piano", niveau: "Débutant" }];
        setUserInfos({ ...userInfos, instruments: newInstruments });
    };

    if (isPendingUser || !userInfos) {
        return <p>Chargement des informations...</p>
    }

    return (<>
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Informations personnelles</h2>
            {autoriseAModifier && <BoutonEditer onClick={() => setIsGestion(!isGestion)} />}
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
                    <Form.Control value={userInfos.email || 'example@mail.com'} disabled />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard(userInfos.email || 'example@mail.com')}>Copier</Button>
                </InputGroup>
            </Col>
        </Row>

        {!isGestion ?
            <>
                <p>Promo : {userInfos.promotion}</p>
                <p>Ville d'origine : {userInfos.ville_origine}</p>
                <p>Chambre : {userInfos.chambre}</p>
                {userInfos.instruments && userInfos.instruments.length > 0 &&
                    <p>
                        Instruments :{' '}
                        {userInfos.instruments.map((instrument, index) => (
                            <span key={index}>
                                {instrument.name}{instrument.niveau ? ` (${instrument.niveau})` : ''}
                                {index < userInfos.instruments.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </p>
                }
                <div>
                    <h3>Relations</h3>
                    {userInfos.co &&
                        <p>Co : <Link to={`/utilisateur/${userInfos.co.id}`}>{userInfos.co.nom_utilisateur}</Link></p>
                    }
                    {userInfos.marrain &&
                        <p>Marrain : <Link to={`/utilisateur/${userInfos.marrain.id}`}>{userInfos.marrain.nom_utilisateur}</Link></p>
                    }
                    {userInfos.fillots && userInfos.fillots.length > 0 &&
                        <p>
                            Fillots :{' '}
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
                        {userInfos.instruments && userInfos.instruments.map((elt, ind) => (
                            <Row key={ind} className="mb-2">
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
                            </Row>
                        ))}
                        <Button variant="outline-primary" size="sm" onClick={ajouterInstru}>Ajouter instrument</Button>
                    </Col>
                </Form.Group>

                <h3 className="mt-3">Relations</h3>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Co</Form.Label>
                    <Col sm="10">
                        <Select
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
                    <Button variant="danger" onClick={() => setIsGestion(false)}>Annuler</Button>
                </div>
            </Form>
        }
    </>
    );
}