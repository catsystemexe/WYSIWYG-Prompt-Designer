# CHANGELOG — rekonstrukce sluzbyhorolezcu.cz (Fáze 3)

Nový web ve složce `docs/` (index.html 14 kB, style.css 9 kB, fx.js 2 kB,
obrázky 422 kB — celkem 448 kB; původní homepage stahovala přes 1 MB
a desítky requestů WordPressu).

## Co se změnilo oproti originálu

### Platforma
- WordPress 7.0 + 6 pluginů → **statické HTML/CSS + 2 kB vanilla JS**, žádný
  framework, build step ani CDN závislost. Funguje offline (ověřeno: všech
  9 souborů se servíruje lokálně, žádná externí reference v assetech).
- Odstraněn balast: 4 měřicí pluginy (vč. mrtvého GA snippetu s nefunkčním
  `G-` ID v analytics.js), emoji loader, Simple Lightbox, xmlrpc/pingback,
  `generator` meta, speculation rules. **Žádná analytika, tracking ani
  cookie lišta** (rozhodnutí Q5).

### SEO a meta (audit A1–A7)
- `og:title` opraven — původně obsahoval URL Facebooku, nyní skutečný titulek.
- `<title>` bez emoji a duplikace fráze, s lokalitami: „Výškové práce
  horolezeckou technikou – Praha a Táborsko | Výškové práce Anděl".
- Meta description bez telefonního čísla, s lokalitami (Q3).
- `og:image` a všechny URL na **https** (audit B1 — mixed content odstraněn).
- **JSON-LD LocalBusiness** (HomeAndConstructionBusiness): name, url, logo,
  image, oba telefony, e-mail, priceRange, `areaServed` (Praha, Středočeský
  kraj, Táborsko, Benešov, Tábor, Ostrava + 12 pražských částí), sameAs.
  Bez IČO/adresy/geo (rozhodnutí Q2 — viz TODO).
- **FAQPage JSON-LD** se 6 otázkami (nové — vhodné pro featured snippets
  i AI odpovídače).
- Doorway charakter odstraněn (audit A2): místo funnelu na každém prvku
  zůstal **jediný odkaz** „Více referencí na vyskovepraceandel.cz" v sekci
  kontakt (rozhodnutí Q1).
- Keyword stuffing odstraněn (audit A3): jeden viditelný H1, popisné alt
  texty, fráze „služby horolezců" už se neopakuje v každém prvku.

### Struktura a obsah (audit A4, C1–C3)
- Sémantická kostra header → hero → služby → proč my → FAQ → kontakt →
  patička; hierarchie H1→H2→H3, žádný skrytý H1, žádné obrázky v H2.
- Texty převzaty z originálu a vyčištěny (audit C2): srostlé „n/abízíme"
  a „p/oskytneme", smazán „-Zajistíme" spojovník, „za pomocí"→„za pomoci",
  „postarat se o Vaše potřeby", „v mnoha situacích"; odstraněny rozbité
  `class="<tag …>"` atributy.
- **Kontakty (mantinely dodrženy):**
  - +420 608 800 618 — Lukáš Anděl, hlavní kontakt (`tel:` odkaz, v hero,
    headeru, FAQ i kontaktech)
  - +420 722 093 256 — druhý technik (`tel:` odkaz) — popisek dle Q4
  - info@vyskovepraceandel.cz (`mailto:`)
- Patička: název firmy + oblast působení + sociální sítě (FB, IG, YouTube)
  místo původního „Používáme WordPress"; bez IČO/adresy (Q2).

### Přístupnost a výkon (audit D1–D5)
- Telefony klikatelné (`tel:`), e-mail `mailto:`.
- Kontrast: tmavý overlay pod textem v hero, akcent #f7c948 na tmavém
  pozadí (kontrast 10,9:1), žádná žlutá #ffff00 na světlém podkladu.
- Obrázky: hero 184 kB JPEG → 110 kB WebP; foto Podolí 158→98 kB WebP
  (JPEG 150 kB ponechán jen pro og:image); 501 kB PNG bannery s textem
  vypuštěny (nahrazeny skutečnými nadpisy). `loading="lazy"` pod foldem.
- `background-attachment: fixed` nahrazen overlay gradientem + volitelným
  jemným parallaxem.
- Skip-link, `:focus-visible` styly, FAQ jako nativní `<details>` (funguje
  bez JS), obsah viditelný i bez JavaScriptu.

### FX (dle NAVRH.md bod 4)
- Sticky header se po scrollu zmenší a ztmaví (IntersectionObserver, žádný
  scroll listener).
- Scroll-reveal sekcí (fade + posun 16 px, jednorázově).
- Smooth scroll čistým CSS (`scroll-behavior` + `scroll-margin-top`).
- Hover přechody tlačítek a karet (150–200 ms, lift + stín).
- Jemný parallax hero pozadí (jen desktop, rAF).
- **`prefers-reduced-motion: reduce`**: animace, přechody, smooth scroll
  i parallax kompletně vypnuty (CSS i JS guard); reveal obsah se zobrazí
  rovnou.

## TODO — chybí ověřený podklad

1. **IČO / identifikace provozovatele** — na původním webu nebylo a do nové
   verze se nevymýšlí. Číslo 64133500 z odkazu na poptavej.cz je interní ID
   portálu, ne IČO; subjekt dohledaný v ARES (76652301) nebyl majitelem
   potvrzen. Po ověření doplnit do patičky (komentář `<!-- TODO -->` je na
   místě) a do LocalBusiness JSON-LD (`identifier`), případně i adresu+geo.
2. **Google Business Profile** — založit/ověřit a sjednotit NAP s webem
   (uživatel; web profil pouze podporuje přes LocalBusiness schema).
3. **Reference a ceny** — web odkazuje na vyskovepraceandel.cz; vlastní
   sekce referencí/ceník lze doplnit, až budou ověřené podklady.
4. **Role druhého čísla** — popisek „druhý technik" dle zadání; pokud má
   číslo konkrétního vlastníka/jméno, upřesnit.
5. **Nasazení**: web je čistá statika — stačí nahrát obsah `docs/` do rootu
   hostingu. Při nasazení na doménu zachovat cesty (`/img/...`), og:image
   míří na https://sluzbyhorolezcu.cz/img/…. Zvážit 301 přesměrování
   25 starých podstránek ze sitemapy (viz `_zdroj/page-sitemap.xml`) na
   homepage, jinak vzniknou 404.
