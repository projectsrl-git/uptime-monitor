# Uptime Monitor

Progetto sviluppato come percorso di onboarding per il ruolo di Junior Python Developer.

L'applicazione permette di monitorare periodicamente endpoint HTTP/HTTPS, registrare lo storico dei controlli e notificare eventuali cambi di stato.

---

## Tecnologie utilizzate

- Python 3.12
- Django
- Django REST Framework
- MySQL
- Docker

---

## Funzionalità implementate

### BR1 - Gestione monitor

- Creazione monitor
- Modifica monitor
- Visualizzazione monitor
- Soft delete (disattivazione)
- Validazione URL HTTP/HTTPS

### BR2 - Esecuzione dei check

- Modello `Check` per la registrazione dello storico
- Esecuzione manuale dei check tramite management command (`run_checks`)
- Richieste HTTP configurabili (metodo e timeout)
- Registrazione di:
  - timestamp
  - esito del check
  - tempo di risposta
  - codice HTTP
  - eventuale messaggio di errore
- Esecuzione dei check solo per monitor attivi
- Rispetto dell'intervallo di controllo configurato per ciascun monitor

---

## Installazione

```bash
git clone ...
cd uptime-monitor
```

Creare un ambiente virtuale:

```bash
python -m venv .venv
```

Attivarlo:

Windows

```bash
.venv\Scripts\activate
```

Linux/macOS

```bash
source .venv/bin/activate
```

Installare le dipendenze:

```bash
pip install -r requirements.txt
```

---

## Migrazioni

```bash
python manage.py migrate
```

Creare un superuser:

```bash
python manage.py createsuperuser
```

---

## Avvio

Avviare il server:

```bash
python manage.py runserver
```

Eseguire manualmente i check:

```bash
python manage.py run_checks
```

Admin:

```
http://127.0.0.1:8000/admin/
```

API:

```
http://127.0.0.1:8000/api/monitors/
```

---

## Roadmap

- [x] BR1 - CRUD Monitor
- [x] BR2 - Scheduler e Check
- [ ] BR3 - Incidenti
- [ ] BR4 - Notifiche
- [ ] BR5 - Uptime
- [ ] BR6 - API complete