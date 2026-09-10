import '../../assets/styles/asso.scss';
import { useRef } from 'react';
import { chargerAsso, estUtilisateurDansAsso, uploadLogoBanniereAsso } from '../../api/api_associations';
import AssoInfo from './PageAsso/AssoInfo';
import AssoMembres from './PageAsso/AssoMembres';
import AssoEvents from './PageAsso/AssoEvents';
import AssoPosts from './PageAsso/AssoPosts';
import AssoAudio from './PageAsso/AssoAudio';
import AssoCotisations from './PageAsso/AssoCotisations';
import AssoBiblio from './PageAsso/AssoBiblio';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Badge } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AssoElection from './PageAsso/AssoElection';
import AssosMedia from './PageAsso/AssoMedia';
import TabTemplate from '../templates/tab';
import HeaderTemplate from '../templates/entetephoto';

function Asso() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const queryClient = useQueryClient();

    const logoInputRef = useRef(null);
    const banniereInputRef = useRef(null);

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
                avecDropdown={membreData.autorise}
                contenuDropdown={[
                    { can: true, onClick: () => logoInputRef.current?.click(), name: "Changer le logo" },
                    { can: true, onClick: () => banniereInputRef.current?.click(), name: "Changer la bannière" },
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
        </Container>
    );
}

export default Asso;

