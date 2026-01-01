import { useState } from 'react';
import '../../assets/styles/asso.scss';
import { chargerAsso, estUtilisateurDansAsso, ajouterContenu, changerPhoto } from './../../api/api_associations';
import AssoInfo from './PageAsso/AssoInfo';
import AssoMembres from './PageAsso/AssoMembres';
import AssoEvents from './PageAsso/AssoEvents';
import AssoPosts from './PageAsso/AssoPosts';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { UPLOAD_BASE_URL } from '../../api/base';
import { Container, Row, Col, Nav, Tab, Image, Button, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import AssoElection from './PageAsso/AssoElection';

function Asso() {
    const [searchParams] = useSearchParams();
    const urlTab = searchParams.get("tab");
    const validTabs = ["info", "events", "members", "posts"];
    const [activeTab, setActiveTab] = useState(validTabs.includes(urlTab) ? urlTab : "info");

    const navigate = useNavigate();
    const { id } = useParams();

    const changerPhotoLogoOuBanniere = (type_photo) => {
        document.getElementById('file-upload').setAttribute("data-type", type_photo);
        document.getElementById('file-upload').click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        const type_photo = event.target.getAttribute("data-type");

        if (file) {
            try {
                const result = await ajouterContenu(id, file);
                if (result.success) {
                    await changerPhoto(id, type_photo, result.fileName);
                    navigate(0);
                } else {
                    alert(`Erreur lors du téléversement : ${result.message}`);
                }
            } catch (error) {
                alert(`Erreur lors du téléversement : ${error.message}`);
            }
        }
    };

    const { data: asso = null } = useQuery({
        queryKey: ['asso', id],
        queryFn: () => { return chargerAsso(id) },
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', id],
        queryFn: () => { return estUtilisateurDansAsso(id) },
    });

    if (asso === null || membreData.is_membre === null) return <p>Chargement...</p>;

    const bannerStyle = {
        backgroundImage: asso.banniere_path ? `url(${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.banniere_path})` : 'none',
        backgroundColor: 'lightgrey'
    };

    const tabs = [
        { key: "info", titre: "Infos", element: <AssoInfo id={asso.id} /> },
        { key: "events", titre: "Événements", element: <AssoEvents asso_id={asso.id} /> },
        { key: "members", titre: "Membres", element: <AssoMembres asso_id={asso.id} /> },
        { key: "posts", titre: "Publications", element: <AssoPosts asso_id={asso.id} /> },
        ... asso.elections ? [{key: "elections", titre: "Élections", element: <AssoElection asso_id={asso.id} />}] : []
    ]

    return (
        <Container>
            <input
                type="file"
                id="file-upload"
                className="d-none"
                onChange={handleFileChange}
                data-type=""
            />
            <Row>
                <Col xs={12} className="p-0">
                    <div className="position-relative">
                        <div className="asso-banner rounded-top" style={bannerStyle}>
                            {membreData.autorise && (
                                <>
                                    <Button variant="primary" className="position-absolute top-0 start-0 m-2" onClick={() => changerPhotoLogoOuBanniere('logo')}>
                                        <img src="/assets/icons/add_photo.svg" alt="Changer le logo" style={{ width: '24px', height: '24px' }} /> Changer le logo
                                    </Button>
                                    <Button variant="primary" className="position-absolute top-0 end-0 m-2" onClick={() => changerPhotoLogoOuBanniere('banniere')}>
                                        <img src="/assets/icons/upload_photo.svg" alt="Changer la bannière" style={{ width: '24px', height: '24px' }} /> Changer la bannière
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            <div className="bg-light p-3 rounded-bottom">
                <Row>
                    <Col md={3} className="text-center text-md-start">
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <Image
                                src={asso.img ? `${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}` : '/assets/icons/group.svg'}
                                alt={asso.nom}
                                className="asso-logo rounded-3"
                            />
                        </div>
                    </Col>
                    <Col md={9} className="d-flex align-items-center justify-content-center justify-content-md-start mt-3 mt-md-0">
                        <h2>{asso.nom}</h2>
                        {membreData.autorise && membreData.is_membre && <Badge bg="success" className="ms-3">Vous êtes dans l'asso</Badge>}
                    </Col>
                </Row>

                <Row className="mt-3">
                    <Col xs={12}>
                        <Tab.Container id="asso-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                            <Nav variant="tabs" className="mb-3">
                                {tabs.map(elt =>
                                    <Nav.Item>
                                        <Nav.Link eventKey={elt.key}>{elt.titre}</Nav.Link>
                                    </Nav.Item>)
                                }
                            </Nav>
                            <Tab.Content>
                                {tabs.map(elt =>
                                    <Tab.Pane eventKey={elt.key}>
                                        {elt.element}
                                    </Tab.Pane>
                                )}
                            </Tab.Content>
                        </Tab.Container>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default Asso;