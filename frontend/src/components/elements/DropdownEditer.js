import { Dropdown } from "react-bootstrap";
import '../../assets/styles/dropdownedit.scss'


export default function DropdownEditer({ list }) {
    return <Dropdown align="end">
        <Dropdown.Toggle as="div" className="no-caret p-0 border-0 bg-transparent" style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
            ⋮
        </Dropdown.Toggle>

        <Dropdown.Menu>
            {list.map ((elt, ind) => {
                return elt.can && <Dropdown.Item key={ind} onClick={elt.onClick}>{elt.name}</Dropdown.Item>
            })}
        </Dropdown.Menu>
    </Dropdown>
}