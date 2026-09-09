import { Nav } from "react-bootstrap"
import { Link, Route, Routes } from "react-router-dom"


export default function TabTemplate({
    tabs, activeKey
}) {
    return <>
        <Nav variant="tabs" className="mb-3" activeKey={activeKey}>
            {tabs.map(({ titre, key, path }, ind) =>
                <Nav.Item key={ind}>
                    <Nav.Link as={Link} to={path} eventKey={key}>
                        {titre}
                    </Nav.Link>
                </Nav.Item>
            )}
        </Nav >
        <Routes>
            {tabs.map(({ index, key, element }, ind) => <>
                <Route key={ind} index={!!index} path={!!index ? undefined : key} element={element} />
            </>)}
        </Routes>
    </>
}
