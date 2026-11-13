import "../../assets/styles/soifguard.scss";
import { useState, useEffect, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Form } from "react-bootstrap";
import { verifierPermission } from "../../api/api_global";
import { useProtected } from "../../Protected";
import Consommation from "./Consommation";
import Liste from "./Liste";
import Operations from "./Operations";
import Permissions from "./Permissions";

export default function SoifGuard() {
    const { userData } = useProtected();
    const navigate = useNavigate();
    const [categorie, setCategorie] = useState();
    const initializedRef = useRef(false);
    const [mode, setMode] = useState("conso");

    const { data: octoPermission = false } = useQuery({
        queryKey: ['permOcto'],
        queryFn: () => verifierPermission({}, "octo", userData.id),
    });
    const { data: bieroPermission = false } = useQuery({
        queryKey: ['permBiero'],
        queryFn: () => verifierPermission({}, "biero", userData.id),
    });
    const { data: octoAdminPermission = false } = useQuery({
        queryKey: ['permAdminOcto'],
        queryFn: () => verifierPermission({}, "admin_octo", userData.id),
    });
    const { data: bieroAdminPermission = false } = useQuery({
        queryKey: ['permAdminBiero'],
        queryFn: () => verifierPermission({}, "admin_biero", userData.id),
    });

    useEffect(() => {
        if (initializedRef.current) return;

        if ((octoPermission || octoAdminPermission) && !(bieroPermission || bieroAdminPermission)) {
            setTimeout(() => {
                setCategorie("octo");
                initializedRef.current = true;
            }, 0);
        } else if ((bieroPermission || bieroAdminPermission) && !(octoPermission || octoAdminPermission)) {
            setTimeout(() => {
                setCategorie("biero");
                initializedRef.current = true;
            }, 0);
        }
    }, [octoPermission, octoAdminPermission, bieroPermission, bieroAdminPermission]);

    const changeMode = (e) => {
        const newMode = e.target.value;
        if (!["conso", "operations", "permissions", "liste"].includes(newMode)) return;

        setMode(newMode);
        switch (newMode) {
            case "conso": navigate("/soifguard"); break;
            case "liste": navigate("/soifguard/liste"); break;
            case "operations": navigate("/soifguard/operations"); break;
            case "permissions": navigate("/soifguard/permissions"); break;
            default: return;
        }
    };

    const changeCategorie = (cat) => {
        setCategorie(cat);
    };

    return (
        <div className="soifguard-container">
            <div className="header">
                <div className="center header-buttons">
                    <Button variant="secondary" onClick={() => navigate("/direction")} >Retour</Button>
                </div>
                <h1>SoifGuard {categorie && `(${categorie})`}</h1>

                {((categorie === "biero" && bieroAdminPermission) || (categorie === "octo" && octoAdminPermission))
                    &&
                    <Form.Select
                        style={{ width: 'auto' }}
                        value={mode}
                        onChange={changeMode}
                        aria-label="Mode"
                    >
                        <option value="conso">Consommation</option>
                        <option value="liste">Liste</option>
                        <option value="operations">Historique</option>
                        <option value="permissions">Permissions</option>
                    </Form.Select>}

                <div className="header-buttons">
                    {(octoPermission || octoAdminPermission) && (
                        <Button
                            onClick={() => changeCategorie("octo")}
                            variant={categorie === "octo" ? "primary" : "secondary"}
                        >
                            Octo
                        </Button>
                    )}

                    {(bieroPermission || bieroAdminPermission) && (
                        <Button
                            onClick={() => changeCategorie("biero")}
                            variant={categorie === "biero" ? "danger" : "secondary"}
                        >
                            Biero
                        </Button>
                    )}
                </div>
            </div>
            {categorie &&
                <Routes>
                    <Route index element={
                        <Consommation
                            key={categorie}
                            categorie={categorie}
                            perms={(categorie === "octo" && octoAdminPermission) || (categorie === "biero" && bieroAdminPermission)}
                        />} />
                    <Route path="liste" element={<Liste categorie={categorie} />} />
                    <Route path="operations" element={<Operations categorie={categorie} />} />
                    <Route path="permissions" element={<Permissions categorie={categorie} />} />
                </Routes>}
        </div>
    );
}
