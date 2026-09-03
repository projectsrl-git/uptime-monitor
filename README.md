# Uptime Monitor

Applicazione Django per monitorare endpoint HTTP/HTTPS, conservare lo storico dei
controlli, gestire gli incidenti e consultare statistiche e grafici dal browser o
tramite API REST.

## Funzionalita

### Monitor

- creazione, modifica, duplicazione e disattivazione (soft delete) dei monitor;
- riattivazione dei monitor disattivati;
- validazione degli URL `http` e `https`;
- configurazione di intervallo e timeout del check;
- scelta del metodo HTTP (`HEAD`, `GET`, `POST`, `PUT`, `PATCH`, `DELETE`,
  `OPTIONS`);
- codici di stato accettati e soglia di fallimenti consecutivi;
- soglia opzionale per risposte lente;
- header e body della richiesta, con opzione per inviare il body come JSON;
- autenticazione `none` o `basic`;
- redirect configurabili e preferenza IPv4, IPv6 o IPv4 prioritario;
- badge personalizzati.

Ogni monitor espone uno stato calcolato:

| Stato | Significato |
| --- | --- |
| `not_started` | non e ancora stato eseguito alcun check |
| `up` | il monitor e operativo |
| `down` | esiste un incidente aperto |
| `paused` | il monitor e disattivato |

### Check e incidenti

Il comando `run_checks`:

1. seleziona i monitor attivi;
2. esegue solo i check arrivati alla scadenza dell'intervallo;
3. salva esito, codice HTTP, tempo di risposta ed eventuale errore;
4. aggiorna lo stato e apre o chiude automaticamente gli incidenti.

I check vengono eseguiti in parallelo (fino a 20 worker). Un incidente viene
aperto dopo il numero configurato di fallimenti consecutivi e viene chiuso al
primo check riuscito. La root cause puo essere:

- `connection_timeout`
- `connection_error`
- `http_error`
- `unknown`

### Dashboard web

L'interfaccia include:

- dashboard con elenco monitor, ricerca, filtro per stato e ordinamento;
- riepilogo di monitor UP, DOWN, PAUSED e NOT STARTED;
- uptime, tempo di risposta, numero di check, incidenti e downtime per periodo;
- pagina di dettaglio del monitor con overview, configurazione, grafici, storico
  check e storico incidenti;
- elenco e dettaglio degli incidenti, con filtro per stato, ricerca e ordinamento;
- pagina per confrontare lo stato dei monitor;
- esportazione delle statistiche in formato Excel.

I periodi disponibili nella dashboard e nelle statistiche sono `24h`, `7d`, `30d`
e `365d`.

### Notifiche

Le notifiche usano una strategia configurabile tramite `NOTIFICATION_CHANNELS`.
Sono disponibili:

- `console`;
- `email`, con invio SMTP all'apertura (`DOWN`) e alla risoluzione (`UP`) di un
  incidente.

## Stack tecnologico

- Python 3.12
- Django 6
- Django REST Framework
- drf-spectacular
- MySQL
- Requests
- openpyxl

## Installazione

```bash
git clone <URL_DEL_REPOSITORY>
cd uptime-monitor
python -m venv .venv
```

Attivazione dell'ambiente virtuale:

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Linux/macOS**

```bash
source .venv/bin/activate
```

Installazione delle dipendenze:

```bash
pip install -r requirements.txt
```

## Configurazione

Copiare `.env.example` in `.env` e valorizzare almeno le variabili del database:

```dotenv
DB_NAME=uptime_monitor
DB_USER=...
DB_PASSWORD=...
DB_HOST=127.0.0.1
DB_PORT=3306
SECRET_KEY=...
DEBUG=True
```

Per abilitare le notifiche email:

```dotenv
NOTIFICATION_CHANNELS=console,email
NOTIFICATION_EMAIL=destinatario@example.com
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
```

`NOTIFICATION_CHANNELS` accetta uno o piu valori separati da virgola. Se non viene
impostato, viene usato `console`.

> In produzione impostare una `SECRET_KEY` sicura, disattivare `DEBUG` e
> configurare correttamente gli host consentiti prima di esporre l'applicazione.

## Migrazioni e avvio

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

URL principali:

- dashboard: <http://127.0.0.1:8000/>
- admin Django: <http://127.0.0.1:8000/admin/>
- API: <http://127.0.0.1:8000/api/>

## Esecuzione dei check

Il progetto non include un processo scheduler persistente: `run_checks` deve
essere invocato periodicamente da cron, Utilita di pianificazione di Windows o
da un altro orchestratore.

```bash
python manage.py run_checks
```

## API REST

Tutti gli endpoint API usano il prefisso `/api/`.

### Monitor

| Metodo | Endpoint | Descrizione |
| --- | --- | --- |
| `GET` | `/api/monitors/` | elenco monitor |
| `POST` | `/api/monitors/` | crea monitor |
| `GET` | `/api/monitors/{id}/` | dettaglio e stato corrente |
| `PUT`/`PATCH` | `/api/monitors/{id}/` | modifica monitor |
| `DELETE` | `/api/monitors/{id}/` | disattiva il monitor |
| `POST` | `/api/monitors/{id}/activate/` | riattiva il monitor |
| `POST` | `/api/monitors/{id}/duplicate/` | crea una copia della configurazione |
| `GET` | `/api/monitors/{id}/checks/` | storico dei check |
| `GET` | `/api/monitors/{id}/incidents/` | storico degli incidenti |
| `GET` | `/api/monitors/{id}/uptime/` | uptime e tempi di risposta |
| `GET` | `/api/monitors/{id}/statistics/` | statistiche complete del monitor |

Filtro e ordinamento elenco monitor:

```text
/api/monitors/?status=down
/api/monitors/?ordering=-created_at
/api/monitors/?ordering=status
```

`status` accetta `up`, `down`, `paused` e `not_started`. L'ordinamento supporta
`name`, `-name`, `created_at`, `-created_at`, `status` e `-status`.

Lo storico dei check supporta:

```text
/api/monitors/1/checks/?from=2026-07-01&to=2026-07-31&success=false&ordering=-response_time_ms&page_size=20
```

I parametri disponibili sono `from`, `to`, `success=true|false`,
`ordering=executed_at|-executed_at|response_time_ms|-response_time_ms`,
`page` e `page_size` (massimo 100).

Lo storico degli incidenti supporta `from`, `to`, `status=active|resolved`,
`ordering=started_at|-started_at|duration_seconds|-duration_seconds`, `page` e
`page_size`.

### Uptime

```text
GET /api/monitors/1/uptime/?period=24h
```

`period` accetta `24h`, `7d`, `30d` e `365d`. La risposta contiene uptime
percentuale, downtime, MTBF, tempi minimo/medio/massimo e dati aggregati nel
periodo.

### Incidenti globali

```text
GET /api/incidents/
GET /api/incidents/?status=active&search=api&ordering=-started_at
GET /api/statistics/incidents/
```

`/api/incidents/` e un endpoint in sola lettura e supporta `status=active|resolved`,
la ricerca per nome monitor o root cause e l'ordinamento per `started_at`.

### Statistiche globali e export

```text
GET /api/statistics/?period=7d
GET /api/monitors/1/statistics/?period=7d
GET /api/statistics/export/?period=30d&monitor_ids=1,2&include_summary=true&include_monitor_sheets=true
```

Il primo endpoint restituisce uptime medio, tempo di risposta medio, numero di
check, incidenti e downtime. L'endpoint `/api/monitors/{id}/statistics/`
restituisce anche serie temporali di response time, check, uptime e incidenti.

L'endpoint `/api/statistics/export/` scarica `monitor-statistics.xlsx`. I
parametri `monitor_ids`, `include_summary` e `include_monitor_sheets` controllano
rispettivamente i monitor inclusi, il riepilogo generale e le schede dei singoli
monitor.

Gli endpoint di storico e `/api/incidents/` sono paginati e restituiscono `count`,
`page`, `num_pages`, `page_size`, `next`, `previous` e `results`. L'elenco
`/api/monitors/` restituisce invece direttamente la lista dei monitor.

## Struttura del progetto

```text
config/             configurazione Django e URL principali
monitor/            modello, API e servizi dei monitor
check/              modello, servizio e comando di esecuzione dei check
incident/           modello, API e gestione del ciclo di vita degli incidenti
monitoring_stats/   statistiche, serie temporali ed export Excel
notification/       notifier console ed email
frontend/           viste, template, CSS e JavaScript della dashboard
```