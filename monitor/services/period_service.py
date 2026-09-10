from datetime import timedelta, datetime

from django.utils import timezone


def parse_date(value):
    if not value:
        return None

    try:
        dt = datetime.fromisoformat(value)

        return timezone.make_aware(dt)

    except ValueError:
        raise ValueError("Formato data non valido. Usa YYYY-MM-DD")


def get_period_range(
    period,
    from_date=None,
    to_date=None,
):

    now = timezone.now()

    if period == "24h":
        return (
            now - timedelta(hours=24),
            now,
        )

    if period == "7d":
        return (
            now - timedelta(days=7),
            now,
        )

    if period == "30d":
        return (
            now - timedelta(days=30),
            now,
        )

    if period == "365d":
        return (
            now - timedelta(days=365),
            now,
        )

    if period == "custom":

        if not from_date or not to_date:
            raise ValueError("Per il periodo custom sono richiesti from e to")

        return (
            from_date,
            to_date,
        )

    raise ValueError("Periodo non valido")
