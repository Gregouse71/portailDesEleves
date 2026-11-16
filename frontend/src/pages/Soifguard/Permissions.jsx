import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Table, InputGroup, FormControl } from "react-bootstrap";
import Select from "react-select";
import {
    getPermissionsSoifguard,
    addPermissionsSoifguard,
    deletePermissionsSoifguard,
} from "../../api/api_soifguard";
import { chargerUtilisateurs } from "../../api/api_utilisateurs";
import RenderPagination from "../../components/elements/RenderPagination";

function PermissionUser({ perm, deleteMe }) {
    return <tr>
        <td>{perm.utilisateur}</td>
        <td>{perm.permission}</td>
        <td>
            <Button size="sm" variant="danger" onClick={deleteMe}>
                Supprimer
            </Button>
        </td>
    </tr>;
}

export default function Permissions({ categorie }) {
    const PER_PAGE = 30;
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState();
    const [permission, setPermission] = useState("");

    const { data: allUsers = [] } = useQuery({
        queryKey: ["allUsers"],
        queryFn: () => chargerUtilisateurs(),
    });
    const options = allUsers.map(u => ({ value: u.id, label: u.nom_utilisateur }));

    const { data = { permissions: [], count: 0 } } = useQuery({
        queryKey: ["permissionsSoifguard", categorie, page, query],
        queryFn: () => getPermissionsSoifguard({ page, per_page: PER_PAGE, query, asso: categorie }),
        placeholderData: (previousData) => previousData,
    });
    const { permissions, count } = data;
    const totalPages = Math.ceil(count / PER_PAGE);

    const addMutation = useMutation({
        mutationFn: async (perm) => {
            await addPermissionsSoifguard({ user_id: selectedUser.value, permission: perm });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissionsSoifguard", categorie]);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async id => {
            await deletePermissionsSoifguard(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissionsSoifguard", categorie]);
        }
    });

    return <div className="main-content flex-column">
        <div className="justify-content-between align-items-center w-100 mb-3">
            <h2>Permissions</h2>
            <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex mb-0" />
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Permissions</th>
                        <th>
                            <InputGroup>
                                <FormControl
                                    placeholder="Filtre"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                />
                            </InputGroup>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><Form>
                            <Select options={options} value={selectedUser} onChange={setSelectedUser}
                                isClearable classNamePrefix="react-select"
                            />
                        </Form></td>
                        <td><Form>
                            <Form.Select
                                style={{ width: 'auto' }}
                                value={permission}
                                onChange={(e) => setPermission(e.target.value)}
                                aria-label="Permission"
                            >
                                <option value="">Sélectionner</option>
                                <option value={`${categorie}`}>Soifguard</option>
                                <option value={`admin_${categorie}`}>Admin</option>
                            </Form.Select>
                        </Form></td>
                        <td><Button variant="info" onClick={() => addMutation.mutate(permission)} disabled={!selectedUser && permission !== ""}>
                            Ajouter
                        </Button></td>
                    </tr>
                    {permissions.map((perm, i) => (
                        <PermissionUser key={i} perm={perm} deleteMe={() => deleteMutation.mutate(perm.id)} />
                    ))}
                </tbody>
            </Table>
        </div>
    </div>;
}
