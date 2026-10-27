"""Celery task queue (Redis broker).

Run workers:  celery -A app.workers.celery_app worker -Q inbox,default -c 8
Run schedule: celery -A app.workers.celery_app beat
Without REDIS_URL tasks run inline (eager) so local development needs no extra services.
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()

celery_app = Celery("omnichat", broker=settings.redis_url or "memory://", include=["app.workers.tasks"])
celery_app.conf.update(
    task_always_eager=not settings.redis_url,
    task_eager_propagates=True,
    task_acks_late=True,  # a crashed worker's job goes back to the queue
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # AI calls are slow; don't hoard jobs on one worker
    task_default_queue="default",
    task_routes={"app.workers.tasks.process_inbound": {"queue": "inbox"}},
    task_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    beat_schedule={
        "prune-webhook-events": {"task": "app.workers.tasks.prune_webhook_events", "schedule": crontab(minute=17)},
    },
)
configure_logging()
