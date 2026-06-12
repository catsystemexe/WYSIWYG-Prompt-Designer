# NÁVRH rekonstrukce — sluzbyhorolezcu.cz (Fáze 2)

Navazuje na `AUDIT.md`. Tento dokument je plán — žádný kód se ve Fázi 2 nestaví.

---

## 1) Stack

- **Čisté HTML + CSS + jeden malý vanilla JS soubor** (`fx.js`) výhradně pro FX.
- Žádný framework, žádný build step, žádné externí závislosti (ani CDN fonty —
  systémový font stack, případně jeden self-hostovaný variabilní font).
- Výstup = **jeden `index.html`** + `style.css` + `fx.js` + složka `img/`
  (optimalizované obrázky z `_zdroj/assets/`).
- Rozpočet: HTML < 25 kB, CSS < 15 kB, JS < 3 kB (vše před gzipem); obrázky
  WebP s JPEG/PNG fallbackem jen kde nutno.
- Nahrazuje WordPress → odpadá celý balast z auditu A7/D5 (4 měřicí pluginy,
  emoji loader, lightbox, xmlrpc, generator leak).

## 2) Struktura sekcí

Obsah ~identický s originálem, přepsaný bez keyword stuffingu (audit A3) a bez
formátovacích artefaktů (audit C2). Sémantická kostra (GEO rovina b):

```
<header>  … sticky lišta: logo (VP-Anděl-ico), kotvy, tel. CTA
<main>
  <section id="hero">     H1 + podtitul + 2 CTA (zavolat / e-mail)
                           pozadí: vyskove-prace.jpg s tmavým overlayem (audit D2)
  <section id="sluzby">   karty služeb: natěračské · zednické · svářečské ·
                           telekomunikační a elektromontážní · údržba budov ·
                           čištění fasád a oken · instalace/demontáže
                           (vše převzato z původního textu, řádky 189, 194, 200)
  <section id="proc-my">  3–4 krátká fakta: odborná způsobilost, moderní
                           technika, konzultace zdarma, místa nedostupná
                           plošinou (stěny, nádrže, komíny, stožáry, mosty)
  <section id="faq">      4–6 otázek, FAQPage JSON-LD (viz 5b)
  <section id="kontakt">  obě tel. čísla (tel:), e-mail (mailto:),
                           oblast působení, IČO, soc. profily
</main>
<footer>  identifikace firmy (jméno, IČO, působnost), © rok,
          odkazy na FB / IG / YouTube z původního schema sameAs
```

Jediný H1 (v hero), viditelný — ruší se skrývací CSS z auditu A4. Hierarchie
H1 → H2 (sekce) → H3 (karty/FAQ otázky).

## 3) Checklist oprav oproti originálu

| ✓ | Oprava | Audit |
|---|---|---|
| ☐ | `<title>`: `Výškové práce horolezeckou technikou – [LOKALITA] \| Výškové práce Anděl` (bez emoji, bez duplikace fráze) | A6 |
| ☐ | `og:title` = skutečný titulek (dnes URL Facebooku) | A1 |
| ☐ | `og:image` + všechny URL na **https** (resp. relativní cesty) | B1 |
| ☐ | **+420 608 800 618** i **+420 722 093 256** zachovat, každé jako `<a href="tel:+420…">`, jednotný formát s mezerami, popisek role | C1, D1 |
| ☐ | e-mail jako `<a href="mailto:…">` (bez `target="_blank"`) | D4 |
| ☐ | JSON-LD `LocalBusiness` (název, oba telefony, e-mail, areaServed, url, IČO — viz otázky) | A5, E2 |
| ☐ | text vyčistit: „n/abízíme", „p/oskytneme", „-Zajistíme", „za pomocí"→„za pomoci", „postarat **se o** Vaše potřeby", „ve mnoha"→„v mnoha" | C2 |
| ☐ | smazat rozbité `class="&lt;tag …&gt;"` atributy | B2 |
| ☐ | popisné alt texty místo keyword aliasů | A3 |
| ☐ | meta description bez telefonu, s lokalitou, ~150 znaků | A3, 5a |
| ☐ | jeden H1, viditelný; obrázky ven z H2/blockquote | A4 |
| ☐ | kontrast: overlay pod textem, žlutou `#ffff00` nahradit akcentovou barvou s kontrastem ≥ 4,5:1 na tmavém podkladu | D2 |
| ☐ | obrázky → WebP (`montazni-…-andel.png` 501 kB → ~50 kB), `loading="lazy"` pod foldem, správné `sizes` | D3 |
| ☐ | žádná analytika v první verzi (mrtvý GA snippet se nepřenáší; měření až rozhodne uživatel) | A7 |
| ☐ | patička: identifikace provozovatele místo „Používáme WordPress" | C3 |

## 4) FX polish (vše vanilla, ~2–3 kB JS + CSS přechody)

1. **Sticky header** — `position: sticky` + IntersectionObserver na sentinel
   v hero; po odscrollování třída `.shrunk` (menší padding, tmavší
   poloprůhledné pozadí s `backdrop-filter: blur`). Žádný scroll listener.
2. **Scroll-reveal sekcí** — IntersectionObserver přidává `.in-view`;
   CSS: `opacity 0→1` + `translateY(16px)→0`, `transition 0.5s ease-out`.
   Jednorázové (unobserve po odhalení). Obsah je v HTML viditelný i bez JS —
   výchozí skrytí nastavuje až JS přidáním třídy `js` na `<html>`.
3. **Smooth scroll na kotvy** — čisté CSS `scroll-behavior: smooth` +
   `scroll-margin-top` na sekcích kvůli sticky headeru. Bez JS.
4. **Hover přechody** — tlačítka a karty služeb: `transition` na
   `transform: translateY(-2px)`, `box-shadow`, barvu; 150–200 ms.
5. **Hero (volitelné, decentní)** — statický tmavý gradient přes fotku +
   velmi jemný parallax (`background-position` posun max ~6 px přes
   `requestAnimationFrame`, jen na desktopu); žádné nekonečné animace.
6. **POVINNĚ:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation: none !important;
       transition: none !important;
       scroll-behavior: auto !important;
     }
   }
   ```
   a v JS guard `matchMedia('(prefers-reduced-motion: reduce)')` — reveal
   prvky se rovnou zobrazí, parallax se neaktivuje.

## 5) GEO optimalizace

### a) Lokální / geografická SEO
- **Lokalita v `<title>` a meta description** — primární lokalita dle odpovědi
  uživatele (kandidáti z podkladů: Praha, Táborsko/Chotoviny, Benešov, Ostrava).
- **Lokalita přirozeně v textu** — 1× v hero podtitulu, 1× v sekci kontakt
  („Působíme v Praze a Středočeském kraji, na Táborsku…"), ne v každém nadpisu.
- **JSON-LD `LocalBusiness`** (typ `HomeAndConstructionBusiness`):
  `name`, `url`, `logo`, `image`, `telephone` (obě čísla), `email`,
  `identifier` (IČO), `address` + `geo` (souřadnice sídla — jen pokud uživatel
  schválí zveřejnění adresy; jinak pouze `areaServed`),
  `areaServed` (seznam měst/krajů), `sameAs` (FB, IG, YouTube),
  `priceRange`, `description`.
- **TODO pro uživatele (já nezakládám):** založit/ověřit **Google Business
  Profile**, propojit s webem, sjednotit NAP (name–address–phone) s webem a
  s profilem na poptavej.cz; zvážit zápis do Firmy.cz.

### b) Generative Engine Optimization (čitelnost pro AI odpovídače)
- **Sémantické HTML**: `header/nav/main/section/footer`, jediný H1, čistá
  hierarchie nadpisů (viz bod 2) — AI crawler musí pochopit strukturu bez CSS.
- **FAQ blok** s reálnými otázkami a stručnými faktickými odpověďmi (2–3 věty,
  první věta = přímá odpověď), značený **FAQPage JSON-LD**. Návrh otázek:
  1. Co jsou výškové práce horolezeckou technikou?
  2. Kde všude působíte? (přímá odpověď s výčtem lokalit)
  3. Jaké práce ve výškách provádíte? (výčet oborů)
  4. Kolik stojí výškové práce? (konzultace a nacenění zdarma; rozsah dle typu)
  5. Jste odborně způsobilí / pojištění? (dle podkladů odborná způsobilost)
  6. Proč horolezecká technika místo lešení nebo plošiny? (rychlost, cena,
     nepřístupná místa)
- **Jasná krátká tvrzení místo vaty**: každá sekce začíná větou, která obstojí
  vytržená z kontextu („Provádíme výškové práce horolezeckou technikou v Praze
  a jižních Čechách."). Subjekt pojmenovaný jménem, ne „my".
- **Konzistentní entita**: stejné jméno firmy v `<title>`, H1, patičce,
  LocalBusiness i Organization — řeší nekonzistenci z auditu C3.

## 6) Ochranné mantinely (NESMÍ se ztratit)

1. **Obě telefonní čísla**: +420 608 800 618 i +420 722 093 256 — zůstávají,
   jen formátovaná a klikatelná. Kontrolní bod Fáze 3: `grep` na obě čísla
   v novém index.html musí vrátit shodu.
2. **E-mail** info@vyskovepraceandel.cz (případná změna jen na pokyn uživatele).
3. **Klíčové sdělení**: „výškové práce prováděné horolezeckou technikou
   (průmyslové lezectví) na obtížně přístupných místech" — jádro hero + služeb.
4. **Odkaz na vyskovepraceandel.cz** — ⚠ čeká na rozhodnutí uživatele
   (otázka Q1 níže). Default v návrhu: jeden decentní odkaz v sekci kontakt
   („Více referencí na vyskovepraceandel.cz"), ne funnel na každém prvku.
5. Soc. profily (FB horolezeckyservis, IG sluzbyhorolezcu.cz, YouTube) —
   přenést do patičky a `sameAs`.

## 7) Otevřené otázky před Fází 3

**Q1 — Odkaz na vyskovepraceandel.cz:** má zůstat výrazný funnel (původní
chování), zredukovat na jeden decentní odkaz (doporučeno kvůli doorway riziku,
audit A2), nebo úplně odstranit? S tím souvisí i e-mail
info@vyskovepraceandel.cz — ponechat, nebo nahradit?

**Q2 — Identifikace firmy:** v ARES jsem dohledal pravděpodobný subjekt:
**Lukáš Anděl, IČO 76652301**, sídlo Sedlečko 5, 391 37 Chotoviny (okres
Tábor), podniká od 2009, DIČ CZ8805061826, obory NACE zahrnují natěračské
práce — sedí na lokality ze sitemapy (Tábor, Benešov, Praha). IČO 64133500
z odkazu na poptavej.cz v ARES neexistuje (je to interní ID poptavej.cz).
→ Potvrdit správnost subjektu a zda zveřejnit i adresu sídla (je to zřejmě
domácí adresa — kvůli soukromí lze uvést jen IČO + „Táborsko").

**Q3 — Primární lokalita pro GEO:** co dát do `<title>`/description jako
hlavní oblast? Podklady ukazují Praha (12 městských částí), Benešov,
Táborsko (sídlo), Ostrava. Vše do `areaServed` dát lze, ale titulek unese
1–2 lokality.

**Q4 — Role druhého čísla +420 722 093 256:** jaký popisek k němu uvést
(druhý technik / dispečink / společník…)? Z webu to neplyne.

**Q5 — (volitelné) Měření návštěvnosti:** původní web měl 4 rozbité/duplicitní
trackery; do nové verze zatím žádný nedávám. Chcete později nasadit GA4, nebo
nechat web bez analytiky?
