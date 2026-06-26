// App.jsx
// Gere les routes principales

import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { Spinner } from "react-bootstrap";
import { ProtectedRoute } from "./Protected";
import { Layout, LayoutProvider } from "./layouts/Layout";
import PublicationsRecentes from "./components/pages/PublicationsRecentes";

// Lazy imports
const Soifguard = lazy(() => import("./pages/Soifguard"));
const Admin = lazy(() => import("./pages/Admin"));
const ListeAssos = lazy(() => import("./components/pages/AssoListe"));
const Home = lazy(() => import("./components/pages/Home"));
const Asso = lazy(() => import("./components/pages/PageAsso"));
const Trombi = lazy(() => import("./components/pages/Trombi"));
const TrombiPromo = lazy(() => import("./components/pages/TrombiPromo"));
const PlanningAsso = lazy(() => import("./components/pages/PlanningAsso"));
const ProposerSondage = lazy(() => import("./components/pages/Sondage/ProposerSondage"));
const GererSondages = lazy(() => import("./components/pages/Sondage/GererSondages"));
const PageUtilisateur = lazy(() => import("./components/pages/PageUtilisateur"));
const AjouterAssociation = lazy(() => import("./components/pages/AssoAjouter"));
const FormulaireConnexion = lazy(() => import("./components/FormulaireConnexion"));
const Search = lazy(() => import("./components/pages/Search"));
const ClassementSondage = lazy(() => import("./components/pages/Sondage/ClassementSondage"));
const Vendomes = lazy(() => import("./components/pages/Vendomes"));
const Palums = lazy(() => import("./components/pages/Palums"));
const NouveauMDP = lazy(() => import("./components/NouveauMDP"));
const MDPoublie = lazy(() => import("./components/MDPoublie"));
const Jeux2048 = lazy(() => import("./components/pages/Jeux/2048"));
const EchecsLobby  = lazy(() => import("./components/pages/echecs/EchecsLobby"));
const EchecsPartie = lazy(() => import("./components/pages/echecs/EchecsPartie"));

export default function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    // If no theme is stored, check for system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <LayoutProvider theme={theme} setTheme={setTheme}>
      <Suspense fallback={<div className="d-flex justify-content-center mt-5"><Spinner animation="border" variant="primary" /></div>}>
        <Routes>
          <Route path="/login" element={<FormulaireConnexion />} />
          <Route path="/reset/:token" element={<NouveauMDP />} />
          <Route path="/oublie" element={<MDPoublie />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="assos">
                <Route index element={<ListeAssos />} />
                <Route path="get/:id/*" element={<Asso />} />
                <Route path="planning" element={<PlanningAsso />} />
                <Route path="ajouter" element={<AjouterAssociation />} />
              </Route>
              <Route path="trombi">
                <Route index element={<Trombi />} />
                <Route path="get/:promo" element={<TrombiPromo />} />
              </Route>
              <Route path="sondage">
                <Route path="classement" element={<ClassementSondage />} />
                <Route path="proposer" element={<ProposerSondage />} />
                <Route path="gerer" element={<GererSondages />} />
              </Route>
              <Route path="utilisateur">
                <Route path=":id/*" element={<PageUtilisateur />} />
              </Route>
              <Route path="jeux/*">
                <Route path="2048" element={<Jeux2048 />} />
                <Route path="echecs"  element={<EchecsLobby />} />
                <Route path="echecs/partie/:partieId" element={<EchecsPartie />} />
              </Route>
              <Route path="search" element={<Search />} />
              <Route path="vendomes" element={<Vendomes />} />
              <Route path="palums" element={<Palums />} />
              <Route path="publications" element={<PublicationsRecentes />} />
            </Route>
            <Route path="soifguard/*" element={<Soifguard />}>
            </Route>
            <Route path="/administration" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </LayoutProvider>
  );
}