import { Image } from 'react-bootstrap';
import '../../assets/styles/footer.scss';
import { Link } from 'react-router-dom';


export default function Footer() {
    return (
        <div className="d-flex justify-content-evenly global-footer-footer">
            <div>Hébergé par le Rézal <Link to="https://rezal-mdm.com"><Image src="/assets/icons/logo_rezal.svg" /></Link></div>
            <div>&copy; UDEEMP 2026</div>
        </div>
    );
}
