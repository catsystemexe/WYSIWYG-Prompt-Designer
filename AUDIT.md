# AUDIT — sluzbyhorolezcu.cz (Fáze 1)

Audit vychází výhradně z podkladů v `_zdroj/` (snapshot homepage z 12. 6. 2026,
sitemapy, robots.txt, stažené assety). Žádný kód nebyl měněn.

Stack: WordPress 7.0, motiv Twenty Eleven (dark scheme), PHP 8.5.4, Yoast SEO 27.8,
Simple Lightbox, WP Statistics, MonsterInsights (nenakonfigurován), Site Kit by Google.

Závažnost: 🔴 kritická · 🟠 střední · 🟡 nízká

---

## A) SEO a meta

### A1 — 🔴 Rozbitý `og:title`: obsahuje URL Facebooku místo titulku — **POTVRZENO**
- **Kde:** `_zdroj/head.txt:16`
  ```html
  <meta property="og:title" content="https://www.facebook.com/horolezeckyservis" />
  ```
- **Projev:** Při sdílení na Facebooku/LinkedIn/WhatsApp se jako nadpis náhledu
  zobrazí cizí URL místo názvu firmy. Zřejmě omylem vyplněné pole „Facebook title"
  v Yoastu hodnotou URL profilu.
- **Oprava:** V Yoast SEO (Social → Facebook title) nastavit smysluplný titulek,
  např. `Výškové práce Anděl – služby horolezců | Praha, Tábor, Benešov`.
  URL profilu patří jen do `article:publisher` / `sameAs` (tam už správně je).

### A2 — 🔴 Riziko „doorway page" (funnel na cizí doménu) — **POTVRZENO**
- **Kde:** celý obsah `_zdroj/index.html:178–216`
- **Projev:** Homepage nemá žádný vlastní cíl — **všech 6 textových odkazů i všechny
  3 obrázky vedou na `https://vyskovepraceandel.cz`**, e-mail je
  `info@vyskovepraceandel.cz` (cizí doména), web nemá menu ani interní odkazy na
  vlastních 25 podstránek ze sitemapy. K tomu sitemapa plná téměř identických
  lokálních stránek (`vyskove-prace-zizkov`, `-vrsovice`, `-holesovice`, …).
  Přesně to odpovídá definici doorway pages dle Google Spam Policies → riziko
  manuální penalizace nebo algoritmického potlačení obou domén.
- **Oprava:** Rozhodnout strategii: (a) udělat ze sluzbyhorolezcu.cz plnohodnotný
  web s vlastním obsahem a kontakty, nebo (b) 301 redirect celé domény na
  vyskovepraceandel.cz. Současný mezistav je nejhorší varianta. Minimálně přidat
  interní navigaci a unikátní obsah, odkazy na druhou doménu omezit na 1–2.

### A3 — 🟠 Keyword stuffing „služby horolezců / horolezecké služby"
- **Kde:** `<title>` (`head.txt:5`), H1 (`index.html:174`), druhý H1 (`index.html:183`),
  `title` + `alt` všech obrázků (`index.html:181, 192, 204` — alt="SLUŽBY HOROLEZCŮ",
  alt="služby horolezců", alt="HOROLEZECKÉ SLUŽBY"), meta description.
- **Projev:** Tatáž fráze ve dvou slovosledných variantách se opakuje v titulku,
  dvou H1, všech alt/title atributech i description. Spolu s A2 a A4 to tvoří
  vzorec over-optimization, který Google od Helpful Content Update aktivně penalizuje.
- **Oprava:** Jedna fráze v `<title>`, jeden H1, popisné alt texty („horolezec
  natírá fasádu bytového domu v Ostravě"), description psaná pro lidi.

### A4 — 🟠 Skrytý H1 + dva H1 na stránce
- **Kde:** inline CSS `head.txt:138–144` (`#post-5428 .entry-title {display:none}`)
  skrývá H1 z `index.html:174`; druhý H1 je `index.html:183` — a je zneužitý jako
  běžný odstavec (font-size 12pt, obsahuje celou větu textu).
- **Projev:** Nadpis viditelný jen pro roboty = signál hraničící s cloakingem;
  sémantika nadpisů je rozbitá (obrázky zabalené v H2, `index.html:181, 192, 204`).
- **Oprava:** Jeden viditelný H1, text z řádku 183 převést na `<p>`, obrázky
  vyjmout z H2/blockquote.

### A5 — 🟠 Chybí JSON-LD `LocalBusiness` — **POTVRZENO**
- **Kde:** `head.txt:26` — Yoast graph obsahuje jen `WebPage`, `ImageObject`,
  `BreadcrumbList`, `WebSite` a generickou `Organization` (bez adresy, telefonu,
  IČO, otevírací doby, oblasti působení).
- **Projev:** Web nemůže získat rich results pro lokální firmu; pro lokální dotazy
  („výškové práce Praha") chybí klíčový signál.
- **Oprava:** Doplnit `LocalBusiness` (příp. `HomeAndConstructionBusiness`) s
  `telephone`, `email`, `areaServed` (Praha, Středočeský kraj, Tábor, Ostrava),
  `address`, `identifier` (IČO 64133500), `sameAs`.

### A6 — 🟡 `<title>` obsahuje emoji a zalomení řádku
- **Kde:** `head.txt:4–5` — `SLUŽBY HOROLEZCŮ ✉ ✆ HOROLEZECKÉ SLUŽBY` (uvnitř tagu
  newline + tabulátor).
- **Projev:** Google emoji v SERP většinou odfiltruje a může titulek přepsat;
  chybí brand i lokalita.
- **Oprava:** `Výškové práce Anděl – služby horolezců | Praha a okolí` apod.

### A7 — 🟡 Rozbitá/duplicitní analytika a leaky generátorů
- **Kde:** `head.txt:81–89` — legacy `analytics.js` volané s GA4 ID
  `G-GFFNX1FBKV` (`analytics.js` measurement ID typu `G-…` nepodporuje → data se
  neměří); MonsterInsights bez konfigurace (`head.txt:35–38`); současně Site Kit a
  WP Statistics. `<meta name="generator" content="WordPress 7.0">` (`head.txt:78`),
  `xmlrpc.php` pingback + EditURI (`head.txt:8, 77`).
- **Oprava:** Jediný měřicí nástroj (gtag.js/GA4 nebo Site Kit), odstranit mrtvý
  snippet a nepoužívané pluginy; skrýt generator, vypnout xmlrpc.

---

## B) Technické / bezpečnost

### B1 — 🔴 Mixed content: `http://` zdroje na HTTPS stránce — **POTVRZENO**
- **Kde:**
  - `og:image` → `http://sluzbyhorolezcu.cz/...vyskove_prace_praha_podoli.jpg` (`head.txt:21`)
  - hlavní obrázek `src="http://sluzbyhorolezcu.cz/...vyskove-prace-ostrava-mesto.jpg"` (`index.html:181`) — srcset má https, samotné `src` ne
- **Projev:** Prohlížeče obrázek auto-upgradují nebo označí stránku „nezabezpečeno";
  Facebook scraper může http og:image odmítnout. Po rekonstrukci na statický web by
  http odkazy zlobily dál.
- **Oprava:** Vše na `https://` (v DB WordPressu zřejmě staré absolutní URL —
  search-replace), ideálně relativní cesty.

### B2 — 🟠 Nevalidní HTML: rozbitý `class` atribut s escapovaným tagem
- **Kde:** `index.html:181` a `index.html:192`:
  ```html
  class="&lt;tag class=&quot;SLUZBY_HOROLEZCU&quot;&gt; aligncenter wp-image-7104 size-full"
  ```
- **Projev:** Do `class` někdo vložil celý (vymyšlený) HTML tag — pozůstatek ručního
  „SEO tagování". Nevalidní hodnota třídy, validátor padá, CSS selektory na třídu
  nefungují spolehlivě.
- **Oprava:** Vyčistit na `aligncenter wp-image-7104 size-full`.

### B3 — 🟡 Základní hygiena head je v pořádku — pro úplnost
- `<meta charset="UTF-8">` ✅ (`head.txt:2`), `lang="cs"` ✅ (`index.html:2`),
  viewport ✅ (`head.txt:3`), canonical ✅ (`head.txt:13`).
- `alt` atributy obrázky **mají**, ale jsou keyword-stuffed (viz A3) — nechybí,
  jen jsou špatné. Prázdný `<p>` na `index.html:217`, `<hgroup>` a `<nav>` prázdné
  (`index.html:152–161`) — mrtvá kostra šablony.
- **Oprava:** Při rekonstrukci prázdné elementy odstranit, alt přepsat popisně.

### B4 — 🟡 Inline-styling „z Wordu"
- **Kde:** celý obsah — desítky vnořených `<span style="color: …">` s 6 odstíny
  bílé (#fff, #f2f2f2, #ebebeb, #e3e3e3, #dedede, #c4c4c4), font-size míchané
  v pt (12/14/15/18/20pt).
- **Projev:** Neudržovatelné, nekonzistentní vzhled, zbytečná váha HTML, příčina
  artefaktů z C2.
- **Oprava:** Při rekonstrukci přenést formátování do CSS tříd.

---

## C) Obsah a konzistence

### C1 — Kontakty (kompletní výčet) — obě čísla platná a ZŮSTÁVAJÍ
| Kontakt | Výskyty | Co z webu plyne |
|---|---|---|
| **+420 608 800 618** | meta description + og:description (`head.txt:12, 17`), `index.html:187`, `index.html:211` | V meta description uvedeno jako „Horolezecké služby **Lukáš Anděl**, GSM +420608800618" → primární číslo majitele. Na stránce stojí u bloků „VÝŠKOVÉ PRÁCE ANDĚL" a u závěrečné výzvy. |
| **+420 722 093 256** | `index.html:198` | Uvedeno u bloku se specializacemi (natěračské, zednické, svářečské, telekomunikační a elektromontážní práce). Účel z webu výslovně neplyne — doporučuji u klienta ověřit popisek (např. „druhý technik / dispečink"). |
| **info@vyskovepraceandel.cz** | `index.html:197`, `index.html:209` (mailto:) | Jediný e-mail; pozor — doména druhého webu, ne sluzbyhorolezcu.cz. |

- **Závažnost:** 🟠 — čísla nejsou klikatelná (žádný `tel:`, viz D1), formát je
  nekonzistentní s běžnou českou konvencí a u druhého čísla chybí kontext.
- **Oprava:** Jednotný formát `+420 608 800 618`, oba kontakty jako `tel:` odkazy,
  ke každému číslu popisek role; e-mail buď sjednotit s doménou, nebo viditelně
  vysvětlit vazbu obou značek.

### C2 — 🟠 Formátovací artefakty — **POTVRZENO vč. „n…abízíme"**
- **`index.html:200`** — slovo „nabízíme" je rozseknuté mezi dva `<span>`y, přičemž
  samotné **„n" je tučně** a zbytek „abízíme" pokračuje v jiném spanu:
  `…a celkově <strong>n</strong></span>…<strong>abízíme rychlý a efektivní…` →
  na stránce vzniká vizuální zlom „n|abízíme".
- **`index.html:214`** — stejný vzor: „Vám p" + „oskytneme zdarma" (slovo
  „poskytneme" rozdělené přes tři spany).
- **`index.html:206`** — osamělý spojovník na začátku věty: „**-Zajistíme** Vám…".
- **`index.html:214`** — chybějící předložka/zvratné se: „abychom se mohli postarat
  Vaše potřeby" (správně „postarat **se o** Vaše potřeby").
- **`index.html:194`** — „za pomocí" (správně „za pomoci"), „**ve** mnoha situacích"
  (správně „v mnoha"), zdvojené mezery mezi vnořenými `<strong>`.
- **`index.html:183`** — celý odstavec vložený do H1 s odkazem na hodnocení na
  poptavej.cz uprostřed věty.
- **Oprava:** Při přepisu obsahu sloučit rozsekané spany, opravit gramatiku,
  sjednotit zvýrazňování (tučně jen klíčová sdělení).

### C3 — 🟡 Branding nekonzistentní
- `<title>`/H1 říkají „SLUŽBY HOROLEZCŮ", schema `WebSite`/`Organization` říká
  „Výškové práce Anděl" (`head.txt:26`), patička webu obsahuje jen „Používáme
  WordPress" (`index.html:240–243`) — žádné jméno firmy, IČO ani copyright.
- **Oprava:** Sjednotit značku, do patičky dát identifikaci firmy (jméno, IČO,
  působnost) — pomůže i bodu A2/E.

---

## D) Přístupnost a výkon

### D1 — 🔴 Telefony nejsou `tel:` odkazy
- **Kde:** `index.html:187, 198, 211` — čísla jsou prostý text se symbolem ✆.
- **Projev:** Na mobilu (hlavní zdroj poptávek u řemeslných služeb) nelze
  zavolat tapnutím; pro screen readery je „✆" balast.
- **Oprava:** `<a href="tel:+420608800618">+420 608 800 618</a>`, ikonu řešit CSS.

### D2 — 🟠 Kontrast a čitelnost
- **Kde:** žluté odkazy `#ffff00` (`index.html:178, 185, …`) a `#eeee22`
  (`head.txt:106`) + šedé texty #e3e3e3/#ebebeb — to vše nad fotografií
  (`body` background `vyskove-prace.jpg`, `head.txt:131–133`) s fallback barvou
  `#eceaf2` (téměř bílá).
- **Projev:** Žlutá na světlém pozadí má kontrast ~1,2:1 (WCAG vyžaduje 4,5:1);
  čitelnost závisí na tom, jaká část fotky je zrovna pod textem — na mobilu
  (jiný výřez) nekontrolovatelné. `background-attachment: fixed` navíc na iOS
  nefunguje a rozbíjí scroll výkon.
- **Oprava:** Text na poloprůhledném tmavém podkladu (overlay), odkazy s
  dostatečným kontrastem, fixed attachment nahradit.

### D3 — 🟠 Velikost a formát obrázků
- **Kde / naměřeno (`_zdroj/assets/`):**
  - `montazni-vyskove-prace-andel.png` — **501 kB** (1115×227 PNG fotobanner!)
  - `vyskove-prace.jpg` — 180 kB (1401×1512, pozadí celé stránky)
  - `vyskove_prace_praha_podoli.jpg` — 155 kB (og:image)
  - `vyskove-prace-ostrava-mesto.jpg` — 99 kB, `vyskove_prace_Ostrava_Ostravsko.jpg` — 97 kB
- **Projev:** ~0,9 MB obrázků na first load; PNG pro fotografii je 5–10× větší
  než nutné; žádné WebP/AVIF; bannery se zobrazují na ~700px, ale `src` míří na
  full-size.
- **Oprava:** Konverze do WebP (banner PNG → ~60 kB), správné `sizes`,
  `loading="lazy"` pro obrázky pod foldem.

### D4 — 🟡 Klikací plochy a `target="_blank"`
- Hlavní CTA jsou textové odkazy 18pt — vyhovuje; ale všechny odkazy otevírají
  nové okno (`target="_blank"`) bez upozornění, e-mail `mailto:` má zbytečně
  `target="_blank"` (`index.html:197, 209`).
- Skip-link existuje (`index.html:150`) ✅, ale cílí na prázdnou kostru navigace.
- **Oprava:** `target="_blank"` jen kde dává smysl; u externích odkazů ponechat
  `rel="noopener"`.

### D5 — 🟡 Zbytečný JS/CSS balast
- wp-emoji loader + inline modul (`index.html:255–262`), Simple Lightbox CSS bez
  jediné galerie, speculationrules prefetch, 2× tracker. Pro jednostránkový web
  rekonstruovaný na statiku lze vše vypustit.

---

## E) GEO — výchozí stav

### E1 — Zmiňované lokality
| Zdroj | Lokality |
|---|---|
| Text homepage | žádná lokalita v běžném textu (!) |
| Obrázky (názvy + EXIF) | **Ostrava** (`vyskove-prace-ostrava-mesto.jpg`, EXIF „výškové práce Ostrava"; `vyskove_prace_Ostrava_Ostravsko.jpg`, EXIF „vyskove_prace_ostrava"), **Praha** (`vyskove_prace_praha_podoli.jpg`, EXIF „Profesionální Výškové práce v Praze") |
| Schema (`head.txt:26`) | caption „Profesionální Výškové práce v Praze" |
| Sitemapa (25 podstránek) | **Praha** + městské části: Žižkov, Vršovice, Holešovice, Strašnice, Chodov, Nusle, Záběhlice, Smíchov, Černý Most, Podolí, Vinohrady, Ruzyně; **Benešov**, **Tábor** (2×: `vyskove-prace-tabor`, `cisteni-natery-strech-fasad-tabor`), **Ostrava** (2×: `ostrava-vyskove-prace`, `montazni-vyskove-prace-praha`) |

→ Deklarovaná působnost: **Praha a okolí (Středočeský kraj — Benešov), Tábor, Ostravsko.**

### E2 — Identifikace firmy (co se dá z podkladů dohledat)
- **Jméno:** Lukáš Anděl (meta description, `head.txt:12`); značka „Výškové práce
  Anděl" (schema Organization).
- **IČO: 64133500** — není na stránce, ale je vyčteno z odkazu
  `https://www.poptavej.cz/firma/64133500/lukas-andel-vyskove-prace-andel`
  (`index.html:183`). Před použitím ověřit v ARES.
- **Adresa:** ❌ nikde v podkladech. **Otevírací doba:** ❌. **IČO viditelně:** ❌.
- **Profily:** Facebook `horolezeckyservis`, Instagram `sluzbyhorolezcu.cz`,
  YouTube kanál `UCbhDKDbpQMsWUDSWt3--pFg`, poptavej.cz (hodnocení).
- **Závažnost:** 🟠 — pro lokální SEO i důvěryhodnost (a u podnikatele i kvůli
  zákonné identifikaci provozovatele) chybí adresa/sídlo, IČO a vymezení oblasti
  působení přímo na webu.
- **Oprava:** Doplnit blok „Kontakt / O nás" s IČO, sídlem (po ověření v ARES),
  oblastí působení; provázat s LocalBusiness schématem (A5).

---

## Top 10 oprav podle priority

| # | Závažnost | Oprava | Nález |
|---|---|---|---|
| 1 | 🔴 | Rozhodnout strategii domény (plnohodnotný web vs. 301 na vyskovepraceandel.cz) — zrušit doorway charakter | A2 |
| 2 | 🔴 | Opravit `og:title` (dnes URL Facebooku) | A1 |
| 3 | 🔴 | Telefony jako `tel:` odkazy, jednotný formát `+420 XXX XXX XXX`, popisky rolí u obou čísel | D1, C1 |
| 4 | 🔴 | Odstranit mixed content — `og:image` a `src` prvního banneru na https | B1 |
| 5 | 🟠 | Jeden viditelný H1, zrušit skrývací CSS, opravit hierarchii nadpisů (H1 jako odstavec, obrázky v H2) | A4 |
| 6 | 🟠 | Doplnit JSON-LD LocalBusiness (telefon, e-mail, IČO 64133500*, areaServed, adresa) | A5, E2 |
| 7 | 🟠 | Vyčistit texty: rozseknuté „n/abízíme", „p/oskytneme", „-Zajistíme", gramatika, keyword stuffing | C2, A3 |
| 8 | 🟠 | Kontrast: overlay pod textem, nahradit žluté #ffff00 odkazy, zrušit `background-attachment: fixed` | D2 |
| 9 | 🟠 | Obrázky: PNG banner (501 kB) → WebP, lazy-loading, správné `sizes` | D3 |
| 10 | 🟡 | Úklid hlavy: emoji v `<title>`, mrtvá GA snippet (G- ID v analytics.js), duplicitní analytika, generator/xmlrpc | A6, A7 |

\* IČO před publikací ověřit v ARES.

**Poznámka ke kontaktům:** obě telefonní čísla (+420 608 800 618 i
+420 722 093 256) jsou platná a v rekonstrukci ZŮSTÁVAJÍ — mění se jen
formátování, klikatelnost a doplnění kontextu.
