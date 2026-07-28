from concurrent.futures import ThreadPoolExecutor

from django.core.management.base import BaseCommand

from monitor.models import Monitor
from check.services import execute_check, should_run_check
from incident.services import determine_status, handle_incident


def process_monitor(monitor):

    if not should_run_check(monitor):
        return

    check = execute_check(monitor)

    status = determine_status(monitor)

    handle_incident(
        monitor,
        status,
        check,
    )


class Command(BaseCommand):
    help = "Esegue i check dei monitor attivi"

    def handle(self, *args, **options):

        monitors = Monitor.objects.filter(
            is_active=True,
        )

        self.stdout.write(f"Avvio controllo di {monitors.count()} monitor attivi")

        with ThreadPoolExecutor(
            max_workers=20,
        ) as executor:

            executor.map(
                process_monitor,
                monitors,
            )

        self.stdout.write("Controlli completati")
