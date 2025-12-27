import { Dropdown } from "react-bootstrap";
import '../../assets/styles/dropdownedit.scss'


export default function DropdownEditer({ canModify=false, modify, canRemove=false, remove }) {
    return <Dropdown align="end">
        <Dropdown.Toggle as="div" className="no-caret p-0 border-0 bg-transparent" style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
            ⋮
        </Dropdown.Toggle>

        <Dropdown.Menu>
            {canModify && <Dropdown.Item onClick={modify}>Modifier</Dropdown.Item>}
            {canRemove && <Dropdown.Item onClick={remove} className="text-danger">
                Supprimer
            </Dropdown.Item>}
        </Dropdown.Menu>
    </Dropdown>
}