# Lab 2: Quantify the Dashboard Reads

## 1. Quality Requirements

### Read Latency
* **Measure:** Timpul măsurat de la primirea cererii de citire HTTP la serverul Dashboard-ului până la trimiterea primului octet al răspunsului către Utilizator.
* **Target:** Percentila 95 (p95) a cererilor trebuie să se finalizeze în cel mult 2 secunde. Dacă se atinge limita de 2 secunde, serverul va întrerupe procesarea (timeout) și va returna un rezultat indisponibil rapid (eroare HTTP 503).
* **Operating Condition:** În perioadele aglomerate de trafic concurent.

### Uptime-style Availability
* **Definiție:** Dashboard-ul este utilizabil dacă paginile principale se încarcă fără erori 5xx și afișează date.
* **Ore de tranzacționare:** Luni-Vineri, între 09:30 și 16:00. Într-o lună de 30 de zile (aprox. 22 zile de piață), acestea însumează ~143 de ore.
* **Țintă (ore de tranzacționare):** 99.9% (trei nouari) — Buget de indisponibilitate: ~8.6 minute / lună (0.1% din 143h).
* **Țintă (restul zilei):** 99.0% (doi nouari) — Ore în afara pieței: 720h - 143h = 577 ore. Buget de indisponibilitate: 5.77 ore / lună (aprox. 5 ore și 46 min).
* **Justificare:** În timpul orelor de tranzacționare, investitorii iau decizii imediate, necesitând disponibilitate maximă. În restul timpului, piața fiind închisă, targetul mai relaxat de 99.0% permite mentenanța sistemului.

### Consistency
* **Stock Price:** 
  * *Măsură/Țintă:* Întârzierea așteptată a furnizorului este de 15 minute. **Vechimea maximă acceptată (maximum staleness)** a datelor este de 20 de minute față de timpul real (15 min delay provider + 5 min toleranță internă). Dacă datele depășesc vechimea de 20 de minute, rezultatul devine indisponibil. Datele între 15 și 20 de minute sunt marcate vizibil ca "întârziate".
  * *Condiție:* Funcționare normală a API-ului extern.
* **Watchlist Change:** 
  * *Măsură/Țintă:* Consistență "Read-Your-Writes". Următoarea citire a Watchlist-ului de către același Utilizator, imediat după o modificare, trebuie să afișeze noul status.
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

Pentru a nu număra de două ori traficul stabil, am scăzut rata de acțiuni normale din rata de vârf pentru grupurile care fac refresh. 
* Formula Overview (30% din utilizatori): `Users * 0.30 * (1/10s - 1/30s) = Flux suplimentar`
* Formula Watchlist (60% din grupul de mai sus = 18%): `Users * 0.18 * (1/10s - 1/60s) = Flux suplimentar`

| Calcul la deschiderea pieței | 300 Utilizatori | 3,000 Utilizatori | 30,000 Utilizatori |
| :--- | :--- | :--- | :--- |
| **Trafic stabil de citire** | 79.2 RPS | 792 RPS | 7,920 RPS |
| **Flux suplimentar de reîmprospătare Overview** | `300 * 0.3 * (2/30)` = 6 RPS | `3000 * 0.3 * (2/30)` = 60 RPS | `30000 * 0.3 * (2/30)` = 600 RPS |
| **Flux suplimentar de reîmprospătare Watchlist** | `300 * 0.18 * (5/60)` = 4.5 RPS | `3000 * 0.18 * (5/60)` = 45 RPS | `30000 * 0.18 * (5/60)` = 450 RPS |
| **Subtotal la deschiderea pieței** | 89.7 RPS | 897 RPS | 8,970 RPS |
| **Marjă de capacitate de 10%** | 8.97 RPS | 89.7 RPS | 897 RPS |
| **Țintă rotunjită în sus la deschiderea pieței** | **99 RPS** | **987 RPS** | **9,867 RPS** |

---

## 4. Storage Estimates

### Cercetarea și definirea unui Stock
* **Piețe suportate:** Acțiuni listate pe bursele din SUA (inclusiv companii internaționale cu ADR-uri).
* **Tipuri incluse/excluse:** Doar acțiuni individuale (Common Stocks). Excludem ETF-uri, fonduri mutuale și crypto.
* **Instrumente inactive:** Rămân în baza de date pentru consistența istorică a portofoliilor.
* **Volum:** 5,613 de instrumente financiare.
* **Dovada cercetării:** Sursa datelor este un screener financiar. (Observat Nov 2026).
  ![Stock Screener Evidence](assets/Screenshot%202026-11-04%20120946.png)

### Datele sincronizate
* **Date de referință:** Ticker, Nume, Bursă (necesare pentru căutare). Sincronizate zilnic.
* **Cele mai recente prețuri:** Ticker, Preț, Procentaj schimbare, Timestamp. Sincronizate pe parcursul orelor de piață.
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
| **Debit** | Limita de conexiuni a Load Balancer-ului la deschiderea pieței. | Vârf de 9,867 RPS pe un interval scurt de 10 secunde. | Pachete pierdute sau cereri refuzate pentru toți utilizatorii. | Capacitatea maximă de conexiuni concurente a Ingress-ului. |
| **Disponibilitate** | Downtime-ul Providerului de date externe. | Aplicația depinde strict de datele furnizate de terți. | Neîndeplinirea țintei de 99.9% Uptime în timpul orelor de piață. | Rapoartele SLA istorice ale furnizorului API selectat. |
