import type { SceneKind } from "@/lib/illustration/scenes";

export type DemoStory = {
  slug: string;
  childName: string;
  age: number;
  title: string;
  subtitle: string;
  theme: "cosmos" | "forest" | "ocean" | "mountains" | "city";
  mood: string;
  label: string;
  dedication: string;
  excerptTitle: string;
  excerpt: string;
  secondTitle: string;
  secondExcerpt: string;
  scene: SceneKind;
  secondScene: SceneKind;
  accent: string;
  coverLine: string;
};

export const DEMO_STORIES: DemoStory[] = [
  {
    slug: "lunny-sad",
    childName: "Аня",
    age: 6,
    title: "Тайна лунного сада",
    subtitle: "Сказка о саде, который просыпается после заката",
    theme: "forest",
    mood: "magical",
    label: "Волшебная · 6 лет",
    dedication: "Ане — девочке, которая умеет замечать свет там, где другие видят только темноту.",
    excerptTitle: "На седьмую ночь сад ответил",
    excerpt: "Сначала зазвенел колокольчик, которого не было. Потом из-под земли показалась серебряная тропинка — и Аня поняла, что ждали именно её.",
    secondTitle: "Каждый цветок помнил своё имя",
    secondExcerpt: "Луна поднялась выше, и сад зажёгся мягким светом. Только одно окно в глубине оставалось тёмным, и кто-то тихо ждал, когда Аня найдёт к нему дорогу.",
    scene: "garden",
    secondScene: "forest",
    accent: "#ffd86b",
    coverLine: "Сад, в котором сбываются маленькие чудеса",
  },
  {
    slug: "polyarnaya-zvezda",
    childName: "Марк",
    age: 8,
    title: "Команда «Полярная звезда»",
    subtitle: "Большое приключение на маленькой планете",
    theme: "cosmos",
    mood: "adventure",
    label: "Приключенческая · 8 лет",
    dedication: "Марку — исследователю, который всегда берёт с собой любопытство и смелость.",
    excerptTitle: "Сигнал с неизвестной орбиты",
    excerpt: "Когда стрелка компаса вместо севера показала на яркую точку в небе, Марк уже знал: это приглашение. Оставалось только собрать команду.",
    secondTitle: "Ни одна звезда не светит в одиночку",
    secondExcerpt: "На маленькой планете их встретили молчаливые роботы. Они умели строить мосты, но совсем не умели дружить — и попросили Марка научить их.",
    scene: "cosmos",
    secondScene: "city",
    accent: "#8eb3ff",
    coverLine: "Один сигнал. Одна команда. Миллион звёзд",
  },
  {
    slug: "more-sheptom",
    childName: "Лёва",
    age: 5,
    title: "Море, которое умеет шептать",
    subtitle: "Колыбельная сказка для самого маленького моряка",
    theme: "ocean",
    mood: "cozy",
    label: "Перед сном · 5 лет",
    dedication: "Лёве — моряку, который знает: дома не обязательно должно быть тихо.",
    excerptTitle: "Письмо, приплывшее в бутылке",
    excerpt: "Волна оставила на песке зелёную бутылку. Внутри лежала записка: «Маяк устал светить. Помоги ему найти новую звезду».",
    secondTitle: "Тише. Слышишь, море дышит?",
    secondExcerpt: "Лёва приложил ладонь к тёплому камню. Море рассказывало свою историю медленно, как добрая колыбельная, и каждый вдох уносил тревогу.",
    scene: "ocean",
    secondScene: "forest",
    accent: "#ffb991",
    coverLine: "Тёплая история о маяке, море и доме",
  },
];
