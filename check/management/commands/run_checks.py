from django.core.management.base import BaseCommand
from monitor.models import Monitor
from check.services import execute_check, should_run_check


class Command(BaseCommand):
    help = "Esegue i check dei monitor attivi"

    def handle(self, *args, **options):
        monitors = Monitor.objects.filter(is_active=True)

        self.stdout.write(f"Trovati {monitors.count()} monitor attivi")

        for monitor in monitors:

            if should_run_check(monitor):

                self.stdout.write(f"Controllo monitor: {monitor.name}")
                check = execute_check(monitor)

                self.stdout.write(f"Risultato: {check.success}")
            else:
                self.stdout.write(f"Skip: {monitor.name}")
