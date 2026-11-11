<p align="center"><img src="static/icon.svg" alt="Stax" width="96" height="96"></p>

<h1 align="center">Stax</h1>

<p align="center"><strong>Budgetteren met potten.</strong><br>
Je geld verdelen over budgetten en spaarpotten, zonder koppeling met je bank. Op je eigen server of alleen op je iPhone.</p>

> **English:** Stax is a self-hosted household budgeting app (web + native iOS). You import your own bank exports
> (ISO 20022 camt.053 or CSV), divide money over budgets and savings pots, and keep full control of your data: run it on your own
> server, or use the iPhone app standalone with all data on the device. The interface is currently Dutch only.

## Wat is Stax

- **Alles is een budget.** Groepen met budgetten erin; een budget begint elke maand opnieuw of spaart door (spaarpot of doel met bedrag en datum).
- **Geen bankkoppeling.** Je haalt zelf een export uit je bank en leest die in. Stax deelt boekingen zo veel mogelijk zelf in met regels die het van je leert.
- **Spaarrekening en betaalrekening samen.** Spaarpotten tellen altijd op tot het saldo van de spaarrekening; uitgaven uit een pot, terugbetalingen en overboekingen tussen eigen rekeningen worden herkend.
- **Banken:** camt.053 (XML, zoals ASN en veel Nederlandse banken) en CSV. Bij CSV herken je de kolommen met een voorbeeld uit je eigen bestand en pas je ze zo nodig aan.
- **Van jou.** Een back-up is één bestand dat werkt op de server én in de app.

## Twee manieren om Stax te gebruiken

| | Alleen op je iPhone | Eigen server |
|---|---|---|
| Waar staan je gegevens | Op je telefoon | Op jouw server |
| Samen met een partner | Nee | Ja, dezelfde gegevens op web en app |
| Wat heb je nodig | De iOS-app | Docker en een domein (HTTPS) |

## Snel starten: eigen server

Je hebt Docker nodig. Stax luistert op `127.0.0.1:3000`; zet er voor HTTPS een reverse proxy of tunnel voor.

```sh
git clone https://github.com/Kristianvanderlinde/stax-app.git && cd stax-app
ORIGIN=https://stax.jouwdomein.nl docker compose up -d --build
docker compose logs stax        # hier staat de installatiecode
```

1. Open `/setup` op je adres en vul de installatiecode uit de log in. Zo kan niemand anders via internet het eerste account aanmaken.
2. Kies een naam en wachtwoord (minstens 12 tekens) en koppel een authenticator-app met de QR-code. Inloggen vraagt altijd naam, wachtwoord en een 6-cijferige code.
3. Na 5 mislukte pogingen per kwartier blokkeert Stax dat IP-adres tijdelijk.

De gegevens staan in `./data` (SQLite) en blijven bij elke update staan. Een andere map zet je met `STAX_DATA_DIR` en een andere poort met `STAX_PORT`. Voor een snelle proef zonder HTTPS gebruik je `ORIGIN=http://localhost:3000`.

Een nieuwe versie installeer je met `git pull` en daarna opnieuw `docker compose up -d --build`.

## De iOS-app

Een native SwiftUI-app (iOS 17+) in `ios/`, met twee keuzes bij de eerste start: verbinden met je server, of lokaal op je telefoon werken. Je gebouwde app gebruikt je eigen Apple-team:

1. Open `ios/Stax.xcodeproj` in Xcode.
2. Kies bij *Signing & Capabilities* je eigen team en pas zo nodig het *Bundle Identifier* aan (`app.stax.finance` is het standaard).
3. Bouw en start op je telefoon of in de simulator.

**Lokaal werken** draait dezelfde rekenkern als de server, ingebouwd in de app (JavaScriptCore) met SQLite op de telefoon. Dat bestand `ios/Stax/Core/core.js` wordt gemaakt met `npm run core:build` en moet bij elke wijziging in `src/lib/server` of de API-routes opnieuw gebouwd en gecommit worden (de CI controleert dat).

## Back-up

Instellingen → Back-up, op het web en in de app. Eén bestand (JSON) met al je gegevens, zonder inloggegevens. Terugzetten vervangt alles na een bevestiging en werkt tussen server en app. Maak vooral in lokale modus regelmatig een back-up: verwijder je de app, dan zijn je gegevens weg.

## Privacy

Stax is gemaakt om je financiële gegevens bij jou te laten.

- **Geen bankkoppeling.** Stax maakt geen verbinding met banken. Je leest zelf exportbestanden in.
- **Geen account bij ons.** Er bestaat geen Stax-cloud en de ontwikkelaar heeft geen toegang tot je gegevens.
- **Lokale modus.** Alle gegevens staan in een database in de opslag van de app op je telefoon en worden nergens heen gestuurd. Ze kunnen onderdeel zijn van de gewone iPhone-back-up van je telefoon. Verwijder je de app, dan zijn ze weg, tenzij je een back-up hebt gemaakt.
- **Servermodus.** De app praat alleen met het serveradres dat jij invult. De gegevens staan op de server die jij beheert; zorg dat die via HTTPS bereikbaar is. De app bewaart een eigen toegangssleutel voor die server in de iOS-sleutelhanger en je kunt telefoons intrekken bij Instellingen → Account.
- **Geen analyse, advertenties of trackers.** De app en de website bevatten geen analyse-, advertentie- of trackingcode en laden niets van derden.
- **Face ID.** De optie "Openen met Face ID" wordt door iOS afgehandeld. Stax ontvangt of bewaart geen biometrische gegevens.
- **Back-upbestanden** bevatten je hele administratie. Bewaar ze op een veilige plek.

Vragen of iets onduidelijk? Open een *issue* in deze repository. Wijzigingen in dit beleid staan in de geschiedenis van dit bestand.

## Lokaal ontwikkelen

Node 24 of nieuwer.

```sh
npm install
npm run dev          # http://localhost:5173, zonder inloggen
npm run check        # typecontrole
npm run demodata     # verzonnen gegevens in data-test/ (eerst één keer npm run dev:test starten om de database aan te maken)
npm run dev:test     # testomgeving op http://localhost:5181
npm run core:test    # rekenkern voor de app bouwen en testen
```

De database staat in `data/stax.db` (SQLite, ingebouwd in Node). Een andere map zet je met `STAX_DATA=/pad`. Weggooien van `data/` is opnieuw beginnen; de startindeling wordt dan opnieuw aangemaakt. Wil je het inloggen lokaal testen, start dan met `STAX_AUTH=on npm run dev`.

## Hoe het werkt

- **Alles is een budget.** In de interface is er één term: *budget*. Er is één boom voor uitgaven en
  één voor inkomsten. Een budget begint elke maand opnieuw (gebudgetteerd naast uitgegeven; zonder
  bedrag = alleen bijhouden). Opties: **spaart** (saldo loopt door: inleg erbij, uitgaven eraf) en
  **doel** (doelbedrag en eventueel datum; dan spaart het altijd). In de code heet een budget dat
  spaart nog `pot` (`behavior = 'pot'`, soorten `spaarpot`/`doelpot`). Een budget dat spaart staat op
  de spaarrekening (inleg via overboeking) of op de betaalrekening (maandbedrag komt er vanzelf bij). Elk budget heeft zijn eigen soort; alleen het icoon wordt overgenomen van de groep.
- **Twee niveaus** (sinds migratie v9): bij uitgaven staat op het hoogste niveau alleen een **groep**, met
  budgetten erin; bij inkomsten alleen budgetten. Geen groepen in groepen. Een groep telt alleen op en
  heeft zelf geen boekingen, bedrag, regels of soort; een lege groep is ook een groep. Een groep met
  budgetten kan niet weg. (Migratie v7 zette wat op groepen stond in een subbudget "Algemeen"; dat is een
  gewoon budget. Migratie v9 maakte van subgroepen eigen groepen.)
- **Instellen gebeurt alleen in Instellingen → Budgetten**: groepen en budgetten aanmaken, slepen voor
  volgorde en groep, en een zijpaneel (`?bewerk=<id>`) voor naam, icoon, opties en groep. Het bedrag per
  maand is planning en pas je aan in het budgetoverzicht of op de detailpagina.
- **Bladeren**: onderaan zweeft een balk (`PeriodBar`) om van maand te wisselen; op een detailpagina ook
  door de budgetten (vorige/volgende, kiezer, pijltjestoetsen), in de volgorde van het overzicht.
- **Bedragen**: prominente bedragen (rekeningen, tegels, kaarten) met euroteken: `€ −12,34`
  (`money()`); in lijsten zonder euroteken: `−12,34` (`amount()`), beide in `src/lib/format.ts`.
- **Iconen**: Google Material Symbols (rounded, filled), een selectie met Nederlandse zoekwoorden in
  `src/lib/material-icons.ts`. Opnieuw maken met `scripts/material-iconen.mjs`.
- **Boekingen** worden ingedeeld met één of meer splitsingen (`splits`). Een terugbetaling
  (Tikkie) deel je in bij dezelfde map als de uitgave; dan verlaagt hij de uitgave.
- **Teruggaven**: bij een uitgave vink je aan dat je geld terugverwacht (`refund_expected`). Komt
  het binnen, dan koppel je die boeking eraan (`refund_of`); hij krijgt dan dezelfde indeling als
  de uitgave en loopt mee als die verandert. Overzicht via "Terug verwacht" bij Boekingen.
- **Overboekingen** tussen eigen rekeningen worden herkend aan het rekeningnummer. De betaalkant
  hoeft niet ingedeeld en telt niet als uitgave.
- **De spaarrekening is de waarheid.** Elke boeking op de spaarrekening (inleg, opname, rente) hoort
  bij een spaarpot, anders staat hij bij "nog indelen". Een spaarpot gaat alleen omhoog of omlaag
  door boekingen op de spaarrekening, dus het totaal van de spaarpotten is altijd het banksaldo.
  Inleg wordt automatisch aan een pot gekoppeld als de omschrijving op de potnaam lijkt.
- **Verwacht inkomen:** per inkomstenbron een bedrag per maand (zelfde tabel `budgets`, dus ook
  "vanaf" of "alleen deze maand"). "Over" is verwacht inkomen min gebudgetteerd, zodat je
  aan het begin van de maand kunt plannen; na de upload vergelijk je ontvangen met verwacht. Is er
  niets verwacht, dan rekent het met wat er binnenkwam.
- **Inkomsten op de spaarrekening** (rente): mogen bij een inkomstencategorie; het geld telt dan
  mee in de inkomstenpot (instelling `inkomstenpot`, standaard Vrij sparen, te kiezen bij Startsaldo).
- **Uitgave uit een spaarpot** (van de betaalrekening, "uit de pot halen"): de pot zakt nog niet,
  maar krijgt "nog op te nemen". Koppel je de opname van de spaarrekening aan de pot, dan zakt hij;
  het indeelvenster stelt die potten voor. Zo telt niets dubbel.
- **Potsaldo** = startsaldo op de startdatum + alle boekingen op de spaarrekening in die pot daarna.
  Een pot op de betaalrekening: startsaldo + maandbedragen − uitgaven uit de pot.
- **Doel met datum**: Stax rekent lineair van het startsaldo naar het doel en laat zien of de pot
  voor of achter loopt en hoeveel er per maand nog bij moet.
- **Regels** delen nieuwe boekingen automatisch in: rekeningnummer › tegenpartij › omschrijving ›
  winkelsoort (MCC). Ze ontstaan vanzelf bij het indelen ("voortaan zo indelen").

## Code

| Pad | Wat |
|---|---|
| `src/lib/server/db.ts` | Database, migraties (alleen nieuwe toevoegen), instellingen |
| `src/lib/server/seed.ts` | Startindeling (uit Actual Budget) en MCC-regels |
| `src/lib/server/camt.ts` | Inlezen van camt.053 |
| `src/lib/server/importer.ts` | Import, dubbele boekingen, overboekingen koppelen |
| `src/lib/server/categorize.ts` | Regels en automatisch indelen |
| `src/lib/server/reports.ts` | `Ledger`: maandcijfers, budgetten, potten, doelen, saldi |
| `src/lib/components/` | Iconen, kaarten voor potten en budgetten, grafiek, mappenkiezer |
| `src/lib/server/maps.ts` | Budgetten en groepen aanmaken, bewerken, verwijderen |
| `src/lib/server/budgets.ts` | Budget per maand: sjabloon ('vanaf') en afwijking ('alleen') |
| `src/routes/` | Budgetoverzicht, sparen (`/sparen`), detailpagina per budget (`map/[id]`, ook bewerken), boekingen, upload, instellingen |
| `src/lib/server/csv.ts`, `bankfile.ts` | CSV-import met kolomherkenning en voorbeeld |
| `src/lib/server/backup.ts` | Back-up maken en terugzetten (één JSON-bestand) |
| `core/` | Bundelt de API-routes tot `ios/Stax/Core/core.js`, de rekenkern van de app (JavaScriptCore) |
| `ios/` | De SwiftUI-app |

## Licentie

Stax is vrije software onder de [GNU Affero General Public License v3.0](LICENSE). Je mag het gebruiken, aanpassen en delen; wie een aangepaste versie als dienst aanbiedt, moet de broncode van die versie beschikbaar stellen.

Copyright © 2026 Kristian van der Linde.
