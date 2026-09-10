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

---

### BR2 - Scheduler e Check

- Esecuzione manuale dei controlli tramite Django Management Command
- Recupero dei monitor attivi
- Controllo dell'intervallo configurato per ogni monitor
- Esecuzione delle richieste HTTP/HTTPS
- Salvataggio dello storico dei check
- Registrazione:
  - esito del controllo
  - codice HTTP
  - tempo di risposta
  - eventuali errori

---

### BR3 - Gestione incidenti

- Calcolo dello stato del monitor:
  - `not_started`
  - `up`
  - `down`
- Gestione dei fallimenti consecutivi tramite soglia configurabile
- Creazione automatica di un incidente quando un monitor passa in stato DOWN
- Chiusura automatica dell'incidente quando il monitor torna UP
- Calcolo della durata dell'incidente
- Identificazione della root cause:
  - `connection_timeout`
  - `connection_error`
  - `http_error`
  - `unknown`

---

### BR4 - Notifiche

- Sistema di notifiche basato su Strategy Pattern
- Canali di notifica configurabili tramite variabile d'ambiente
- Supporto ai notifier:
  - Console notifier
  - Email notifier
- Invio automatico delle notifiche durante i cambi di stato:
  - apertura incidente (`DOWN`)
  - risoluzione incidente (`UP`)
- Configurazione email tramite SMTP e variabili d'ambiente:
  - server SMTP
  - porta
  - username
  - password
  - destinatario notifiche

---

### BR5 - Storico e statistiche

- Calcolo uptime percentuale basato sulla durata degli incidenti
- Calcolo MTBF
- Statistiche tempi di risposta
- Storico check filtrabile per data
- Storico incidenti filtrabile per data
- Endpoint uptime con periodi predefiniti e custom

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

## Esecuzione controlli

Per eseguire manualmente il controllo dei monitor:

```bash
python manage.py run_checks
```

---

## Roadmap

- [x] BR1 - CRUD Monitor
- [x] BR2 - Scheduler e Check
- [x] BR3 - Incidenti
- [x] BR4 - Notifiche
- [x] BR5 - Uptime
- [ ] BR6 - API complete