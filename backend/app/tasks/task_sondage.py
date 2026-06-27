from .. import scheduler
from app.services.services_sondages import sondage_suivant

# A client to connect to Redis


@scheduler.task("cron", id="task_sondage", day="*", hour="4")
def task_sondage():
    """
    This task is called periodically to advance to the next poll.
    It uses a Redis lock to ensure that only one worker process
    executes the task in a multi-worker environment.
    """
    with scheduler.app.app_context():
        sondage_suivant()

# @scheduler.task("cron", id="task_sondage", day="*", hour="*", minute="*")
# def test_task():
#     print("Task running")

