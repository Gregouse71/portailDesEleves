import { useQuery } from '@tanstack/react-query';
import { Container, Form, Spinner } from 'react-bootstrap';
import { obtenirPublicationsRecentes } from '../../api/api_publications';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout
import Post from '../elements/Post';
import { useState } from 'react';
import RenderPagination from '../elements/RenderPagination';

export default function PublicationsRecentes() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const { data = { publications: [], count: 0 }, isLoading, isError } = useQuery({
        queryKey: ['publicationRecentes', 'all', query, perPage, page],
        queryFn: () => obtenirPublicationsRecentes({ page, per: perPage, query }),
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

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-3">
                <div className="text-center text-md-start">
                    <h1 className="mb-3">Publications récentes</h1>
                    <p className="text-muted">Retrouvez ici les dernières publications associatives</p>
                </div>
                <Form.Select
                    style={{ width: 'auto' }}
                    value={perPage}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPerPage(val);
                        setPage(1);
                        localStorage.setItem('vendomesPerPage', val);
                    }}
                    aria-label="Nombre de publications par page"
                >
                    <option value="10">10</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="120">120</option>
                </Form.Select>
            </div>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3">
                <div className="w-md-auto">
                    <Form onSubmit={e => { e.preventDefault(); }} className="w-100">
                        <Form.Group>
                            <Form.Control
                                type="text"
                                name="query"
                                placeholder="Rechercher"
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                            />
                        </Form.Group>
                    </Form>
                </div>
                <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex mb-0" />
            </div>
            {publications.map(post_id => (
                <div className="mb-3"><Post key={post_id} postId={post_id} isGestion={false} /></div>
            ))}
            <RenderPagination totalPages={totalPages} setPage={setPage} page={page} />
        </Container>
    );
}
