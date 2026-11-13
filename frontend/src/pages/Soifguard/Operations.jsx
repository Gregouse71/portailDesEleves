import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, Table, Pagination } from "react-bootstrap";
import { listeOperations } from "../../api/api_soifguard";

const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
};

export default function Operations({ categorie }) {
    const PER_PAGE = 30;
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const { data = { operations: [], count: 0 }, isLoading } = useQuery({
        queryKey: ['operations', categorie, page, query],
        queryFn: () => listeOperations({ page: page, per: PER_PAGE, asso: categorie, query: query }),
        placeholderData: (previousData) => previousData,
    });
    const { operations, count } = data;
    const totalPages = Math.ceil(count / PER_PAGE);

    return <div className="main-content flex-column">
        <div className="d-flex justify-content-between align-items-center w-100 mb-3">
            <h2>Dernières opérations</h2>
            <Form onSubmit={e => { e.preventDefault(); }}>
                <Form.Group>
                    <Form.Control type="text" name="query" placeholder="Rechercher"
                        value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
                </Form.Group>
            </Form>
            {totalPages > 1 && (
                <Pagination className="mb-0">
                    <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                    <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} />

                    {page > 3 && <Pagination.Ellipsis disabled />}

                    {Array.from({ length: 5 }, (_, i) => page - 2 + i)
                        .filter(p => p > 0 && p <= totalPages)
                        .map(p => (
                            <Pagination.Item
                                key={p}
                                active={p === page}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </Pagination.Item>
                        ))
                    }

                    {page < totalPages - 2 && <Pagination.Ellipsis disabled />}

                    <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
                    <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
                </Pagination>
            )}
        </div>
        <div>
            <Table responsive hover>
                <thead key="header">
                    <tr className="fw-bold align-items-center">
                        <th>Date</th>
                        <th>Utilisateur</th>
                        <th>Auteur</th>
                        <th>Somme</th>
                        <th>Libellé</th>
                        <th>Solde avant</th>
                        <th>Solde après</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && operations.length === 0 ?
                        <tr>
                            <td colSpan="3">Chargement...</td>
                        </tr>
                        :
                        operations.map((elt, i) => <tr key={i} className="align-items-start">
                            <td>{formatDate(elt.date)}</td>
                            <td>{elt.utilisateur}</td>
                            <td>{elt.auteur}</td>
                            <td>{elt.somme}</td>
                            <td>{elt.libelle}</td>
                            <td>{elt.solde_avant}</td>
                            <td>{elt.solde_apres}</td>
                        </tr>
                        )}
                </tbody>
            </Table>
        </div>
    </div>;
}
