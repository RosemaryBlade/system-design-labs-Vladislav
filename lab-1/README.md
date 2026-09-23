# Lab 1: Personal Investment Dashboard - Scopul Inițial al Produsului

## 1. Cercetarea Produsului

Întrebare de cercetare: *Cum ajută produsele existente un utilizator să urmărească informațiile despre piață și ce funcționalități aparțin primei versiuni a acestui Dashboard?*

| Produs | Utilizator probabil și obiectiv | Model reutilizabil (*Reusable pattern*) |
| :--- | :--- | :--- |
| **Google Finance** | **Investitor ocazional / Urmăritor de piață**<br>Obiectiv: Să scaneze rapid indicii bursieri regionali și tendințele pieței folosind carduri sumare, vizuale, pe o temă întunecată. | **Selectie de categorii regionale și carduri de indici cu grafice Sparkline**<br>Navigare pe file pentru regiuni de piață (de ex., „Европа”) care conține carduri compacte de indici (DAX, FTSE 100, CAC 40) cu valori în timp real, modificări absolute/procentuale, săgeți direcționale și mini-grafice de tendință (sparklines). |
| **TradingView** | **Trader activ / Analist de sector**<br>Obiectiv: Să urmărească liste specifice de acțiuni dintr-un sector cu simboluri explicite, prețuri în USD și procente exacte de creștere. | **Rânduri structurate pentru lista de urmărire (Watchlist)**<br>O listă verticală clară care afișează numele complet al companiei, un etichetă cu simbolul bursier (de ex., JAGX, GRML, VKTX), prețul curent în USD și procentele de câștig evidențiate colorat. |

### Dovezi din Cercetare și Impactul asupra Scopului
* **Surse și dovezi:**
  * Captură de ecran Google Finance: `assets/google-finance.png` (Sursă URL: `https://www.google.com/finance/`) - Demonstrează cardurile cu indici ai pieței europene (DAX, FTSE 100, CAC 40, IBEX 35) cu săgeți de direcție, schimbări procentuale și linii de tendință sparkline.
  * Captură de ecran TradingView: `assets/tradingView.png` (Sursă URL: `https://www.tradingview.com/`) - Demonstrează liste de active care afișează numele companiilor, etichete ticker (JAGX, GRML, VKTX, IMCC, INDP, MAZE), prețuri în USD și creșteri procentuale pozitive pronunțate.
* **Decizie de scop confirmată/schimbată de cercetare:** Cercetarea a confirmat că versiunea 1 a Dashboard-ului ar trebui să adopte cardurile cu indici regionali de pe Google Finance pentru vizualizarea sintetică și aspectul de listă cu etichete ticker de pe TradingView pentru activele din lista de urmărire. Instrumentele avansate de analiză tehnică și plasarea directă a ordinelor de tranzacționare au fost excluse explicit pentru a menține un scop restrâns.

---

## 2. Stakeholderi și Actori

### Analiza Stakeholderilor
| Stakeholder | Motivație | Influență | Motiv |
| :--- | :--- | :--- | :--- |
| **Investitor Individual (Utilizator)** | Mare | Mică | Folosește dashboard-ul zilnic pentru urmărirea portofoliului, dar nu poate dicta arhitectura tehnică sau funcționalitățile viitoare. |
| **Product Owner** | Mare | Mare | Definește direcția produsului, limitele scopului, user story-urile și criteriile de acceptanță. |
| **API Provider de Date Financiare** | Mică | Mare | Furnizează prețurile acțiunilor și datele despre indici în timp real; întreruperea sau limitele API-ului afectează direct funcționarea dashboard-ului. |
| **Responsabil Conformitate (Compliance Officer)** | Mică | Mare | Impune notificările legale privind declinarea responsabilității pentru datele de piață și reglementările privind confidențialitatea. |

### Matricea de Angajament
| Motivație | Influență Mică | Influență Mare |
| :--- | :--- | :--- |
| **Mare** | Investitor Individual (Utilizator) | Product Owner |
| **Mică** | — | API Provider de Date Financiare, Responsabil Conformitate |

### Clasificarea Entităților
* **Actor Uman Direct:** Investitorul Individual (interacționează direct cu interfața pentru a gestiona listele de urmărire și a vizualiza portofoliul).
* **Sisteme Externe:** API-ul Providerului de Date Financiare, Serviciul de Autentificare a Utilizatorilor.
* **Alți Stakeholderi:** Product Owner, Responsabilul de Conformitate (nu interacționează direct cu aplicația în timpul urmăririi pieței).

---

## 3. Promisiunea Produsului și Scopul

### Promisiunea Produsului
**Personal Investment Dashboard** ajută **Investitorii Individuali** să rezolve **urmărirea fragmentată a pieței**, astfel încât **să poată vizualiza liste personalizate de urmărire, grafice sparkline pentru indici și valoarea totală a portofoliului într-o singură interfață în timp real**.

### Obiective (Goals)
1. Să permită utilizatorilor să caute, să adauge și să șteargă simboluri bursiere (de ex., JAGX, VKTX) dintr-o listă personalizată de urmărire.
2. Să afișeze carduri sumare cu indicii pieței regionale, cu modificări procentuale zilnice și grafice de tendință sparkline.
3. Să permită utilizatorilor să introducă cantitățile de active deținute pentru a calcula valoarea totală a portofoliului.
4. Să permită utilizatorilor să seteze alerte de preț pentru active specifice.
5. Să ofere autentificare securizată pentru a păstra listele de urmărire între sesiunile utilizatorului.

### Non-Obiective (Non-Goals)
1. Nu va suporta tranzacționarea directă de acțiuni, executarea prin broker sau plasarea de ordine în v1.
2. Nu va oferi sfaturi de investiții automatizate prin AI, recomandări de acțiuni sau raportare fiscală.
3. Nu va suporta conversia valutară multiplă sau integrarea cu portofele de criptomonede în v1.

---

## 4. Cerințe Funcționale

### DASH-1: Urmărirea Activelor din Lista de Urmărire
* **Obiectivul Actorului:** Investitorul trebuie să adauge simboluri bursiere într-o listă de urmărire pentru a monitoriza evoluția prețurilor.
* **User Story:** Ca Investitor, vreau să adaug simboluri bursiere în lista mea de urmărire, astfel încât să pot vedea numele companiilor, etichetele ticker, prețurile live în USD și modificările procentuale.
* **Definitions of Done (Definiția Finalizării):**
  * Afișează numele companiei, eticheta ticker (de ex., VKTX), prețul curent în USD și procentul de schimbare zilnică marcat prin culoare la adăugarea unui activ.
  * Dacă simbolul este invalid sau nesuportat, afișează un mesaj explicit de eroare („Simbolul activului nu a fost găsit”) și păstrează elementele existente neschimbate.
  * Limitează capacitatea maximă a listei de urmărire la 50 de active per profil de utilizator.

### DASH-2: Vizualizarea Evaluării Totalului Portofoliului
* **Obiectivul Actorului:** Investitorul trebuie să calculeze valoarea generală a portofoliului pe baza acțiunilor deținute.
* **User Story:** Ca Investitor, vreau să introduc cantitățile de acțiuni pentru activele mele, astfel încât să pot vizualiza valoarea totală cumulată a portofoliului meu.
* **Definitions of Done (Definiția Finalizării):**
  * Calculează soldul total al portofoliului prin înmulțirea cantităților introduse cu prețurile live din piață în USD.
  * Dacă datele despre preț pentru un activ sunt învechite sau indisponibile, afișează o etichetă „Date Învechite” (Data Stale) lângă sold și păstrează ultima valoare calculată.
  * Restricționează introducerea cantităților de acțiuni doar la valori numerice non-negative.

### DASH-3: Vizualizarea Sumarelor Indicilor Regionali
* **Obiectivul Actorului:** Investitorul trebuie să inspecteze indicii principali ai pieței regionale dintr-o privire.
* **User Story:** Ca Investitor, vreau să văd cardurile indicilor regionali (de ex., DAX, FTSE 100), astfel încât să pot evalua rapid tendințele generale ale pieței prin grafice sparkline.
* **Definitions of Done (Definiția Finalizării):**
  * Afișează valoarea indicelui, modificarea procentuală zilnică cu indicator de direcție și un mini-grafic sparkline.
  * Dacă datele despre tendința indicelui lipsesc sau sunt incomplete, afișează un substituent „Tendință indisponibilă” în interiorul cardului.

### DASH-4: Setarea Alertelor de Preț pentru Active
* **Obiectivul Actorului:** Investitorul trebuie să fie notificat când un activ trece de un preț țintă.
* **User Story:** Ca Investitor, vreau să configurez alerte de preț țintă pentru un simbol bursier, astfel încât să primesc notificări când pragurile pieței sunt depășite.
* **Definitions of Done (Definiția Finalizării):**
  * Afișează marcajele pragurilor de preț active în vizualizarea detaliată a activului.
  * Dacă livrarea alertei eșuează sau lipsesc permisiunile, afișează un aviz în aplicație („Alerte suspendate: Reautorizați notificările”).

### DASH-5: Autentificarea Sesiunii Utilizatorului
* **Obiectivul Actorului:** Investitorul are nevoie de acces securizat la listele de urmărire salvate între sesiuni.
* **User Story:** Ca Investitor, vreau să mă autentific în siguranță, astfel încât lista mea personală și deținerile să rămână salvate și private.
* **Definitions of Done (Definiția Finalizării):**
  * Încarcă lista de urmărire și datele portofoliului salvate după o autentificare reușită.
  * Dacă autentificarea eșuează sau sesiunea expiră, redirecționează către pagina de autentificare cu un mesaj explicit „Sesiune expirată”.

---

## 5. Vizualizarea C4 System Context

### Imaginea Diagramei
![Vizualizare C4 System Context](assets/c4-context.png)

### Codul Sursă Mermaid
flowchart TD
    investor["Investitor Individual\n[Actor Uman Direct]\nMonitorizează listele și portofoliul."]
    
    dashboard["Personal Investment Dashboard\n[Sistem de Interes]\nCentralizează cardurile de indici, listele și evaluarea portofoliului."]
    
    marketApi["API Provider Date Financiare\n[Sistem Extern]\nFurnizează prețuri live, valori indici și date sparkline."]
    
    authService["Provider Autentificare Utilizator\n[Sistem Extern]\nOferă verificarea identității și jetoane de sesiune."]

    investor -->|"Gestionează listele, introduce deținerile, configurează alerte"| dashboard
    dashboard -->|"Solicită cotații live, valori indici și date sparkline"| marketApi
    marketApi -->|"Returnează cotații live, tendințe sparkline sau indicatori de date învechite"| dashboard
    dashboard -->|"Solicită verificarea identității"| authService
    authService -->|"Returnează confirmarea autentificării, profilul sau eroare"| dashboard
