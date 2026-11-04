# Lab 2: Quantify the Dashboard Reads

## 1. Quality Requirements

### Read Latency
* **Measure:** Timpul măsurat de la primirea cererii de citire HTTP la serverul Dashboard-ului până la trimiterea primului octet al răspunsului către Utilizator.
* **Target:** Percentila 95 (p95) a cererilor trebuie să se finalizeze în cel mult 2 secunde. Dacă se atinge limita de 2 secunde, serverul va întrerupe procesarea (timeout) și va returna un rezultat indisponibil rapid (eroare HTTP 503 sau mesaj UI) pentru a elibera resursele.
* **Operating Condition:** În perioadele aglomerate de trafic concurent.

### Uptime-style Availability
* **Definiție:** Dashboard-ul este utilizabil dacă paginile principale se încarcă cu succes (fără erori de server 5xx) și afișează date (chiar dacă sunt marcate ca învechite/stale).
* **Ore de tranzacționare:** Luni-Vineri, între 09:30 și 16:00 (EST - ora bursei americane).
* **Țintă (ore de tranzacționare):** 99.9% (trei nouari) — Buget de indisponibilitate: ~8.6 minute / lună.
* **Țintă (restul zilei):** 99.0% (doi nouari) — Buget de indisponibilitate: ~4.3 ore / lună.
* **Justificare:** În timpul orelor de tranzacționare, investitorii se bazează pe produs pentru decizii imediate, necesitând disponibilitate ridicată. În restul zilei, piața este închisă, permițând ferestre de mentenanță și un target de disponibilitate mai relaxat.

### Consistency
* **Stock Price:** 
  * *Măsură/Țintă:* Întârzierea acceptată este de maximum 15 minute față de timpul real. Dacă datele sunt mai vechi de 15 minute, vor fi marcate ca întârziate (delayed), iar dacă lipsesc, rezultatul devine indisponibil.
  * *Condiție:* Funcționare normală a API-ului extern.
* **Watchlist Change:** 
  * *Măsură/Țintă:* Consistență "Read-Your-Writes". După adăugarea sau ștergerea unui activ, următoarea citire a Watchlist-ului de către același Utilizator trebuie să afișeze imediat modificarea.
  * *Condiție:* Imediat după o operațiune de scriere reușită.

---

## 2. Steady RPS Estimates

**Formula:** `RPS = concurrent Users x participating share x actions per User / seconds`

| Citire | 300 Utilizatori | 3,000 Utilizatori | 30,000 Utilizatori |
| :--- | :--- | :--- | :--- |
| **Overview** (70%, 1/30s) | `300 * 0.70 * 1 / 30` = 7 RPS | `3000 * 0.70 * 1 / 30` = 70 RPS | `30000 * 0.70 * 1 / 30` = 700 RPS |
| **Filter** (50%, 3/60s) | `300 * 0.50 * 3 / 60` = 7.5 RPS | `3000 * 0.50 * 3 / 60` = 75 RPS | `30000 * 0.50 * 3 / 60` = 750 RPS |
| **Stock price** (20%, 1/1s) | `300 * 0.20 * 1 / 1` = 60 RPS | `3000 * 0.20 * 1 / 1` = 600 RPS | `30000 * 0.20 * 1 / 1` = 6000 RPS |
| **History** (20%, 1/300s) | `300 * 0.20 * 1 / 300` = 0.2 RPS | `3000 * 0.20 * 1 / 300` = 2 RPS | `30000 * 0.20 * 1 / 300` = 20 RPS |
| **Watchlist** (60%, 1/60s) | `300 * 0.60 * 1 / 60` = 3 RPS | `3000 * 0.60 * 1 / 60` = 30 RPS | `30000 * 0.60 * 1 / 60` = 300 RPS |
| **Search** (10%, 3/60s) | `300 * 0.10 * 3 / 60` = 1.5 RPS | `3000 * 0.10 * 3 / 60` = 15 RPS | `30000 * 0.10 * 3 / 60` = 150 RPS |
| **Total în regim stabil** | **79.2 RPS** | **792 RPS** | **7,920 RPS** |

---

## 3. Market-open RPS Estimates

Pentru a nu număra dublu traficul stabil de Overview și Watchlist pentru grupul vizat, din fluxul suplimentar s-a scăzut rata acțiunilor normale (`1/30s` și `1/60s`).

| Calcul la deschiderea pieței | 300 Utilizatori | 3,000 Utilizatori | 30,000 Utilizatori |
| :--- | :--- | :--- | :--- |
| **Trafic stabil de citire** | 79.2 RPS | 792 RPS | 7,920 RPS |
| **Flux supl. Overview** <br> `(U * 0.3 * 1/10) - (U * 0.3 * 1/30)` | `9 - 3` = 6 RPS | `90 - 30` = 60 RPS | `900 - 300` = 600 RPS |
| **Flux supl. Watchlist** <br> `(U * 0.18 * 1/10) - (U * 0.18 * 1/60)`| `5.4 - 0.9` = 4.5 RPS | `54 - 9` = 45 RPS | `540 - 90` = 450 RPS |
| **Subtotal la deschiderea pieței** | 89.7 RPS | 897 RPS | 8,970 RPS |
| **Marjă de capacitate de 10%** | 8.97 RPS | 89.7 RPS | 897 RPS |
| **Țintă rotunjită în sus** | **99 RPS** | **987 RPS** | **9,867 RPS** |

---

## 4. Storage Estimates

### Cercetarea și definirea unui Stock
* **Piețe suportate:** Acțiuni listate pe bursele din SUA (inclusiv companii internaționale cu ADR-uri).
* **Tipuri incluse/excluse:** Doar acțiuni individuale (Common Stocks / ADRs). Excludem ETF-uri, fonduri mutuale și crypto.
* **Instrumente inactive:** Rămân în baza de date pentru consistența istorică a portofoliilor, dar nu primesc actualizări.
* **Volum:** 5,613 de instrumente financiare.
* **Dovada cercetării:** Sursa datelor este un screener financiar. (Observat Nov 2026).
  ![Stock Screener Evidence](assets/Screenshot%202026-11-04%20120946.png)

### Datele sincronizate
* **Date de referință:** Ticker, Nume, Bursă, Țară (necesare pentru căutare și filtrare). Sincronizate zilnic.
* **Cele mai recente prețuri:** Ticker, Preț, Procentaj schimbare, Timestamp. Sincronizate pe parcursul orelor de tranzacționare.
* **Price history:** Păstrat la intervale de 5 minute (aprox. 78 de puncte/zi pe o durată de piață de 6.5 ore). Perioada de reținere: 1 an (252 de zile de tranzacționare).

### Calculul stocării

| Set de date | Decizia despre produs și perioada de păstrare | Calculul numărului de înregistrări | Octeți per înregistrare | Stocare brută |
| :--- | :--- | :--- | :--- | :--- |
| **Date referință** | 5,613 acțiuni. | 5,613 | 100 B | ~0.56 MB |
| **Prețuri recente** | Ultimul preț pentru 5,613 acțiuni. | 5,613 | 50 B | ~0.28 MB |
| **Price history** | Puncte la 5 min (78/zi), reținute 1 an (252 zile). | `5,613 * 78 * 252` = 110,329,128 | 30 B | ~3.31 GB |
| **Total** | | **110,340,354** | | **~3.31 GB** |

---

## 5. Potential Bottlenecks

| Calitate | Posibil blocaj | Dovezi din acest laborator | Efect posibil | Ce trebuie măsurat în continuare |
| :--- | :--- | :--- | :--- | :--- |
| **Latență** | Limitele de cereri (Rate Limits) ale Providerului API. | 6,000 RPS doar pentru prețuri la 30k utilizatori. | Cererile HTTP vor depăși pragul de 2 secunde sau vor da timeout. | Timpul de răspuns al API-ului extern sub sarcină. |
| **Consistență** | Replicarea lentă a bazei de date (Replication lag). | Regula impune consistență "Read-Your-Writes" pentru Watchlist. | Utilizatorul adaugă o acțiune, dar nu apare imediat la reîncărcare. | Timpul de sincronizare între nodurile Master și Read-Replica. |
| **Debit (Throughput)** | Limita de conexiuni a Load Balancer-ului / Ingress la deschiderea pieței. | Vârf de 9,867 RPS pe un interval scurt de 10 secunde. | Pachete pierdute sau cereri refuzate pentru toți utilizatorii. | Capacitatea maximă de conexiuni concurente a Load Balancer-ului. |
| **Disponibilitate** | Downtime-ul Providerului de date externe. | Aplicația depinde strict de datele furnizate de terți. | Neîndeplinirea țintei de 99.9% Uptime în timpul orelor de piață. | Rapoartele SLA istorice ale furnizorului API selectat. |
