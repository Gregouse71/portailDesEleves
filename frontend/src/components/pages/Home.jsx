import { Container, Card } from 'react-bootstrap';
import Post from '../elements/Post';
import { useQuery } from '@tanstack/react-query';
import { obtenirPublicationsRecentes } from '../../api/api_publications';

function Home() {
    const mailingLists = [
        { name: 'Élèves 1A IC (P26)', email: 'promo-ic26-tous@minesparis.psl.eu' },
        { name: 'Élèves 2A IC (P25)', email: 'promo-ic25-hors-cesure@minesparis.psl.eu' },
        { name: 'Élèves Césuriens IC (P24)', email: 'promo-ic25-cesure@minesparis.psl.eu' },
        { name: 'Élèves 2A IC et Césuriens IC (P24 + P25)', email: 'promo-ic25-tous@minesparis.psl.eu' },
        { name: 'Élèves 3A IC (P23 + P24)', email: 'promo-ic24-tous@minesparis.psl.eu' },
        { name: 'Élèves 1A ISUP (I26)', email: 'promo-isupfere26@minesparis.psl.eu' },
        { name: 'Élèves 2A ISUP (I25)', email: 'promo-isupfere25@minesparis.psl.eu' },
        { name: 'Élèves 3A ISUP (I24)', email: 'promo-isupfere24@minesparis.psl.eu' },
    ];

    const contacts = [
        { name: 'Anne Mortureux, psychologue aux Mines (mercredi aprèm ou distanciel)', email: 'psy-mortureux@minesparis.psl.eu', phone: '+33 (0)6 88 78 21 88' },
        { name: 'Anne-Hélène Malcor, psychologue aux Mines (mardi en fin d\'aprèm et soirée ou distanciel)', email: 'psy-malcor@minesparis.psl.eu' },
        { name: 'Nightline Paris (appel anonymisés, 21h-2h30 / tchat anonymisé sur le site)', website: 'https://www.nightline.fr/paris', phone: '+33 (0)1 88 32 12 32' },
        { name: 'Pamela Vaulot, chargée de la vie étudiante', email: 'pamela.vaulot@minesparis.psl.eu', phone: '+33 (0)6 27 20 23 38' },
    ];

    const vpSoutien = [
        { name: 'Oriane Arnaud', email: 'oriane.arnaud@etu.minesparis.psl.eu', phone: '+33 (0)7 84 26 17 28' },
        { name: 'Raphaelle Christmann', email: 'raphaelle.christmann@etu.minesparis.psl.eu', phone: '+33 (0)7 67 02 25 59' },
        { name: 'Pierre Dubrez', email: 'pierre.dubrez@etu.minesparis.psl.eu', phone: '+33 (0)6 58 84 90 95' },
        { name: 'Inès Gabillé', email: 'ines.gabille@etu.minesparis.psl.eu', phone: '+33 (0)7 81 28 32 54' },
        { name: 'Christiane Hebey', email: 'christiane.hebey@etu.minesparis.psl.eu', phone: '+33 (0)6 32 34 31 31' },
    ];

    const { data, isLoading, isError } = useQuery({
        queryKey: ['publicationRecentes', 'all', 3],
        queryFn: () => obtenirPublicationsRecentes({ page: 1, per: 3 }),
    });

    return (
        <Container fluid>
            <Card className="mb-3">
                <Card.Body className='d-flex flex-column gap-3'>
                    <Card.Title as="h2" className="text-end">Publications récentes</Card.Title>
                    {(!isLoading && !isError) && data.publications.map(post_id => (
                        <Post key={post_id} postId={post_id} isGestion={false} />
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
                        <a href="https://www.calameo.com/read/008240352e3eed81bb7e1?authid=aMzxtHx9pHND">L&apos;abatage 2026</a> est disponible !
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
