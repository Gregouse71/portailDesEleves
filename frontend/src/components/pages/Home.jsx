import { Container, Card } from 'react-bootstrap';
import Post from '../elements/Post';
import { useQuery } from '@tanstack/react-query';
import { obtenirPublicationsRecentes } from '../../api/api_publications';

function Home() {
    const mailingLists = [
        { name: 'Élèves 1A IC (P25)', email: 'promo-ic25-tous@groupes.mines-paristech.fr' },
        { name: 'Élèves 2A IC (P24)', email: 'promo-ic24-hors-cesure@groupes.mines-paristech.fr' },
        { name: 'Élèves Césuriens IC (P23)', email: 'promo-ic24-cesure@groupes.mines-paristech.fr' },
        { name: 'Élèves 2A IC et Césuriens IC (P23 + P24)', email: 'promo-ic24-tous@groupes.mines-paristech.fr' },
        { name: 'Élèves 3A IC (P22)', email: 'promo-ic23-tous@groupes.mines-paristech.fr' },
        { name: 'Élèves 1A ISUP (I25)', email: 'promo-isupfere25@groupes.mines-paristech.fr' },
        { name: 'Élèves 2A ISUP (I24)', email: 'promo-isupfere24@groupes.mines-paristech.fr' },
        { name: 'Élèves 3A ISUP (I23)', email: 'promo-isupfere23@groupes.mines-paristech.fr' },
    ];

    const contacts = [
        { name: 'Anne Mortureux, psychologue aux Mines (mercredi aprèm ou distanciel)', email: 'psy-mortureux@mines-paristech.fr', phone: '+33 (0)6 88 78 21 88' },
        { name: 'Anne-Hélène Malcor, psychologue aux Mines (mardi en fin d\'aprèm et soirée ou distanciel)', email: 'psy-malcor@mines-paristech.fr' },
        { name: 'Nightline Paris (appel anonymisés, 21h-2h30 / tchat anonymisé sur le site)', website: 'https://www.nightline.fr/paris', phone: '+33 (0)1 88 32 12 32' },
        { name: 'Pamela Vaulot (successeuse de Béatrice)', email: 'pamela.vaulot@minesparis.psl.eu', phone: '+33 (0)6 27 20 23 38' },
    ];

    const vpSoutien = [
        { name: 'Luigi Romain', email: 'luigi.romain@etu.minesparis.psl.eu', phone: '+33 (0)7 68 30 24 98' },
        { name: 'Hélory Grenade', email: 'helory.grenade@etu.minesparis.psl.eu', phone: '+33 (0)7 72 33 94 29' },
        { name: 'Solène Losantos', email: 'solene.losantos@etu.minesparis.psl.eu', phone: '+33 (0)6 25 10 65 26' },
        { name: 'Baptiste Vial', email: 'baptiste.vial@etu.minesparis.psl.eu', phone: '+33 (0)6 42 67 63 58' },
        { name: 'Marguerite Tabary', email: 'marguerite.tabary@etu.minesparis.psl.eu', phone: '+33 (0)6 34 42 59 11' },
    ];

    const { data: listePosts = [] } = useQuery({
        queryKey: ['publicationRecentes', 3],
        queryFn: () => obtenirPublicationsRecentes(3),
    });

    return (
        <Container fluid>
            <Card className="mb-3">
                <Card.Body className='d-flex flex-column gap-3'>
                    <Card.Title as="h2" className="text-end">Publications récentes</Card.Title>
                    {listePosts.map(post_id => (
                        <Post key={post_id} postId={post_id} isGestion={false}/>
                    ))}
                </Card.Body>
            </Card>
            <Card className="mb-3">
                <Card.Body>
                    <Card.Title as="h2" className="text-end">Mailing-lists</Card.Title>
                    {mailingLists.map((list, index) => (
                        <div key={index} className="text-end small text-wrap mb-2">
                            {list.name} : <a href={`mailto:${list.email}`}>{list.email}</a>
                        </div>
                    ))}
                </Card.Body>
            </Card>

            <Card className="mb-3">
                <Card.Body>
                    <Card.Title as="h2" className="text-end">
                        <a href="https://www.eleves.mines-paris.eu/media/abatage/Abatage2025compressed.pdf">L&apos;abatage</a> 2025 est disponible !
                    </Card.Title>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <Card.Title as="h2" className="text-end">Contacts en cas de mal-être</Card.Title>
                    {contacts.map((contact, index) => (
                        <div key={index} className="text-end small text-wrap mb-2">
                            {contact.name} : {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                            {contact.phone && <>{contact.email && <> / </>} <a href={`tel:${contact.phone}`}>{contact.phone}</a></>}
                            {contact.website && <> / <a href={contact.website} target="_blank" rel="noopener noreferrer">{contact.website}</a></>}
                        </div>
                    ))}
                    <h3 className="text-end">Contacts des VP Soutien :</h3>
                    {vpSoutien.map((vp, index) => (
                        <div key={index} className="text-end small text-wrap mb-2">
                            {vp.name} : <a href={`mailto:${vp.email}`}>{vp.email}</a> / <a href={`tel:${vp.phone}`}>{vp.phone}</a>
                        </div>
                    ))}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Home;