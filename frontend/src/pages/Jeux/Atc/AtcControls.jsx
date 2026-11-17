import { Button } from "react-bootstrap";

export default function AtcControls({
    gameStarted,
    isGameOver,
    isPaused,
    isStarting,
    isPausing,
    onRestart,
    onTogglePause,
    onFinishGame,
}) {
    return (
        <div className="mt-2 d-flex align-items-center gap-2">
            <Button
                variant={gameStarted ? "secondary" : "primary"}
                size="sm"
                onClick={onRestart}
                disabled={isStarting}
            >
                {gameStarted ? "Nouvelle partie" : "Commencer"}
            </Button>
            {gameStarted && !isGameOver && (
                <>
                    <Button
                        variant={isPaused ? "success" : "warning"}
                        size="sm"
                        onClick={onTogglePause}
                        disabled={isPausing}
                    >
                        {isPaused ? "Reprendre" : "Pause"}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onFinishGame}
                    >
                        Terminer la partie
                    </Button>
                </>
            )}
        </div>
    );
}
