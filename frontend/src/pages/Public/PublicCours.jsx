import { VP_GEEK_EMAIL } from "../../globals";

export default function PublicCours() {
    return (
        <div>
            <h3 className="public-heading text-center mb-4">
                Les petits <span>cours</span>
            </h3>

            <div className="public-text">
                <p>
                    Nous vous proposons de vous mettre en contact avec des élèves motivés pour des cours du collège jusqu&apos;au supérieur, à domicile ou dans un autre endroit qui vous arrange.
                </p>
                <p>
                    Les élèves des Mines sont tous de très bons élèves ayant été reçus à un des concours les plus sélectifs de France. Ils maîtrisent parfaitement les disciplines scientifiques et connaissent les méthodes de travail les plus efficaces.
                </p>
                <p>
                    Veuillez nous contacter via cette adresse courriel : <a className="see-more-link" href={`mailto:${VP_GEEK_EMAIL}`}>{VP_GEEK_EMAIL}</a>. Afin de pouvoir vous proposer le profil le plus adapté, n&apos;oubliez pas de préciser les points suivants dans votre demande :
                </p>
                <ul className="mb-0">
                    <li>Niveau de l&apos;élève (4e, 2nde, PSI...)</li>
                    <li>Matières à enseigner et objectif (aide aux devoirs, approfondissement, préparation à un concours...)</li>
                    <li>Quartier où se déroulera le cours (chez vous, ou bien à l&apos;École)</li>
                    <li>Suggestions d&apos;horaires (1h tous les soirs de la semaine, 2h le samedi matin...)</li>
                </ul>
            </div>
        </div>
    );
}
