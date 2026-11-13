import '../../assets/styles/asso.scss';
import { useRef, useState } from 'react';
import { chargerAsso, estUtilisateurDansAsso, uploadLogoBanniereAsso, editerModulesAsso } from '../../api/api_associations';
import AssoInfo from './AssoInfo';
import AssoMembres from './AssoMembres';
import AssoEvents from './AssoEvents';
import AssoPosts from './AssoPosts';
import AssoAudio from './AssoAudio';
import AssoCotisations from './AssoCotisations';
import AssoBiblio from './AssoBiblio';
import { useLocation, useParams } from 'react-router-dom';
import { Container, Badge, Modal, Button, Form } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AssoElection from './AssoElection';
import AssosMedia from './AssoMedia';
import AssoMusiciens from './AssoMusiciens';
import TabTemplate from '../../components/templates/TabTemplate';
import HeaderTemplate from '../../components/templates/HeaderTemplate';
import { useProtected } from '../../Protected';

// Liste de tous les modules activables
const TOUS_LES_MODULES = [
    { nom: 'Info', label: 'Infos' },
    { nom: 'Events', label: 'Événements' },
    { nom: 'Membres', label: 'Membres' },
    { nom: 'Posts', label: 'Publications' },
    { nom: 'Media', label: 'Media' },
    { nom: 'Elections', label: 'Élections' },
    { nom: 'Audio', label: 'Audio' },
    { nom: 'Biblio', label: 'Bibliothèque' },
    { nom: 'Musiciens', label: 'Musiciens' },
    { nom: 'Cotisations', label: 'Cotisations' },
];

function Asso() {
    const { id } = useParams();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { userData } = useProtected();
    const estSuperUtilisateur = userData.is_superuser;

    const logoInputRef = useRef(null);
    const banniereInputRef = useRef(null);

    const [showModulesModal, setShowModulesModal] = useState(false);
    const [modulesSelectionnes, setModulesSelectionnes] = useState([]);
    const [savingModules, setSavingModules] = useState(false);

    const { data: asso = null } = useQuery({
        queryKey: ['asso', id],
        queryFn: () => { return chargerAsso(id) },
    });
    const { data: membreData = { is_membre: false, autorise: false } } = useQuery({
        queryKey: ['membreData', id],
        queryFn: () => { return estUtilisateurDansAsso(id) },
    });

    const handleFileUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const result = await uploadLogoBanniereAsso(id, type, file);
                if (result.success) {
                    queryClient.invalidateQueries(['asso', id]);
                    queryClient.invalidateQueries(['photosAsso', id]);
                } else {
                    alert(`Erreur : ${result.message}`);
                }
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
        e.target.value = '';
    };

    const ouvrirModalModules = () => {
        setModulesSelectionnes(asso?.modules ?? []);
        setShowModulesModal(true);
    };

    const toggleModule = (nom) => {
        setModulesSelectionnes(prev =>
            prev.includes(nom) ? prev.filter(m => m !== nom) : [...prev, nom]
        );
    };

    const handleSaveModules = async () => {
        setSavingModules(true);
        try {
            await editerModulesAsso(id, modulesSelectionnes);
            queryClient.invalidateQueries({ queryKey: ['asso', id] });
            setShowModulesModal(false);
        } catch (error) {
            alert(`Erreur : ${error.message}`);
        } finally {
            setSavingModules(false);
        }
    };

    if (asso === null || membreData.is_membre === null) return <p>Chargement...</p>;

    const moduleToTab = {
        'Info': {
            key: "infos", index: true, titre: "Infos", path: `/assos/get/${id}`,
            element: <AssoInfo id={asso.id} membreData={membreData} />
        },
        'Events': {
            key: "events", titre: "Événements", path: `/assos/get/${id}/events`,
            element: <AssoEvents asso_id={asso.id} membreData={membreData} />
        },
        'Membres': {
            key: "members", titre: "Membres", path: `/assos/get/${id}/members`,
            element: <AssoMembres asso_id={asso.id} membreData={membreData} />
        },
        'Posts': {
            key: "posts", titre: "Publications", path: `/assos/get/${id}/posts`,
            element: <AssoPosts asso_id={asso.id} membreData={membreData} />
        },
        'Media': {
            key: "media", titre: "Media", path: `/assos/get/${id}/media`,
            element: <AssosMedia asso_id={asso.id} membreData={membreData} />
        },
        'Elections': {
            key: "elections", titre: "Élections", path: `/assos/get/${id}/elections`,
            element: <AssoElection asso_id={asso.id} membreData={membreData} />
        },
        'Audio': {
            key: "audio", titre: "Audio", path: `/assos/get/${id}/audio`,
            element: <AssoAudio asso_id={asso.id} membreData={membreData} />
        },
        'Biblio': {
            key: "biblio", titre: "Bibliothèque", path: `/assos/get/${id}/biblio`,
            element: <AssoBiblio asso_id={asso.id} membreData={membreData} />
        },
        'Musiciens': {
            key: "musiciens", titre: "Musiciens", path: `/assos/get/${id}/musiciens`,
            element: <AssoMusiciens asso_id={asso.id} membreData={membreData} />
        },
        ...(membreData.admin && {
            'Cotisations': {
                key: "cotisations", titre: "Cotisations", path: `/assos/get/${id}/cotisations`,
                element: <AssoCotisations asso_id={asso.id} membreData={membreData} />
            }
        }),
    };

    const tabs = asso.modules.map(moduleName => moduleToTab[moduleName]).filter(Boolean);

    const currentPath = location.pathname.split('/').pop();
    const activeKey = currentPath === id ? "infos" : currentPath;

    return (
        <Container className='py-4'>
            <HeaderTemplate
                banniere={asso.banniere_path}
                image={asso.img || '/assets/icons/group.svg'}
                imageAlt={asso.nom}
                titre={asso.nom}
                sousTitre={
                    <div>
                        {membreData.is_membre && <Badge bg="success" className="me-1">membre</Badge>}
                        {membreData.cotisant && <Badge bg="primary" className="me-1">cotisant</Badge>}
                    </div>
                }
                avecDropdown={membreData.autorise || estSuperUtilisateur}
                contenuDropdown={[
                    { can: membreData.autorise, onClick: () => logoInputRef.current?.click(), name: "Changer le logo" },
                    { can: membreData.autorise, onClick: () => banniereInputRef.current?.click(), name: "Changer la bannière" },
                    { can: estSuperUtilisateur, onClick: ouvrirModalModules, name: "Modifier les modules" },
                ]}
                logoInputRef={logoInputRef}
                banniereInputRef={banniereInputRef}
                onLogoChange={(e) => handleFileUpload(e, 'logo')}
                onBanniereChange={(e) => handleFileUpload(e, 'banniere')}
            />

            <TabTemplate
                activeKey={activeKey}
                tabs={
                    tabs
                }
            />

            <Modal show={showModulesModal} onHide={() => setShowModulesModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Modifier les modules</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {TOUS_LES_MODULES.map(({ nom, label }) => (
                            <Form.Check
                                key={nom}
                                type="checkbox"
                                id={`module-${nom}`}
                                label={label}
                                checked={modulesSelectionnes.includes(nom)}
                                onChange={() => toggleModule(nom)}
                            />
                        ))}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModulesModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleSaveModules} disabled={savingModules}>
                        {savingModules ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default Asso;