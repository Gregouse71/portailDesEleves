import { Tabs, Tab, Button } from "react-bootstrap";

export default function PublicEntreprises() {
    return (
        <div>
            <h3 className="public-heading text-center mb-4">
                Relations <span>entreprises</span>
            </h3>

            <div className="public-tabs">
                <Tabs defaultActiveKey="presentation">
                    <Tab eventKey="presentation" title="Présentation">
                        <div className="public-section-row public-text">
                            <p>
                                Bienvenue sur le portail <strong>Relations Entreprises</strong> du Bureau des Élèves de Mines de Paris.
                            </p>
                            <p>
                                Au sein de l&apos;établissement, une équipe d&apos;élèves est entièrement dédiée à l&apos;organisation d&apos;événements permettant de nouer des liens entre les étudiants et le monde de l&apos;entreprise.
                            </p>
                            <p>
                                Vous souhaitez devenir partenaire de notre école ou en apprendre plus sur les différentes actions que votre groupe peut mener ? Pour cela,{" "}
                                <a className="see-more-link" href="mailto:bde-entreprises@mines-paristech.fr">contactez-nous</a>.
                            </p>
                            <p className="mb-0">
                                Vous pouvez aussi consulter{" "}
                                <a
                                    className="see-more-link"
                                    href="/upload/associations/bde/Plaquette-2025-2026.pdf"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    notre plaquette
                                </a>{" "}
                                qui décrit en détail plusieurs formats d&apos;événements. Et si vous ne trouvez pas celui qui vous correspond,{" "}
                                <a className="see-more-link" href="mailto:bde-entreprises@mines-paristech.fr">contactez-nous</a> directement et nous tâcherons de vous proposer un événement sur mesure.
                            </p>
                        </div>
                    </Tab>

                    <Tab eventKey="contact" title="Contactez-nous">
                        <div className="py-4 public-text">
                            <p>
                                Vous souhaitez devenir partenaire du Bureau des Élèves (BdE) ou de l&apos;école ? Vous désirez en savoir plus sur le fonctionnement des Relations Entreprises au sein de l&apos;établissement ? Vous cherchez à proposer une offre de stage, VIE ou emploi ? Vous trouverez ci-dessous le contact approprié pour répondre à toutes vos attentes.
                            </p>

                            <h4 className="mt-4">Bureau des Élèves</h4>
                            <p>
                                Vos interlocuteurs privilégiés :{" "}
                                <strong>BDE MINES de Paris - Pôle Relations Entreprises</strong>
                                <br />
                                Courriel :{" "}
                                <a className="see-more-link" href="mailto:bde-entreprises@mines-paristech.fr">
                                    bde-entreprises@mines-paristech.fr
                                </a>
                            </p>

                            <h4 className="mt-4">Direction de l&apos;Enseignement - Cycle Ingénieur Civil</h4>
                            <p className="mb-0">
                                Relations Élèves - Entreprises, Taxe d&apos;Apprentissage, Responsable des stages :{" "}
                                <strong>Johanna Ducret</strong>
                                <br />
                                Courriel :{" "}
                                <a className="see-more-link" href="mailto:johanna.ducret@minesparis.psl.eu">
                                    johanna.ducret@minesparis.psl.eu
                                </a>
                                <br />
                                Téléphone : 01 40 51 94 15
                                <br />
                                Pour déposer vos offres de stages ou d&apos;emplois :{" "}
                                <a
                                    className="see-more-link"
                                    href="http://www.mines-paristech.fr/Entreprise/Recrutez-nos-etudiants/Proposez-un-stage-ou-un-emploi/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Cliquez ici
                                </a>
                                .
                            </p>
                        </div>
                    </Tab>

                    <Tab eventKey="plaquette" title="Plaquette">
                        <div className="py-4 text-center public-text">
                            <p className="text-center">
                                Retrouvez notre plaquette entreprise pour l&apos;année 2025-2026 :
                            </p>
                            <Button
                                as="a"
                                href="/upload/associations/bde/Plaquette-2025-2026.pdf"
                                target="_blank"
                                rel="noreferrer"
                                variant="primary"
                            >
                                Voir la plaquette (PDF)
                            </Button>
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
