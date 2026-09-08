import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { getPublicationsByTag } from '../../api/api_publications';
import PostCard from '../elements/PostCard';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout
import { useState } from 'react';
import PageRandom from '../templates/pageRandom';

function Vendomes() {
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [perPage, setPerPage] = useState(() => {
        const storedPer = localStorage.getItem('vendomesPerPage');
        if (storedPer) {
            return storedPer;
        }
        return 30;
    });

    const { data = { publications: [], count: 0 }, isLoading, isError } = useQuery({
        queryKey: ['vendomes', perPage, page, query],
        queryFn: () => getPublicationsByTag("Vendôme", page, perPage, query),
        placeholderData: (previousData) => previousData,
    });
    const { publications, count, totalPages } = data;

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
        titre="Vendômes"
        sousTitre="Retrouvez ici tous les Vendômes"
        avecPagination={true} paramsPag={{ totalPages, setPage, page }}
        avecRequete={true} paramsReq={{ query, onChange: (e) => { setQuery(e.target.value); setPage(1); } }}
        avecNbPP={true} paramsNbPP={{ setPerPage, perPage }}
        contenu={
            <div className="asso-grid"> {/* Reusing the asso-grid class for styling */}
                {publications.filter(p => p.fichier_joint).map((post, index) => {
                    if (publications.length === index + 1) {
                        return <div key={post.id}><PostCard post={post} /></div>
                    }
                    return <div key={post.id}><PostCard post={post} /></div>
                })}
            </div>} />;
}

export default Vendomes;
