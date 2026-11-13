import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Form, Table } from "react-bootstrap";
import { listeUtilisateurs, exportListeUtilisateurs } from "../../api/api_soifguard";
import { obtenirDataUser } from "../../api/api_utilisateurs";
import RenderPagination from "../../components/elements/RenderPagination";

function UserList({ id, categorie }) {
    const { data: user, isLoading } = useQuery({
        queryKey: ['donneesUtilisateurs', id],
        queryFn: () => obtenirDataUser(id)
    });

    if (isLoading) return <></>;
    return <tr>
        <td>{user.prenom}</td>
        <td>{user.nom}</td>
        <td>{user.cycle}{user.promotion}</td>
        <td>
            {categorie === "octo" && `${user.solde_octo}€`}
            {categorie === "biero" && `${user.solde_biero}€`}
        </td>
    </tr>;
}

export default function Liste({ categorie }) {
    const [perPage, setPerPage] = useState(20);
    const [page, setPage] = useState(1);
    const [orderBy, setOrderBy] = useState("promotion");
    const [orderAsc, setOrderAsc] = useState(false);
    const [query, setQuery] = useState("");

    const { data = { utilisateurs: [], count: 0 }, isLoading } = useQuery({
        queryKey: ['soifguardListe', categorie, page, perPage, query, orderAsc, orderBy],
        queryFn: () => listeUtilisateurs({ page: page, perPage, asso: categorie, query: query, orderBy, orderAsc }),
        placeholderData: (previousData) => previousData,
    });
    const { utilisateurs, count } = data;
    const totalPages = Math.ceil(count / perPage);

    const handleSort = (column) => {
        if (orderBy === column) {
            setOrderAsc(!orderAsc);
        } else {
            setOrderBy(column);
            setOrderAsc(true);
        }
        setPage(1);
    };

    const getSortIndicator = (column) => {
        if (orderBy === column) {
            return orderAsc ? ' ▲' : ' ▼';
        }
        return '';
    };

    return <div className="main-content flex-column">
        <h2>Liste des utilisateurs</h2>
        <div style={{ maxWidth: '900px', minWidth: '700px', margin: '0 auto' }}>
            <div className="d-flex flex-md-row flex-column align-items-center mb-3">
                <Form onSubmit={e => { e.preventDefault(); }} className="w-100 me-2">
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

                <Form.Select
                    className="w-auto"
                    value={perPage}
                    onChange={(e) => {
                        setPerPage(Number(e.target.value)); setPage(1);
                    }}
                    aria-label="Éléments par page"
                >
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </Form.Select>
                <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex mb-0 ms-2" />
                <Button variant="success" onClick={() => exportListeUtilisateurs({ asso: categorie, query, orderBy, orderAsc })} className="ms-2">
                    Exporter CSV
                </Button>
            </div>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th style={{ width: '30%' }} onClick={() => handleSort('prenom')}>Prénom{getSortIndicator('prenom')}</th>
                        <th style={{ width: '30%' }} onClick={() => handleSort('nom')}>Nom{getSortIndicator('nom')}</th>
                        <th style={{ width: '15%' }} onClick={() => handleSort('promotion')}>Promotion{getSortIndicator('promotion')}</th>
                        <th style={{ width: '15%' }} onClick={() => handleSort('solde')}>Solde{getSortIndicator('solde')}</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && utilisateurs.length === 0 ?
                        <tr>
                            <td colSpan="4">Chargement...</td>
                        </tr>
                        :
                        utilisateurs.map(u => <UserList key={u} id={u} categorie={categorie} />)
                    }
                    {!isLoading && utilisateurs.length === 0 && (
                        <tr>
                            <td colSpan="4">Aucun utilisateur trouvé.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    </div>;
}
