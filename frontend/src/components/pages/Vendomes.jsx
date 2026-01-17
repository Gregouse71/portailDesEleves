import { useQuery } from '@tanstack/react-query';
import { Container, Spinner, Alert, Form } from 'react-bootstrap';
import { getPublicationsByTag } from '../../api/api_publications';
import PostCard from '../elements/PostCard';
import '../../assets/styles/asso.scss'; // Reusing the asso.scss for grid layout
import { useState } from 'react';
import RenderPagination from '../elements/RenderPagination'

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

    return (
        <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-3">
                <div className="text-center text-md-start">
                    <h1 className="mb-0">Vendômes</h1>
                    <p className="text-muted mb-0">Retrouvez ici tous les Vendômes</p>
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
            <div className="asso-grid"> {/* Reusing the asso-grid class for styling */}
                {publications.filter(p => p.fichier_joint).map((post, index) => {
                    if (publications.length === index + 1) {
                        return <div key={post.id}><PostCard post={post} /></div>
                    }
                    return <div key={post.id}><PostCard post={post} /></div>
                })}
            </div>
            <RenderPagination totalPages={totalPages} setPage={setPage} page={page} />
            {count === 0 && (
                <Alert variant="info" className="mt-4">
                    Aucune publication trouvée avec le tag &quot;Vendôme&quot;.
                </Alert>
            )}
        </Container>
    );
}

export default Vendomes;
