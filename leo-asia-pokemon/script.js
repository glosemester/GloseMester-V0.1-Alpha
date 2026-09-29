"use strict";

/* =========================================================================
   Asia, Japan og Pokémon
   - Alt innhold ligger i objektet STANDARD_INNHOLD under.
   - Endringer gjort i Lærerpanelet lagres i nettleseren (localStorage).
   - Finnes filen innhold.json ved siden av index.html, brukes den som
     innhold for alle besøkende (lag den med «Eksporter innhold» i panelet).
   ========================================================================= */

const LAGRINGSNOKKEL = "ajp-innhold-v1";
const INNLOGGET_NOKKEL = "ajp-laerer-innlogget";
// Passordet står ikke i klartekst – bare et fingeravtrykk (hash) av det.
const PASSORD_HASH = "t0rwou3mm9";

const TYPER = {
  Normal: "#9a9a7c",
  Ild: "#f08030",
  Vann: "#5c86e8",
  Gress: "#5fb35a",
  Elektrisk: "#d9ad00",
  Is: "#62bcbc",
  Kamp: "#c03028",
  Gift: "#a040a0",
  Bakke: "#c29a44",
  Flyvende: "#8f7ee8",
  Psykisk: "#f0507e",
  Insekt: "#98a820",
  Stein: "#b09a36",
  Spøkelse: "#705898",
  Drage: "#6a3cf0",
  Mørk: "#705848",
  Stål: "#8a8aa6",
  Fe: "#e07fab",
};

/* ---------- Standardinnhold ---------- */

function del(overskrift, tekst) {
  return { id: nyId(), overskrift, tekst: tekst.trim().replace(/^[ \t]+/gm, ""), bilde: "" };
}

function nyId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const STANDARD_INNHOLD = {
  versjon: 1,
  asia: [
    {
      id: "asia",
      merke: "亜",
      tittel: "Asia",
      ingress: "Verdens største verdensdel – med flest mennesker, det høyeste fjellet og utrolig mange ulike kulturer.",
      bilde: "",
      deler: [
        del("Oversikt", `
          Asia er den **største verdensdelen** på jorda, både i areal og i antall mennesker.

          - Areal: omtrent **44,6 millioner km²** – nesten en tredjedel av alt land på jorda.
          - Folketall: rundt **4,8 milliarder** mennesker. Det betyr at omtrent 6 av 10 mennesker i verden bor i Asia.
          - Antall land: rundt **48**, litt avhengig av hvordan man teller.
          - Grensen mot Europa går blant annet langs **Uralfjellene** i Russland.
        `),
        del("Regioner", `
          Asia er så stort at man ofte deler det inn i regioner:

          - **Øst-Asia:** Kina, Japan, Sør-Korea, Nord-Korea, Mongolia og Taiwan.
          - **Sørøst-Asia:** Thailand, Vietnam, Indonesia, Filippinene, Malaysia, Singapore og flere.
          - **Sør-Asia:** India, Pakistan, Bangladesh, Nepal, Sri Lanka, Bhutan og Maldivene.
          - **Sentral-Asia:** Kasakhstan, Usbekistan, Turkmenistan, Kirgisistan og Tadsjikistan.
          - **Vest-Asia (Midtøsten):** Tyrkia, Iran, Irak, Saudi-Arabia, Israel og flere.
          - **Nord-Asia:** Sibir, som er en del av Russland.
        `),
        del("Rekorder", `
          Asia har mange av verdens rekorder:

          - **Mount Everest** (8849 moh.) er verdens høyeste fjell. Det ligger på grensen mellom Nepal og Kina.
          - **Dødehavet** er det laveste punktet på land, omtrent 430 meter under havet.
          - **Bajkalsjøen** i Russland er verdens dypeste innsjø – hele 1642 meter dyp.
          - **Yangtze** i Kina er Asias lengste elv, omtrent 6300 km lang.
          - **Kina** og **India** har hver over 1,4 milliarder innbyggere.
          - **Tokyo-området** er verdens største byområde med rundt 37 millioner mennesker.
        `),
        del("Religion og språk", `
          Mange av verdens store religioner oppsto i Asia: **hinduisme**, **buddhisme**, **jødedom**, **kristendom** og **islam**.

          Det snakkes flere tusen språk i Asia. **Mandarin** (kinesisk) er språket med flest morsmålsbrukere i hele verden. Andre store språk er hindi, bengali, arabisk, japansk og indonesisk.
        `),
        del("Klima", `
          Fordi Asia er så stort, finnes nesten alle typer klima her:

          - Iskaldt **arktisk klima** i Sibir i nord.
          - Store **ørkener**, som Gobi i Mongolia og Kina og ørkenene på den arabiske halvøy.
          - Varm og fuktig **regnskog** i Indonesia og Malaysia.
          - **Monsun** i Sør- og Sørøst-Asia: vinder som gir en lang regntid hvert år.
        `),
      ],
    },
    {
      id: "japan",
      merke: "日",
      tittel: "Japan",
      ingress: "Et øyrike i Stillehavet der gamle tradisjoner og moderne teknologi lever side om side. På japansk heter landet Nihon – «solens opprinnelse».",
      bilde: "",
      deler: [
        del("Geografi", `
          Japan er et **øyrike** i Stillehavet, øst for Kina og Korea.

          - Fire hovedøyer: **Honshu** (størst), **Hokkaido**, **Kyushu** og **Shikoku**.
          - I tillegg over **14 000** mindre øyer.
          - Areal: omtrent **378 000 km²** – nesten like stort som Norge med Svalbard.
          - Omtrent tre fjerdedeler av landet er **fjell**, så de fleste bor langs kysten.
          - Japan ligger i **Ildringen** rundt Stillehavet, og har derfor mange jordskjelv og vulkaner.
        `),
        del("Befolkning", `
          Japan har rundt **124 millioner** innbyggere – mer enn 20 ganger så mange som Norge.

          - De fleste bor i store byer som Tokyo, Osaka, Nagoya og Yokohama.
          - Japanere lever lenge: forventet levealder er rundt **84 år**, blant de høyeste i verden.
          - Det fødes få barn, så befolkningen blir **eldre** og **mindre** hvert år.
        `),
        del("Hovedstad", `
          Hovedstaden er **Tokyo**. Byen het tidligere **Edo** og ble hovedstad i **1868**.

          - Tokyo-området har rundt **37 millioner** innbyggere – verdens største byområde.
          - **Shibuya-krysset** er kjent som et av verdens travleste fotgjengerkryss.
          - **Tokyo Skytree** er 634 meter høyt og verdens høyeste tårn.
          - Før Tokyo var **Kyoto** keiserens by i over 1000 år (794–1868).
        `),
        del("Språk", `
          I Japan snakker man **japansk**. Språket har tre skriftsystemer som brukes sammen:

          - **Hiragana** – runde tegn for japanske ord og bøyninger.
          - **Katakana** – kantete tegn for ord fra andre språk. «Pokémon» skrives ポケモン.
          - **Kanji** – tegn fra kinesisk, der hvert tegn betyr noe. 日 betyr «sol» eller «dag».

          Noen nyttige ord:

          - こんにちは – **konnichiwa** – hei / god dag
          - ありがとう – **arigatō** – takk
          - さようなら – **sayōnara** – ha det
          - はい / いいえ – **hai / iie** – ja / nei
        `),
        del("Valuta", `
          Pengene i Japan heter **yen**, med tegnet **¥** (kode JPY).

          - Mynter: 1, 5, 10, 50, 100 og 500 yen.
          - Sedler: 1000, 5000 og 10 000 yen. Nye sedler kom i 2024.
          - 100 yen er omtrent 7 norske kroner, men kursen endrer seg hele tiden.
          - I Japan betaler mange fortsatt med kontanter, selv om kort og mobil blir vanligere.
        `),
        del("Historie", `
          Noen viktige hendelser i Japans historie:

          - **ca. 14 000–300 f.Kr.:** Jōmon-tiden. Folk lagde noen av verdens eldste leirkrukker.
          - **794:** Kyoto blir keiserens hovedstad.
          - **1185:** Samuraiene og **shogunene** (militære ledere) får makten.
          - **1603–1868:** Edo-tiden. Japan holdt seg nesten helt stengt for utlandet i over 200 år.
          - **1868:** Meiji-tiden starter, og Japan moderniseres raskt med tog, fabrikker og skoler.
          - **1945:** Andre verdenskrig slutter etter atombombene over **Hiroshima** og **Nagasaki**.
          - **1964:** Olympiske leker i Tokyo, og det første lyntoget **Shinkansen** åpner.
          - **2011:** Et stort jordskjelv og en tsunami rammer nordøst i landet.
          - **2019:** **Naruhito** blir keiser.
        `),
        del("Kultur", `
          Japansk kultur er kjent over hele verden – fra samurai og te-seremonier til **anime**, **manga** og **videospill**.

          Høflighet er veldig viktig. Man **bukker** når man hilser, og man tar av seg **skoene** når man går inn i et hjem.

          Les mer under temaet **Japansk kultur**.
        `),
        del("Tradisjoner", `
          - **Shōgatsu (nyttår):** Den viktigste høytiden. Familier besøker templer og spiser spesiell mat.
          - **Hanami (mars–april):** Man har piknik under blomstrende **kirsebærtrær** (sakura).
          - **Kodomo no hi (5. mai):** Barnas dag. Familier henger opp fargerike vimpler formet som karper.
          - **Tanabata (7. juli):** Man skriver ønsker på papirlapper og henger dem på bambus.
          - **Obon (august):** Man minnes forfedrene med lykter og dansen **bon odori**.
          - **Shichi-Go-San (november):** Fest for barn som er 3, 5 og 7 år.
        `),
        del("Teknologi", `
          Japan er et av verdens ledende land innen teknologi.

          - **Shinkansen** («lyntoget») åpnet i 1964 og kjører i opptil 320 km/t.
          - Kjente japanske selskaper: **Nintendo**, **Sony**, **Toyota**, **Honda**, **Panasonic** og **Canon**.
          - **Game Boy** (1989), **PlayStation** (1994) og **Nintendo Switch** (2017) kommer fra Japan.
          - Japan er verdensledende på **roboter**.
          - Bygninger lages for å tåle **jordskjelv**, med fundamenter som kan svaie.
        `),
        del("Mat", `
          Japansk mat er basert på **ris**, **fisk**, **grønnsaker** og **soyasaus**. Kjente retter er **sushi**, **ramen**, **tempura** og **onigiri** (risboller).

          Les mer under temaet **Japansk mat**.
        `),
        del("Kjente steder", `
          - **Fuji-fjellet** (3776 moh.) – Japans høyeste fjell og en sovende vulkan.
          - **Fushimi Inari** i Kyoto – tusenvis av knallrøde **torii-porter** i lange rekker.
          - **Kinkaku-ji** i Kyoto – det gylne tempelet.
          - **Nara** – her går hundrevis av tamme hjorter fritt rundt i parken.
          - **Fredsparken i Hiroshima** – til minne om atombomben i 1945.
          - **Himeji slott** – et av de best bevarte slottene fra samuraitiden.
          - **Shibuya og Akihabara** i Tokyo – lys, butikker, anime og spill.
        `),
        del("Natur", `
          Japan har fire tydelige **årstider**: kirsebærblomster om våren, varm og fuktig sommer, røde lønnetrær om høsten og mye snø i nord om vinteren.

          Omtrent to tredjedeler av landet er dekket av **skog**. Les mer under temaet **Natur**.
        `),
        del("Interessante fakta", `
          - Japan har mer enn **5 millioner** salgsautomater – for drikke, mat og mye rart.
          - Tog i Japan er så **punktlige** at forsinkelser på bare noen minutter kan gi en unnskyldning fra togselskapet.
          - Det finnes kafeer med **katter**, **ugler** og til og med **pinnsvin**.
          - Japanske skolebarn **vasker klasserommet selv**.
          - Det finnes hoteller og butikker der **roboter** jobber.
          - Pokémon, Super Mario og Hello Kitty kommer alle fra Japan.
        `),
      ],
    },
    {
      id: "kultur",
      merke: "文",
      tittel: "Japansk kultur",
      ingress: "Høflighet, samurai, kunst og anime – en kultur som blander det aller eldste med det aller nyeste.",
      bilde: "",
      deler: [
        del("Høflighet", `
          I Japan er det viktig å vise **respekt** for andre.

          - Man **bukker** i stedet for å håndhilse. Jo dypere buk, jo mer respekt.
          - Man tar av seg **skoene** innendørs og bruker ofte tøfler.
          - Det er vanlig å være **stille** på toget og ikke snakke i mobilen.
          - Man gir **ikke tips** på restaurant – god service er en selvfølge.
        `),
        del("Samurai og ninja", `
          **Samuraiene** var krigere som tjente mektige herrer i flere hundre år. De fulgte en streng æreskodeks kalt **bushidō**, og var kjent for sverdet **katana**.

          **Ninjaene** var spioner og snikere som jobbet i hemmelighet. I dag er de populære i filmer, spill og anime – og Pokémonen **Greninja** er inspirert av dem!
        `),
        del("Kunst og håndverk", `
          - **Origami:** å brette figurer av papir uten saks og lim. En kjent figur er tranen.
          - **Shodō:** vakker skrift med pensel og blekk (kalligrafi).
          - **Bonsai:** små trær som stelles i mange år for å se ut som store trær i miniatyr.
          - **Ikebana:** kunsten å sette sammen blomster.
          - **Ukiyo-e:** tresnitt. «Den store bølgen utenfor Kanagawa» av Hokusai er et av verdens mest kjente bilder.
        `),
        del("Klær", `
          **Kimono** er Japans tradisjonelle drakt, en lang kjole med vide ermer som holdes sammen med et belte kalt **obi**.

          **Yukata** er en lettere kimono i bomull som brukes om sommeren og på festivaler.

          Til vanlig går japanere i moderne klær, og mange skoler har **skoleuniform**.
        `),
        del("Religion", `
          De to største religionene er **shinto** og **buddhisme**, og mange følger litt av begge.

          - **Shinto** handler om ånder, kalt **kami**, som finnes i naturen. Shinto-helligdommer kjennes igjen på den røde **torii-porten**.
          - **Buddhisme** kom til Japan fra Kina og Korea for rundt 1500 år siden. Buddhistiske **templer** har ofte store statuer av Buddha.
        `),
        del("Sport", `
          - **Sumo:** tradisjonell bryting der to store brytere prøver å dytte hverandre ut av en ring.
          - **Judo** og **karate:** kampsporter som i dag trenes over hele verden.
          - **Kendo:** fekting med bambussverd.
          - **Baseball** og **fotball** er de mest populære lagsportene.
        `),
        del("Anime, manga og spill", `
          **Manga** er japanske tegneserier, og de leses fra **høyre mot venstre**. **Anime** er japanske tegnefilmer og serier.

          Kjente eksempler er **Pokémon**, **Dragon Ball**, **One Piece**, **Naruto** og filmene fra **Studio Ghibli**, som «Min nabo Totoro».

          Japan er også hjemlandet til mange kjente spill og figurer: **Super Mario**, **Zelda**, **Sonic**, **Kirby** og selvfølgelig **Pokémon**.
        `),
      ],
    },
    {
      id: "mat",
      merke: "食",
      tittel: "Japansk mat",
      ingress: "Ris, fisk, nudler og søtsaker – japansk mat er sunn, vakker og full av smak.",
      bilde: "",
      deler: [
        del("Grunnlaget", `
          Japansk mat bygger på noen få viktige ingredienser:

          - **Ris** – spises nesten til hvert måltid.
          - **Fisk og sjømat** – fordi Japan er et øyrike.
          - **Soyasaus** og **miso** (soyabønnepasta).
          - **Tang** (nori) og **grønnsaker**.

          Maten skal se fin ut, og man bruker gjerne råvarer som passer årstiden.
        `),
        del("Sushi", `
          **Sushi** er ris smaksatt med riseddik, servert med fisk, grønnsaker eller egg.

          - **Nigiri:** en liten risbolle med en skive fisk på toppen.
          - **Maki:** ris og fyll rullet inn i tang og skåret i biter.
          - **Sashimi:** tynne skiver rå fisk uten ris.

          Sushi spises ofte med **soyasaus**, **wasabi** (sterk grønn pasta) og syltet ingefær.
        `),
        del("Nudler", `
          - **Ramen:** nudler i kraftig suppe med kjøtt, egg og grønnsaker.
          - **Udon:** tykke, myke hvetenudler.
          - **Soba:** tynne nudler av bokhvete, ofte servert kalde om sommeren.

          I Japan er det helt greit å **slurpe** nudler – det viser at maten smaker godt!
        `),
        del("Gatemat", `
          - **Onigiri:** risboller med fyll, pakket inn i tang. Populær skolemat.
          - **Takoyaki:** små, runde boller med blekksprut – kjent fra Osaka.
          - **Okonomiyaki:** en slags pannekake med kål og fyll du velger selv.
          - **Yakitori:** grillede kyllingspyd.
          - **Tempura:** sjømat og grønnsaker frityrstekt i lett røre.
        `),
        del("Søtsaker", `
          - **Mochi:** myke kaker av klebrig ris, ofte med søt bønnepasta inni.
          - **Dango:** små riskuler på spyd.
          - **Dorayaki:** to små pannekaker med søt bønnepasta imellom – favoritten til Doraemon.
          - **Matcha:** grønn te i pulverform, brukt i te-seremonier, is og kaker.
        `),
        del("Bordskikk", `
          - Før maten sier man **itadakimasu** («jeg tar imot»), og etterpå **gochisōsama** («takk for maten»).
          - Man spiser med **spisepinner** (hashi).
          - Man skal **ikke** stikke spisepinnene rett opp i risen. Det gjøres bare ved begravelser.
          - Mange tar med seg **bento** – en matboks med små porsjoner av ulike retter.
        `),
      ],
    },
    {
      id: "natur",
      merke: "山",
      tittel: "Natur",
      ingress: "Vulkaner, varme kilder, kirsebærblomster og snøaper – naturen i Japan er både vakker og kraftfull.",
      bilde: "",
      deler: [
        del("Fjell og vulkaner", `
          Japan har rundt **110 aktive vulkaner**.

          Den mest kjente er **Fuji-fjellet** (3776 moh.). Det har ikke hatt utbrudd siden 1707, og er et hellig fjell i Japan. Hvert år klatrer rundt 200 000 mennesker til toppen.
        `),
        del("Jordskjelv og tsunami", `
          Japan ligger der flere **jordplater** møtes, og har derfor tusenvis av små jordskjelv hvert år.

          - Skolebarn har **jordskjelvøvelser** der de gjemmer seg under pulten.
          - Mobiltelefoner får **varsel** sekunder før skjelvet kommer.
          - Et stort jordskjelv under havet kan lage en **tsunami** – en enorm bølge.
        `),
        del("Årstidene", `
          - **Vår:** Kirsebærtrærne (**sakura**) blomstrer i mars og april.
          - **Sommer:** Varmt og fuktig, og det kan komme **tyfoner** (kraftige stormer).
          - **Høst:** Lønnetrærne blir knallrøde. Dette kalles **momiji**.
          - **Vinter:** Mye snø på Hokkaido og i fjellene – perfekt for ski.

          Helt i sør ligger **Okinawa**, med varmt klima, korallrev og hvite strender.
        `),
        del("Dyr", `
          - **Japansk makak** («snøape»): aper som bader i varme kilder om vinteren.
          - **Sika-hjort:** går fritt rundt i byen Nara og bukker når de får kjeks.
          - **Tanuki** (mårhund) og **kitsune** (rev) er med i mange gamle japanske eventyr.
          - **Japansk trane:** et symbol på lykke og langt liv.
          - **Koi:** fargerike karper som svømmer i dammer ved templer og hager.
        `),
        del("Varme kilder og skog", `
          På grunn av vulkanene finnes det tusenvis av **varme kilder**, kalt **onsen**. Japanere elsker å bade i det varme vannet.

          Omtrent **to tredjedeler** av Japan er dekket av skog, blant annet med bambus, seder og lønnetrær.
        `),
      ],
    },
    {
      id: "fakta",
      merke: "知",
      tittel: "Fakta",
      ingress: "Raske fakta om Asia og Japan – perfekt for en quiz eller en presentasjon.",
      bilde: "",
      deler: [
        del("Japan i tall", `
          - **Hovedstad:** Tokyo
          - **Innbyggere:** rundt 124 millioner
          - **Areal:** omtrent 378 000 km²
          - **Språk:** japansk
          - **Valuta:** yen (¥)
          - **Høyeste fjell:** Fuji-fjellet, 3776 moh.
          - **Statsform:** keiserdømme med folkevalgt regjering
          - **Nasjonalflagg:** en rød sirkel (solen) på hvit bakgrunn
        `),
        del("Asia i tall", `
          - **Areal:** omtrent 44,6 millioner km²
          - **Innbyggere:** rundt 4,8 milliarder
          - **Antall land:** rundt 48
          - **Største land:** Russland (delvis i Europa) og Kina
          - **Høyeste fjell:** Mount Everest, 8849 moh.
          - **Største by:** Tokyo-området
        `),
        del("Visste du?", `
          - Japan kalles **«den oppgående sols land»**.
          - Kinamuren er over 20 000 km lang hvis man regner med alle delene.
          - **Singapore** er både en by og et land.
          - **Indonesia** består av over 17 000 øyer.
          - Te, papir og kruttet ble oppfunnet i **Kina**.
          - Sjakk har trolig sin opprinnelse i **India**.
        `),
      ],
    },
  ],
  pokemon: [
    {
      id: "hva",
      merke: "?",
      tittel: "Hva er Pokémon?",
      ingress: "Pokémon er en av verdens største underholdningsserier – med spill, kort, anime og over 1000 forskjellige Pokémon.",
      bilde: "",
      deler: [
        del("Kort forklart", `
          **Pokémon** er skapninger med spesielle krefter. I Pokémon-verdenen er man **trener**: man fanger Pokémon i en **Poké Ball**, trener dem og kjemper mot andre trenere.

          Navnet kommer fra japansk **Poketto Monsutā** – «Pocket Monsters», altså «lommemonstre».

          Det kjente slagordet er **«Gotta catch 'em all!»** – «Fang dem alle!»
        `),
        del("Historien", `
          - Pokémon ble skapt av **Satoshi Tajiri** og selskapet **Game Freak** i Japan.
          - Tajiri samlet insekter da han var liten, og ville at barn skulle få den samme gleden gjennom et spill.
          - De første spillene, **Pocket Monsters Red og Green**, kom ut på Game Boy **27. februar 1996**.
          - Pokémon eies av **The Pokémon Company**, som eies av Nintendo, Game Freak og Creatures.
          - I dag er Pokémon den **mest innbringende** underholdningsserien i verden.
        `),
        del("Slik fungerer det", `
          - **Fange:** Svekk en vill Pokémon og kast en Poké Ball.
          - **Kjempe:** Pokémon bruker **angrep** (moves). Typen avgjør hva som er sterkt og svakt.
          - **Utvikle seg:** Mange Pokémon **utvikler seg** til en sterkere form, for eksempel Charmander → Charmeleon → Charizard.
          - **Pokédex:** Et leksikon der man registrerer alle Pokémon man har sett og fanget.
          - **Gym-ledere:** Sterke trenere man må slå for å få **medaljer** (badges).
        `),
        del("Hvor mange Pokémon finnes?", `
          Det finnes over **1000** forskjellige Pokémon, og det kommer nye med nesten hvert nytt hovedspill.

          Pokémonene deles inn i **generasjoner**. Generasjon 1 hadde **151** Pokémon, fra **Bulbasaur (#1)** til **Mew (#151)**.
        `),
      ],
    },
    {
      id: "typer",
      merke: "18",
      tittel: "Pokémon-typer",
      ingress: "Hver Pokémon har én eller to typer. Typen bestemmer hvilke angrep som er sterke eller svake mot den.",
      bilde: "",
      deler: [
        del("De 18 typene", `
          Det finnes **18 typer**. Her er de norske navnene, med det engelske navnet fra spillene i parentes:

          - **Normal** (Normal), **Ild** (Fire), **Vann** (Water)
          - **Gress** (Grass), **Elektrisk** (Electric), **Is** (Ice)
          - **Kamp** (Fighting), **Gift** (Poison), **Bakke** (Ground)
          - **Flyvende** (Flying), **Psykisk** (Psychic), **Insekt** (Bug)
          - **Stein** (Rock), **Spøkelse** (Ghost), **Drage** (Dragon)
          - **Mørk** (Dark), **Stål** (Steel), **Fe** (Fairy)
        `),
        del("Stein, saks, papir", `
          Typene fungerer litt som **stein, saks, papir**. Den enkleste trekanten er:

          - **Vann** slår **Ild** (vann slukker ild)
          - **Ild** slår **Gress** (ild brenner planter)
          - **Gress** slår **Vann** (planter suger opp vann)

          Et angrep som er sterkt mot typen gjør **dobbel skade**. Et svakt angrep gjør bare halv skade.
        `),
        del("Flere eksempler", `
          - **Elektrisk** er sterk mot Vann og Flyvende, men virker **ikke i det hele tatt** på Bakke.
          - **Is** er sterk mot Drage, Gress, Bakke og Flyvende.
          - **Spøkelse**-angrep virker ikke på Normal – og Normal-angrep virker ikke på Spøkelse.
          - **Fe** er sterk mot Drage, og Drage-angrep virker ikke på Fe.
          - **Psykisk** er sterk mot Kamp og Gift.
        `),
        del("Doble typer", `
          Mange Pokémon har **to typer**. Da teller begge.

          **Charizard** er både Ild og Flyvende. Et **Stein**-angrep er sterkt mot begge typene, og gjør derfor **fire ganger** så mye skade!

          **Gengar** er både Spøkelse og Gift, og **Lucario** er både Kamp og Stål.
        `),
      ],
    },
    {
      id: "spill",
      merke: "遊",
      tittel: "Pokémon-spill",
      ingress: "Fra Game Boy i 1996 til Nintendo Switch i dag – Pokémon-spillene har solgt hundrevis av millioner eksemplarer.",
      bilde: "",
      deler: [
        del("Hovedspillene", `
          Hovedspillene kommer ofte i **par**, med noen forskjellige Pokémon i hver versjon:

          - **1996 – Red og Green** (Game Boy). I Europa kom Red og Blue i 1999.
          - **1999 – Gold og Silver** (Game Boy Color)
          - **2002 – Ruby og Sapphire** (Game Boy Advance)
          - **2006 – Diamond og Pearl** (Nintendo DS)
          - **2010 – Black og White** (Nintendo DS)
          - **2013 – X og Y** (Nintendo 3DS) – de første i full 3D
          - **2016 – Sun og Moon** (Nintendo 3DS)
          - **2019 – Sword og Shield** (Nintendo Switch)
          - **2022 – Scarlet og Violet** (Nintendo Switch) – åpen verden
        `),
        del("Legends-spillene", `
          - **Pokémon Legends: Arceus** (2022) foregår langt tilbake i tid i regionen Hisui.
          - **Pokémon Legends: Z-A** (2025) foregår i byen Lumiose, inspirert av Paris.
        `),
        del("Mobil og andre spill", `
          - **Pokémon GO** (2016): Fang Pokémon ute i den ekte verden med mobilen. Ble lastet ned hundrevis av millioner ganger.
          - **Pokémon Unite** (2021): Lagspill der to lag kjemper mot hverandre.
          - **Pokémon Sleep** (2023): Et spill som måler søvnen din.
          - **Pokémon Mystery Dungeon**, **Pokémon Snap** og **Pokémon Stadium** er andre kjente spill.
        `),
        del("Samlekort", `
          Pokémon-**samlekortene** (Pokémon TCG) kom i Japan i 1996. Man kan både samle kortene og spille med dem.

          Noen sjeldne kort er verdt **millioner av kroner**. Det dyreste er et spesielt **Pikachu Illustrator**-kort.

          I 2024 kom også **Pokémon TCG Pocket**, der man samler kort på mobilen.
        `),
      ],
    },
    {
      id: "anime",
      merke: "映",
      tittel: "Pokémon-anime",
      ingress: "Pokémon-serien har gått på TV siden 1997 og har over 1200 episoder.",
      bilde: "",
      deler: [
        del("Ash og Pikachu", `
          Serien startet i Japan **1. april 1997**. Hovedpersonen er **Ash Ketchum** (Satoshi på japansk) fra Pallet Town, og hans beste venn **Pikachu**.

          Ash reiste gjennom mange regioner for å bli **Pokémon-mester**. I **2022** vant han endelig verdensmesterskapet!
        `),
        del("Kjente figurer", `
          - **Misty** og **Brock** – Ash sine første reisevenner.
          - **Team Rocket** – **Jessie**, **James** og den snakkende **Meowth**, som alltid prøver å stjele Pikachu.
          - **Professor Oak** – forskeren som ga Ash hans første Pokémon.
          - **Gary** – Ash sin rival fra barndommen.
        `),
        del("Pokémon Horizons", `
          I **2023** fikk serien nye hovedpersoner: **Liko** og **Roy**. Serien heter **Pokémon Horizons**, og Liko og Roy reiser med startpokémonene **Sprigatito** og **Fuecoco**.
        `),
        del("Filmer", `
          - Den første filmen, **Pokémon: The First Movie** (1998), handler om **Mewtwo**.
          - Det har kommet over **20 animerte filmer**.
          - **Detective Pikachu** (2019) var den første filmen med skuespillere, der Pokémon ble laget med dataanimasjon.
        `),
      ],
    },
    {
      id: "kjente",
      merke: "★",
      tittel: "Kjente Pokémon",
      ingress: "Noen Pokémon er mer kjent enn andre – her er maskoten, startpokémonene og de legendariske.",
      bilde: "",
      deler: [
        del("Maskoten", `
          **Pikachu** er Pokémon sin offisielle maskot. Den er en **Elektrisk**-type mus som utvikler seg fra **Pichu** og kan utvikle seg til **Raichu**.

          Pikachu er så kjent at den har vært med i Macy's-paraden i New York og på fly fra All Nippon Airways.
        `),
        del("Startpokémon", `
          I hvert hovedspill velger man én av tre **startpokémon** – nesten alltid én Gress, én Ild og én Vann.

          I de første spillene var det:

          - **Bulbasaur** (Gress/Gift)
          - **Charmander** (Ild) – utvikler seg til Charizard
          - **Squirtle** (Vann)
        `),
        del("Legendariske Pokémon", `
          **Legendariske** Pokémon er svært sjeldne og sterke. Det finnes ofte bare én av dem.

          - **Mew** og **Mewtwo** – Mewtwo ble laget av forskere fra Mew sine gener.
          - **Lugia** og **Ho-Oh** – fra Gold og Silver.
          - **Rayquaza** – en grønn drage som bor høyt oppe i himmelen.
          - **Arceus** – i historien skapte den hele Pokémon-universet.
        `),
        del("Eevee og utviklingene", `
          **Eevee** kan utvikle seg til **åtte** forskjellige Pokémon, flere enn noen annen:

          - Vaporeon (Vann), Jolteon (Elektrisk), Flareon (Ild)
          - Espeon (Psykisk), Umbreon (Mørk)
          - Leafeon (Gress), Glaceon (Is), Sylveon (Fe)
        `),
      ],
    },
  ],
  kort: [
    { id: "k-pikachu", navn: "Pikachu", nr: 25, typer: ["Elektrisk"], bilde: "", info: "Pokémon-verdenens mest kjente maskot. Lagrer strøm i de røde kinnene og sender ut kraftige lyn når den blir sint eller redd." },
    { id: "k-charizard", navn: "Charizard", nr: 6, typer: ["Ild", "Flyvende"], bilde: "", info: "Den siste utviklingen av Charmander. Flyr høyt og puster flammer som er så varme at de kan smelte stein." },
    { id: "k-bulbasaur", navn: "Bulbasaur", nr: 1, typer: ["Gress", "Gift"], bilde: "", info: "Nummer 1 i Pokédexen. Frøet på ryggen vokser med sollys og blir til en stor blomst når den utvikler seg til Venusaur." },
    { id: "k-squirtle", navn: "Squirtle", nr: 7, typer: ["Vann"], bilde: "", info: "En liten skilpadde som gjemmer seg i skallet og sprøyter vann med stor kraft. Utvikler seg til Wartortle og Blastoise." },
    { id: "k-eevee", navn: "Eevee", nr: 133, typer: ["Normal"], bilde: "", info: "Har ustabile gener som gjør at den kan utvikle seg til åtte forskjellige Pokémon – flere enn noen annen." },
    { id: "k-mewtwo", navn: "Mewtwo", nr: 150, typer: ["Psykisk"], bilde: "", info: "Ble skapt av forskere fra genene til den sjeldne Pokémonen Mew. En av de aller sterkeste psykiske Pokémonene." },
    { id: "k-gengar", navn: "Gengar", nr: 94, typer: ["Spøkelse", "Gift"], bilde: "", info: "Gjemmer seg i skygger og liker å skremme folk med et stort glis. Rommet blir kaldt når Gengar er i nærheten." },
    { id: "k-lucario", navn: "Lucario", nr: 448, typer: ["Kamp", "Stål"], bilde: "", info: "Kan se og styre aura – energien som alle levende vesener har. Den kan kjenne hva andre føler og tenker." },
    { id: "k-greninja", navn: "Greninja", nr: 658, typer: ["Vann", "Mørk"], bilde: "", info: "En lynrask ninja-Pokémon som former vann til skarpe stjerner og kaster dem som shuriken." },
    { id: "k-snorlax", navn: "Snorlax", nr: 143, typer: ["Normal"], bilde: "", info: "Spiser rundt 400 kilo mat hver dag og sover resten av tiden. Sperrer ofte veien for trenere i spillene." },
  ],
};

/* ---------- Tilstand ---------- */

let data = hentLagretInnhold() || kopier(STANDARD_INNHOLD);
let innlogget = lesOkt();
let stakk = [{ vis: "forside" }];
let kortFilter = { sok: "", type: "" };
let modalHandling = null;

const innholdEl = document.getElementById("innhold");
const toppHoyreEl = document.getElementById("topp-hoyre");
const modalRot = document.getElementById("modal-rot");
const toastRot = document.getElementById("toast-rot");

/* ---------- Hjelpefunksjoner ---------- */

function kopier(o) {
  return JSON.parse(JSON.stringify(o));
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function inline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// Gjør vanlig tekst om til avsnitt og punktlister.
// Tom linje = nytt avsnitt, linje som starter med «- » = punkt i liste, **tekst** = fet.
function formater(tekst) {
  const blokker = String(tekst || "").replace(/\r/g, "").split(/\n\s*\n/);
  return blokker.map((blokk) => {
    const linjer = blokk.split("\n").map((l) => l.trim()).filter(Boolean);
    let html = "";
    let avsnitt = [];
    let liste = [];
    const tomAvsnitt = () => {
      if (avsnitt.length) html += `<p>${avsnitt.map(inline).join("<br>")}</p>`;
      avsnitt = [];
    };
    const tomListe = () => {
      if (liste.length) html += `<ul>${liste.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`;
      liste = [];
    };
    for (const linje of linjer) {
      if (/^[-•]\s+/.test(linje)) {
        tomAvsnitt();
        liste.push(linje.replace(/^[-•]\s+/, ""));
      } else {
        tomListe();
        avsnitt.push(linje);
      }
    }
    tomAvsnitt();
    tomListe();
    return html;
  }).join("");
}

function cyrb53(str, seed = 7) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function erGyldigInnhold(d) {
  return d && Array.isArray(d.asia) && Array.isArray(d.pokemon) && Array.isArray(d.kort);
}

function hentLagretInnhold() {
  try {
    const raa = localStorage.getItem(LAGRINGSNOKKEL);
    if (!raa) return null;
    const d = JSON.parse(raa);
    return erGyldigInnhold(d) ? d : null;
  } catch {
    return null;
  }
}

function lagre() {
  try {
    localStorage.setItem(LAGRINGSNOKKEL, JSON.stringify(data));
    return true;
  } catch {
    visToast("Kunne ikke lagre – nettleseren har ikke nok plass. Bruk mindre bilder eller slett noen.");
    return false;
  }
}

function lesOkt() {
  try {
    return sessionStorage.getItem(INNLOGGET_NOKKEL) === "ja";
  } catch {
    return false;
  }
}

function settOkt(verdi) {
  innlogget = verdi;
  try {
    if (verdi) sessionStorage.setItem(INNLOGGET_NOKKEL, "ja");
    else sessionStorage.removeItem(INNLOGGET_NOKKEL);
  } catch {
    /* ignorer */
  }
}

function liste(navn) {
  if (navn === "asia") return data.asia;
  if (navn === "pokemon") return data.pokemon;
  return data.kort;
}

function seksjonsnavn(seksjon) {
  return seksjon === "asia" ? "Asia og Japan" : "Pokémon";
}

function merkeFor(tema) {
  return (tema.merke || tema.tittel || "?").trim().slice(0, 2) || "?";
}

function kortBilde(k) {
  if (k.bilde) return k.bilde;
  const nr = parseInt(k.nr, 10);
  if (!nr) return "";
  const innebygd = window.INNEBYGDE_BILDER && window.INNEBYGDE_BILDER[nr];
  return innebygd || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${nr}.png`;
}

function hentSti(obj, sti) {
  return sti.split(".").reduce((o, n) => (o == null ? o : o[n]), obj);
}

function settSti(obj, sti, verdi) {
  const deler = sti.split(".");
  const siste = deler.pop();
  const mal = deler.reduce((o, n) => o[n], obj);
  mal[siste] = verdi;
}

/* ---------- Navigasjon ---------- */

const naa = () => stakk[stakk.length - 1];

function gaaTil(vis, param = {}) {
  stakk.push({ vis, ...param });
  render(true);
}

function tilbake() {
  if (stakk.length > 1) stakk.pop();
  render(true);
}

function hjem() {
  stakk = [{ vis: "forside" }];
  render(true);
}

function tilbakeKnapp(tekst = "Tilbake") {
  return `<button type="button" class="knapp tilbake" data-h="tilbake"><span aria-hidden="true">←</span> ${esc(tekst)}</button>`;
}

/* ---------- Visninger ---------- */

function render(rullOpp = false) {
  const tilstand = naa();
  const krevLaerer = ["panel", "redigerTema", "redigerKort"];
  if (krevLaerer.includes(tilstand.vis) && !innlogget) {
    stakk = [{ vis: "forside" }];
    return render(true);
  }

  let html = "";
  switch (tilstand.vis) {
    case "meny": html = visMeny(tilstand); break;
    case "tema": html = visTema(tilstand); break;
    case "kort": html = visKortside(); break;
    case "panel": html = visPanel(); break;
    case "redigerTema": html = visTemaRedigering(tilstand); break;
    case "redigerKort": html = visKortRedigering(tilstand); break;
    default: html = visForside();
  }
  innholdEl.innerHTML = html;
  renderTopp();
  if (rullOpp) window.scrollTo({ top: 0 });
}

function renderTopp() {
  if (!innlogget) {
    toppHoyreEl.innerHTML = "";
    return;
  }
  const iPanel = naa().vis === "panel";
  toppHoyreEl.innerHTML = `
    <span class="merkelapp">Lærer innlogget</span>
    ${iPanel ? "" : `<button type="button" class="knapp knapp-liten" data-h="panel">Lærerpanel</button>`}
    <button type="button" class="knapp knapp-liten" data-h="loggUt">Logg ut</button>
  `;
}

function visForside() {
  return `
    <section class="visning forside">
      <div class="forside-hode">
        <span class="forside-jp" lang="ja">アジア・日本・ポケモン</span>
        <h1 class="forside-tittel">Asia, Japan <span class="og">&amp;</span><br><span class="poke">Pokémon</span></h1>
        <p class="forside-under">Velg hva du vil lære om.</p>
      </div>
      <div class="hovedvalg">
        <button type="button" class="valg valg-asia" data-h="meny" data-seksjon="asia">
          <span class="valg-tegn" lang="ja" aria-hidden="true">日</span>
          <span class="valg-navn">Asia og Japan</span>
          <span class="valg-tekst">Geografi, kultur, mat, natur og fakta.</span>
          <span class="valg-pil" aria-hidden="true">→</span>
        </button>
        <button type="button" class="valg valg-poke" data-h="meny" data-seksjon="pokemon">
          <span class="valg-tegn" aria-hidden="true"><span class="logo-ball" style="display:block;width:44px;height:44px"></span></span>
          <span class="valg-navn">Pokémon</span>
          <span class="valg-tekst">Typer, spill, anime og Pokémon-kort.</span>
          <span class="valg-pil" aria-hidden="true">→</span>
        </button>
        <button type="button" class="valg valg-laerer" data-h="laerertilgang">
          <span class="valg-tegn" lang="ja" aria-hidden="true">鍵</span>
          <span class="valg-navn">Lærertilgang</span>
          <span class="valg-tekst">${innlogget ? "Du er logget inn. Åpne lærerpanelet." : "Logg inn for å redigere innholdet."}</span>
          <span class="valg-pil" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  `;
}

function visMeny({ seksjon }) {
  const temaer = liste(seksjon);
  const erPoke = seksjon === "pokemon";
  const knapper = temaer.map((t) => `
    <button type="button" class="tema-knapp" data-h="tema" data-seksjon="${seksjon}" data-id="${esc(t.id)}">
      <span class="tema-merke">${esc(merkeFor(t))}</span>
      <span class="tema-navn">${esc(t.tittel)}</span>
    </button>
  `).join("");

  const kortKnapp = erPoke ? `
    <button type="button" class="tema-knapp tema-knapp-kort" data-h="kort">
      <span class="tema-merke"><span class="logo-ball" style="display:block;width:34px;height:34px"></span></span>
      <span class="tema-navn">Pokémon-kort<small>${data.kort.length} kort med bilde, type og informasjon</small></span>
    </button>` : "";

  return `
    <section class="visning seksjon-${seksjon}">
      ${tilbakeKnapp("Til forsiden")}
      <div class="tema-hode">
        <div class="overskrift-blokk">
          <span class="overline" lang="ja">${erPoke ? "ポケモン" : "アジア・日本"}</span>
          <h1 class="side-tittel">${erPoke ? "Pokémon" : "Asia og Japan"}</h1>
          <p class="ingress">${erPoke ? "Velg et tema, eller se alle Pokémon-kortene." : "Velg et tema for å lese mer."}</p>
        </div>
        ${innlogget ? `<button type="button" class="knapp knapp-gul" data-h="nyttTema" data-seksjon="${seksjon}">+ Nytt tema</button>` : ""}
      </div>
      <div class="meny-rutenett">
        ${knapper || `<p class="tom-tekst">Ingen temaer ennå.</p>`}
        ${kortKnapp}
      </div>
    </section>
  `;
}

function visTema(tilstand) {
  const { seksjon, id } = tilstand;
  const tema = liste(seksjon).find((t) => t.id === id);
  if (!tema) {
    return `<section class="visning">${tilbakeKnapp()}<p class="tom-tekst">Fant ikke dette temaet. Det kan ha blitt slettet.</p></section>`;
  }
  const deler = tema.deler || [];
  const aktiv = Math.min(tilstand.del || 0, Math.max(deler.length - 1, 0));
  const d = deler[aktiv];

  const faner = deler.map((del, i) => `
    <button type="button" class="del-knapp" role="tab" aria-selected="${i === aktiv}" data-h="velgDel" data-indeks="${i}">${esc(del.overskrift || "Uten tittel")}</button>
  `).join("");

  const innhold = d ? `
    <article class="del-innhold" role="tabpanel">
      ${d.bilde ? `<img class="del-bilde" src="${esc(d.bilde)}" alt="${esc(d.overskrift)}">` : ""}
      <h2>${esc(d.overskrift)}</h2>
      ${formater(d.tekst)}
      <div class="del-navigasjon">
        ${aktiv > 0 ? `<button type="button" class="knapp knapp-liten" data-h="velgDel" data-indeks="${aktiv - 1}">← ${esc(deler[aktiv - 1].overskrift)}</button>` : "<span></span>"}
        ${aktiv < deler.length - 1 ? `<button type="button" class="knapp knapp-liten" data-h="velgDel" data-indeks="${aktiv + 1}">${esc(deler[aktiv + 1].overskrift)} →</button>` : ""}
      </div>
    </article>
  ` : `<p class="tom-tekst">Dette temaet har ikke noe innhold ennå.</p>`;

  return `
    <section class="visning seksjon-${seksjon}">
      ${tilbakeKnapp(`Tilbake til ${seksjonsnavn(seksjon)}`)}
      <div class="tema-hode">
        <div class="overskrift-blokk">
          <span class="overline">${esc(seksjonsnavn(seksjon))}</span>
          <h1 class="side-tittel">${esc(tema.tittel)}</h1>
          ${tema.ingress ? `<p class="ingress">${inline(tema.ingress)}</p>` : ""}
        </div>
        ${innlogget ? `<button type="button" class="knapp knapp-gul" data-h="redigerTema" data-seksjon="${seksjon}" data-id="${esc(tema.id)}">✎ Rediger denne siden</button>` : ""}
        ${tema.bilde ? `<img class="tema-hode-bilde" src="${esc(tema.bilde)}" alt="${esc(tema.tittel)}">` : ""}
      </div>
      ${deler.length > 1 ? `<div class="tema-oppsett"><nav class="del-meny" role="tablist" aria-label="Deler av temaet">${faner}</nav>${innhold}</div>` : innhold}
    </section>
  `;
}

function kortHTML(k, medRedigering = false) {
  const typer = (k.typer || []).filter(Boolean);
  const hovedfarge = TYPER[typer[0]] || "#bbbbbb";
  const bilde = kortBilde(k);
  const nr = parseInt(k.nr, 10);
  return `
    <article class="pkort" style="--kortfarge:${hovedfarge}55">
      ${medRedigering ? `
        <div class="rediger-lag">
          <button type="button" class="knapp knapp-liten knapp-gul" data-h="redigerKort" data-id="${esc(k.id)}" aria-label="Rediger ${esc(k.navn)}">✎ Rediger</button>
        </div>` : ""}
      <div class="pkort-indre">
        <div class="pkort-topp">
          <h3 class="pkort-navn">${esc(k.navn || "Uten navn")}</h3>
          ${nr ? `<span class="pkort-nr">#${String(nr).padStart(3, "0")}</span>` : ""}
        </div>
        <div class="pkort-bilde">
          ${bilde
            ? `<img src="${esc(bilde)}" alt="${esc(k.navn)}" loading="lazy" data-reserve="${esc((k.navn || "?").charAt(0))}">`
            : `<span class="pkort-reserve">${esc((k.navn || "?").charAt(0))}</span>`}
        </div>
        <div class="pkort-typer">
          ${typer.map((t) => `<span class="type-pille" style="--typefarge:${TYPER[t] || "#888"}">${esc(t)}</span>`).join("")}
        </div>
        <p class="pkort-info">${esc(k.info)}</p>
      </div>
    </article>
  `;
}

function filtrerteKort() {
  const sok = kortFilter.sok.trim().toLowerCase();
  return data.kort.filter((k) =>
    (!sok || (k.navn || "").toLowerCase().includes(sok) || String(k.nr || "") === sok) &&
    (!kortFilter.type || (k.typer || []).includes(kortFilter.type))
  );
}

function kortRutenettHTML() {
  const kort = filtrerteKort();
  if (!kort.length) return `<p class="tom-tekst" style="grid-column:1/-1">Ingen kort passer søket.</p>`;
  return kort.map((k) => kortHTML(k, innlogget)).join("");
}

function visKortside() {
  const brukteTyper = [...new Set(data.kort.flatMap((k) => k.typer || []).filter(Boolean))];
  const filterKnapper = [`<button type="button" class="filter-knapp" data-h="filterType" data-type="" aria-pressed="${!kortFilter.type}">Alle</button>`]
    .concat(Object.keys(TYPER).filter((t) => brukteTyper.includes(t)).map((t) =>
      `<button type="button" class="filter-knapp" data-h="filterType" data-type="${esc(t)}" aria-pressed="${kortFilter.type === t}">${esc(t)}</button>`
    )).join("");

  return `
    <section class="visning seksjon-pokemon">
      ${tilbakeKnapp("Tilbake til Pokémon")}
      <div class="tema-hode">
        <div class="overskrift-blokk">
          <span class="overline">Pokémon</span>
          <h1 class="side-tittel">Pokémon-kort</h1>
          <p class="ingress">Søk etter en Pokémon, eller filtrer på type.</p>
        </div>
        ${innlogget ? `<button type="button" class="knapp knapp-gul" data-h="nyttKort">+ Nytt Pokémon-kort</button>` : ""}
      </div>
      <div class="kort-verktoy">
        <input type="search" id="kort-sok" class="sok" placeholder="Søk etter navn eller nummer …" value="${esc(kortFilter.sok)}" aria-label="Søk etter Pokémon">
        <div class="type-filter">${filterKnapper}</div>
      </div>
      <div class="kort-rutenett" id="kort-rutenett">${kortRutenettHTML()}</div>
    </section>
  `;
}

/* ---------- Lærerpanel ---------- */

function panelListe(navn, elementer) {
  if (!elementer.length) return `<p class="tom-tekst">Ingen ennå.</p>`;
  return `<ul class="liste">${elementer.map((el, i) => {
    const erKort = navn === "kort";
    const ikon = erKort
      ? (kortBilde(el) ? `<img class="mini" src="${esc(kortBilde(el))}" alt="" data-reserve="">` : `<span class="tema-merke">${esc((el.navn || "?").charAt(0))}</span>`)
      : `<span class="tema-merke">${esc(merkeFor(el))}</span>`;
    const tittel = erKort ? el.navn : el.tittel;
    const under = erKort ? (el.typer || []).filter(Boolean).join(" / ") : `${(el.deler || []).length} deler`;
    const redigerH = erKort ? `data-h="redigerKort" data-id="${esc(el.id)}"` : `data-h="redigerTema" data-seksjon="${navn}" data-id="${esc(el.id)}"`;
    return `
      <li class="liste-rad">
        ${ikon}
        <span class="liste-navn">${esc(tittel || "Uten navn")}<small>${esc(under)}</small></span>
        <span class="liste-knapper">
          <button type="button" class="knapp knapp-ikon knapp-liten" data-h="flytt" data-liste="${navn}" data-id="${esc(el.id)}" data-retning="-1" aria-label="Flytt opp" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="knapp knapp-ikon knapp-liten" data-h="flytt" data-liste="${navn}" data-id="${esc(el.id)}" data-retning="1" aria-label="Flytt ned" ${i === elementer.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="knapp knapp-liten" ${redigerH}>Rediger</button>
          <button type="button" class="knapp knapp-ikon knapp-liten knapp-fare" data-h="slett" data-liste="${navn}" data-id="${esc(el.id)}" aria-label="Slett ${esc(tittel)}">✕</button>
        </span>
      </li>`;
  }).join("")}</ul>`;
}

function visPanel() {
  return `
    <section class="visning">
      ${tilbakeKnapp()}
      <div class="panel-hode">
        <div class="overskrift-blokk">
          <span class="overline">Du er logget inn som lærer</span>
          <h1 class="side-tittel">Lærerpanel</h1>
          <p class="ingress">Her kan du legge til, endre og slette innhold på nettsiden – uten å røre koden.</p>
        </div>
        <div class="knapper">
          <button type="button" class="knapp knapp-gul" data-h="leggTil">+ Legg til nytt</button>
        </div>
      </div>

      <div class="tall-rad">
        <div class="tall"><b>${data.asia.length}</b><span>temaer i Asia og Japan</span></div>
        <div class="tall"><b>${data.pokemon.length}</b><span>temaer om Pokémon</span></div>
        <div class="tall"><b>${data.kort.length}</b><span>Pokémon-kort</span></div>
      </div>

      <div class="panel-rutenett">
        <div class="panel-boks">
          <div class="panel-boks-hode">
            <h2>Asia og Japan</h2>
            <button type="button" class="knapp knapp-liten" data-h="nyttTema" data-seksjon="asia">+ Tema</button>
          </div>
          ${panelListe("asia", data.asia)}
        </div>
        <div class="panel-boks">
          <div class="panel-boks-hode">
            <h2>Pokémon-temaer</h2>
            <button type="button" class="knapp knapp-liten" data-h="nyttTema" data-seksjon="pokemon">+ Tema</button>
          </div>
          ${panelListe("pokemon", data.pokemon)}
        </div>
        <div class="panel-boks panel-boks-bred">
          <div class="panel-boks-hode">
            <h2>Pokémon-kort</h2>
            <button type="button" class="knapp knapp-liten" data-h="nyttKort">+ Kort</button>
          </div>
          ${panelListe("kort", data.kort)}
        </div>
        <div class="panel-boks panel-boks-bred">
          <h2>Lagring og sikkerhetskopi</h2>
          <p>Endringene dine lagres automatisk i denne nettleseren. Ta en sikkerhetskopi innimellom, og bruk den hvis du vil flytte innholdet til en annen PC.</p>
          <div class="kort-verktoy">
            <button type="button" class="knapp" data-h="eksporter">Eksporter innhold</button>
            <button type="button" class="knapp" data-h="importer">Importer innhold</button>
            <button type="button" class="knapp knapp-fare" data-h="tilbakestill">Tilbakestill alt</button>
          </div>
          <p class="hjelp">Tips: Lagre eksporten som <code>innhold.json</code> i samme mappe som <code>index.html</code> på nettstedet. Da ser alle besøkende innholdet ditt.</p>
        </div>
      </div>
    </section>
  `;
}

/* ---------- Redigering ---------- */

function bildevelger(sti, verdi, tekstUtenBilde = "Ingen bilde") {
  const erUrl = verdi && !verdi.startsWith("data:");
  return `
    <div class="bildevelger">
      <div class="bilde-forhandsvisning">${verdi ? `<img src="${esc(verdi)}" alt="Valgt bilde">` : esc(tekstUtenBilde)}</div>
      <div class="bildevelger-knapper">
        <div class="kort-verktoy">
          <label class="knapp knapp-liten fil-knapp">Last opp bilde
            <input type="file" accept="image/*" data-bilde="${sti}">
          </label>
          ${verdi ? `<button type="button" class="knapp knapp-liten knapp-fare" data-h="fjernBilde" data-sti="${sti}">Fjern bilde</button>` : ""}
        </div>
        <input type="url" id="url-${sti.replace(/\./g, "-")}" placeholder="…eller lim inn en bildeadresse (https://…)" value="${erUrl ? esc(verdi) : ""}" data-felt="${sti}" data-oppdater>
      </div>
    </div>
  `;
}

function visTemaRedigering(tilstand) {
  const u = tilstand.utkast;
  const deler = u.deler.map((d, i) => `
    <div class="skjema-seksjon">
      <div class="skjema-seksjon-hode">
        <b>Del ${i + 1}</b>
        <span class="liste-knapper">
          <button type="button" class="knapp knapp-ikon knapp-liten" data-h="flyttDel" data-indeks="${i}" data-retning="-1" aria-label="Flytt opp" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="knapp knapp-ikon knapp-liten" data-h="flyttDel" data-indeks="${i}" data-retning="1" aria-label="Flytt ned" ${i === u.deler.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="knapp knapp-liten knapp-fare" data-h="slettDel" data-indeks="${i}">Slett del</button>
        </span>
      </div>
      <div class="felt">
        <label for="del-${d.id}-overskrift">Overskrift</label>
        <input type="text" id="del-${d.id}-overskrift" data-felt="deler.${i}.overskrift" value="${esc(d.overskrift)}" placeholder="F.eks. Geografi">
      </div>
      <div class="felt">
        <label for="del-${d.id}-tekst">Tekst</label>
        <textarea id="del-${d.id}-tekst" data-felt="deler.${i}.tekst" placeholder="Skriv informasjonen her …">${esc(d.tekst)}</textarea>
      </div>
      <div class="felt">
        <span class="etikett">Bilde til denne delen (valgfritt)</span>
        ${bildevelger(`deler.${i}.bilde`, d.bilde)}
      </div>
    </div>
  `).join("");

  return `
    <section class="visning seksjon-${tilstand.seksjon}">
      ${tilbakeKnapp("Avbryt")}
      <div class="overskrift-blokk">
        <span class="overline">${tilstand.id ? "Rediger fakta-tema" : "Nytt fakta-tema"} · ${esc(seksjonsnavn(tilstand.seksjon))}</span>
        <h1 class="side-tittel">${esc(u.tittel || "Nytt tema")}</h1>
      </div>
      <form class="skjema" id="tema-skjema" novalidate>
        <div class="rad">
          <div class="felt">
            <label for="tema-tittel">Tittel</label>
            <input type="text" id="tema-tittel" data-felt="tittel" value="${esc(u.tittel)}" placeholder="F.eks. Kina" required>
          </div>
          <div class="felt">
            <label for="tema-merke">Merke (1–2 tegn)</label>
            <input type="text" id="tema-merke" data-felt="merke" value="${esc(u.merke)}" maxlength="2" placeholder="F.eks. 中">
            <small>Vises i den fargede ruten på menyknappen.</small>
          </div>
        </div>
        <div class="felt">
          <label for="tema-ingress">Kort innledning</label>
          <input type="text" id="tema-ingress" data-felt="ingress" value="${esc(u.ingress)}" placeholder="Én setning som forteller hva temaet handler om">
        </div>
        <div class="felt">
          <span class="etikett">Toppbilde (valgfritt)</span>
          ${bildevelger("bilde", u.bilde)}
        </div>
        <p class="hjelp">Slik skriver du: Lag en <code>tom linje</code> for nytt avsnitt. Start en linje med <code>- </code> for å lage en punktliste. Skriv <code>**slik**</code> for <strong>fet skrift</strong>.</p>
        ${deler}
        <button type="button" class="knapp" data-h="nyDel">+ Legg til ny del</button>
        <div class="skjema-bunn">
          <button type="button" class="knapp" data-h="tilbake">Avbryt</button>
          <button type="submit" class="knapp knapp-primar">Lagre tema</button>
        </div>
      </form>
    </section>
  `;
}

function visKortRedigering(tilstand) {
  const u = tilstand.utkast;
  const typeValg = (valgt, tomTekst) =>
    (tomTekst ? `<option value="">${tomTekst}</option>` : "") +
    Object.keys(TYPER).map((t) => `<option value="${t}" ${t === valgt ? "selected" : ""}>${t}</option>`).join("");

  return `
    <section class="visning seksjon-pokemon">
      ${tilbakeKnapp("Avbryt")}
      <div class="overskrift-blokk">
        <span class="overline">${tilstand.id ? "Rediger Pokémon-kort" : "Nytt Pokémon-kort"}</span>
        <h1 class="side-tittel">${esc(u.navn || "Ny Pokémon")}</h1>
      </div>
      <div class="panel-rutenett">
        <form class="skjema" id="kort-skjema" novalidate>
          <div class="rad">
            <div class="felt">
              <label for="kort-navn">Navn</label>
              <input type="text" id="kort-navn" data-felt="navn" value="${esc(u.navn)}" placeholder="F.eks. Jigglypuff" required>
            </div>
            <div class="felt">
              <label for="kort-nr">Pokédex-nummer</label>
              <input type="number" id="kort-nr" data-felt="nr" value="${esc(u.nr)}" min="1" max="1025" placeholder="F.eks. 39">
            </div>
          </div>
          <div class="rad">
            <div class="felt">
              <label for="kort-type1">Type</label>
              <select id="kort-type1" data-felt="typer.0">${typeValg(u.typer[0])}</select>
            </div>
            <div class="felt">
              <label for="kort-type2">Type 2 (valgfritt)</label>
              <select id="kort-type2" data-felt="typer.1">${typeValg(u.typer[1], "Ingen")}</select>
            </div>
          </div>
          <div class="felt">
            <label for="kort-info">Kort informasjon</label>
            <textarea id="kort-info" data-felt="info" style="min-height:100px" placeholder="2–3 setninger om Pokémonen">${esc(u.info)}</textarea>
          </div>
          <div class="felt">
            <span class="etikett">Bilde</span>
            ${bildevelger("bilde", u.bilde, u.nr ? "Bilde hentes fra nummeret" : "Ingen bilde")}
            <small>Skriver du inn Pokédex-nummeret, hentes det offisielle bildet automatisk. Du kan også laste opp ditt eget.</small>
          </div>
          <div class="skjema-bunn">
            ${tilstand.id ? `<button type="button" class="knapp knapp-fare" data-h="slett" data-liste="kort" data-id="${esc(tilstand.id)}" style="margin-right:auto">Slett kort</button>` : ""}
            <button type="button" class="knapp" data-h="tilbake">Avbryt</button>
            <button type="submit" class="knapp knapp-primar">Lagre kort</button>
          </div>
        </form>
        <div class="felt">
          <span class="etikett">Forhåndsvisning</span>
          <div id="kort-forhandsvisning" style="max-width:280px">${kortHTML(u)}</div>
        </div>
      </div>
    </section>
  `;
}

function nyttTemaUtkast() {
  return { id: nyId(), merke: "", tittel: "", ingress: "", bilde: "", deler: [{ id: nyId(), overskrift: "", tekst: "", bilde: "" }] };
}

function aapneTemaRedigering(seksjon, id) {
  const tema = id ? liste(seksjon).find((t) => t.id === id) : null;
  gaaTil("redigerTema", { seksjon, id: tema ? id : null, utkast: tema ? kopier(tema) : nyttTemaUtkast() });
}

function aapneKortRedigering(id) {
  const kort = id ? data.kort.find((k) => k.id === id) : null;
  const utkast = kort ? kopier(kort) : { id: nyId(), navn: "", nr: "", typer: ["Normal", ""], info: "", bilde: "" };
  if (!utkast.typer) utkast.typer = [];
  while (utkast.typer.length < 2) utkast.typer.push(utkast.typer.length === 0 ? "Normal" : "");
  gaaTil("redigerKort", { id: kort ? id : null, utkast });
}

function lagreTema() {
  const t = naa();
  const u = t.utkast;
  u.tittel = u.tittel.trim();
  if (!u.tittel) {
    visToast("Temaet må ha en tittel.");
    document.getElementById("tema-tittel")?.focus();
    return;
  }
  u.deler = u.deler.filter((d) => d.overskrift.trim() || d.tekst.trim() || d.bilde);
  const l = liste(t.seksjon);
  const i = l.findIndex((x) => x.id === u.id);
  if (i >= 0) l[i] = u; else l.push(u);
  if (lagre()) {
    visToast("Temaet er lagret.");
    stakk.pop();
    // Kom vi hit fra temasiden, vis det oppdaterte temaet der.
    render(true);
  }
}

function lagreKort() {
  const t = naa();
  const u = t.utkast;
  u.navn = u.navn.trim();
  if (!u.navn) {
    visToast("Kortet må ha et navn.");
    document.getElementById("kort-navn")?.focus();
    return;
  }
  u.nr = u.nr ? parseInt(u.nr, 10) || "" : "";
  u.typer = u.typer.filter(Boolean);
  if (!u.typer.length) u.typer = ["Normal"];
  const i = data.kort.findIndex((k) => k.id === u.id);
  if (i >= 0) data.kort[i] = u; else data.kort.push(u);
  if (lagre()) {
    visToast(`${u.navn} er lagret.`);
    stakk.pop();
    render(true);
  }
}

// Gjør opplastede bilder mindre, så de får plass i nettleserens lagring.
function lesBilde(fil, maks = 900) {
  return new Promise((ok, feil) => {
    if (!fil || !fil.type.startsWith("image/")) return feil(new Error("Filen er ikke et bilde."));
    const leser = new FileReader();
    leser.onerror = () => feil(new Error("Kunne ikke lese filen."));
    leser.onload = () => {
      const img = new Image();
      img.onerror = () => feil(new Error("Kunne ikke åpne bildet."));
      img.onload = () => {
        const skala = Math.min(1, maks / Math.max(img.width, img.height));
        const lerret = document.createElement("canvas");
        lerret.width = Math.round(img.width * skala);
        lerret.height = Math.round(img.height * skala);
        lerret.getContext("2d").drawImage(img, 0, 0, lerret.width, lerret.height);
        let url = lerret.toDataURL("image/webp", 0.82);
        if (!url.startsWith("data:image/webp")) url = lerret.toDataURL("image/png");
        ok(url);
      };
      img.src = leser.result;
    };
    leser.readAsDataURL(fil);
  });
}

/* ---------- Modaler ---------- */

function visModal(html, { bred = false, onSubmit = null } = {}) {
  modalHandling = onSubmit;
  modalRot.innerHTML = `
    <div class="modal-bakgrunn" data-h="lukkBakgrunn">
      <div class="modal ${bred ? "modal-bred" : ""}" role="dialog" aria-modal="true">${html}</div>
    </div>`;
  const forste = modalRot.querySelector("input, textarea, button.knapp-primar, button");
  forste?.focus();
}

function lukkModal() {
  modalRot.innerHTML = "";
  modalHandling = null;
}

function visInnlogging() {
  visModal(`
    <div class="laas" lang="ja" aria-hidden="true">鍵</div>
    <h2>Lærertilgang</h2>
    <p>Skriv inn passordet for å åpne lærerpanelet.</p>
    <form id="innlogging" class="felt" novalidate>
      <label for="passord">Passord</label>
      <input type="password" id="passord" autocomplete="current-password" required>
      <span class="feilmelding" id="innlogging-feil" role="alert"></span>
      <div class="modal-knapper">
        <button type="button" class="knapp" data-h="lukk">Avbryt</button>
        <button type="submit" class="knapp knapp-primar">Logg inn</button>
      </div>
    </form>
  `, {
    onSubmit: () => {
      const felt = document.getElementById("passord");
      if (cyrb53(felt.value) === PASSORD_HASH) {
        settOkt(true);
        lukkModal();
        visToast("Du er logget inn.");
        gaaTil("panel");
      } else {
        document.getElementById("innlogging-feil").textContent = "Feil passord. Prøv igjen.";
        const modal = modalRot.querySelector(".modal");
        modal.classList.remove("risting");
        void modal.offsetWidth;
        modal.classList.add("risting");
        felt.select();
      }
    },
  });
}

function bekreft(tittel, tekst, jaTekst, onJa) {
  visModal(`
    <h2>${esc(tittel)}</h2>
    <p>${esc(tekst)}</p>
    <form class="modal-knapper" novalidate>
      <button type="button" class="knapp" data-h="lukk">Avbryt</button>
      <button type="submit" class="knapp knapp-primar">${esc(jaTekst)}</button>
    </form>
  `, { onSubmit: () => { lukkModal(); onJa(); } });
}

function visLeggTilValg() {
  visModal(`
    <h2>Hva vil du lage?</h2>
    <p>Velg om du vil lage et nytt Pokémon-kort eller et nytt fakta-tema.</p>
    <div class="valgkort-rad">
      <button type="button" class="valgkort" data-h="nyttKort">
        <span class="logo-ball" style="width:40px;height:40px"></span>
        <strong>Pokémon-kort</strong>
        <span>Navn, bilde, type og kort informasjon.</span>
      </button>
      <button type="button" class="valgkort" data-h="velgFaktaSeksjon">
        <span class="tema-merke" style="background:var(--torii)">知</span>
        <strong>Fakta-tema</strong>
        <span>Et nytt tema med tekst og bilder, delt inn i deler.</span>
      </button>
    </div>
    <div class="modal-knapper"><button type="button" class="knapp" data-h="lukk">Avbryt</button></div>
  `, { bred: true });
}

function visFaktaSeksjonValg() {
  visModal(`
    <h2>Hvor skal temaet ligge?</h2>
    <div class="valgkort-rad">
      <button type="button" class="valgkort" data-h="nyttTema" data-seksjon="asia">
        <span class="tema-merke" style="background:var(--torii)">日</span>
        <strong>Asia og Japan</strong>
        <span>Vises i menyen for Asia og Japan.</span>
      </button>
      <button type="button" class="valgkort" data-h="nyttTema" data-seksjon="pokemon">
        <span class="tema-merke" style="background:var(--pika);color:var(--pika-mork)">★</span>
        <strong>Pokémon</strong>
        <span>Vises i Pokémon-menyen.</span>
      </button>
    </div>
    <div class="modal-knapper"><button type="button" class="knapp" data-h="leggTil">← Tilbake</button></div>
  `, { bred: true });
}

function visEksport() {
  const json = JSON.stringify(data, null, 2);
  let lenke = "";
  try {
    // Nedlasting virker ikke når siden vises inni en annen side (iframe).
    if (window.top !== window.self) throw new Error();
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    lenke = `<a class="knapp" href="${url}" download="innhold.json">Last ned innhold.json</a>`;
  } catch {
    /* ignorer */
  }
  visModal(`
    <h2>Eksporter innhold</h2>
    <p>Dette er alt innholdet på nettsiden. Last det ned som fil, eller kopier teksten og lagre den et trygt sted.</p>
    <textarea id="eksport-tekst" readonly style="min-height:220px;font-size:0.8rem">${esc(json)}</textarea>
    <div class="modal-knapper">
      <button type="button" class="knapp" data-h="lukk">Lukk</button>
      ${lenke}
      <button type="button" class="knapp knapp-primar" data-h="kopierEksport">Kopier tekst</button>
    </div>
  `, { bred: true });
}

function visImport() {
  visModal(`
    <h2>Importer innhold</h2>
    <p>Velg en fil du har eksportert tidligere, eller lim inn teksten. Alt nåværende innhold blir erstattet.</p>
    <form id="import-skjema" class="felt" novalidate>
      <label class="knapp fil-knapp">Velg fil …
        <input type="file" accept=".json,application/json" id="import-fil">
      </label>
      <textarea id="import-tekst" placeholder="…eller lim inn teksten her" style="min-height:160px;font-size:0.8rem"></textarea>
      <span class="feilmelding" id="import-feil" role="alert"></span>
      <div class="modal-knapper">
        <button type="button" class="knapp" data-h="lukk">Avbryt</button>
        <button type="submit" class="knapp knapp-primar">Importer</button>
      </div>
    </form>
  `, {
    bred: true,
    onSubmit: () => {
      const feil = document.getElementById("import-feil");
      try {
        const d = JSON.parse(document.getElementById("import-tekst").value);
        if (!erGyldigInnhold(d)) throw new Error();
        data = d;
        if (lagre()) {
          lukkModal();
          visToast("Innholdet er importert.");
          render();
        }
      } catch {
        feil.textContent = "Teksten er ikke en gyldig eksport fra denne nettsiden.";
      }
    },
  });
}

function visToast(tekst) {
  toastRot.innerHTML = `<div class="toast" role="status">${esc(tekst)}</div>`;
  clearTimeout(visToast.tid);
  visToast.tid = setTimeout(() => { toastRot.innerHTML = ""; }, 2800);
}

/* ---------- Hendelser ---------- */

const handlinger = {
  tilbake: () => tilbake(),
  meny: (el) => gaaTil("meny", { seksjon: el.dataset.seksjon }),
  tema: (el) => gaaTil("tema", { seksjon: el.dataset.seksjon, id: el.dataset.id, del: 0 }),
  kort: () => gaaTil("kort"),
  velgDel: (el) => {
    naa().del = parseInt(el.dataset.indeks, 10);
    render();
    const innhold = document.querySelector(".del-innhold");
    if (innhold && innhold.getBoundingClientRect().top < 0) innhold.scrollIntoView({ block: "start" });
  },
  laerertilgang: () => (innlogget ? gaaTil("panel") : visInnlogging()),
  panel: () => (naa().vis === "panel" ? null : gaaTil("panel")),
  loggUt: () => {
    settOkt(false);
    visToast("Du er logget ut.");
    hjem();
  },
  lukk: () => lukkModal(),
  lukkBakgrunn: (el, e) => { if (e.target === el) lukkModal(); },
  leggTil: () => visLeggTilValg(),
  velgFaktaSeksjon: () => visFaktaSeksjonValg(),
  nyttTema: (el) => { lukkModal(); aapneTemaRedigering(el.dataset.seksjon, null); },
  nyttKort: () => { lukkModal(); aapneKortRedigering(null); },
  redigerTema: (el) => aapneTemaRedigering(el.dataset.seksjon, el.dataset.id),
  redigerKort: (el) => aapneKortRedigering(el.dataset.id),
  filterType: (el) => {
    kortFilter.type = el.dataset.type;
    document.querySelectorAll(".filter-knapp").forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.type === kortFilter.type)));
    document.getElementById("kort-rutenett").innerHTML = kortRutenettHTML();
  },
  flytt: (el) => {
    const l = liste(el.dataset.liste);
    const i = l.findIndex((x) => x.id === el.dataset.id);
    const j = i + parseInt(el.dataset.retning, 10);
    if (i < 0 || j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    lagre();
    render();
  },
  slett: (el) => {
    const navn = el.dataset.liste;
    const l = liste(navn);
    const element = l.find((x) => x.id === el.dataset.id);
    if (!element) return;
    const tittel = element.tittel || element.navn || "dette";
    bekreft(`Slette «${tittel}»?`, "Dette kan ikke angres, med mindre du har en sikkerhetskopi.", "Slett", () => {
      const i = l.indexOf(element);
      if (i >= 0) l.splice(i, 1);
      lagre();
      visToast(`«${tittel}» er slettet.`);
      if (naa().vis === "redigerKort") stakk.pop();
      render();
    });
  },
  eksporter: () => visEksport(),
  kopierEksport: () => {
    const felt = document.getElementById("eksport-tekst");
    const reserve = () => { felt.focus(); felt.select(); visToast("Teksten er markert. Trykk Ctrl+C (eller Cmd+C) for å kopiere."); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(felt.value).then(() => visToast("Kopiert!"), reserve);
    } else {
      reserve();
    }
  },
  importer: () => visImport(),
  tilbakestill: () => bekreft(
    "Tilbakestille alt?",
    "Alt innhold settes tilbake til slik det var fra starten. Egne temaer, kort og bilder blir borte.",
    "Tilbakestill",
    () => {
      data = kopier(STANDARD_INNHOLD);
      lagre();
      visToast("Innholdet er tilbakestilt.");
      render();
    }
  ),
  nyDel: () => {
    naa().utkast.deler.push({ id: nyId(), overskrift: "", tekst: "", bilde: "" });
    render();
    const felter = document.querySelectorAll('[data-felt$=".overskrift"]');
    felter[felter.length - 1]?.focus();
  },
  slettDel: (el) => {
    naa().utkast.deler.splice(parseInt(el.dataset.indeks, 10), 1);
    render();
  },
  flyttDel: (el) => {
    const d = naa().utkast.deler;
    const i = parseInt(el.dataset.indeks, 10);
    const j = i + parseInt(el.dataset.retning, 10);
    if (j < 0 || j >= d.length) return;
    [d[i], d[j]] = [d[j], d[i]];
    render();
  },
  fjernBilde: (el) => {
    settSti(naa().utkast, el.dataset.sti, "");
    render();
  },
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-h]");
  if (!el || el.disabled) return;
  const handling = handlinger[el.dataset.h];
  if (!handling) return;
  if (el.dataset.h !== "lukkBakgrunn") e.preventDefault();
  handling(el, e);
});

document.getElementById("logo-knapp").addEventListener("click", () => hjem());

document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.closest("#modal-rot")) {
    if (modalHandling) modalHandling();
    return;
  }
  if (e.target.id === "tema-skjema") lagreTema();
  if (e.target.id === "kort-skjema") lagreKort();
});

document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "kort-sok") {
    kortFilter.sok = el.value;
    document.getElementById("kort-rutenett").innerHTML = kortRutenettHTML();
    return;
  }
  const t = naa();
  if (el.dataset.felt && t.utkast) {
    settSti(t.utkast, el.dataset.felt, el.value);
    if (t.vis === "redigerKort") {
      const fv = document.getElementById("kort-forhandsvisning");
      if (fv) fv.innerHTML = kortHTML(t.utkast);
    }
  }
});

document.addEventListener("change", async (e) => {
  const el = e.target;
  const t = naa();

  if (el.id === "import-fil" && el.files[0]) {
    try {
      document.getElementById("import-tekst").value = await el.files[0].text();
    } catch {
      document.getElementById("import-feil").textContent = "Kunne ikke lese filen.";
    }
    return;
  }

  if (el.dataset.bilde && el.files && el.files[0] && t.utkast) {
    try {
      const url = await lesBilde(el.files[0]);
      settSti(t.utkast, el.dataset.bilde, url);
      render();
      visToast("Bildet er lagt til. Husk å lagre.");
    } catch (feil) {
      visToast(feil.message);
    }
    return;
  }

  if (el.hasAttribute("data-oppdater") && t.utkast) render();
});

// Vis forbokstaven hvis et bilde ikke kan lastes.
document.addEventListener("error", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !("reserve" in img.dataset)) return;
  const reserve = document.createElement("span");
  reserve.className = img.classList.contains("mini") ? "tema-merke" : "pkort-reserve";
  reserve.textContent = img.dataset.reserve || "?";
  img.replaceWith(reserve);
}, true);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalRot.innerHTML) lukkModal();
});

/* ---------- Oppstart ---------- */

render();

// Har nettstedet en innhold.json (og denne nettleseren ikke har egne endringer), brukes den.
if (!hentLagretInnhold()) {
  fetch("innhold.json", { cache: "no-store" })
    .then((svar) => (svar.ok ? svar.json() : null))
    .then((d) => {
      if (erGyldigInnhold(d)) {
        data = d;
        render();
      }
    })
    .catch(() => { /* ingen innhold.json – bruk standardinnholdet */ });
}
