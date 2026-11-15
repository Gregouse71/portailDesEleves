import { Container, Alert, Form, Button, Row, Col } from 'react-bootstrap';
import RenderPagination from '../elements/RenderPagination'
import Chargement from '../elements/Chargement';
import { useNavigate } from 'react-router-dom';
import DropdownEditer from '../elements/DropdownEditer';
import ChampAvecCroix from '../elements/ChampAvecCroix';

export default function PageRandom({
    titre,
    sousTitre,
    children,
    isLoading,
    avecPagination = false, paramsPag = {},
    avecNbPP = false, paramsNbPP = {},
    avecDrop = false, paramsDrop = {},
    avecRequete = false, paramsReq = {},
    avecDates = false, paramsDates = {},
    avecBoutonRetour = false, destRetour
}) {
    const navigate = useNavigate();

    if (isLoading) {
        return <Container className="page-random-header page-random py-4">
            {avecBoutonRetour && <Button variant="outline-secondary" onClick={() => navigate(destRetour)} className="mb-3">
                Retour
            </Button>}
            <div className="text-center text-md-start">
                <h1 className="mb-0">{titre}</h1>
                <p className="text-muted mb-0">{sousTitre}</p>
            </div>
            <Chargement />
        </Container>;
    }
    return <Container className="page-random py-4">
        {avecBoutonRetour && <Button variant="outline-secondary" onClick={() => navigate(destRetour)} className="mb-3">
            Retour
        </Button>}
        <div className="page-random-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-2 gap-3">
            <div className="text-center text-md-start">
                <h1 className="mb-0">{titre}</h1>
                <p className="text-muted mb-0">{sousTitre}</p>
            </div>
            <div className="flex-grow-1 vh-0"></div>
            {avecNbPP &&
                <Form.Select
                    style={{ width: 'auto' }}
                    value={paramsNbPP.perPage}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        paramsNbPP.setPerPage(val);
                        paramsPag?.setPage(1);
                        localStorage.setItem('nbPP', val);
                    }}
                    aria-label="Nombre de publications par page"
                >
                    <option value="30">30</option>
                    <option value="60">60</option>
                    <option value="120">120</option>
                </Form.Select>
            }
            {avecDrop && <DropdownEditer list={paramsDrop} />}
            {avecPagination && <RenderPagination
                totalPages={paramsPag.totalPages}
                setPage={paramsPag.setPage}
                page={paramsPag.page}
            />}
        </div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3">
            {avecRequete &&
                <div className="w-md-auto">
                    <ChampAvecCroix label={paramsReq.label} valeur={paramsReq.query} onClear={paramsReq?.onClear} >
                        <Form.Control
                            type="text"
                            name="query"
                            className="rounded-end"
                            placeholder={paramsReq?.placeholder ?? "Rechercher"}
                            value={paramsReq.query}
                            onChange={paramsReq.onChange}
                        />
                    </ChampAvecCroix>
                </div>
            }
            {avecDates && <>
                <div style={{ width: "30rem" }} className="d-flex flex-row justify-content-between gap-3">
                    {/* décalage plus grand : la croix se place à gauche de l'icône calendrier */}
                    <ChampAvecCroix label="Du" valeur={paramsDates.dates.dateDebut} onClear={paramsDates.onClear.debut} decalage="2.5rem">
                        <Form.Control
                            type="date"
                            className="rounded-end"
                            name="dateDebut"
                            value={paramsDates.dates.dateDebut}
                            max={paramsDates.dates.dateFin || undefined}
                            onChange={paramsDates.handleSetDates}
                        />
                    </ChampAvecCroix>
                    <ChampAvecCroix label="Au" valeur={paramsDates.dates.dateFin} onClear={paramsDates.onClear.fin} decalage="2.5rem">
                        <Form.Control
                            type="date"
                            className="rounded-end"
                            name="dateFin"
                            value={paramsDates.dates.dateFin}
                            min={paramsDates.dates.dateDebut || undefined}
                            onChange={paramsDates.handleSetDates}
                        />
                    </ChampAvecCroix>
                </div>
            </>}
        </div>
        {children}
        {
            avecPagination && <RenderPagination
                totalPages={paramsPag.totalPages}
                setPage={paramsPag.setPage}
                page={paramsPag.page}
            />
        }
        {
            1 === 0 && (
                <Alert variant="info" className="mt-4">
                    Aucune publication trouvée avec le tag &quot;Vendôme&quot;.
                </Alert>
            )
        }
    </Container >;
}
