import { Container, Card } from 'react-bootstrap';

function Home() {
  const mailingLists = [
    { name: 'Élèves 1A IC (P24)', email: 'promo-ic24-tous@groupes.mines-paristech.fr' },
    { name: 'Élèves 2A IC (P23)', email: 'promo-ic23-hors-cesure@groupes.mines-paristech.fr' },
    { name: 'Élèves Césuriens IC (P22)', email: 'promo-ic23-cesure@groupes.mines-paristech.fr' },
    { name: 'Élèves 2A IC et Césuriens IC (P22 + P23)', email: 'promo-ic23-tous@groupes.mines-paristech.fr' },
    { name: 'Élèves 3A IC (P21)', email: 'promo-ic22-tous@groupes.mines-paristech.fr' },
    { name: 'Élèves 1A ISUP (I24)', email: 'promo-isupfere24@groupes.mines-paristech.fr' },
    { name: 'Élèves 2A ISUP (I23)', email: 'promo-isupfere23@groupes.mines-paristech.fr' },
    { name: 'Élèves 3A ISUP (I22)', email: 'promo-isupfere22@groupes.mines-paristech.fr' },
  ];

  const contacts = [
    { name: 'Anne Mortureux, psychologue aux Mines (mercredi aprèm ou distanciel)', email: 'psy-mortureux@mines-paristech.fr', phone: '+33688782188' },
    { name: 'Anne-Hélène Malcor, psychologue aux Mines (mardi en fin d\'aprèm et soirée ou distanciel)', email: 'psy-malcor@mines-paristech.fr' },
    { name: 'Nightline Paris (appel anonymisés, 21h-2h30 / tchat anonymisé sur le site)', website: 'https://www.nightline.fr/paris', phone: '+33188321232' },
    { name: 'Pamela Vaulot (successeuse de Béatrice)', email: 'pamela.vaulot@minesparis.psl.eu', phone: '+33627202338' },
  ];

  const vpSoutien = [
    { name: 'Luigi Romain', email: 'luigi.romain@etu.minesparis.psl.eu', phone: '+33768302498' },
    { name: 'Hélory Grenade', email: 'helory.grenade@etu.minesparis.psl.eu', phone: '+33772339429' },
    { name: 'Solène Losantos', email: 'solene.losantos@etu.minesparis.psl.eu', phone: '+33625106526' },
    { name: 'Baptiste Vial', email: 'baptiste.vial@etu.minesparis.psl.eu', phone: '+33642676358' },
    { name: 'Marguerite Tabary', email: 'marguerite.tabary@etu.minesparis.psl.eu', phone: '+33634425911' },
  ];

  return (
    <Container fluid>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title as="h2" className="text-end">Mailing-lists</Card.Title>
                {mailingLists.map((list, index) => (
                  <p key={index} className="text-end small">
                    {list.name} : <a href={`mailto:${list.email}`}>{list.email}</a>
                  </p>
                ))}
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title as="h2" className="text-end">
                <a href="https://www.eleves.mines-paris.eu/media/abatage/Abatage2025compressed.pdf">L'abatage</a> 2025 est disponible !
              </Card.Title>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <Card.Title as="h2" className="text-end">Contacts en cas de mal-être</Card.Title>
                {contacts.map((contact, index) => (
                  <p key={index} className="text-end small">
                    {contact.name} : 
                    {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                    {contact.phone && <> / <a href={`tel:${contact.phone}`}>{contact.phone}</a></>}
                    {contact.website && <a href={contact.website} target="_blank" rel="noopener noreferrer">{contact.website}</a>}
                  </p>
                ))}
                <h3 className="text-end">Contacts des VP Soutien :</h3>
                {vpSoutien.map((vp, index) => (
                  <p key={index} className="text-end small">
                    {vp.name} : <a href={`mailto:${vp.email}`}>{vp.email}</a> / <a href={`tel:${vp.phone}`}>{vp.phone}</a>
                  </p>
                ))}
            </Card.Body>
          </Card>
    </Container>
  );
}

export default Home;