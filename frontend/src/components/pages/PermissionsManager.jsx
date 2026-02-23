import { useState } from "react";
import { Table, Form, Button, InputGroup, FormControl, Pagination } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addPermission, deletePermission, getPermissions } from "../../api/api_global";
import RenderPagination from "../elements/RenderPagination";
import Select from "react-select";
import { chargerUtilisateurs } from "../../api/api_utilisateurs";

const PER_PAGE = 15;

function Permission({ perm, deleteMe }) {
    return <>
        <tr>
            <td>{perm.utilisateur}</td>
            <td>{perm.permission}</td>
            <td>
                <Button size="sm" variant="danger" deleteMe onClick={deleteMe}>
                    Supprimer
                </Button>
            </td>
        </tr>
    </>
}

export default function PermissionsManager() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState();
    const [permission, setPermission] = useState();

    const queryClient = useQueryClient();

    const { data: allUsers = [] } = useQuery({
        queryKey: ["allUsers"],
        queryFn: () => chargerUtilisateurs(),
    });
    const options = allUsers.map(u => ({ value: u.id, label: u.nom_utilisateur }));

    const { data = { permissions: [], count: 0 }, isLoading, isError } = useQuery({
        queryKey: ["permissions", page, query],
        queryFn: () => getPermissions({ page, per_page: PER_PAGE, query }),
        placeholderData: (previousData) => previousData,
    });
    const { permissions, count } = data;
    const totalPages = Math.ceil(count / PER_PAGE);

    const addMutation = useMutation({
        mutationFn: async () => {
            const ret = { user_id: selectedUser.value, permission }
            console.log(ret)
            await addPermission({ user_id: selectedUser.value, permission })
            return
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissions", page, query]);
            return
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async id => {
            await deletePermission(id)
            return
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["permissions", page, query]);
        }
    });

    if (isLoading) return <div>Chargement...</div>;
    if (isError) return <div>Erreur lors du chargement des données.</div>;

    return (
        <div>
            <RenderPagination totalPages={totalPages} setPage={setPage} page={page} className="d-flex mb-0" />

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Permissions</th>
                        <td>
                            <InputGroup>
                                <FormControl
                                    placeholder="Filtre"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                />
                            </InputGroup>
                        </td>
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
                            <Form.Control type="text" value={permission} onChange={(e) => setPermission(e.target.value)}></Form.Control>
                        </Form></td>
                        <td><Button variant="info" onClick={addMutation.mutate} disabled={!selectedUser}>
                            Ajouter
                        </Button></td>
                    </tr>
                    {permissions.map((perm, i) => (
                        <Permission key={i} perm={perm} deleteMe={() => deleteMutation.mutate(perm.id)} />
                    ))}
                </tbody>
            </Table>

        </div>
    );
}
