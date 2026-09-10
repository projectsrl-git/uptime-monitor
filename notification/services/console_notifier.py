class ConsoleNotifier:

    def send(self, event, incident):
        print(f"[{event.upper()}] " f"{incident.monitor.name}")
