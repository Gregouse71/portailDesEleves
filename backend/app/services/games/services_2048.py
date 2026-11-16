from app.models import JeuxPartie

def _transpose(board):
    return [list(row) for row in zip(*board)]

def _move_left(row):
    new_row = [i for i in row if i != 0]
    score = 0
    i = 0
    while i < len(new_row) - 1:
        if new_row[i] == new_row[i+1]:
            new_row[i] *= 2
            score += new_row[i]
            new_row.pop(i+1)
        i += 1
    new_row.extend([0] * (4 - len(new_row)))
    return new_row, score


def coup_2048(partie: JeuxPartie, data: dict):
    board = partie.etat["plateau"]
    initial = board[:]
    move = data["coup"]
    score_increment = 0

    if move == 'gauche':
        for i in range(4):
            board[i], score = _move_left(board[i])
            score_increment += score
    elif move == 'droite':
        for i in range(4):
            reversed_row, score = _move_left(board[i][::-1])
            board[i] = reversed_row[::-1]
            score_increment += score
    elif move == 'haut':
        board = _transpose(board)
        for i in range(4):
            board[i], score = _move_left(board[i])
            score_increment += score
        board = _transpose(board)
    elif move == 'bas':
        board = _transpose(board)
        for i in range(4):
            reversed_row, score = _move_left(board[i][::-1])
            board[i] = reversed_row[::-1]
            score_increment += score
        board = _transpose(board)

    partie.score += score_increment

    if board != initial:
        partie.etat["plateau"] = board
        partie.add_random_tile()

    return partie