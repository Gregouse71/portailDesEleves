import DropdownEditer from "../elements/DropdownEditer";

export default function OngletTemplate({
    titre,
    contenu,
    avecDropdown, contenuDropdown
}) {
    return <>
        <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
            <h2>{titre}</h2>
            {avecDropdown && <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0 ps-3">
                <DropdownEditer list={contenuDropdown} />
            </div>}
        </div>
        {contenu}
    </>;
}