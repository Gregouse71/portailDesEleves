import "../assets/styles/formulaire_connexion.scss"

import { useMemo, useState } from "react";
import { setNouveauMDP } from "../api/api_global";
import { Container, Form, Button, Alert, ProgressBar, InputGroup, Card } from "react-bootstrap";
import { useParams, Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { Check, X, Eye, EyeSlash, Lock } from 'react-bootstrap-icons'; // Recommended: Use Bootstrap Icons or similar

// Define Icons for modern look
const Visibility = () => <Eye size={18} />;
const VisibilityOff = () => <EyeSlash size={18} />;
const CheckIcon = () => <Check color="green" size={16} className="me-1" />;
const XIcon = () => <X color="red" size={16} className="me-1" />;
const LockIcon = () => <Lock size={20} className="me-2" />;

// Password strength logic remains outside the component (as provided)
const passwordStrengthCriteria = [
  { regex: /.{12,}/, message: 'Au moins 12 caractères' },
  { regex: /[a-z]/, message: 'Une minuscule' },
  { regex: /[A-Z]/, message: 'Une majuscule' },
  { regex: /[0-9]/, message: 'Un chiffre' },
  { regex: /[^A-Za-z0-9]/, message: 'Un caractère spécial (ex: !@#$)' },
];

const calculatePasswordStrength = (password) => {
  let score = 0;
  const requiredChecks = [];
  const passedChecks = [];

  if (password.length > 0) {
    passwordStrengthCriteria.forEach(criterion => {
      const passed = criterion.regex.test(password);
      requiredChecks.push({ ...criterion, passed });
      if (passed) {
        score++;
        passedChecks.push(criterion.message);
      }
    });
  }

  const strengthPercentage = (score / passwordStrengthCriteria.length) * 100;
  const isStrong = score === passwordStrengthCriteria.length;

  return {
    score,
    strengthPercentage,
    requiredChecks,
    isStrong,
  };
};

export default function NouveauMDP() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [err, setErr] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const { strengthPercentage, isStrong, requiredChecks } = passwordStrength;

  const passwordsMatch = password === passwordAgain;

  const token = useParams().token;

  async function handleNew(e) {
    e.preventDefault();
    if (!passwordsMatch || !isStrong) return;

    setIsSubmitting(true);
    setErr(false);

    const res = await setNouveauMDP(token, password);
    setErr(!res);
    setIsSubmitting(false);

    if (res) {
        navigate('/login'); 
    }
  }

  const getStrengthVariant = (percentage) => {
    if (percentage === 0) return 'secondary'; // Grey for empty/zero
    if (percentage < 33) return 'danger'; // Red
    if (percentage < 66) return 'warning'; // Orange/Yellow
    if (percentage < 100) return 'info'; // Use info/primary as a moderate step
    return 'success'; // Green
  };

  return (
    <Container className="connexion-main-container d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
      
      <Card className="shadow-lg p-4 mb-4" style={{ maxWidth: '450px', width: '100%' }}>
        <Card.Body>
          <div className="text-center mb-4">
            <h1 className="fs-3 text-primary mb-2">
                <LockIcon /> Nouveau mot de passe
            </h1>
            <p className="text-muted small">Veuillez définir un mot de passe sécurisé pour votre compte.</p>
          </div>
          
          <Form onSubmit={handleNew} className="d-flex flex-column">
            
            {err && <Alert variant="danger" className="text-start">Lien de réinitialisation invalide ou expiré. Veuillez obtenir un nouveau lien.</Alert>}
            
            {/* --- NEW PASSWORD FIELD --- */}
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <InputGroup size="lg"> {/* Increased size for modern look */}
                <Form.Control
                  onChange={(e) => setPassword(e.target.value)}
                  type={show1 ? 'text' : 'password'}
                  name="Mot de passe"
                  value={password}
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <Button variant="outline-secondary" onClick={() => setShow1(!show1)} aria-label={show1 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  {show1 ? <VisibilityOff /> : <Visibility />}
                </Button>
              </InputGroup>
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                    <ProgressBar 
                        now={strengthPercentage} 
                        variant={getStrengthVariant(strengthPercentage)} 
                        style={{ height: '8px' }} 
                        className="mb-2"
                    />
                    <div className="d-flex flex-wrap justify-content-start">
                        {requiredChecks.map((check, index) => (
                            <div
                                key={index}
                                className="me-3 mb-1 small"
                                style={{ color: check.passed ? 'green' : 'gray' }}
                            >
                                {check.passed ? <CheckIcon /> : <XIcon />} {check.message}
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </Form.Group>

            {/* --- CONFIRM PASSWORD FIELD --- */}
            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label>Répéter le mot de passe</Form.Label>
              <InputGroup size="lg">
                <Form.Control
                  onChange={(e) => setPasswordAgain(e.target.value)}
                  type={show2 ? 'text' : 'password'}
                  name="Confirmation du mot de passe"
                  value={passwordAgain}
                  placeholder="Confirmez le nouveau mot de passe"
                  required
                />
                <Button variant="outline-secondary" onClick={() => setShow2(!show2)} aria-label={show2 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  {show2 ? <VisibilityOff /> : <Visibility />}
                </Button>
              </InputGroup>
              
              {/* Match Error Feedback */}
              {passwordAgain.length > 0 && !passwordsMatch && (
                <Form.Text className="text-danger mt-1 d-block">
                  Les mots de passe ne correspondent pas.
                </Form.Text>
              )}
            </Form.Group>
            
            {/* --- SUBMIT BUTTON --- */}
            <div className="d-grid gap-2">
                <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
                    disabled={!isStrong || !passwordsMatch || isSubmitting}
                >
                    {isSubmitting ? 'Validation en cours...' : 'Valider ce mot de passe'}
                </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Optional: Link back to login/home */}
      <Link to={'/login'} className="text-center text-muted mt-3">
        &#x2190; Annuler et retourner à la connexion
      </Link>
    </Container>
  );
}