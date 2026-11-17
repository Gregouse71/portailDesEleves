import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button, Alert, Row, Col } from "react-bootstrap";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nouvellePartie, faireUnCoup, leaderboardJeu, partieEnCours } from "../../../api/api_jeux";
import Leaderboard from "../../../components/elements/Leaderboard";
import JeuxTemplate from "../../../components/templates/JeuxTemplate";
import {
    DEFAULT_SCREEN,
    createInitialGame,
    stepUpdate,
    createInitialInputState,
    handleInputKey,
    replayAtcGame,
} from "./atcEngine";
import { CONSIGNES } from "./atcConstants";
import AtcTerminal from "./AtcTerminal";
import AtcControls from "./AtcControls";
import AtcManualModal from "./AtcManualModal";
import "../../../assets/styles/atc.scss";

const INITIAL_GAME_STATE = {
    clck: 0,
    safe_planes: 0,
    last_plane: -1,
    air: [],
    ground: [],
    loser_msg: null,
};

function recordCommand(commands, clck, cmdStr) {
    while (commands.length <= clck) {
        commands.push([]);
    }
    commands[clck].push(cmdStr);
}

function padCommandsToTick(commands, clck) {
    while (commands.length < clck) {
        commands.push([]);
    }
}

export default function Atc() {
    const queryClient = useQueryClient();
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches
    );
    const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
    const [inputState, setInputState] = useState(() => createInitialInputState());
    const [gameStarted, setGameStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // Suivi unifié du replay pour la vérification serveur et la reprise après pause
    const replayRef = useRef({
        commands: [],
        forcedUpdates: 0,
        submitted: false,
        restoredId: null,
    });

    // Référence pour conserver des callbacks stables sans invalider le mémo du radar à chaque frappe
    const liveRef = useRef({ gameState, inputState, isPaused, gameStarted });
    useEffect(() => {
        liveRef.current = { gameState, inputState, isPaused, gameStarted };
    }, [gameState, inputState, isPaused, gameStarted]);

    const { data: partieEnCoursData } = useQuery({
        queryKey: ["partieEnCours", "atc"],
        queryFn: () => partieEnCours({}, "atc"),
        staleTime: 0,
        refetchOnMount: "always",
    });

    const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
        queryKey: ["leaderboard", "atc"],
        queryFn: () => leaderboardJeu({}, "atc"),
    });

    const submitScoreMutation = useMutation({
        mutationFn: async (payload) => await faireUnCoup(payload, "atc"),
        onSuccess: () => {
            queryClient.setQueryData(["partieEnCours", "atc"], {});
            queryClient.invalidateQueries({ queryKey: ["leaderboard", "atc"] });
        },
    });

    const pauseMutation = useMutation({
        mutationFn: async (payload) => await faireUnCoup(payload, "atc"),
    });

    const startNewGameMutation = useMutation({
        mutationFn: async () => await nouvellePartie({ jeu: "atc" }),
        onSuccess: (data) => {
            const seed = data?.etat?.seed ?? 4;
            replayRef.current = {
                commands: [],
                forcedUpdates: 0,
                submitted: false,
                restoredId: data?.id ?? null,
            };
            setIsPaused(false);
            setGameState(createInitialGame(DEFAULT_SCREEN, seed));
            setInputState(createInitialInputState());
            setGameStarted(true);
            queryClient.setQueryData(["partieEnCours", "atc"], data);
        },
    });

    // Suivi du format mobile
    useEffect(() => {
        const mql = window.matchMedia("(max-width: 767.98px)");
        const onChange = (e) => setIsMobile(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    // Restauration d'une partie mise en pause après rechargement de la page
    useEffect(() => {
        if (!partieEnCoursData?.id || !partieEnCoursData?.etat?.paused) return;
        if (replayRef.current.restoredId === partieEnCoursData.id) return;

        const etat = partieEnCoursData.etat;
        const cmds = Array.isArray(etat.commandes)
            ? etat.commandes.map((arr) => (Array.isArray(arr) ? [...arr] : []))
            : [];

        replayRef.current = {
            commands: cmds,
            forcedUpdates: etat.paused_forced_updates ?? 0,
            submitted: false,
            restoredId: partieEnCoursData.id,
        };

        const replayed = replayAtcGame(
            etat.seed ?? 4,
            etat.paused_tick ?? 0,
            cmds,
            DEFAULT_SCREEN
        );
        setGameState(replayed);
        setInputState(createInitialInputState());
        setGameStarted(true);
        setIsPaused(true);
    }, [partieEnCoursData]);

    // Envoi automatique du replay au serveur dès que la partie se termine
    useEffect(() => {
        if (gameStarted && gameState.loser_msg && !replayRef.current.submitted) {
            replayRef.current.submitted = true;
            padCommandsToTick(replayRef.current.commands, gameState.clck);
            submitScoreMutation.mutate({
                ticks: gameState.clck,
                forced_updates: replayRef.current.forcedUpdates,
                commands: replayRef.current.commands,
            });
        }
    }, [gameStarted, gameState.loser_msg, gameState.clck, submitScoreMutation]);

    // Horloge périodique (désactivée sur mobile, avant le début, en pause ou en fin de partie)
    useEffect(() => {
        if (isMobile || !gameStarted || isPaused || gameState.loser_msg) return;
        const timer = setInterval(() => {
            setGameState((prev) => stepUpdate(prev, DEFAULT_SCREEN));
        }, DEFAULT_SCREEN.update_secs * 1000);
        return () => clearInterval(timer);
    }, [isMobile, gameStarted, isPaused, gameState.clck, gameState.loser_msg]);

    const processKey = useCallback(
        (key) => {
            const cur = liveRef.current;
            if (isMobile || !cur.gameStarted || cur.isPaused || cur.gameState.loser_msg) return;

            const {
                inputState: nextInput,
                gameState: nextGame,
                forceUpdate,
                executedCommand,
            } = handleInputKey(key, cur.inputState, cur.gameState, DEFAULT_SCREEN);

            if (executedCommand) {
                recordCommand(replayRef.current.commands, cur.gameState.clck, executedCommand);
            }

            setInputState(nextInput);
            if (forceUpdate) {
                replayRef.current.forcedUpdates += 1;
                setGameState(stepUpdate(nextGame, DEFAULT_SCREEN));
            } else {
                setGameState(nextGame);
            }
        },
        [isMobile]
    );

    const selectPlane = useCallback(
        (planeKey) => {
            const cur = liveRef.current;
            if (isMobile || !cur.gameStarted || cur.isPaused || cur.gameState.loser_msg) return;
            const { inputState: nextInput, gameState: nextGame } = handleInputKey(
                planeKey,
                createInitialInputState(),
                cur.gameState,
                DEFAULT_SCREEN
            );
            setInputState(nextInput);
            setGameState(nextGame);
        },
        [isMobile]
    );

    // Écoute clavier globale
    useEffect(() => {
        if (isMobile || !gameStarted) return;

        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

            if (gameState.loser_msg) {
                if (e.key === " ") {
                    e.preventDefault();
                    startNewGameMutation.mutate();
                }
                return;
            }

            if (isPaused) return;
            if (e.key === "Backspace" || e.key === "Enter" || e.key.length === 1) {
                e.preventDefault();
                processKey(e.key);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isMobile, gameStarted, isPaused, gameState.loser_msg, processKey, startNewGameMutation]);

    const handleRestart = () => {
        startNewGameMutation.mutate();
    };

    const handleTogglePause = () => {
        if (!gameStarted || gameState.loser_msg || pauseMutation.isPending) return;

        if (!isPaused) {
            replayRef.current.forcedUpdates += 1;
            const nextGame = stepUpdate(gameState, DEFAULT_SCREEN);
            setGameState(nextGame);
            setInputState(createInitialInputState());

            if (nextGame.loser_msg) return;

            setIsPaused(true);
            padCommandsToTick(replayRef.current.commands, nextGame.clck);
            pauseMutation.mutate({
                action: "pause",
                ticks: nextGame.clck,
                forced_updates: replayRef.current.forcedUpdates,
                commands: replayRef.current.commands,
            });
        } else {
            pauseMutation.mutate(
                { action: "resume" },
                { onSuccess: () => setIsPaused(false) }
            );
        }
    };

    const handleFinishGame = () => {
        if (!gameStarted || gameState.loser_msg) return;
        setIsPaused(false);
        setGameState((prev) => ({
            ...prev,
            loser_msg: "Partie terminée volontairement.",
        }));
    };

    if (isMobile) {
        return (
            <JeuxTemplate
                titre="Contrôleur de l'air"
                contenu={
                    <Alert variant="warning" className="mt-3">
                        <strong>Jeu non disponible sur mobile.</strong>
                        <p className="mb-0 mt-1">
                            Ce jeu doit se jouer depuis un ordinateur.
                        </p>
                    </Alert>
                }
            />
        );
    }

    return (
        <JeuxTemplate
            titre="Contrôleur de l'air"
            fluid={true}
            contenu={
                <div className="w-100">
                    <div className="d-flex justify-content-center mb-3 w-100">
                        <div className="atc-terminal-wrapper d-flex flex-column align-items-center">
                            <AtcTerminal
                                gameState={gameState}
                                inputState={inputState}
                                gameStarted={gameStarted}
                                isPaused={isPaused}
                                onKey={processKey}
                                onSelectPlane={selectPlane}
                            />
                            <AtcControls
                                gameStarted={gameStarted}
                                isGameOver={Boolean(gameState.loser_msg)}
                                isPaused={isPaused}
                                isStarting={startNewGameMutation.isPending}
                                isPausing={pauseMutation.isPending}
                                onRestart={handleRestart}
                                onTogglePause={handleTogglePause}
                                onFinishGame={handleFinishGame}
                            />
                        </div>
                    </div>

                    <Row>
                        <Col sm={7}>
                            <div className="atc-consignes">
                                <Card>
                                    <Card.Header className="fw-bold py-2 d-flex justify-content-between align-items-center">
                                        <span>Consignes</span>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setShowManual(true)}
                                        >
                                            Manuel complet
                                        </Button>
                                    </Card.Header>
                                    <Card.Body className="py-2">
                                        <p className="mb-2">
                                            <strong>But :</strong> Guider les avions à travers l&apos;espace aérien sans collision ni panne de carburant. Donnez des consignes au clavier ou en cliquant sur les avions.
                                        </p>
                                        <ul className="ps-3 mb-2">
                                            {CONSIGNES.map((elt, ind) => (
                                                <li key={ind}>
                                                    <strong>{elt.titre} :</strong> {elt.texte}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            </div>
                        </Col>
                        <Col sm={5}>
                            <Leaderboard
                                data={leaderboardData}
                                title="Meilleurs contrôleurs"
                                titleRow={true}
                                format={[
                                    { nom: "Avions", scoreKey: "score", formatScore: (s) => s },
                                    { nom: "Tours", scoreKey: "ticks", formatScore: (t) => t ?? 0 },
                                ]}
                                isLoading={isLoadingLeaderboard}
                            />
                        </Col>
                    </Row>

                    <AtcManualModal show={showManual} onHide={() => setShowManual(false)} />
                </div>
            }
        />
    );
}
