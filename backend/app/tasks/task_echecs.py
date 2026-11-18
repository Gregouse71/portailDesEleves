from .. import scheduler
from app.services.services_echecs import appliquer_inactivite_rd


@scheduler.task("cron", id="task_echecs_rd", day="*", hour="0", timezone="Europe/Paris")
def task_echecs_rd():
    """
    Appelée chaque jour à minuit pour augmenter le RD des joueurs inactifs aux échecs.
    """
    with scheduler.app.app_context():
        appliquer_inactivite_rd()