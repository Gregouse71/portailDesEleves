import { Dropdown } from "react-bootstrap";
import "../../assets/styles/DropdownEditer.scss";

export default function DropdownEditer({ list }) {
    return (
        <Dropdown
            align="end"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <Dropdown.Toggle
                as="div"
                className="no-caret p-0 border-0 bg-transparent"
                style={{ cursor: "pointer", fontSize: "1.2rem" }}
            >
                ⋮
            </Dropdown.Toggle>

            <Dropdown.Menu
                popperConfig={{ strategy: "fixed" }}
                renderOnMount
                className="dropdown-editer-menu"
            >
                {list.map((elt, ind) =>
                    elt === "divider" ? (
                        <Dropdown.Divider key={ind} />
                    ) : (
                        elt.can && (
                            <Dropdown.Item key={ind} onClick={elt.onClick}>
                                {elt.name}
                            </Dropdown.Item>
                        )
                    )
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
}