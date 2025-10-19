import { useEffect, useState } from "react";
import { chargerUtilisateursParPromo, modifierInfos, obtenirDataUser, changerMarrain, selectionnerFillots } from "../../../api/api_utilisateurs";
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

    const [selectedP, setSelectedP] = useState("");
    const [optionsP, setOptionsP] = useState([]);

    const [selectedC, setSelectedC] = useState("");
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

            if (data.co) {
                setSelectedC(data.co.id);
            }
            if (data.marrain) {
                setSelectedP(data.marrain.id);
            }
            if (data.fillots) {
                setSelectedF(data.fillots.map(f => f.id));
            }

            if (data.promotion && !isNaN(parseInt(data.promotion))) {
                const promoInt = parseInt(data.promotion);
                const dataParrains = await chargerUtilisateursParPromo(promoInt - 1);
                setOptionsP(dataParrains.map(elt => ({ value: elt.id, label: elt.prenom + " " + elt.nom })));

                const dataCo = await chargerUtilisateursParPromo(promoInt);
                setOptionsC(dataCo.map(elt => ({ value: elt.id, label: elt.prenom + " " + elt.nom })));

                const dataFillots = await chargerUtilisateursParPromo(promoInt + 1);
                setOptionsF(dataFillots.map(elt => ({ value: elt.id, label: elt.prenom + " " + elt.nom })));
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

    const validerModifierInfos = () => {
        const infosToSave = {
            ...userInfos,
            co: selectedC,
        };
        modifierInfos(id, infosToSave);

        if (selectedP) { // if a marrain is selected
            changerMarrain(selectedP, id);
        }

        if (selectedF.length > 0) {
            selectionnerFillots(selectedF);
        }

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
                    <Form.Control value={userInfos.telephone || '01 23 45 67 89'} disabled />
                    <Button variant="outline-secondary" onClick={() => copyToClipboard(userInfos.telephone || '01 23 45 67 89')}>Copier</Button>
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
                <div>
                    <h3>Instruments</h3>
                    <ul>
                        {userInfos.instruments.map(elt => (<li>{elt[0]} : {elt[1]}</li>))}
                    </ul>
                </div>
                <div>
                    <h3>Relations</h3>
                    <p>Co : {userInfos.co?.nom_utilisateur}</p>
                    <p>Marrain : {userInfos.marrain?.nom_utilisateur}</p>
                    <div>
                        <p>Fillots :</p>
                        <ul>
                            {userInfos.fillots.map(fillot => (
                                <li key={fillot.id}>{fillot.nom_utilisateur}</li>
                            ))}
                        </ul>
                    </div>
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
                        <Form.Select value={selectedC} onChange={e => setSelectedC(e.target.value)}>
                            <option value="">---</option>
                            {optionsC.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Form.Select>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Marrain</Form.Label>
                    <Col sm="10">
                        <Form.Select value={selectedP} onChange={e => setSelectedP(e.target.value)}>
                            <option value="">---</option>
                            {optionsP.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Form.Select>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">Fillots</Form.Label>
                    <Col sm="10">
                        <Form.Select 
                            multiple
                            value={selectedF} 
                            onChange={e => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedF(selectedOptions);
                            }}
                        >
                            {optionsF.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Form.Select>
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