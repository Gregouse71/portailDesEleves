import { useEffect, useState } from "react";
import Select from "react-select";
import { Link } from "react-router-dom";
import { chargerUtilisateursParPromo, modifierInfos, obtenirDataUser, changerMarrain, selectionnerFillots, changerCo } from "../../../api/api_utilisateurs";
import { Row, Col, Button, Form, InputGroup } from "react-bootstrap";
import { useLayout } from "../../../layouts/Layout";
import BoutonEditer from "../../elements/BoutonEditer";

export default function TabInfo({ id, autoriseAModifier }) {
    const { userData } = useLayout();
    const [isGestion, setIsGestion] = useState(false);
    const [userInfos, setUserInfos] = useState(
        {
            promo: 2,
            date_de_naissance: "0",
            chambre: "0",
            ville_origine: "Lens",
            instruments: [],
            co: null,
            marrain: null,
            fillots: []
        }
    );

    const [selectedP, setSelectedP] = useState(null);
    const [optionsP, setOptionsP] = useState([]);

    const [selectedC, setSelectedC] = useState(null);
    const [optionsC, setOptionsC] = useState([]);

    const [selectedF, setSelectedF] = useState([]);
    const [optionsF, setOptionsF] = useState([]);

    useEffect(() => {// Obtention des données utilisateur à afficher
        const fetchData = async () => {
            const data = await obtenirDataUser(id);
            setUserInfos({
                email: data.email,
                telephone: data.telephone,
                promo: data.promotion,
                date_de_naissance: data.date_de_naissance,
                chambre: data.chambre,
                ville_origine: data.ville_origine,
                instruments: data.instruments || [],
                co: data.co,
                marrain: data.marrain,
                fillots: data.fillots || []
            });

            if (data.promotion && !isNaN(parseInt(data.promotion))) {
                const promoInt = parseInt(data.promotion);

                const dataParrains = await chargerUtilisateursParPromo(promoInt - 1);
                setOptionsP(dataParrains.map(elt => ({ value: elt.id, label: elt.nom_utilisateur })));

                const dataCo = await chargerUtilisateursParPromo(promoInt);
                setOptionsC(dataCo.map(elt => ({ value: elt.id, label: elt.nom_utilisateur })));

                const dataFillots = await chargerUtilisateursParPromo(promoInt + 1);
                setOptionsF(dataFillots.map(elt => ({ value: elt.id, label: elt.nom_utilisateur })));

                if (data.co) {
                    setSelectedC({ value: data.co.id, label: data.co.nom_utilisateur });
                }
                if (data.marrain) {
                    setSelectedP({ value: data.marrain.id, label: data.marrain.nom_utilisateur });
                }
                if (data.fillots) {
                    setSelectedF(data.fillots.map(elt => ({ value: elt.id, label: elt.nom_utilisateur })));
                }
            }
        };
        fetchData();
    }, [id]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserInfos({ ...userInfos, [name]: value })
    };

    const validerModifierInfos = async () => {
        const { co, marrain, fillots, ...otherInfos } = userInfos;
        await modifierInfos(id, otherInfos);

        const newCoId = selectedC ? selectedC.value : null;
        if (co?.id !== newCoId) {
            await changerCo(id, newCoId);
        }

        const newMarrainId = selectedP ? selectedP.value : null;
        if (userInfos.marrain?.id !== newMarrainId) {
             await changerMarrain(newMarrainId, id);
        }

        await selectionnerFillots(id, selectedF.map(f => f.value));

        const data = await obtenirDataUser(id);

        setUserInfos({
            email: data.email,
            telephone: data.telephone,
            promo: data.promotion,
            date_de_naissance: data.date_de_naissance,
            chambre: data.chambre,
            ville_origine: data.ville_origine,
            instruments: data.instruments || [],
            co: data.co,
            marrain: data.marrain,
            fillots: data.fillots || []

        });

        setIsGestion(false);
    }

    const handleInstruChange = (e) => {
        const { name, value } = e.target;
        let temp = userInfos.instruments;
        temp[name] = [userInfos.instruments[name][0], value];
        setUserInfos({ ...userInfos, instruments: temp })
    }

    const handleInstruNameChange = (e) => {
        const { name, value } = e.target;
        var temp = userInfos.instruments;
        temp[name] = [value, userInfos.instruments[name][1]];
        setUserInfos({ ...userInfos, instruments: temp })
    }

    const ajouterInstru = () => {
        setUserInfos({ ...userInfos, instruments: [...userInfos.instruments, ["Piano", "1 an"]] })
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
                <p>Promo : {userInfos.promo}</p>
                <p>Ville d'origine : {userInfos.ville_origine}</p>
                <p>Chambre : {userInfos.chambre}</p>
                {userInfos.instruments && userInfos.instruments.length > 0 &&
                    <p>
                        Instruments :{' '}
                        {userInfos.instruments.map((elt, index) => (
                            <span key={index}>
                                {elt[0]} ({elt[1]})
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
                        <Form.Control value={userInfos.promo} disabled />
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

                <h3>Instruments</h3>
                {userInfos.instruments.map((elt, ind) => (
                    <Row key={ind} className="mb-2">
                        <Col>
                            <Form.Control value={elt[0]} name={ind} onChange={handleInstruNameChange} />
                        </Col>
                        <Col>
                            <Form.Control value={elt[1]} name={ind} onChange={handleInstruChange} />
                        </Col>
                    </Row>
                ))}
                <Button variant="outline-primary" size="sm" onClick={ajouterInstru}>Ajouter instrument</Button>

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
                    <Button variant="success" onClick={validerModifierInfos}>Valider</Button>
                    <Button variant="danger" onClick={() => setIsGestion(false)}>Annuler</Button>
                </div>
            </Form>
        }
    </>
    );
}