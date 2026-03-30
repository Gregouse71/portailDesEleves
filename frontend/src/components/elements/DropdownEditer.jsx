import { Dropdown, NavDropdown } from "react-bootstrap";
import '../../assets/styles/dropdownedit.scss'


export default function DropdownEditer({ list }) {
    return <Dropdown align="end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Dropdown.Toggle as="div" className="no-caret p-2 border-0 bg-transparent" style={{ cursor: 'pointer', fontSize: '1.2rem' }}>
            ⋮
        </Dropdown.Toggle>

        <Dropdown.Menu>
            {list.map((elt, ind) => {
                return elt === "divider" ? <Dropdown.Divider key={ind} />
                    : elt.can && <Dropdown.Item key={ind} onClick={elt.onClick}>{elt.name}</Dropdown.Item>
            })}
        </Dropdown.Menu>
    </Dropdown>
}