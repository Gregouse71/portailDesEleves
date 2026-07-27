import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import { searchUsers } from '../../api/api_utilisateurs';
import "../../assets/styles/autocomplete.scss"

function useDebounce(valeur, delai = 250) {
    const [valeurDebounced, setValeurDebounced] = useState(valeur);
    useEffect(() => {
        const timer = setTimeout(() => setValeurDebounced(valeur), delai);
        return () => clearTimeout(timer);
    }, [valeur, delai]);
    return valeurDebounced;
}

/**
 * Normalise la réponse de searchUsers
 */
function normaliserResultats(reponse) {
    if (Array.isArray(reponse)) return reponse;
    if (Array.isArray(reponse?.users)) return reponse.users;
    if (Array.isArray(reponse?.results)) return reponse.results;
    if (Array.isArray(reponse?.items)) return reponse.items;
    return [];
}

function libelleUtilisateur(u) {
    if (u.prenom && u.nom && u.cycle && u.promotion)
        return `${u.prenom} ${u.nom} ${u.cycle}${u.promotion}`
    if (u.nom_utilisateur) return u.nom_utilisateur;
    if (u.prenom || u.nom) return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
    return `#${u.id}`;
}

/**
 * Champ d'autocomplétion basé sur POST /users/search (searchUsers).
 */
function Autocomplete({ onSelect, filter=() => true, placeholder, valeurInitiale = '', longueurMin = 2 }) {
    const [texte, setTexte] = useState(valeurInitiale);
    const [ouvert, setOuvert] = useState(false);
    const conteneurRef = useRef(null);
    const texteDebounced = useDebounce(texte);

    const rechercheActive = texteDebounced.trim().length >= longueurMin;

    const { data: resultats = [], isFetching } = useQuery({
        queryKey: ['autocompleteUtilisateurs', texteDebounced],
        queryFn: () =>
            searchUsers({ query: texteDebounced.trim(), limit: 10 }).then(normaliserResultats),
        enabled: rechercheActive,
    });

    useEffect(() => {
        function gererClicExterieur(evenement) {
            if (conteneurRef.current && !conteneurRef.current.contains(evenement.target)) {
                setOuvert(false);
            }
        }
        document.addEventListener('mousedown', gererClicExterieur);
        return () => document.removeEventListener('mousedown', gererClicExterieur);
    }, []);

    const choisir = (item) => {
        console.log(item, libelleUtilisateur(item))
        setTexte("");
        setOuvert(false);
        onSelect(item);
    };

    return (
        <div className="autocomplete-conteneur" ref={conteneurRef}>
            <Form.Control
                type="text"
                value={texte}
                placeholder={placeholder}
                autoComplete="off"
                onChange={(evenement) => {
                    setTexte(evenement.target.value);
                    setOuvert(true);
                }}
                onFocus={() => setOuvert(true)}
            />
            {ouvert && rechercheActive && (
                <ListGroup className="autocomplete-liste">
                    {isFetching && (
                        <ListGroup.Item disabled className="d-flex align-items-center gap-2">
                            <Spinner animation="border" size="sm" /> Recherche...
                        </ListGroup.Item>
                    )}
                    {!isFetching && resultats.length === 0 && (
                        <ListGroup.Item disabled>Aucun résultat</ListGroup.Item>
                    )}
                    {!isFetching && resultats.filter(item => filter(item)).map((item) => (
                        <ListGroup.Item key={item.id} action onClick={() => choisir(item)}>
                            {libelleUtilisateur(item)}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
}

export default Autocomplete;