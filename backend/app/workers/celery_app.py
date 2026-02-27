from celery import Celery
from app.core.config import settings

celery = Celery(
    "audio_lessons",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
)

# Import tasks to register them
from app.workers import tasks  # noqa: F401, E402
