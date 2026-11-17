import { Modal, Button } from "react-bootstrap";

export default function AtcManualModal({ show, onHide }) {
    return (
        <Modal show={show} onHide={onHide} size="lg" scrollable>
            <Modal.Header closeButton>
                <Modal.Title className="fs-5 fw-bold">
                    Manuel du jeu
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="atc-manpage">
                <h6 className="mt-1">Nom</h6>
                <p className="mb-2">
                    <code>atc</code> — Jeu de simulation de contrôle du trafic aérien
                </p>

                <h6>Description</h6>
                <p className="mb-2">
                    <strong>Contrôleur de l&apos;air</strong> (<code>atc</code>) vous permet de vous essayer au métier éprouvant de contrôleur aérien sans mettre en danger la vie de millions de voyageurs chaque année. Votre mission consiste à diriger le vol d&apos;avions à réaction (<em>jets</em>) et d&apos;avions à hélices entrant et sortant de l&apos;espace aérien contrôlé et des aéroports. Un tour d&apos;horloge (mise à jour du radar) s&apos;écoule toutes les <strong>5 secondes</strong>.
                </p>

                <h6>Objectifs</h6>
                <p className="mb-2">
                    Votre objectif est de faire durer la partie le plus longtemps possible et d&apos;acheminer un maximum d&apos;avions à bon port. Il n&apos;y a pas d&apos;état de victoire final, si ce n&apos;est de battre le score des autres joueurs. Vous devrez :
                </p>
                <ul className="ps-3 mb-2">
                    <li>
                        <strong>faire décoller</strong> les avions en attente aux aéroports (en leur ordonnant d&apos;augmenter leur altitude) ;
                    </li>
                    <li>
                        <strong>faire atterrir</strong> les avions aux aéroports (en leur ordonnant de descendre à l&apos;altitude <code>0</code> lorsqu&apos;ils arrivent exactement au-dessus de l&apos;aéroport, alignés dans le sens de la piste) ;
                    </li>
                    <li>
                        <strong>faire sortir</strong> les avions en transit par leur porte de sortie à la bonne altitude (<code>9000</code> pieds).
                    </li>
                </ul>
                <p className="mb-2">
                    Plusieurs événements provoquent la fin immédiate de la partie :
                </p>
                <ul className="ps-3 mb-2">
                    <li>envoyer un avion vers une mauvaise destination (mauvaise porte de sortie ou mauvais aéroport) ;</li>
                    <li>laisser un avion quitter l&apos;espace aérien en dehors de sa porte de sortie de destination, ou à une altitude différente de <code>9</code> (9000 pieds) ;</li>
                    <li>faire atterrir un avion dans le mauvais sens de la piste, ou le faire descendre à l&apos;altitude <code>0</code> en dehors d&apos;un aéroport (crash), ou dépasser l&apos;altitude <code>9</code> ;</li>
                    <li>laisser un avion tomber en panne sèche de carburant ;</li>
                    <li>
                        provoquer une <strong>collision</strong> : une collision est définie par la proximité immédiate (distance ≤ 1) de deux avions simultanément dans les trois dimensions (X, Y et altitude).
                    </li>
                </ul>
                <p className="mb-2">
                    Les scores sont classés d&apos;abord par le <strong>nombre d&apos;avions sécurisés</strong>, puis par le <strong>nombre de tours</strong> (<em>ticks</em>) en cas d&apos;égalité. Vous pouvez mettre la partie en pause avec le bouton <strong>Pause</strong> (ce qui termine le tour en cours et masque le plateau) ou clore votre service à tout moment avec <strong>Terminer la partie</strong>.
                </p>

                <h6>L&apos;affichage</h6>
                <p className="mb-1">
                    L&apos;écran du terminal est divisé en trois zones :
                </p>
                <ul className="ps-3 mb-2">
                    <li className="mb-1">
                        <strong>Le radar :</strong> affiche la position des avions, des aéroports, des portes d&apos;entrée/sortie, des balises radar et des « lignes » de couloirs aériens (<code>+</code>) qui servent de repères visuels pour vous aider à guider les avions.
                        <ul className="ps-3 mt-1">
                            <li>
                                <strong>Avions :</strong> représentés par une lettre suivie d&apos;un chiffre indiquant l&apos;altitude en milliers de pieds (<code>0</code> à <code>9</code>). Les avions à hélices sont représentés par une lettre <strong>majuscule</strong> (<code>A</code>–<code>Z</code>) et les avions à réaction (<em>jets</em>) par une lettre <strong>minuscule</strong> (<code>a</code>–<code>z</code>). Chaque avion est affiché de la même couleur que sa destination.
                            </li>
                            <li>
                                <strong>Aéroports (<code>^0</code>, <code>&gt;1</code>) :</strong> représentés par un numéro précédé d&apos;un symbole indiquant la direction de la piste : <code>^</code> pour le Nord (0°), <code>&gt;</code> pour l&apos;Est (90°), <code>v</code> pour le Sud (180°) et <code>&lt;</code> pour l&apos;Ouest (270°). Les avions décollent dans cette direction et doivent impérativement voler dans ce même cap pour atterrir.
                            </li>
                            <li>
                                <strong>Balises (<code>*0</code>, <code>*1</code>) :</strong> représentées par un astérisque et un numéro. Elles offrent un point de référence aux pilotes pour différer un changement de cap ou une mise en attente (voir <em>La commande de délai</em>).
                            </li>
                            <li>
                                <strong>Portes d&apos;entrée/sortie (<code>0</code> à <code>7</code>) :</strong> affichées le long de la bordure du radar. Les avions y entrent sans préavis à <strong>7000 pieds</strong> (<code>7</code>) suivant le cap d&apos;entrée propre à cette porte. Pour sortir avec succès par sa porte de destination, un avion doit voler à <strong>9000 pieds</strong> (<code>9</code>) (aucune direction particulière n&apos;est exigée pour la sortie).
                            </li>
                        </ul>
                    </li>
                    <li className="mb-1">
                        <strong>La zone d&apos;information (à droite du radar) :</strong> indique le temps écoulé (<code>Tps</code>, en nombre de tours) et le nombre d&apos;avions sortis ou posés sains et saufs (<code>Sûrs</code>). En dessous figure la liste des avions actuellement en vol, suivie d&apos;une ligne vide, puis la liste des avions au sol (en attente aux aéroports). Chaque ligne mentionne l&apos;avion et son altitude, un astérisque éventuel <code>*</code> signalant un carburant faible (&lt; 15 tours), sa destination (<code>A0</code>..<code>A1</code> ou <code>S0</code>..<code>S7</code>) et sa consigne de navigation actuelle (le changement d&apos;altitude n&apos;y est pas affiché). Exemples :
                        <pre className="mt-1">{`B4*A0: Cercle @ B1\ng7 S4: 225`}</pre>
                        Le premier exemple montre un avion à hélices nommé <code>B</code> volant à 4000 pieds, à court de carburant (notez le <code>*</code>), à destination de l&apos;aéroport <code>#0</code>, qui a pour consigne de décrire un cercle dès qu&apos;il atteindra la balise <code>#1</code>. Le second exemple montre un jet nommé <code>g</code> à 7000 pieds, à destination de la sortie <code>#4</code>, en train d&apos;exécuter un virage vers le cap 225° (Sud-Ouest).
                    </li>
                    <li>
                        <strong>La zone de saisie (en bas du radar) :</strong> affiche la commande en cours de composition ainsi que les aides contextuelles ou messages d&apos;erreur.
                    </li>
                </ul>

                <h6>Saisie et commandes</h6>
                <p className="mb-2">
                    Une interface de complétion automatique est intégrée au jeu (et des aides cliquables apparaissent en bas à droite). À tout moment, appuyer sur <code>?</code> affiche les caractères possibles à l&apos;étape courante. Appuyer sur <code>Retour arrière</code> (<code>Backspace</code>) efface la dernière partie de la commande. Lorsque votre commande est complète, appuyez sur <code>Entrée</code> : la vérification sémantique est alors effectuée. Si aucune erreur n&apos;est détectée, l&apos;ordre est envoyé à l&apos;avion ; en cas d&apos;erreur, la partie fautive est soulignée par des accents circonflexes (<code>^^^</code>) accompagnés d&apos;un message explicatif.
                </p>
                <p className="mb-2">
                    Dans les tables ci-dessous, <code>[0-9]</code> désigne un chiffre unique, et <code>&lt;cap&gt;</code> désigne une direction indiquée par les 8 touches entourant la touche <code>s</code> du clavier AZERTY : <code>zedcxwqa</code>. En valeur absolue, <code>a</code> désigne le Nord-Ouest (315°) et <code>z</code> le Nord (0°). En valeur relative, <code>a</code> désigne -45° (45° à gauche) et <code>z</code> désigne 0° (aucun changement de cap). Toutes les commandes commencent par la lettre de l&apos;avion destinataire (insensible à la casse).
                </p>

                <p className="mb-1 fw-bold">1. Commandes immédiates uniquement (prennent effet au prochain tour) :</p>
                <ul className="ps-3 mb-2">
                    <li>
                        <code>a [cd+-] nombre</code> — <strong>Altitude :</strong> change l&apos;altitude d&apos;un avion (et fait décoller un avion au sol si l&apos;altitude cible est &gt; 0).
                        <ul className="ps-3">
                            <li><code>a [0-9]</code> : monter ou descendre vers l&apos;altitude donnée (en milliers de pieds).</li>
                            <li><code>ac [1-9]</code> ou <code>a+ [1-9]</code> : monter (gain d&apos;altitude relatif en milliers de pieds).</li>
                            <li><code>ad [1-9]</code> ou <code>a- [1-9]</code> : descendre (perte d&apos;altitude relative en milliers de pieds).</li>
                        </ul>
                    </li>
                    <li>
                        <code>m</code> — <strong>Marquer :</strong> afficher l&apos;avion en surbrillance (état par défaut à l&apos;entrée dans la zone).
                    </li>
                    <li>
                        <code>i</code> — <strong>Ignorer :</strong> ne plus afficher l&apos;avion en surbrillance ; le champ de consigne affiche une ligne de tirets (<code>---------</code>) s&apos;il n&apos;y a pas de commande en cours.
                    </li>
                    <li>
                        <code>u</code> — <strong>Démarquer :</strong> identique à ignorer, mais si une commande différée est déclenchée au passage d&apos;une balise, l&apos;avion redevient automatiquement marqué (en surbrillance). Idéal pour oublier temporairement un avion pendant une partie seulement de son trajet.
                    </li>
                </ul>

                <p className="mb-1 fw-bold">2. Commandes différables (immédiates, ou différées avec le suffixe de délai) :</p>
                <ul className="ps-3 mb-2">
                    <li>
                        <code>c</code> — <strong>Cercle :</strong> ordonne à l&apos;avion de décrire des cercles sur place (rotation de 90° dans le sens horaire à chaque déplacement).
                    </li>
                    <li>
                        <code>t [lrLR] [cap]</code> ou <code>tv [bsa*] nombre</code> — <strong>Tourner :</strong> changer de direction.
                        <ul className="ps-3">
                            <li><code>t&lt;cap&gt;</code> : virer vers le cap absolu donné (<code>z</code> = 0°, <code>e</code> = 45°, <code>d</code> = 90°, <code>c</code> = 135°, <code>x</code> = 180°, <code>w</code> = 225°, <code>q</code> = 270°, <code>a</code> = 315°). Le virage le plus court est choisi automatiquement.</li>
                            <li><code>tl [cap]</code> : tourner à gauche (sens anti-horaire) de 45° par défaut, ou de l&apos;angle relatif indiqué par <code>&lt;cap&gt;</code> (<em>et non vers le cap <code>&lt;cap&gt;</code></em>).</li>
                            <li><code>tr [cap]</code> : tourner à droite (sens horaire) de 45° par défaut, ou de l&apos;angle relatif indiqué par <code>&lt;cap&gt;</code>.</li>
                            <li><code>tL</code> : virage serré de 90° à gauche (anti-horaire).</li>
                            <li><code>tR</code> : virage serré de 90° à droite (horaire).</li>
                            <li><code>tvb#</code> (ou <code>tv*#</code>), <code>tvs#</code>, <code>tva#</code> : tourner <strong>v</strong>ers la <strong>b</strong>alise, la <strong>s</strong>ortie ou l&apos;<strong>a</strong>éroport indiqué (cap estimé au plus proche).</li>
                        </ul>
                    </li>
                </ul>

                <p className="mb-1 fw-bold">3. La commande de délai (<code>ab#</code> / <code>@b#</code>) :</p>
                <p className="mb-2">
                    Le suffixe <code>ab [0-9]</code> (ou <code>@b [0-9]</code>, <code>a* [0-9]</code>, <code>@* [0-9]</code>) peut être ajouté à la fin de n&apos;importe quelle commande différable (<code>c</code> ou <code>t...</code>). Il ordonne à l&apos;avion d&apos;exécuter cette manœuvre lorsqu&apos;il atteindra la balise spécifiée (celle-ci doit se trouver dans l&apos;axe de vol actuel de l&apos;avion).
                </p>

                <h6>Exemples</h6>
                <ul className="ps-3 mb-2">
                    <li><code>atlab1</code> — Avion A : tourner à gauche à la balise #1</li>
                    <li><code>cc</code> — Avion C : décrire un cercle</li>
                    <li><code>gtvs4ab0</code> — Avion G : tourner vers la sortie #4 à la balise #0</li>
                    <li><code>ma+2</code> — Avion M : altitude : monter de 2000 pieds</li>
                    <li><code>sta</code> — Avion S : tourner vers le cap 315° (Nord-Ouest)</li>
                    <li><code>xi</code> — Avion X : ignorer</li>
                </ul>

                <h6>Autres informations</h6>
                <ul className="ps-3 mb-2">
                    <li>Les <em>jets</em> (minuscules) avancent à chaque tour ; les avions à hélices (majuscules) avancent un tour sur deux (tours pairs).</li>
                    <li>Tous les avions tournent au maximum de 90° par déplacement et changent d&apos;altitude d&apos;au plus 1000 pieds par déplacement.</li>
                    <li>Les avions entrent à 7000 pieds et doivent sortir à 9000 pieds.</li>
                    <li>Les avions volant à l&apos;altitude 0 s&apos;écrasent s&apos;ils ne sont pas exactement au-dessus d&apos;un aéroport.</li>
                    <li>Les avions en attente aux aéroports (<code>Attente @ A0</code>) ne peuvent recevoir qu&apos;un ordre de décollage (monter en altitude).</li>
                    <li>Appuyer sur <code>Entrée</code> à vide déclenche immédiatement le tour suivant, ce qui permet d&apos;accélérer l&apos;horloge lorsque tout est sous contrôle.</li>
                </ul>

                <h6>Auteur original</h6>
                <p className="mb-0 text-muted">
                    Ed James, UC Berkeley (1987) — BSD Games <code>atc(6)</code>.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onHide}>
                    Fermer
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
