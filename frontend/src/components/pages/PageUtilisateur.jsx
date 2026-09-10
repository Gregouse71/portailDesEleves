import { useRef } from 'react';
import { obtenirDataUser, ajouterContenuUtilisateur, changerPhotoUtilisateur, changerBanniereUtilisateur } from '../../api/api_utilisateurs';
import { useProtected } from '../../Protected';
import TabInfo from './PageUtilisateur/Info';
import TabAsso from './PageUtilisateur/Asso';
import TabQuestions from './PageUtilisateur/Question';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TabMedia from './PageUtilisateur/Media';
import TabTemplate from '../templates/tab';
import HeaderTemplate from '../templates/entetephoto';

function PageUtilisateur() {
    const { userData } = useProtected();
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logoInputRef = useRef(null);
    const banniereInputRef = useRef(null);

    const handleFileUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const result = await ajouterContenuUtilisateur(id, file);
                if (result.success) {
                    if (type === 'photo') {
                        await changerPhotoUtilisateur(id, result.mediaId);
                    } else if (type === 'banniere') {
                        await changerBanniereUtilisateur(id, result.mediaId);
                    }
                    queryClient.invalidateQueries(['donneesUtilisateur', id]);
                    queryClient.invalidateQueries(['photosUtilisateur', id]);
                } else {
                    alert(`Erreur : ${result.message}`);
                }
            } catch (error) {
                alert(`Erreur : ${error.message}`);
            }
        }
        e.target.value = '';
    };

    const { data: donneesUtilisateur, isLoading } = useQuery({
        queryKey: ['donneesUtilisateur', id],
        queryFn: () => obtenirDataUser(id),
    });

    if (isLoading) { return (<p>Chargement...</p>); }

    const autoriseAModifier = userData.id == id || userData.is_superuser;

    // Helper to determine active tab based on URL path
    const getActiveKey = () => {
        if (location.pathname.includes('assos')) return 'assos';
        if (location.pathname.includes('questions')) return 'questions';
        if (location.pathname.includes('media')) return 'media';
        return 'info';
    };

    return (
        <Container className="py-4">
            <HeaderTemplate
                photoADroite
                banniere={donneesUtilisateur.banniere}
                image={donneesUtilisateur.photo}
                imageAlt={donneesUtilisateur.nom_utilisateur}
                titre={<>
                    {donneesUtilisateur.prenom} {donneesUtilisateur.surnom && <em>&quot;{donneesUtilisateur.surnom}&quot;</em>} {donneesUtilisateur.nom}
                    {donneesUtilisateur.pronoms && <span style={{ fontSize: "0.7em" }}> <em>({donneesUtilisateur.pronoms})</em></span>}
                </>}
                avecDropdown={autoriseAModifier}
                contenuDropdown={[
                    { can: true, onClick: () => logoInputRef.current?.click(), name: "Changer la photo" },
                    { can: true, onClick: () => banniereInputRef.current?.click(), name: "Changer la bannière" },
                ]}
                logoInputRef={logoInputRef}
                banniereInputRef={banniereInputRef}
                onLogoChange={(e) => handleFileUpload(e, 'photo')}
                onBanniereChange={(e) => handleFileUpload(e, 'banniere')}
            />

            <TabTemplate activeKey={getActiveKey()} tabs={[
                {
                    titre: "Infos", path: `/utilisateur/${id}`, key: "info", index: true,
                    element: <TabInfo id={id} autoriseAModifier={autoriseAModifier} />
                },
                {
                    titre: "Associations", path: `/utilisateur/${id}/assos`, key: "assos",
                    element: <TabAsso id={id} autoriseAModifier={autoriseAModifier} />
                },
                {
                    titre: "Questions/Réponses", path: `/utilisateur/${id}/questions`, key: "questions",
                    element: <TabQuestions id={id} autoriseAModifier={autoriseAModifier} />
                },
                {
                    titre: "Media", path: `/utilisateur/${id}/media`, key: "media",
                    element: <TabMedia id={id} autoriseAModifier={autoriseAModifier} />
                },
            ]} />
        </Container>
    );
}

export default PageUtilisateur;