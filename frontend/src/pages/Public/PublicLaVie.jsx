import { Tabs, Tab, Row, Col } from "react-bootstrap";

const QUARTIER_ITEMS = [
    {
        title: <>Le musée de <span>Minéralogie</span></>,
        alt: "Le musée de Minéralogie",
        img: "/assets/public/musee.jpg",
        caption: "L'un des plus grands musées de minéralogie du monde !",
        text: "Ne l'oublions pas, l'École des Mines formait jadis et forme encore des mineurs (oui, encore aujourd'hui, il reste des amoureux des cailloux et du sous-sol). Pour parfaire leur formation et peaufiner la connaissance des minéraux, de nombreuses pièces uniques ont ainsi été récupérées depuis la fin du 18ème siècle, des pépites d'or aux émeraudes scintillantes en passant par les fragments de météorites. C'est une authentique palette de couleurs qui se présente à vous à travers les lignes délicates de chefs-d'œuvre naturels. Un véritable régal pour les yeux.",
    },
    {
        title: <>Le jardin du <span>Luxembourg</span></>,
        alt: "Le jardin du Luxembourg",
        img: "/assets/public/luco.jpg",
        caption: "Juste à côté de l'école des Mines !",
        text: "C'est LE rendez-vous incontournable des Parisiens du quartier dès qu'un rayon de soleil illumine le Sénat. Venez y déambuler une glace à la main avant de vous asseoir sur la pelouse pour profiter d'un moment de détente. Si vous avez de la chance, vous pourrez même envisager une sieste au son des musiciens qui investissent régulièrement le belvédère. Sinon, n'hésitez pas à longer le parc côté Saint-Michel pour profiter des photos accrochées aux grilles avant de poursuivre vers le musée du Luxembourg en compagnie d'autres amateurs d'art. Les plus sportifs pourront faire le célèbre footing autour du Luco et évacuer la pression en tapant quelques balles de tennis.",
        reverse: true,
    },
    {
        title: <>Le <span>Panthéon</span></>,
        alt: "Le Panthéon",
        img: "/assets/public/pantheon.jpg",
        caption: "Le tombeau des plus grands !",
        text: "« Aux grands hommes la patrie reconnaissante. » Imaginez donc Aimé Césaire, Jean Moulin et Marie Curie réunis sous le même toit pour l'éternité sous le regard attentif du pendule de Foucault, qui après des années semble toujours hésiter entre la gauche et la droite. Sous la coupole, le calme règne et saura vous ressourcer.",
    },
    {
        title: <>La rue <span>Mouffetard</span></>,
        alt: "La rue Mouffetard",
        img: "/assets/public/mouffetard.jpg",
        caption: "À une dizaine de minutes à pied",
        text: "LA rue du Quartier Latin. Les inconditionnels du MacDo et/ou du Burger King peuvent se contenter de rester sur le Boulmich. Néanmoins, pour se plonger dans l'ambiance du Quartier Latin, il faut aller se perdre du côté de la rue Mouffetard, de la rue Descartes et de la place de la Contrescarpe. Les restaurants et les bars y pullulent, avec des prix qui peuvent être plus que raisonnables. Que vous vouliez aller fêter votre dernier oral avec un vrai repas ou vous remettre d'aplomb en allant prendre un pot avec vos collègues, vous adorerez cette ambiance de village.",
        reverse: true,
    },
];

const ASSOS_ITEMS = [
    {
        title: <>Le <span>BDE</span></>,
        alt: "Le BDE",
        img: "/assets/public/BDEminea.png",
        caption: "Une équipe surmotivée de 23 étudiants des Mines",
        text: "C'est un peu l'association des élèves pour les élèves. L'équipe saura t'accueillir pour te faire découvrir la vie associative sous tous ses aspects, plus excitants les uns que les autres. Entre l'inté, les voyages et les soirées, le BDE saura rajouter la petite touche de peps quotidien dans ta vie qui, tu le verras, sera déjà bien remplie !",
    },
    {
        title: <>Le <span>BDS</span></>,
        alt: "Le BDS",
        img: "/assets/public/bureau_bds.jpg",
        caption: "Le bureau BDS, prêt à tout pour te faire transpirer",
        text: "Le BDS est l'asso qui te fera prendre plaisir à faire du sport, que tu sois sportif ou non. Aux Mines, les créneaux de sport sont le mardi matin et le jeudi après-midi. Sur les créneaux, tu pourras pratiquer le ou les sports que tu auras choisis parmi la quinzaine de disciplines disponibles ! Si tu aimes la compétition, tu pourras participer aux championnats universitaires et aux grands tournois inter-écoles. Mais le BDS te fera aussi sortir de Paris grâce à des sorties montagnes et à des week-ends surf ! PSL propose également beaucoup de sports en plus, comme l'escrime et le saut en parachute.",
        reverse: true,
    },
    {
        title: <>Le <span>BDA</span></>,
        alt: "Le BDA",
        img: "/assets/public/bda2019.png",
        caption: "Bienvenue à bord du Dart'jeeling Limited",
        text: "Le Bureau Des Arts, ou BDA, est une association hétéroclite composée d'amoureux du cinéma ou des lettres, de passionnés de peinture ou de musique... qui ont tous hâte de te faire profiter un maximum de Paris ! Profitant de la situation exceptionnelle de la Meuh, à quelques stations de métro des plus belles salles de la capitale, nous te donnons des conseils de sortie et t'offrons des réductions inégalables pour toutes sortes de spectacles.",
    },
    {
        title: <>Le <span>Forum Trium</span></>,
        alt: "Le Forum Trium",
        img: "/assets/public/trium_2020.jpg",
        caption: "Les Mineurs bien habillés pour une journée de folie",
        text: "Le Trium c'est l'asso qui organise le plus gros événement de ton début d'année : le Forum Trium. Avec l'aide des Ponts, de l'ENSTA et de l'ENSAE, nous mettons tout en place pour que plus de 3000 étudiants puissent rencontrer 200 entreprises dans les meilleures conditions. C'est l'occasion idéale pour toi de découvrir de nouvelles entreprises, de trouver un stage ou même de revoir ton CV et préparer des entretiens avec nos partenaires. En bref : une vraie Mine d'informations !",
        reverse: true,
    },
    {
        title: <>La <span>WEI</span>-team</>,
        alt: "La WEI-team",
        img: "/assets/public/wei_team.jpg",
        caption: "L'équipe responsable du week-end d'intégration",
        text: "Toi qui t'accordes un bref instant de rêverie avec cette plaquette entre deux relectures des équations de Maxwell, tu te demandes sûrement : « Pourquoi une WEI-Team ? » Rassure-toi, au retour de ce week-end sportif et festif, tu ne te poseras plus la question. Après les trois jours d'activités de haut niveau, les chants partagés avec toute ta promo et les soirées mémorables, tu sauras pourquoi il y a une WEI Team. Et surtout, tu voudras en faire partie. La WEI Team, c'est plus qu'une association. C'est une équipe de 2A dont le seul but dans la vie est de faire rêver la promo suivante. La WEI Team, c'est de l'organisation, de la logistique, des réunions pour mettre en commun toutes les idées afin de programmer des jeux et des soirées de légende !",
    },
];

function SectionList({ items }) {
    return items.map((item) => (
        <Row key={item.alt} className="align-items-center public-section-row">
            <Col md={6} className={item.reverse ? "order-md-2 mb-3 mb-md-0" : "mb-3 mb-md-0"}>
                <figure className="effect-lexi">
                    <img src={item.img} alt={item.alt} className="img-fluid" />
                    <figcaption>
                        <p>{item.caption}</p>
                    </figcaption>
                </figure>
            </Col>
            <Col md={6} className={item.reverse ? "order-md-1" : ""}>
                <h3 className="public-heading mb-3">{item.title}</h3>
                <p className="public-text mb-0">{item.text}</p>
            </Col>
        </Row>
    ));
}

export default function PublicAdmissibles() {
    return (
        <div>
            <h3 className="public-heading text-center mb-4">
                La vie aux <span>Mines</span>
            </h3>

            <div className="public-text mb-4">
                <p>
                    La vie à l&apos;École suit un rythme très différent de celui que vous avez connu en classe préparatoire et il vous faudra sûrement un certain temps d&apos;adaptation. Les cours commencent, pour les élèves de première année, à 9h et se terminent à 17h ou à 20h (très rarement, seulement pour ceux suivant une LV3+) suivant les jours. Deux demi-journées, les mardi matins et les jeudi après-midis, sont consacrées au sport. De façon non obligatoire, vous pouvez vous inscrire dans un grand nombre de disciplines comme le volley, le basket, le foot, le rugby, l&apos;aviron, le badminton, la natation, la musculation, l&apos;athlétisme, le squash, l&apos;escalade. À ces créneaux s&apos;ajoutent deux heures d&apos;anglais et au moins autant d&apos;une LV2 au choix, sachant que vous pouvez étudier jusqu&apos;à quatre langues (parmi allemand, espagnol, portugais, arabe, chinois, japonais, russe...).
                </p>
                <p>
                    Le midi, vous disposerez d&apos;au moins une heure pour manger, parfois deux, ce qui vous laisse le temps de profiter du restaurant universitaire, de rentrer à la Maison des Mines pour vous cuisiner vous-même quelque chose ou encore de vous acheter un repas chez un des nombreux commerçants du quartier. Ensuite, libre à vous de venir manger chez vous, dans le jardin de l&apos;École quand il fait beau, ou au foyer entre deux parties de baby-foot.
                </p>
                <p>
                    Le soir, de nombreuses activités ont lieu toute la semaine au sous-sol de la résidence. Une fois par semaine, vous pourrez venir y pratiquer, par exemple, le rock, ou encore prendre part au club de Go. D&apos;autres rendez-vous hebdomadaires vous attendent également une fois rentré comme la rédaction du Vendôme, le journal de l&apos;École, tous les lundis soirs, ou les répétitions de la fanfare.
                </p>
                <p className="mb-0">
                    Une seule règle demeure : faites-vous plaisir, l&apos;école et les associations sont là pour ça !
                </p>
            </div>

            <div className="text-center mb-4">
                <img
                    src="/assets/public/mines2.png"
                    alt="Logo Mines de Paris"
                    className="img-fluid"
                    style={{ maxWidth: "400px" }}
                />
            </div>

            <div className="public-tabs">
                <Tabs defaultActiveKey="quartier">
                    <Tab eventKey="quartier" title="Le quartier">
                        <SectionList items={QUARTIER_ITEMS} />
                    </Tab>
                    <Tab eventKey="assoces" title="Associations">
                        <SectionList items={ASSOS_ITEMS} />
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
