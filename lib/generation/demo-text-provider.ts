import type { IllustrationScene, StoryBook } from "@/lib/generation/types";
import type { TextGenerationRequest, TextProvider } from "@/lib/generation/text-provider";
import type { SceneKind } from "@/lib/illustration/scenes";
import type { InterestId } from "@/lib/content/options";

type Profile = {
  titleObject: string;
  subtitle: string;
  morning: string;
  invitation: string;
  note: string;
  guide: string;
  guideDescription: string;
  problem: string;
  mission: string;
  firstPlace: string;
  secondPlace: string;
  helper: string;
  helperAction: string;
  solution: string;
  celebration: string;
  keepsake: string;
  lesson: string;
  coverLine: string;
  scene: SceneKind;
  visuals: [string, string, string, string];
  alts: [string, string, string, string];
};

const PROFILES: Record<string, Profile> = {
  cosmos: {
    titleObject: "серебряный компас",
    subtitle: "Сказка о звёздах, которые забыли свои имена",
    morning: "на холме за домом тихо мигает одинокая звезда",
    invitation: "серебряный компас на синей ленте",
    note: "Стрелка показывает не на север, а туда, где начинаются сказки. Если тебе интересно — приходи к старой обсерватории.",
    guide: "звёздный кот Пульс",
    guideDescription: "с хвостом, усыпанным созвездиями, и глазами цвета вечернего неба",
    problem: "на небе одна за другой гаснут звёзды: они забыли свои имена, и ночь становится всё темнее",
    mission: "вернуть небу семь имён",
    firstPlace: "обсерваторию на холме",
    secondPlace: "лунный сад за старым телескопом",
    helper: "робот-садовник Орби",
    helperAction: "поливает звёзды тёплым светом и знает, где спрятаны забытые имена",
    solution: "Семь имён возвращаются на небо по одному, и над долиной загорается широкая река Млечного Пути.",
    celebration: "звёзды устраивают хоровод, а Пульс мурлычет песенку, которую слышно даже с земли",
    keepsake: "маленькую карту собственного созвездия, которое теперь зажигается каждую ночь",
    lesson: "Свет становится ярче, когда им делятся.",
    coverLine: "Маленький компас. Большое небо. Одна очень личная история.",
    scene: "cosmos",
    visuals: [
      "a small child silhouette with a silver compass on a hill under a huge deep-blue evening sky, one bright star, observatory in the distance",
      "a tiny observatory with a brass telescope, star charts floating in golden light, a magical cat with constellation tail",
      "a moonlit garden of glass flowers and floating star seeds, a friendly little robot gardener watering light",
      "the sky full of newly named stars above a quiet valley, a child holding a glowing map, warm golden Milky Way",
    ],
    alts: [
      "Ребёнок с серебряным компасом на холме под большим синим небом",
      "Старая обсерватория, телескоп и звёздный кот с хвостом-созвездием",
      "Лунный сад, стеклянные цветы и робот-садовник с лейкой",
      "Млечный Путь над долиной и светящаяся карта в руках ребёнка",
    ],
  },
  forest: {
    titleObject: "жёлудь-фонарик",
    subtitle: "Сказка о семи огнях и тропинке, которая помнит дом",
    morning: "туман лежит на крышах, а сад пахнет мокрой землёй",
    invitation: "жёлудь-фонарик, который светится изнутри",
    note: "Лесной фонарь погас. Помоги зажечь семь маленьких огней, пока тропинки не забыли дорогу домой.",
    guide: "оленёнок Тим",
    guideDescription: "с тонкими рожками и длинным шарфом, который всегда пахнет хвоей",
    problem: "в лесу погас большой Фонарь, и тропинки начали путаться между корнями",
    mission: "зажечь семь маленьких огней",
    firstPlace: "ручей Шёпот",
    secondPlace: "поляну колокольчиков",
    helper: "барсучиха Агата",
    helperAction: "хранит карту лесных корней и умеет разговаривать с самыми старыми деревьями",
    solution: "Семь огней вспыхивают один за другим, и тропинки снова находят дорогу домой.",
    celebration: "лесные звери приносят ягоды, тёплый чай и плед из мягкого мха",
    keepsake: "крошечный фонарик, который горит ровно до рассвета",
    lesson: "Дом — это не только место, но и те, кто ждёт.",
    coverLine: "Семь огней, одна тропинка и лес, который помнит имя.",
    scene: "forest",
    visuals: [
      "a child opening a glowing acorn lantern in a misty garden at dawn, blue forest, warm golden light",
      "a little deer with a long scarf leading the way along a winding forest path, tall pines",
      "a whispering stream with round stones, fireflies, an old badger holding a map of tree roots",
      "seven lanterns glowing among ferns, forest animals gathered for tea, a cosy woodland celebration",
    ],
    alts: [
      "Ребёнок держит светящийся жёлудь в туманном саду на рассвете",
      "Оленёнок в шарфе ведёт по лесной тропинке между высокими соснами",
      "Ручей, светлячки и барсучиха с картой лесных корней",
      "Семь фонариков светятся среди папоротников, лесные звери пьют чай",
    ],
  },
  ocean: {
    titleObject: "раковина, которая помнит море",
    subtitle: "Колыбельная сказка о маяке и новой звезде",
    morning: "море за окном дышит медленно, а на стекле остаются солёные капли",
    invitation: "перламутровая раковина, в которой слышен не шум волн, а чей-то тихий шёпот",
    note: "Маяк устал светить. Найди для него новую звезду, пока корабли не потеряли бухту.",
    guide: "чайка Мира",
    guideDescription: "с белым крылом, смешливым глазом и привычкой проверять, все ли дома",
    problem: "старый маяк перестал светить, и корабли больше не находят тихую бухту",
    mission: "найти новую звезду для маяка",
    firstPlace: "Стеклянную бухту",
    secondPlace: "остров Ветров",
    helper: "старый кит Бо",
    helperAction: "знает все течения и умеет петь так низко, что море затихает",
    solution: "Звезда опускается в фонарь маяка, и тёплый луч снова ложится на воду.",
    celebration: "дельфины рисуют на воде светящиеся круги, а Мира приносит самый красивый закат",
    keepsake: "маленькую раковину, которая хранит голос моря",
    lesson: "Иногда нужно остановиться и услышать ответ.",
    coverLine: "Тёплая история о маяке, море и доме.",
    scene: "ocean",
    visuals: [
      "a child on a quiet shore with a pearlescent shell, pastel lighthouse in the distance, calm ocean at dawn",
      "a white seagull flying over a glassy bay, fishing boats, warm coral sunset, golden reflections",
      "a huge gentle whale under starry water, a child and seagull on a small boat, lighthouse beam",
      "a lighthouse shining with a star inside, dolphins making circles of light, calm blue sea at night",
    ],
    alts: [
      "Ребёнок на тихом берегу с перламутровой раковиной и маяком вдали",
      "Белая чайка над стеклянной бухтой и рыбацкими лодками на закате",
      "Огромный добрый кит под звёздной водой и маленькая лодка",
      "Маяк со звездой внутри и дельфины, рисующие круги света",
    ],
  },
  dinosaurs: {
    titleObject: "янтарное пёрышко",
    subtitle: "Сказка о добром великане и реке, которая вернулась",
    morning: "над долиной поднимается пар, а папоротники блестят от росы",
    invitation: "янтарное пёрышко на плоском камне",
    note: "Река пересохла, и стадо не может вернуться домой. Помоги разбудить подземный родник.",
    guide: "маленький трицератопс Топ",
    guideDescription: "с добрыми глазами и рожками, похожими на маленькие антенны",
    problem: "в долине пересохла река, и древние великаны не могут вернуться к своим гнёздам",
    mission: "разбудить подземный родник",
    firstPlace: "папоротниковую долину",
    secondPlace: "каменные ворота",
    helper: "птеранодон Пип",
    helperAction: "видит сверху все трещины в камне и умеет находить кратчайшую дорогу",
    solution: "Родник просыпается глубоко под камнями, вода бежит по старому руслу, и долина снова зеленеет.",
    celebration: "великаны приносят огромные листья, а маленькие динозавры катаются с водяной горки",
    keepsake: "гладкий камешек с отпечатком древнего папоротника",
    lesson: "Сила — это когда рядом есть кому помочь.",
    coverLine: "Древняя долина, тёплый ветер и река, которая вернулась домой.",
    scene: "dinosaurs",
    visuals: [
      "a child holding an amber feather in a fern valley at sunrise, gentle dinosaurs far away, warm mist",
      "a small friendly triceratops with kind eyes leading through giant ferns, ancient valley",
      "a pteranodon flying over stone gates and a dry riverbed, soft morning light",
      "a revived river winding through a green prehistoric valley, gentle dinosaurs celebrating, golden light",
    ],
    alts: [
      "Ребёнок с янтарным пёрышком в долине папоротников на рассвете",
      "Маленький добрый трицератопс ведёт через гигантские папоротники",
      "Птеранодон над каменными воротами и пересохшим руслом реки",
      "Река снова течёт по древней долине, добрые динозавры радуются",
    ],
  },
  mountains: {
    titleObject: "тёплый камень",
    subtitle: "Сказка о северном сиянии и доме, который ждёт",
    morning: "над горами висит тихое сияние, а снег под окнами кажется голубым",
    invitation: "тёплый камень, который не остывает даже на морозе",
    note: "Северное сияние запуталось в ущелье. Помоги ему распутаться, пока ночь не стала совсем тёмной.",
    guide: "северный олень Лу",
    guideDescription: "с широкими рогами и колокольчиком, который звенит только в важные минуты",
    problem: "северное сияние запуталось в ущелье, и ночь над горами стала слишком тёмной",
    mission: "освободить сияние",
    firstPlace: "перевал Ветров",
    secondPlace: "ледяное озеро",
    helper: "смотрительница маяка Астрид",
    helperAction: "живёт в маленьком доме на склоне и знает, как разговаривать с ветром",
    solution: "Сияние распутывается, поднимается над горами и окрашивает снег в зелёный, золотой и синий.",
    celebration: "в доме Астрид пахнет корицей, а за окном танцует свет",
    keepsake: "маленький колокольчик от оленя Лу",
    lesson: "Тепло можно унести с собой, если им поделиться.",
    coverLine: "Снег, сияние и тёплый дом на краю ночи.",
    scene: "mountains",
    visuals: [
      "a child holding a warm glowing stone in a snowy mountain village, blue hour, aurora beginning",
      "a reindeer with a small bell leading across a windy mountain pass, snow and pine trees",
      "a little lighthouse keeper's house by a frozen lake, warm windows, stars, friendly woman silhouette",
      "green and golden aurora dancing above snowy peaks, child and reindeer watching from a warm porch",
    ],
    alts: [
      "Ребёнок с тёплым светящимся камнем в снежной горной деревне",
      "Северный олень с колокольчиком ведёт через ветреный перевал",
      "Тёплый дом смотрительницы у ледяного озера и звёздное небо",
      "Северное сияние над снежными горами, ребёнок и олень на крыльце",
    ],
  },
  city: {
    titleObject: "бронзовый ключ",
    subtitle: "Сказка о трёх дверях и чудесах обычного двора",
    morning: "город просыпается медленно: звенят трамваи, а булочная на углу открывает двери",
    invitation: "бронзовый ключ с бумажной биркой",
    note: "В городе перестали открываться секретные двери. Найди три из них и верни чудеса на улицы.",
    guide: "кот Фонарщик",
    guideDescription: "с пушистым хвостом и маленьким фонариком на ошейнике",
    problem: "секретные двери города перестали открываться, и чудеса спрятались по углам",
    mission: "найти три двери и вернуть свет",
    firstPlace: "крыши старого квартала",
    secondPlace: "часовую башню",
    helper: "бабушка Роза",
    helperAction: "шьёт тёплые шарфы, знает все дворы и хранит ключи от самых неожиданных мест",
    solution: "Три двери открываются одна за другой, и над городом зажигаются окна, гирлянды и маленькие фонарики.",
    celebration: "соседские коты устраивают парад фонариков, а булочная угощает всех тёплыми булочками",
    keepsake: "маленький бумажный фонарик, который светится от добрых слов",
    lesson: "Чудо живёт в обычных дворах — нужно только посмотреть внимательнее.",
    coverLine: "Три двери, один ключ и город, в котором снова зажглись окна.",
    scene: "city",
    visuals: [
      "a child holding a bronze key in a warm European city courtyard at early morning, bakery lights",
      "a magical cat with a lantern collar leading across old rooftops, city lights, deep blue sky",
      "a clock tower and a kind grandmother sewing warm scarves in a cosy shop, golden lamps",
      "city windows and lanterns glowing, neighbours and cats celebrating in a small courtyard at night",
    ],
    alts: [
      "Ребёнок с бронзовым ключом в тёплом городском дворе ранним утром",
      "Волшебный кот с фонариком на ошейнике ведёт по старым крышам",
      "Часовая башня и добрая бабушка, которая шьёт шарфы в уютной мастерской",
      "Светящиеся окна и фонарики, соседи и коты празднуют в маленьком дворе",
    ],
  },
};

const INTEREST_ITEMS: Record<InterestId, string> = {
  space: "звёздный атлас",
  animals: "книга о животных",
  dinosaurs: "маленькая фигурка динозавра",
  drawing: "блокнот и цветные карандаши",
  music: "маленькие колокольчики",
  football: "любимый мяч",
  sea: "ракушка с берега",
  robots: "игрушечный робот",
  princesses: "книжка со сказками о принцессах",
  travel: "карта дорог",
  books: "любимая книга",
  nature: "засушенный лист клёна",
};

const INTEREST_HINTS: Record<InterestId, string> = {
  space: "звёздный атлас подсказывает ритм и порядок, по которому двигаются огни",
  animals: "книга о животных напоминает, что каждый зверь оставляет свой след",
  dinosaurs: "фигурка динозавра помогает заметить отпечаток на камне, похожий на древнюю лапу",
  drawing: "блокнот и карандаши подсказывают нарисовать карту, а карта складывается в нужный маршрут",
  music: "колокольчики звенят в ответ на далёкую мелодию, и по звуку получается найти дорогу",
  football: "мяч откатывается в сторону и показывает, откуда дует ветер",
  sea: "ракушка тихо шумит и напоминает, что у всякой воды есть своё течение",
  robots: "игрушечный робот подсказывает, как починить старый механизм",
  princesses: "книжка со сказками напоминает: доброе слово часто сильнее заклинания",
  travel: "карта дорог помогает увидеть путь там, где остальные видят только туман",
  books: "любимая книга подсказывает нужную мысль в самый подходящий момент",
  nature: "засушенный лист клёна показывает, как течёт вода между корнями",
};

const MOOD_LINES: Record<string, string> = {
  magical: "Воздух становится густым от чудес, и даже камни под ногами начинают тихонько светиться.",
  adventure: "Впереди — неизвестная дорога, и это одновременно немножко страшно и очень интересно.",
  kind: "Рядом становится теплее, будто кто-то невидимый укрывает плечи большим пледом.",
  funny: "В самый важный момент откуда-то появляется пушистый хвост, и серьёзность улыбается.",
  cozy: "Мир замедляется, звуки становятся мягче, и хочется идти дальше спокойно, без спешки.",
};

const packageItems = (interests: string[]) => {
  const items = interests
    .slice(0, 3)
    .map((id) => INTEREST_ITEMS[id as InterestId])
    .filter(Boolean);

  if (!items.length) {
    return { sentence: "В рюкзаке лежит маленькая книжка и карандаш.", list: "маленькая книжка и карандаш" };
  }

  const list = items.length === 1
    ? items[0]
    : items.slice(0, -1).join(", ") + " и " + items[items.length - 1];

  return { sentence: "В рюкзаке " + (items.length === 1 ? "лежит " : "лежат ") + list + ".", list };
};

const quoteDetail = (label: string, value: string) => {
  if (!value) return "";
  return " " + label + " «" + value.replace(/[«»]/g, "").trim() + "».";
};

const letterText = (name: string, profile: Profile) =>
  [
    name + ", здравствуй!",
    "Эта история создана для тебя. В ней есть " + profile.titleObject + ", " + profile.guide + " и дорога, на которой обязательно находится свет.",
    "Когда станет шумно или грустно, вспомни: " + profile.lesson + " Твоё имя уже вписано в эту книгу, а значит, у истории всегда будет продолжение.",
    "Береги свои маленькие таланты. Они умеют превращаться в настоящие чудеса.",
  ].join("\n\n");

const ensureChapterLength = (text: string, atmosphere: (index: number) => string, index: number) => {
  if (text.length >= 260) return text;
  return text + " " + atmosphere(index);
};

export class DemoTextProvider implements TextProvider {
  readonly id = "demo-local-author";
  readonly isDemo = true;

  async generate(request: TextGenerationRequest): Promise<StoryBook> {
    const profile = PROFILES[request.theme] ?? PROFILES.forest;
    const name = request.childName;
    const interests = request.interests;
    const moodLine = MOOD_LINES[request.mood] ?? MOOD_LINES.magical;
    const items = packageItems(interests);
    const hintId = (interests[0] as InterestId | undefined) ?? "books";
    const hint = INTEREST_HINTS[hintId] ?? INTEREST_HINTS.books;
    const detailLine = quoteDetail("На полях записки добавлено:", request.extraDetails);
    const wishLine = quoteDetail("А в самом низу — заветное желание:", request.wish);

    const atmosphere = (index: number) => {
      const lines = [
        "Свет становится мягче, а мир будто прислушивается.",
        "Кажется, даже время замедляет шаг, чтобы не мешать.",
        "Где-то далеко тихо звенит колокольчик, и на душе становится спокойнее.",
        "В такие минуты особенно ясно: маленькое мужество тоже считается.",
      ];
      return lines[index % lines.length];
    };

    const chapters = [
      {
        title: "Утро с маленьким чудом",
        text: [
          "Утро начинается тихо: " + profile.morning + ". " + name + " просыпается и видит на подоконнике " + profile.invitation + ".",
          "К нему приложена записка: «" + profile.note + "»" + detailLine + " " + items.sentence + " Кажется, это утро приготовило не просто завтрак, а приглашение.",
        ].join("\n\n"),
      },
      {
        title: "Шаг за край знакомой карты",
        text: [
          name + " выходит за калитку — и привычная улица заканчивается там, где начинается тропинка, которой вчера ещё не было. На тропинке ждёт " + profile.guide + ", " + profile.guideDescription + ".",
          "«" + profile.problem + ", — говорит " + profile.guide + ". — Если мы не поможем, всё вокруг станет чуть тусклее. Отправимся вместе?» " + moodLine,
          name + " крепче сжимает " + profile.titleObject + ". Ответ получается коротким, но очень важным: «Идём».",
        ].join("\n\n"),
      },
      {
        title: "Дорога, которой нет на карте",
        text: [
          "Сначала идти легко. Потом дорога сужается, трава становится выше, а привычные звуки остаются позади. Друзья добираются до " + profile.firstPlace + ". Здесь всё выглядит почти обычным — если не считать крошечных золотых искр, которые вспыхивают на камнях.",
          "«Первый знак всегда рядом, — говорит " + profile.guide + ". — Нужно только перестать спешить». " + name + " оглядывается и замечает, что искры складываются в стрелку. Она указывает туда, где начинается " + profile.mission + ".",
          "Впереди ждёт " + profile.secondPlace + ", а вместе с ним — первая настоящая загадка.",
        ].join("\n\n"),
      },
      {
        title: "Первый огонь",
        text: [
          "У входа в " + profile.secondPlace + " висит старый знак: три круга, пять лучей и маленькая звёздочка посередине. " + name + " долго смотрит на него, а потом вспоминает: " + hint + ".",
          "Решение приходит не сразу. Сначала — тишина. Потом — осторожный шаг. Потом — ещё один. Когда " + name + " касается нужного места, раздаётся мягкий щелчок, и первый огонь просыпается.",
          "Он не яркий, но его хватает, чтобы вокруг стало видно. " + profile.guide + " тихо говорит: «Один есть. Значит, остальные тоже получится найти».",
        ].join("\n\n"),
      },
      {
        title: "Когда становится тихо",
        text: [
          "Дальше дорога идёт в гору, и вскоре друзья останавливаются передохнуть. " + name + " смотрит на " + profile.titleObject + " и вдруг понимает, что не знает, что делать дальше. Мыслей слишком много, а ответа нет.",
          "«Иногда самый полезный шаг — просто посидеть рядом», — говорит " + profile.guide + ". Они садятся на тёплый камень. " + moodLine + wishLine,
          "Постепенно шум в голове стихает. В тишине слышно, как где-то капает вода. " + name + " поднимает глаза: «Кажется, теперь я вижу». И это уже начало следующего чуда.",
        ].join("\n\n"),
      },
      {
        title: "Помощь приходит неожиданно",
        text: [
          "На пути появляется " + profile.helper + ". " + profile.helperAction + ". Сначала кажется, что помочь может только что-то большое и сильное. Но " + profile.helper + " улыбается: «Мне как раз нужен кто-то внимательный. Большие дела часто начинаются с маленьких рук».",
          "Вместе они проверяют каждый уголок. " + name + " держит " + profile.titleObject + ", " + profile.guide + " прислушивается, а " + profile.helper + " показывает, где спрятались следующие огни. Дело идёт быстрее, когда никто не пытается справиться в одиночку.",
          "Вскоре загораются ещё три огня. Остаётся последний — самый важный.",
        ].join("\n\n"),
      },
      {
        title: "Самый трудный поворот",
        text: [
          "Последний огонь спрятан в месте, где дорога делает резкий поворот. Там темно, и даже " + profile.guide + " не сразу решается идти вперёд. " + name + " чувствует, как сердце стучит быстрее. Страшно — это нормально. Гораздо важнее то, что делается со страхом дальше.",
          name + " вспоминает всё, что уже получилось: первый огонь, тишину у камня, помощь друзей. Потом достаёт из рюкзака " + items.list + " — и среди знакомых вещей замечает подсказку: " + hint + ".",
          "«Я не знаю всего, — говорит " + name + ", — но я знаю следующий шаг». Друзья переглядываются и шагают следом.",
        ].join("\n\n"),
      },
      {
        title: "Свет возвращается",
        text: [
          "На повороте открывается место, которого не было ни на одной карте. " + profile.solution + " " + profile.celebration + ".",
          "Сначала все молчат. Потом " + profile.guide + " смеётся, " + profile.helper + " хлопает в ладоши, а " + name + " смотрит на свет и чувствует, как усталость превращается в радость. " + moodLine,
          "Теперь " + name + " уносит с собой " + profile.keepsake + ". Это не просто подарок, а напоминание: " + profile.lesson,
        ].join("\n\n"),
      },
      {
        title: "Дорога домой",
        text: [
          "Домой идти легче: дорога будто сама узнаёт гостя. По пути " + profile.guide + " рассказывает смешные истории, а " + profile.helper + " машет вслед. Над крышами уже зажигается вечер.",
          name + " возвращается домой и ставит " + profile.titleObject + " на полку рядом с любимыми вещами. Обычный вечер снова становится обычным — но теперь в нём есть место чуду.",
          "Если однажды станет трудно, можно открыть эту историю и вспомнить: «" + profile.lesson + "» Закрывается книга мягко, как будто кто-то поправляет одеяло.",
        ].join("\n\n"),
      },
    ].map((chapter, index) => ({
      title: chapter.title,
      text: ensureChapterLength(chapter.text, atmosphere, index),
    }));

    const scenes: IllustrationScene[] = [0, 2, 4, 7].map((chapterIndex, index) => ({
      chapterIndex,
      alt: profile.alts[index],
      prompt: profile.visuals[index],
    }));

    const story: StoryBook = {
      title: (name + " и " + profile.titleObject).slice(0, 90),
      subtitle: profile.subtitle,
      dedication: "Эта история создана для тебя, " + name + ". " + profile.coverLine,
      chapters,
      illustrationScenes: scenes,
      coverPrompt:
        "front cover of a personalised children's fairytale for " +
        name +
        ", " +
        profile.visuals[0] +
        ", beautiful deep blue and gold book cover artwork without text",
      letter: letterText(name, profile),
      closingLine: profile.lesson,
    };

    return story;
  }
}
