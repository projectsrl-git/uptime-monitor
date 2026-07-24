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

# API REST

Base URL:

```
/api/
```

---

# Monitors

## Elenco monitor

```
GET /api/monitors/
```

Restituisce l'elenco dei monitor disponibili.

### Filtri disponibili

Il parametro `status` permette di filtrare i monitor per stato corrente.

Esempio:

```
GET /api/monitors/?status=up
```

Valori ammessi:

- `up`
- `down`
- `paused`
- `not_started`

Esempi:

```
GET /api/monitors/?status=down
```

restituisce solo i monitor con incidenti attivi.

```
GET /api/monitors/?status=paused
```

restituisce i monitor disattivati.

---

## Ordinamento

Il parametro `ordering` permette di ordinare i risultati.

Formato:

```
?ordering=<campo>
```

Campi disponibili:

| Parametro | Descrizione |
|---|---|
| `name` | ordine alfabetico crescente |
| `-name` | ordine alfabetico decrescente |
| `created_at` | monitor meno recenti prima |
| `-created_at` | monitor più recenti prima |
| `status` | monitor UP prima |
| `-status` | monitor DOWN prima |

Esempi:

```
GET /api/monitors/?ordering=name

GET /api/monitors/?ordering=-created_at

GET /api/monitors/?ordering=-status
```

---

## Paginazione

Gli endpoint che restituiscono liste supportano la paginazione tramite `PageNumberPagination`.

Parametri disponibili:

```
?page=1
```

e:

```
?page_size=20
```

Esempio:

```
GET /api/monitors/?page=2&page_size=20
```

Formato risposta:

```json
{
    "count": 50,
    "next": "/api/monitors/?page=3",
    "previous": "/api/monitors/?page=1",
    "results": []
}
```

---

## Creazione Monitor

```
POST /api/monitors/
```

Crea un nuovo monitor.

Risposte:

- 201 Created se il monitor viene creato correttamente.
- 400 Bad Request se i dati inviati non sono validi.

---

# Eliminazione monitor

## Endpoint

```
 DELETE /api/monitors/{id}/
```

L'eliminazione esegue una disattivazione logica del monitor impostando il campo `is_active` a `false`.

## Risposta

```
204 No Content
```

---

# Stato corrente monitor

## Endpoint

```
GET /api/monitors/{id}/
```

La risposta include lo stato corrente calcolato del monitor.

Valori possibili:

- `up`
- `down`
- `paused`
- `not_started`

## Esempio risposta

```json
{
"id": 1,
"name": "Google",
"status": "up"
}
```

---

# Storico check

## Endpoint

```
GET /api/monitors/{id}/checks/
```

Restituisce lo storico dei controlli eseguiti dal monitor.

## Parametri opzionali

- `from`: data iniziale nel formato `YYYY-MM-DD`
- `to`: data finale nel formato `YYYY-MM-DD`

## Esempio richiesta

[INSERIRE BLOCCO CODICE: esempio GET `/api/monitors/1/checks/?from=2026-07-01&to=2026-07-24`]

L'endpoint supporta la paginazione tramite:

- `page`
- `page_size`

---
# Storico incidenti

## Endpoint

[INSERIRE BLOCCO CODICE: metodo GET con endpoint `/api/monitors/{id}/incidents/`]

Restituisce lo storico degli incidenti associati al monitor.

## Parametri opzionali

- `from`: data iniziale nel formato `YYYY-MM-DD`
- `to`: data finale nel formato `YYYY-MM-DD`

## Esempio richiesta

[INSERIRE BLOCCO CODICE: esempio GET `/api/monitors/1/incidents/?from=2026-07-01`]

L'endpoint supporta la paginazione tramite:

- `page`
- `page_size`

---

# Uptime monitor

## Endpoint

```
GET /api/monitors/{id}/uptime/
```

Restituisce le statistiche di uptime del monitor calcolate su un intervallo temporale.

## Periodi disponibili

Periodi predefiniti:

```
?period=24h
```
```
?period=7d
```
```
?period=30d
```

Intervallo personalizzato:

```
?period=custom&from=2026-07-01&to=2026-07-24
```

## Esempio risposta

```json
{
    "uptime_percentage": 99.98,
    "downtime_seconds": 10,
    "mtbf_seconds": 3600,
    "response_time": {
        "average_ms": 120,
        "minimum_ms": 80,
        "maximum_ms": 200
    }
}
```
---

# Gestione errori

Gli errori delle API vengono restituiti in formato JSON con un messaggio descrittivo.

## Esempio errore

```json
{
    "detail": "Monitor non trovato"
}
```

---

# Codici HTTP utilizzati

| Codice HTTP | Significato |
|-------------|-------------|
| 200 OK | Richiesta completata correttamente |
| 201 Created | Risorsa creata correttamente |
| 204 No Content | Operazione completata senza contenuto |
| 400 Bad Request | Richiesta non valida |
| 404 Not Found | Risorsa non trovata |

---

# Struttura generale API

Tutte le API sono esposte sotto il prefisso:

```
/api/
```

Gli endpoint principali disponibili sono:

- `/api/monitors/`
- `/api/monitors/{id}/`
- `/api/monitors/{id}/checks/`
- `/api/monitors/{id}/incidents/`
- `/api/monitors/{id}/uptime/`

---

# Paginazione

Gli endpoint che restituiscono liste utilizzano la paginazione standard DRF.

Parametri disponibili:

- `page`
- `page_size`

Esempio:

```
?page=2&page_size=20
```

La risposta contiene:

- numero totale di risultati
- pagina successiva
- pagina precedente
- risultati della pagina corrente

---
