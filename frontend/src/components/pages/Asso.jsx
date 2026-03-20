import '../../assets/styles/asso.scss';
import { chargerAsso, estUtilisateurDansAsso, ajouterContenu, changerPhoto } from '../../api/api_associations';
import AssoInfo from './PageAsso/AssoInfo';
import AssoMembres from './PageAsso/AssoMembres';
import AssoEvents from './PageAsso/AssoEvents';
import AssoPosts from './PageAsso/AssoPosts';
import AssoAudio from './PageAsso/AssoAudio';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { UPLOAD_BASE_URL } from '../../api/base';
import { Container, Row, Col, Nav, Image, Badge, Card } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import AssoElection from './PageAsso/AssoElection';
import DropdownEditer from "../elements/DropdownEditer";

function Asso() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

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

    const moduleToTab = {
        'Info': { key: "", titre: "Infos", element: <AssoInfo id={asso.id} /> },
        'Events': { key: "events", titre: "Événements", element: <AssoEvents asso_id={asso.id} /> },
        'Membres': { key: "members", titre: "Membres", element: <AssoMembres asso_id={asso.id} /> },
        'Posts': { key: "posts", titre: "Publications", element: <AssoPosts asso_id={asso.id} /> },
        'Elections': { key: "elections", titre: "Élections", element: <AssoElection asso_id={asso.id} /> },
        'Audio': { key: "audio", titre: "Audio", element: <AssoAudio asso_id={asso.id} /> },
    };

    const tabs = asso.modules.map(moduleName => moduleToTab[moduleName]).filter(Boolean);


    const currentPath = location.pathname.split('/').pop();
    const activeKey = currentPath === id ? "" : currentPath;

    return (
        <Container className='py-4'>
            <input
                type="file"
                id="file-upload"
                className="d-none"
                onChange={handleFileChange}
                data-type=""
            />
            <Card className='mb-3'>
                <Card.Header
                    style={{
                        backgroundImage: asso.banniere_path ? `url(${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.banniere_path})` : 'none',
                        height: '170px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                </Card.Header>
                <Card.Body>
                    <Row className="d-flex flex-column flex-md-row align-items-center">
                        <Col xs="auto" md="auto">
                            <Image
                                className="rounded-3"
                                src={asso.img ? `${UPLOAD_BASE_URL}/associations/${asso.nom_dossier}/${asso.img}` : '/assets/icons/group.svg'}
                                alt={asso.nom}
                                rounded
                                style={{
                                    position: 'relative',
                                    top: '-120px',
                                    height: '150px',
                                    border: '2px solid white',
                                    marginBottom: '-120px'
                                }}
                            />
                        </Col>
                        <Col md="auto" className="text-center text-md-start">
                            <h2>{asso.nom}</h2>
                        </Col>
                        <Col className="text-left text-md-start">
                            {membreData.is_membre && <Badge className="asso-member-badge ms-3">membre</Badge>}
                        </Col>
                        {membreData.autorise && (
                            <Col md="auto" className="text-right text-md-start">
                                <DropdownEditer list={[
                                    { can: true, onClick: () => changerPhotoLogoOuBanniere('logo'), name: "Changer le logo" },
                                    { can: true, onClick: () => changerPhotoLogoOuBanniere('banniere'), name: "Changer la bannière" },
                                ]}
                                />
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            <Nav variant="tabs" className="mb-3" activeKey={activeKey}>
                {tabs.map((elt, ind) =>
                    <Nav.Item key={ind}>
                        <Nav.Link as={Link} eventKey={elt.key} to={`/assos/get/${id}/${elt.key}`}>
                            {elt.titre}
                        </Nav.Link>
                    </Nav.Item>
                )}
            </Nav>

            <Routes>
                {tabs.map((elt, ind) => (
                    <Route key={elt.key} index={ind === 0}
                        path={ind === 0 ? undefined : elt.key} element={elt.element}
                    />
                ))}
            </Routes>
        </Container>
    );
}

export default Asso;

