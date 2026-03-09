import redis
from .. import scheduler
from app.services.services_sondages import sondage_suivant
from app import db

# A client to connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)


@scheduler.task("cron", id="task_sondage", day="*", hour="4")
def task_sondage():
    """
    This task is called periodically to advance to the next poll.
    It uses a Redis lock to ensure that only one worker process
    executes the task in a multi-worker environment.
    """
    # The key for the distributed lock in Redis
    lock_key = "lock:task_sondage"

    # Try to acquire the lock.
    # nx=True means "set only if the key does not already exist".
    # ex=60 means the lock will automatically expire after 60 seconds,
    # preventing deadlocks if a worker crashes.
    is_lock_acquired = redis_client.set(lock_key, "locked", nx=True, ex=60)

    if not is_lock_acquired:
        print("Could not acquire lock for task_sondage, another worker is already running it.")
        return

    print("Lock acquired for task_sondage. Running the task.")
    try:
        # With the application context, we can access the database
        # and other Flask extensions.
        with scheduler.app.app_context():
            with db.session.no_autoflush:
                sondage_suivant()
            print("task_sondage has run successfully.")
    finally:
        # Always release the lock when the task is done.
        redis_client.delete(lock_key)
        print("Lock for task_sondage released.")
