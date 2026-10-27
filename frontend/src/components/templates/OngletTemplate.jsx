import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import DropdownEditer from "../elements/DropdownEditer";
import Chargement from "../elements/Chargement";

export default function OngletTemplate({
    titre,
    isLoading,
    contenu,
    avecTooltip, tooltipContent,
    avecDropdown, contenuDropdown,
    avecBouton, onButonClick
}) {
    if (isLoading) {
        return <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                <h2>{titre}</h2>
            </div>
            <Chargement />
        </div>;
    }

    return <>
        <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
            <h2>{titre}</h2>
            {avecDropdown && <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                <DropdownEditer list={contenuDropdown} />
            </div>}
            {avecTooltip && <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                <OverlayTrigger
                    placement="top"
                    trigger={['hover', 'click', 'focus']}
                    overlay={<Tooltip>{tooltipContent}</Tooltip>}
                >
                    <img src="/assets/icons/info.svg" alt="info" className="theme-icon" />
                </OverlayTrigger>
            </div>}
            {avecBouton && <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                <Button
                    variant="outline-secondary"
                    onClick={onButonClick}
                >
                    <img src="/assets/icons/plus.svg" alt="ajouter" className="theme-icon" />
                </Button>
            </div>}
        </div>
        {contenu}
    </>;
}