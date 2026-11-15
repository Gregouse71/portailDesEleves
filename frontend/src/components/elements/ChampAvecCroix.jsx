import { CloseButton, InputGroup } from "react-bootstrap";


// Libellé et champ sur la même ligne, avec une petite croix dans le champ si celui-ci est rempli
export default function ChampAvecCroix({ label, valeur, onClear, decalage = "0.75rem", children }) {
    return (
        <InputGroup>
            {label && <InputGroup.Text>{label}</InputGroup.Text>}
            {children}
            {valeur !== "" && (
                <CloseButton
                    onClick={onClear}
                    aria-label={`Effacer : ${label}`}
                    className="position-absolute top-50 translate-middle-y"
                    style={{ right: decalage, fontSize: "0.7rem", zIndex: 6 }}
                />
            )}
        </InputGroup>
    );
}