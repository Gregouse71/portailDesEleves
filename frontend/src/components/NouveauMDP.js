import "../assets/styles/formulaire_connexion.scss"

import { useMemo, useState } from "react";
import { setNouveauMDP } from "../api/api_global";
import { Container, Form, Button, Alert, ProgressBar, InputGroup } from "react-bootstrap";
import { useParams } from "react-router-dom";

const Visibility = () => <span>👁️</span>;
const VisibilityOff = () => <span>🔒</span>;

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

  // Convert score to a percentage (0 to 100)
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
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [err, setErr] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const { strengthPercentage, isStrong, requiredChecks } = passwordStrength;

  const token = useParams().token;

  async function handleNew(e) {
    e.preventDefault();
    const res = await setNouveauMDP(token, password);
    setErr(!res);
  }

  const getStrengthVariant = (percentage) => {
    if (percentage < 33) return 'danger'; // Red
    if (percentage < 66) return 'warning'; // Orange/Yellow
    if (percentage < 100) return 'info'; // Use info/primary as a moderate step
    return 'success'; // Green
  };

  return (
    <Container className="connexion-main-container d-flex flex-column align-items-center justify-content-center vh-100">
      <h2 className="m-4">Nouveau mot de passe</h2>
      <Form onSubmit={handleNew} className="connexion-form border rounded p-4 d-flex flex-column d-block">
        {err && <Alert variant="danger">Lien invalide. Veuillez obtenir un nouveau lien.</Alert>}
        <Form.Label style={{ fontSize: '1em' }}>Nouveau mot de passe</Form.Label>
        <InputGroup size="sm" className="mb-3">
          <Form.Control
            onChange={(e) => setPassword(e.target.value)}
            type={show1 ? 'text' : 'password'}
            name="Mot de passe"
            value={password}
            placeholder="Mot de passe"
          />
          <Button variant="outline-secondary" onClick={() => setShow1(!show1)} aria-label={show1 ? 'hide the password' : 'display the password'}>
            {show1 ? <VisibilityOff /> : <Visibility />}
          </Button>
        </InputGroup>
        <Form.Label style={{ fontSize: '1em' }}>Répéter le mot de passe</Form.Label>
        <InputGroup size="sm" className="mb-3">
          <Form.Control
            onChange={(e) => setPasswordAgain(e.target.value)}
            type={show2 ? 'text' : 'password'}
            name="Mot de passe"
            value={passwordAgain}
            placeholder="Mot de passe"
          />
          <Button variant="outline-secondary" onClick={() => setShow2(!show2)} aria-label={show2 ? 'hide the password' : 'display the password'}>
            {show2 ? <VisibilityOff /> : <Visibility />}
          </Button>
        </InputGroup>
        {passwordAgain.length > 0 && password !== passwordAgain && (
          <Form.Text className="text-danger mt-1 d-block">
            Les mots de passe ne correspondent pas.
          </Form.Text>
        )}
        <Button variant="primary" type="submit">Valider ce mot de passe</Button>
      </Form>
      {password.length > 0 && (
        <div className="mt-2 mb-3">
          <ProgressBar now={strengthPercentage} variant={getStrengthVariant(strengthPercentage)} style={{ height: '8px' }} />
          <div className="mt-2">
            {requiredChecks.map((check, index) => (
              <div
                key={index}
                style={{
                  fontSize: '0.85em',
                  color: check.passed ? 'green' : 'gray', // Using simple colors
                  fontWeight: check.passed ? 'bold' : 'normal',
                }}
              >
                {check.passed ? '✓' : '•'} {check.message}
              </div>
            ))}
          </div>
        </div>
      )}
      <Form.Group className="mb-4">
      </Form.Group>
    </Container>
  );
}
