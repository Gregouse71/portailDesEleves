import { useQuery } from '@tanstack/react-query';
import { Alert, Container, Spinner } from 'react-bootstrap';
import { obtenirPublicationsRecentes } from '../../api/api_publications';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout
import Post from '../elements/Post';
import { useState } from 'react';
import PageRandom from '../templates/pageRandom';

export default function PublicationsRecentes() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const { data = { publications: [], count: 0 }, isLoading, isError } = useQuery({
        queryKey: ['publicationRecentes', 'all', query, perPage, page],
        queryFn: () => obtenirPublicationsRecentes({ page, per: perPage, query }),
        placeholderData: (previousData) => previousData,
    });
    const { publications, totalPages } = data;


    if (isLoading) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </Spinner>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    Erreur lors du chargement des publications.
                </Alert>
            </Container>
        );
    }

    return <PageRandom
        titre="Publications récentes"
        sousTitre="Retrouvez ici les dernières publications associatives"
        avecPagination={true} paramsPag={{ totalPages, setPage, page }}
        avecRequete={true} paramsReq={{ query, onChange: (e) => { setQuery(e.target.value); setPage(1); } }}
        avecNbPP={true} paramsNbPP={{ setPerPage, perPage }}
        contenu={
            publications.map(post_id => (
                <div className="mb-3" key={post_id} ><Post postId={post_id} isGestion={false} /></div>
            ))} />;
}
