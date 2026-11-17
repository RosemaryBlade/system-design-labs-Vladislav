# Lab 3: Limita Dashboard-ului — arhitectura de bază

Acest laborator descrie arhitectura de bază a **Personal Investment Dashboard** prin trei view-uri C4 (System Context, Container, Component) și verifică proiectarea cu trei diagrame de secvență.

**Date preluate din laboratoarele anterioare:**

* Utilizatorul autentificat răsfoiește și filtrează Stock-uri, citește prețuri și istoric și administrează un Watchlist privat (maximum 50 de Stock-uri, Lab 1, DASH-1).
* Furnizorul de date de piață are o întârziere de 15 minute. Vechimea maximă acceptată a unui preț este de **20 de minute** (15 minute întârziere + 5 minute toleranță internă). Între 15 și 20 de minute prețul este marcat „întârziat”, iar peste 20 de minute rezultatul este „indisponibil” (Lab 2).
* Latența citirilor: p95 ≤ 2 secunde. La depășirea termenului, serverul returnează rapid `503` (Lab 2).
* Watchlist: consistență „Read-Your-Writes” pentru același Utilizator (Lab 2).
* Volum (3,000 Utilizatori): 792 RPS în regim stabil și 987 RPS la deschiderea pieței; 600 RPS sunt citiri de preț (Lab 2).

**Decizie nouă față de Lab 1:** citirile Utilizatorilor **nu** mai solicită direct furnizorul. Datele de piață sunt aduse de un **Market Data Collector** separat, care validează și salvează datele acceptate, iar Dashboard-ul citește doar datele stocate (exemplul din Lecția 4).

---

## 1. Diagrama System Context

```mermaid
flowchart TB
    user["Utilizator autentificat<br/>[Persoană]<br/>Răsfoiește Stock-uri, citește prețuri și istoric,<br/>administrează un Watchlist privat"]

    dashboard["Personal Investment Dashboard<br/>[Sistem software]<br/>Afișează date de piață întârziate și<br/>Watchlist-ul privat al Utilizatorului"]

    provider["Market Data Provider<br/>[Sistem extern]<br/>Furnizează prețuri întârziate și istoric.<br/>Poate returna date invalide, poate limita<br/>cererile sau poate fi indisponibil"]

    idp["Identity Provider<br/>[Sistem extern]<br/>Autentifică Utilizatorul și emite<br/>token-uri de acces"]

    user -->|"Folosește prin browser (HTTPS)"| dashboard
    user -->|"Se autentifică (OAuth 2.0 / OIDC)"| idp
    dashboard -->|"Verifică token-urile de acces (chei publice JWKS)"| idp
    dashboard -->|"Cere prețuri și istoric cu cheia API a serverului (HTTPS)"| provider
```

Limita sistemului conține tot ce operăm noi. Utilizatorul se autentifică la Identity Provider, iar Dashboard-ul verifică doar token-ul primit. Cheia API a furnizorului nu ajunge niciodată în browser.

---

## 2. Diagrama Container

```mermaid
flowchart TB
    user["Utilizator autentificat<br/>[Persoană]"]
    idp["Identity Provider<br/>[Sistem extern]"]
    provider["Market Data Provider<br/>[Sistem extern]"]

    subgraph system["Personal Investment Dashboard"]
        web["Web App<br/>[Container: SPA în browser]<br/>Afișează Stock-uri, prețuri, istoric<br/>și Watchlist-ul"]
        app["Dashboard Application<br/>[Container: API server]<br/>Verifică identitatea și datele de intrare,<br/>servește citirile și modificările Watchlist"]
        collector["Market Data Collector<br/>[Container: proces în fundal]<br/>Sincronizează, validează și salvează<br/>datele furnizorului"]
        marketdb[("Market Data Store<br/>[Container: bază de date]<br/>Stock-uri, ultimele prețuri acceptate,<br/>istoric, progresul sincronizării")]
        userdb[("Watchlist Store<br/>[Container: bază de date]<br/>Watchlist-urile private, cheia este<br/>ID-ul Utilizatorului")]
    end

    user -->|"Folosește (HTTPS)"| web
    web -->|"Apelează API JSON cu token Bearer (HTTPS)"| app
    app -->|"Verifică semnătura token-ului (JWKS)"| idp
    app -->|"Citește Stock-uri, prețuri și istoric (SQL)"| marketdb
    app -->|"Citește și modifică Watchlist-ul Utilizatorului (SQL)"| userdb
    app -->|"Cere sincronizare pentru date lipsă sau prea vechi, cu termen-limită"| collector
    collector -->|"Cere date cu cheia API a serverului (HTTPS)"| provider
    collector -->|"Salvează datele acceptate și progresul (SQL)"| marketdb
```

| Container | Responsabilitate |
| :--- | :--- |
| **Web App** | Interfața din browser. Nu păstrează date de piață sau credențiale ale furnizorului. |
| **Dashboard Application** | Singurul punct de intrare pentru Utilizator: verifică token-ul, validează datele de intrare, citește datele acceptate și aplică regulile de actualitate (15/20 min). |
| **Market Data Collector** | Singurul container care vorbește cu furnizorul. Validează înregistrările înainte de salvare și limitează cererile la cota furnizorului. |
| **Market Data Store** | Sursa durabilă pentru datele de piață acceptate și momentele furnizorului (`provider_time`). |
| **Watchlist Store** | Sursa durabilă pentru datele private ale Utilizatorilor. Este separat de datele de piață, deoarece are alt model de acces (scrieri ale Utilizatorilor, Read-Your-Writes). |

Acesta este cel mai mic set de containere care separă citirile Utilizatorilor de sincronizarea cu furnizorul. Cache-ul și replicile sunt adăugate abia în Laboratorul 4.

---

## 3. Diagrama Component — Dashboard Application

```mermaid
flowchart TB
    web["Web App<br/>[Container]"]
    idp["Identity Provider<br/>[Sistem extern]"]
    collector["Market Data Collector<br/>[Container]"]
    marketdb[("Market Data Store<br/>[Container]")]
    userdb[("Watchlist Store<br/>[Container]")]

    subgraph app["Dashboard Application"]
        router["API Router<br/>[Componentă]<br/>Rutează cererile HTTP<br/>și formatează erorile"]
        auth["Auth Guard<br/>[Componentă]<br/>Verifică token-ul și extrage<br/>ID-ul Utilizatorului"]
        validator["Request Validator<br/>[Componentă]<br/>Verifică simboluri, filtre,<br/>intervale și dimensiunea paginii"]
        market["Market Data Service<br/>[Componentă]<br/>Citește prețuri și istoric, aplică<br/>regula de actualitate 15/20 min"]
        catalog["Stock Catalog Service<br/>[Componentă]<br/>Răsfoire, filtrare și căutare<br/>după nume sau simbol"]
        watch["Watchlist Service<br/>[Componentă]<br/>Citește și modifică Watchlist-ul,<br/>verifică proprietarul și limita de 50"]
        syncclient["Collector Client<br/>[Componentă]<br/>Cere sincronizare cu termen-limită"]
    end

    web -->|"Cereri HTTP JSON"| router
    router -->|"Verifică token-ul"| auth
    auth -->|"Descarcă cheile publice (JWKS)"| idp
    router -->|"Validează parametrii"| validator
    router -->|"Citiri de preț și istoric"| market
    router -->|"Listă, filtre, căutare"| catalog
    router -->|"Citiri și modificări Watchlist"| watch
    market -->|"Citește prețuri și provider_time"| marketdb
    catalog -->|"Citește catalogul de Stock-uri"| marketdb
    watch -->|"Citește și scrie elementele Utilizatorului"| userdb
    watch -->|"Verifică existența simbolului"| catalog
    market -->|"Date lipsă sau mai vechi de 20 min"| syncclient
    syncclient -->|"Cere sincronizare, așteaptă cel mult termenul"| collector
```

Toate componentele aparțin aceluiași proces Dashboard Application. Ele nu sunt servicii separate.

---

## 4. Diagrame de secvență

Participanții folosesc aceleași nume ca în view-urile de arhitectură. Market Data Collector este desenat ca un singur participant; detaliile lui interne urmează exemplul din Lecția 4.

### A. Sincronizează datele de piață

```mermaid
sequenceDiagram
    autonumber
    participant Sched as Programator (cron, la 5 min)
    participant App as Dashboard Application
    participant Col as Market Data Collector
    participant Prov as Market Data Provider
    participant Store as Market Data Store

    alt Declanșare programată în orele de piață
        Sched->>Col: Pornește sincronizarea pentru lotul de prețuri
    else Declanșare la cerere
        App->>Col: Cere sincronizare pentru AAPL, termen 1.5 s
    end
    Col->>Store: Citește progresul și ultimul provider_time
    Store-->>Col: Progres și provider_time 09:44
    Col->>Prov: GET quotes cu cheia API a serverului
    alt Răspuns valid
        Prov-->>Col: Prețuri cu provider_time 09:45
        Col->>Col: Validează simbol, preț mai mare ca 0, provider_time mai nou
        Col->>Store: Salvează prețurile acceptate și progresul într-o tranzacție
        Store-->>Col: Salvare confirmată
        Note over Col,Store: Abia acum datele sunt disponibile pentru citiri
        Col-->>App: Sincronizare reușită, date noi salvate
    else Date invalide
        Prov-->>Col: Preț negativ sau simbol necunoscut
        Col->>Col: Respinge înregistrările invalide
        Col->>Store: Salvează doar progresul și eroarea de validare
        Col-->>App: Sincronizare eșuată, datele vechi rămân
    else Timeout sau 429 Too Many Requests
        Prov-->>Col: Niciun răspuns în 5 s sau 429 cu Retry-After
        Col->>Store: Salvează următorul moment permis pentru reîncercare
        Col-->>App: Furnizor indisponibil, datele vechi rămân
    end
```

**Ipoteze inițiale:**

* Sincronizarea programată rulează la fiecare 5 minute în orele de piață, iar sincronizarea la cerere este folosită doar pentru date lipsă sau mai vechi de 20 de minute.
* Cheia API a furnizorului se află doar în Market Data Collector, pe server.
* O singură sincronizare activă pentru fiecare cheie (furnizor, set de date, lot); cererile pentru aceeași cheie se alătură sincronizării existente.
* **La eșec, datele acceptate anterior nu sunt șterse și nu sunt suprascrise.** Ele rămân disponibile, iar Dashboard-ul le marchează ca „întârziate” sau „indisponibile” după vârsta lor.

### B. Citește prețul unui Stock

```mermaid
sequenceDiagram
    autonumber
    actor User as Utilizator
    participant Web as Web App
    participant App as Dashboard Application
    participant Store as Market Data Store
    participant Col as Market Data Collector

    User->>Web: Deschide pagina AAPL
    Web->>App: GET /v1/stocks/AAPL/price cu Bearer token
    App->>App: Verifică token-ul și formatul simbolului
    alt Token invalid sau expirat
        App-->>Web: 401 Unauthorized
        Web-->>User: Sesiune expirată, autentificare necesară
    else Simbol invalid
        App-->>Web: 400 invalid_symbol
        Web-->>User: Simbol invalid
    else Date de intrare valide
        App->>Store: Citește ultimul preț acceptat pentru AAPL
        alt Preț găsit, vechime sub 15 min
            Store-->>App: 189.30 USD, provider_time 09:45
            App-->>Web: 200 cu price și providerTime
            Web-->>User: Preț afișat normal
        else Preț găsit, vechime între 15 și 20 min
            Store-->>App: 189.10 USD, provider_time 09:28
            App-->>Web: 200 cu price și delayed true
            Web-->>User: Preț afișat cu eticheta Întârziat
        else Preț lipsă sau mai vechi de 20 min
            Store-->>App: Niciun preț acceptabil
            App->>Col: Cere sincronizare, termen 1.5 s
            alt Sincronizarea salvează date noi la timp
                Col-->>App: Date salvate
                App->>Store: Recitește prețul
                Store-->>App: 189.30 USD, provider_time 09:45
                App-->>Web: 200 cu prețul nou
                Web-->>User: Preț afișat
            else Termenul expiră sau furnizorul eșuează
                Col-->>App: Indisponibil
                App-->>Web: 503 price_unavailable
                Web-->>User: Preț indisponibil, reîncercați
            end
        else Defectare a stocării
            Store-->>App: Eroare de conexiune
            App-->>Web: 503 storage_unavailable
            Web-->>User: Date temporar indisponibile
        end
    end
```

**Ipoteze inițiale:**

* **O citire obișnuită a Utilizatorului nu face o cerere nouă către furnizor.** Dashboard-ul citește datele acceptate din Market Data Store. Doar un preț lipsă sau mai vechi de 20 de minute declanșează o cerere de sincronizare către Collector, nu direct către furnizor.
* Termenul de 1.5 secunde pentru sincronizare păstrează ținta p95 ≤ 2 s.
* O defectare a stocării nu este tratată ca un preț lipsă: răspunsul este `503`, fără a încerca furnizorul.

### C. Modifică un Watchlist privat

```mermaid
sequenceDiagram
    autonumber
    actor User as Utilizator
    participant Web as Web App
    participant App as Dashboard Application
    participant WStore as Watchlist Store
    participant Store as Market Data Store

    User->>Web: Apasă Adaugă TSLA în Watchlist
    Web->>App: POST /v1/me/watchlist/items cu symbol TSLA și Bearer token
    App->>App: Verifică token-ul și extrage userId din token
    alt Token lipsă sau invalid
        App-->>Web: 401 Unauthorized
        Web-->>User: Autentificare necesară
    else Cerere pentru Watchlist-ul altui Utilizator
        Note over App: Proprietarul vine doar din token, nu din URL sau corp
        App-->>Web: 404 watchlist_not_found
        Web-->>User: Watchlist inexistent
    else Simbol invalid sau limita de 50 atinsă
        App-->>Web: 400 invalid_symbol sau watchlist_full
        Web-->>User: Mesaj de eroare, lista rămâne neschimbată
    else Cerere validă
        App->>Store: Verifică dacă TSLA există în catalog
        Store-->>App: TSLA există
        App->>WStore: Inserează userId și TSLA, idempotent
        alt Scriere reușită
            WStore-->>App: Commit confirmat
            Note over App,WStore: Punctul în care succesul poate fi raportat
            App-->>Web: 201 cu elementul adăugat
            Web-->>User: TSLA apare în Watchlist
        else Defectare a stocării
            WStore-->>App: Eroare sau timeout
            App-->>Web: 503 storage_unavailable
            Web-->>User: Modificarea nu a fost salvată, reîncercați
        end
    end
    User->>Web: Reîncarcă Watchlist-ul
    Web->>App: GET /v1/me/watchlist
    App->>WStore: Citește din nodul lider, pentru userId
    WStore-->>App: Lista include TSLA
    App-->>Web: 200 cu lista actualizată
```

**Ipoteze inițiale:**

* ID-ul proprietarului este luat **doar** din token. O încercare de a accesa Watchlist-ul altui Utilizator primește `404`, ca să nu dezvăluie existența lui.
* Succesul se raportează numai după confirmarea commit-ului în Watchlist Store.
* **Următoarea citire a aceluiași Utilizator trebuie să arate TSLA** (Read-Your-Writes, Lab 2). Citirile Watchlist folosesc nodul lider, nu o replică întârziată.
* Dacă scrierea eșuează, Watchlist-ul rămâne neschimbat și Utilizatorul vede că modificarea nu a fost salvată.

---

## Listă de verificare

- [x] Am inclus o diagramă System Context, una Container și una Component.
- [x] Am inclus cele trei diagrame de secvență cerute.
- [x] Toate cele șase blocuri Mermaid se afișează fără erori.
- [x] Diagrama Component deschide numai Dashboard Application.
- [x] Fluxurile mele arată rezultate normale, acțiuni respinse și rezultate în caz de defectare.
- [x] Proiectarea acoperă citirile normale, datele private, preluarea datelor de la furnizor și defectările.
