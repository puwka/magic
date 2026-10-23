export type SceneKind =
  | "cosmos"
  | "forest"
  | "ocean"
  | "garden"
  | "mountains"
  | "city"
  | "dinosaurs"
  | "home";

export type SceneOptions = {
  kind: SceneKind;
  seed?: number;
  label?: string;
};

const round = (value: number) => Math.round(value * 10) / 10;

const rng = (seed: number) => {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const child = (x: number, y: number, scale = 1, coat = "#f4654e", flip = false) => {
  const transform = "translate(" + x + " " + y + ") scale(" + (flip ? -scale : scale) + " " + scale + ")";
  return (
    '<g transform="' + transform + '">' +
      '<ellipse cx="0" cy="8" rx="64" ry="12" fill="#081330" opacity=".22"/>' +
      '<path d="M-24 4 C-30 -42 -24 -75 -20 -95 L20 -95 C26 -72 30 -35 24 4 Z" fill="' + coat + '"/>' +
      '<path d="M-20 -92 C-16 -126 -7 -142 0 -142 C8 -142 17 -126 21 -92 Z" fill="#17213c"/>' +
      '<circle cx="0" cy="-154" r="22" fill="#17213c"/>' +
      '<path d="M-21 -105 L-51 -68 L-44 -58 L-15 -88" fill="' + coat + '" stroke="' + coat + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M21 -105 L48 -78 L42 -68 L15 -88" fill="' + coat + '" stroke="' + coat + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M-12 -89 C-4 -82 4 -82 12 -89 L12 -78 C4 -71 -4 -71 -12 -78 Z" fill="#ffd86b"/>' +
      '<path d="M-17 1 L-21 46 L-7 46 L0 8 L7 46 L21 46 L17 1 Z" fill="#17213c"/>' +
    '</g>'
  );
};

const stars = (rand: () => number, count: number, maxY = 620) => {
  const result: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const x = round(rand() * 1600);
    const y = round(rand() * maxY);
    const r = round(rand() * 2.6 + 0.7);
    const opacity = round(rand() * 0.55 + 0.32);
    result.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff7dd" opacity="' + opacity + '"/>');
    if (index % 11 === 0) {
      result.push('<path d="M' + x + ' ' + (y - 9) + ' L' + (x + 2) + ' ' + (y - 2) + ' L' + (x + 9) + ' ' + y + ' L' + (x + 2) + ' ' + (y + 2) + ' L' + x + ' ' + (y + 9) + ' L' + (x - 2) + ' ' + (y + 2) + ' L' + (x - 9) + ' ' + y + ' L' + (x - 2) + ' ' + (y - 2) + ' Z" fill="#fff3c2" opacity="' + opacity + '"/>');
    }
  }
  return result.join("");
};

const waves = (yBase: number, color: string, opacity = 1) => {
  return (
    '<path d="M0 ' + yBase + ' C220 ' + (yBase - 34) + ' 380 ' + (yBase + 44) + ' 590 ' + (yBase + 4) +
      ' S980 ' + (yBase - 45) + ' 1160 ' + (yBase + 8) + ' S1450 ' + (yBase + 30) + ' 1600 ' + (yBase - 6) +
      ' L1600 1100 L0 1100 Z" fill="' + color + '" opacity="' + opacity + '"/>'
  );
};

const pines = (rand: () => number, side: "left" | "right", color = "#0b1a30") => {
  const parts: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const x = side === "left" ? 30 + index * 110 + rand() * 55 : 1600 - 40 - index * 105 - rand() * 45;
    const base = 1010 - rand() * 120;
    const height = 290 + rand() * 330;
    const half = height * 0.28;
    parts.push(
      '<path d="M' + round(x) + ' ' + round(base - height) + ' L' + round(x - half) + ' ' + round(base) +
        ' L' + round(x + half) + ' ' + round(base) + ' Z" fill="' + color + '"/>' +
      '<path d="M' + round(x) + ' ' + round(base - height * 1.25) + ' L' + round(x - half * 0.7) + ' ' + round(base - height * 0.25) +
        ' L' + round(x + half * 0.7) + ' ' + round(base - height * 0.25) + ' Z" fill="' + color + '"/>' +
      '<rect x="' + round(x - 4) + '" y="' + round(base - 6) + '" width="8" height="30" fill="' + color + '"/>'
    );
  }
  return parts.join("");
};

const flower = (x: number, y: number, height: number, color: string, stem = "#2e7b73") => {
  const top = y - height;
  return (
    '<path d="M' + x + ' ' + y + ' C' + (x - 20) + ' ' + (y - height * 0.5) + ' ' + (x + 16) + ' ' + (y - height * 0.7) + ' ' + x + ' ' + top + '" fill="none" stroke="' + stem + '" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M' + (x - 4) + ' ' + (y - height * 0.55) + ' C' + (x - 52) + ' ' + (y - height * 0.7) + ' ' + (x - 54) + ' ' + (y - height * 0.9) + ' ' + (x - 22) + ' ' + (y - height * 0.83) + ' C' + (x - 25) + ' ' + (y - height * 0.65) + ' ' + (x - 15) + ' ' + (y - height * 0.58) + ' ' + x + ' ' + (y - height * 0.55) + ' Z" fill="' + stem + '"/>' +
    '<g transform="translate(' + x + ' ' + top + ')">' +
      '<circle cx="-22" cy="-3" r="22" fill="' + color + '" opacity=".9"/>' +
      '<circle cx="22" cy="-3" r="22" fill="' + color + '" opacity=".9"/>' +
      '<circle cx="0" cy="-26" r="25" fill="' + color + '"/>' +
      '<circle cx="0" cy="18" r="20" fill="' + color + '" opacity=".88"/>' +
      '<circle cx="0" cy="-3" r="13" fill="#ffd86b"/>' +
    '</g>'
  );
};

export const createSceneSvg = ({ kind, seed = 7, label }: SceneOptions) => {
  const rand = rng(seed);
  const uid = "s" + kind + seed;
  const grainId = uid + "-grain";
  const skyId = uid + "-sky";
  const glowId = uid + "-glow";
  const ringId = uid + "-ring";
  const parts: string[] = [];
  const add = (section: string) => parts.push(section);

  const skyStops: Record<SceneKind, string> = {
    cosmos: '<stop offset="0" stop-color="#07122e"/><stop offset=".55" stop-color="#1a2b7d"/><stop offset="1" stop-color="#5969c9"/>',
    forest: '<stop offset="0" stop-color="#0a1734"/><stop offset=".62" stop-color="#25477b"/><stop offset="1" stop-color="#9a9bbf"/>',
    ocean: '<stop offset="0" stop-color="#19285f"/><stop offset=".5" stop-color="#5464b1"/><stop offset=".72" stop-color="#f09a79"/><stop offset="1" stop-color="#ffd397"/>',
    garden: '<stop offset="0" stop-color="#0a1830"/><stop offset=".55" stop-color="#1e3558"/><stop offset="1" stop-color="#4f7a79"/>',
    mountains: '<stop offset="0" stop-color="#07142f"/><stop offset=".5" stop-color="#12334c"/><stop offset="1" stop-color="#6e8d99"/>',
    city: '<stop offset="0" stop-color="#111c43"/><stop offset=".6" stop-color="#414b8f"/><stop offset="1" stop-color="#d98e86"/>',
    dinosaurs: '<stop offset="0" stop-color="#173e47"/><stop offset=".54" stop-color="#6e9c8f"/><stop offset="1" stop-color="#f2c897"/>',
    home: '<stop offset="0" stop-color="#0d1a32"/><stop offset="1" stop-color="#263251"/>',
  };

  add('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100" width="1600" height="1100" role="img" aria-label="' + (label || "Иллюстрация к сказке") + '">');
  add('<defs>');
  add('<linearGradient id="' + skyId + '" x1="0" y1="0" x2="0" y2="1">' + skyStops[kind] + '</linearGradient>');
  add('<radialGradient id="' + glowId + '"><stop offset="0" stop-color="#fff2bf" stop-opacity=".85"/><stop offset=".45" stop-color="#ffdf8a" stop-opacity=".22"/><stop offset="1" stop-color="#ffd86b" stop-opacity="0"/></radialGradient>');
  add('<linearGradient id="' + ringId + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd86b" stop-opacity=".8"/><stop offset=".5" stop-color="#f6b883" stop-opacity=".2"/><stop offset="1" stop-color="#ffd86b" stop-opacity=".7"/></linearGradient>');
  add('<pattern id="' + grainId + '" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r=".8" fill="#fff" opacity=".22"/><circle cx="19" cy="17" r=".6" fill="#fff" opacity=".18"/><circle cx="11" cy="23" r=".5" fill="#0b1328" opacity=".2"/></pattern>');
  add('</defs>');

  add('<rect width="1600" height="1100" fill="url(#' + skyId + ')"/>');

  if (kind === "cosmos") {
    add(stars(rand, 110, 800));
    add('<circle cx="1270" cy="275" r="285" fill="url(#' + glowId + ')" opacity=".5"/>');
    add('<circle cx="1270" cy="275" r="166" fill="#7586dc"/>');
    add('<path d="M1110 275 C1120 150 1390 130 1440 250 C1330 325 1200 340 1110 275 Z" fill="#9ba9f0" opacity=".48"/>');
    add('<path d="M1140 345 C1260 285 1390 285 1470 350 C1340 410 1220 402 1140 345 Z" fill="#4a5cbc" opacity=".6"/>');
    add('<ellipse cx="1270" cy="285" rx="324" ry="62" fill="none" stroke="url(#' + ringId + ')" stroke-width="20" transform="rotate(-16 1270 285)"/>');
    add('<circle cx="450" cy="230" r="72" fill="#f0c889" opacity=".92"/>');
    add('<circle cx="430" cy="212" r="14" fill="#d5aa70" opacity=".4"/><circle cx="475" cy="255" r="8" fill="#d5aa70" opacity=".32"/>');
    add('<path d="M0 780 C220 700 380 754 560 710 C760 660 880 730 1060 703 C1280 670 1400 742 1600 690 L1600 1100 L0 1100 Z" fill="#14255d"/>');
    add('<path d="M0 860 C250 790 380 850 600 816 C820 780 1000 850 1240 808 C1410 778 1500 826 1600 804 L1600 1100 L0 1100 Z" fill="#0b1738"/>');
    add('<path d="M0 990 C310 910 540 960 760 928 C1010 892 1220 958 1600 892 L1600 1100 L0 1100 Z" fill="#071128"/>');
    add(child(495, 952, 0.86, "#f4654e"));
    add('<g transform="translate(585 855) rotate(-24)"><rect x="0" y="0" width="15" height="168" rx="7" fill="#0b1129"/><rect x="-22" y="-13" width="60" height="20" rx="10" fill="#0b1129"/><circle cx="8" cy="-5" r="2" fill="#ffd86b"/></g>');
    add('<path d="M1360 530 l8 20 21 8 -21 8 -8 21 -8 -21 -21 -8 21 -8z" fill="#ffd86b" opacity=".8"/>');
    add('<path d="M1330 575 C1300 610 1294 645 1328 663" fill="none" stroke="#ffd86b" stroke-width="3" stroke-linecap="round" opacity=".75"/>');
  }

  if (kind === "forest") {
    add(stars(rand, 78, 570));
    add('<circle cx="1240" cy="230" r="230" fill="url(#' + glowId + ')"/>');
    add('<circle cx="1240" cy="230" r="126" fill="#f7e6b8"/>');
    add('<circle cx="1200" cy="190" r="16" fill="#dfcaa1" opacity=".4"/><circle cx="1270" cy="270" r="10" fill="#dfcaa1" opacity=".35"/>');
    add('<path d="M0 760 C220 615 445 700 620 620 C810 535 1030 630 1240 588 C1400 557 1510 620 1600 590 L1600 1100 L0 1100 Z" fill="#152d40"/>');
    add('<path d="M0 845 C260 760 430 820 670 760 C900 705 1120 775 1360 730 C1460 712 1540 730 1600 716 L1600 1100 L0 1100 Z" fill="#102639"/>');
    add(pines(rand, "left", "#0a1b2b"));
    add(pines(rand, "right", "#0a1b2b"));
    add('<path d="M730 1100 C810 990 705 910 825 810 C900 746 975 700 1000 630" fill="none" stroke="#efdba8" stroke-width="68" stroke-linecap="round" opacity=".28"/>');
    add('<path d="M735 1100 C812 995 714 920 832 820 C905 758 978 708 1000 635" fill="none" stroke="#ffefc5" stroke-width="30" stroke-linecap="round" opacity=".58"/>');
    add('<g opacity=".95">' +
      '<path d="M196 830 q36 -24 73 0 v86 q-36 -17 -73 0z" fill="#f4d89c" opacity=".9"/>' +
      '<path d="M196 830 q36 -24 73 0 v86 q-36 -17 -73 0z" fill="none" stroke="#d7b06d" stroke-width="2"/>' +
    '</g>');
    add(child(490, 950, 0.92, "#f4654e"));
    add('<g transform="translate(600 832)"><rect x="-22" y="-40" width="44" height="62" rx="8" fill="#ffd86b" opacity=".2"/><rect x="-15" y="-32" width="30" height="44" rx="6" fill="#ffd86b"/><path d="M-11 -30 C-11 -44 11 -44 11 -30" fill="none" stroke="#d0a840" stroke-width="4"/><path d="M0 -40 L0 -58" stroke="#d0a840" stroke-width="3"/></g>');
    add('<g transform="translate(800 970)"><path d="M-68 10 C-70 -26 -40 -48 -5 -40 C20 -58 62 -36 60 0 C82 16 65 36 35 34 L-45 34 C-70 34 -80 24 -68 10 Z" fill="#d98957"/><path d="M52 2 L86 -24 L95 -7 L70 20 Z" fill="#d98957"/><circle cx="50" cy="-8" r="3" fill="#18223a"/><path d="M-64 4 C-46 30 -8 30 25 6" fill="none" stroke="#f8d7a3" stroke-width="8" opacity=".75"/><path d="M-52 36 L-60 68 L-40 66 L-31 36Z" fill="#b56f48"/><path d="M25 36 L18 68 L39 66 L46 34Z" fill="#b56f48"/></g>');
    for (let index = 0; index < 12; index += 1) {
      add('<circle cx="' + round(330 + rand() * 700) + '" cy="' + round(680 + rand() * 240) + '" r="' + round(2 + rand() * 3) + '" fill="#ffd86b" opacity="' + round(0.45 + rand() * 0.45) + '"/>');
    }
  }

  if (kind === "ocean") {
    add(stars(rand, 36, 390));
    add('<circle cx="1160" cy="400" r="245" fill="url(#' + glowId + ')" opacity=".65"/>');
    add('<circle cx="1160" cy="400" r="108" fill="#ffd08f"/>');
    add('<path d="M0 612 C240 575 380 620 600 600 C850 576 1000 626 1230 590 C1415 562 1510 590 1600 585 L1600 695 L0 695 Z" fill="#2d4681" opacity=".8"/>');
    add(waves(660, "#1e3470"));
    add(waves(745, "#18295d"));
    add(waves(850, "#101e46"));
    add('<path d="M0 1100 L0 906 C200 876 340 940 520 910 C700 878 840 930 1010 902 C1240 860 1430 936 1600 895 L1600 1100 Z" fill="#0b1633"/>');
    add('<path d="M1180 670 L1180 360 L1220 330 L1260 360 L1260 670 Z" fill="#f2e4c6"/>');
    add('<path d="M1160 380 L1220 300 L1280 380 Z" fill="#f4654e"/>');
    add('<rect x="1200" y="395" width="40" height="36" rx="5" fill="#ffd86b"/>');
    add('<path d="M1140 700 C1170 620 1200 600 1220 600 C1240 600 1280 635 1300 700 Z" fill="#0b1730"/>');
    add('<path d="M1150 704 l14 -86 22 33 24 -34 16 87z" fill="#f2dfb4" opacity=".65"/>');
    add('<path d="M1250 322 C1350 300 1390 360 1360 460" fill="none" stroke="#ffd86b" stroke-width="18" stroke-linecap="round" opacity=".16"/>');
    add('<g transform="translate(790 638) scale(1.1)"><path d="M-100 45 L100 45 L62 110 L-60 110 Z" fill="#151f3e"/><path d="M0 42 L0 -150" stroke="#e7d8b8" stroke-width="8"/><path d="M4 -132 L100 -45 L4 8 Z" fill="#f4e3c2"/><path d="M-3 -114 L-82 -48 L-3 0 Z" fill="#f1d6a7" opacity=".8"/></g>');
    add('<path d="M560 920 C640 880 690 900 730 930 C670 955 610 968 550 958 Z" fill="#f2c38e" opacity=".2"/>');
    add('<path d="M515 916 C590 912 640 936 700 930" fill="none" stroke="#f2c38e" stroke-width="4" opacity=".6"/>');
    add('<g transform="translate(1140 870)"><path d="M0 0 C-40 -50 -12 -112 53 -104 C105 -98 135 -42 104 5 C80 38 32 37 0 0 Z" fill="#262e55"/><path d="M43 -104 C52 -142 99 -146 103 -104" fill="none" stroke="#262e55" stroke-width="19"/><circle cx="35" cy="-35" r="3" fill="#9ea5d7"/></g>');
    add(child(360, 960, 0.9, "#f4654e"));
    add('<path d="M130 900 l9 22 23 9 -23 9 -9 23 -9 -23 -23 -9 23 -9z" fill="#ffd86b" opacity=".7"/>');
  }

  if (kind === "garden") {
    add(stars(rand, 86, 540));
    add('<circle cx="800" cy="280" r="320" fill="url(#' + glowId + ')" opacity=".36"/>');
    add('<circle cx="800" cy="270" r="190" fill="#f5e7c0"/>');
    add('<circle cx="740" cy="215" r="30" fill="#e5d4ac" opacity=".4"/><circle cx="860" cy="330" r="18" fill="#e5d4ac" opacity=".36"/>');
    add('<path d="M0 1010 C220 900 370 960 520 920 C720 866 900 940 1080 904 C1280 862 1450 924 1600 880 L1600 1100 L0 1100 Z" fill="#132d3a"/>');
    add('<path d="M265 1010 C255 760 345 600 480 545 C555 515 620 560 600 640 C550 780 520 900 555 1020 Z" fill="#123f42"/>');
    add('<path d="M1335 1010 C1345 760 1255 600 1120 545 C1045 515 980 560 1000 640 C1050 780 1080 900 1045 1020 Z" fill="#113b3e"/>');
    add('<path d="M0 1040 C300 910 430 978 590 930 C780 870 940 945 1120 910 C1320 870 1460 930 1600 895 L1600 1100 L0 1100 Z" fill="#0b202e"/>');
    add('<path d="M400 1040 C520 970 670 1000 780 958 C900 912 1010 950 1160 900" fill="none" stroke="#e9d4a0" stroke-width="55" stroke-linecap="round" opacity=".23"/>');
    add(flower(140, 1010, 440, "#e87786"));
    add(flower(260, 1030, 300, "#ffd86b"));
    add(flower(1450, 1000, 500, "#e87786"));
    add(flower(1310, 1040, 330, "#f5b2b8"));
    add(flower(1110, 1030, 250, "#ffd86b"));
    add(flower(760, 1040, 210, "#f5b2b8"));
    add('<path d="M420 835 C500 800 600 802 680 830" fill="none" stroke="#2c6966" stroke-width="16" stroke-linecap="round"/>');
    add('<g transform="translate(560 842)"><path d="M0 0 C30 -90 140 -105 170 -20 C143 20 36 40 0 0Z" fill="#b9d5c4" opacity=".22"/></g>');
    add(child(705, 955, 0.94, "#f4654e"));
    add('<g transform="translate(804 900)"><path d="M-14 -8 L30 -8 L22 35 L-5 35 Z" fill="#ffd86b"/><path d="M-2 -8 C-2 -28 18 -28 18 -8" fill="none" stroke="#d2ae46" stroke-width="4"/></g>');
    for (let index = 0; index < 20; index += 1) {
      add('<circle cx="' + round(380 + rand() * 860) + '" cy="' + round(560 + rand() * 410) + '" r="' + round(1.8 + rand() * 3.4) + '" fill="#ffe1a0" opacity="' + round(0.4 + rand() * 0.55) + '"/>');
    }
    add('<path d="M1040 1010 C1160 840 1200 780 1120 730 C1070 700 1010 760 1040 810 C1070 860 1060 880 990 1010Z" fill="#174b47" opacity=".8"/>');
  }

  if (kind === "mountains") {
    add(stars(rand, 80, 540));
    add('<circle cx="1150" cy="230" r="210" fill="url(#' + glowId + ')" opacity=".4"/>');
    add('<circle cx="1150" cy="225" r="96" fill="#f7e8c6"/>');
    add('<path d="M0 560 C300 410 530 505 700 340 C800 245 920 290 1010 410 C1120 555 1290 500 1600 330 L1600 760 L0 760 Z" fill="#2e6f77" opacity=".35"/>');
    add('<path d="M0 620 C300 500 480 560 620 470 C760 380 900 440 1030 540 C1180 650 1370 590 1600 440 L1600 850 L0 850 Z" fill="#173c4b" opacity=".75"/>');
    add('<path d="M0 760 L290 445 L420 590 L560 350 L730 560 L870 460 L1030 650 L1240 395 L1600 720 L1600 1100 L0 1100 Z" fill="#234e5d"/>');
    add('<path d="M290 445 L250 500 L300 485 L320 520 L360 490 L385 550 L420 590 L350 570 L310 600 L270 560Z" fill="#e7e9de" opacity=".88"/>');
    add('<path d="M560 350 L510 415 L565 400 L590 440 L630 398 L685 465 L730 560 L655 525 L600 550 L555 502Z" fill="#eef0e4"/>');
    add('<path d="M1240 395 L1195 465 L1240 450 L1270 490 L1310 445 L1360 505 L1400 565 L1320 525 L1270 545 L1230 490Z" fill="#f3f1e6"/>');
    add('<path d="M0 860 C280 790 480 840 690 802 C910 760 1120 830 1330 790 C1450 768 1540 792 1600 780 L1600 1100 L0 1100 Z" fill="#0e2938"/>');
    add('<path d="M960 1030 C970 930 1010 880 1090 880 C1180 880 1210 938 1220 1030 Z" fill="#0a1c2a"/>');
    add('<rect x="1010" y="920" width="160" height="110" fill="#0a1c2a"/>');
    add('<path d="M990 920 L1090 840 L1190 920 Z" fill="#0a1c2a"/>');
    add('<rect x="1050" y="948" width="42" height="46" rx="2" fill="#ffd86b"/>');
    add('<path d="M1071 948 L1071 994 M1050 971 L1092 971" stroke="#b6783f" stroke-width="3" opacity=".55"/>');
    add('<path d="M1080 880 C1090 820 1110 810 1120 830" fill="none" stroke="#aabec0" stroke-width="8" stroke-linecap="round" opacity=".28"/>');
    add('<path d="M0 1080 C300 1010 460 1040 700 1000 C920 964 1140 985 1600 930 L1600 1100 L0 1100 Z" fill="#091a28"/>');
    add(child(520, 960, 0.88, "#f4654e"));
    add('<g transform="translate(650 1000)"><path d="M-60 0 C-54 -37 -28 -49 0 -31 C8 -57 53 -52 54 -15 C75 -4 66 22 40 22 L-32 22 C-55 22 -67 12 -60 0Z" fill="#d7c4a8"/><path d="M-52 21 L-58 55 L-38 53 L-28 23Z" fill="#c4ae90"/><path d="M28 22 L22 55 L43 54 L49 20Z" fill="#c4ae90"/><path d="M54 3 C74 -2 82 7 86 18 L67 19Z" fill="#d7c4a8"/></g>');
    add('<path d="M1350 850 C1450 900 1480 1000 1440 1100 L1600 1100 L1600 810 C1510 840 1450 830 1350 850Z" fill="#0b202d"/>');
  }

  if (kind === "city") {
    add(stars(rand, 70, 440));
    add('<circle cx="360" cy="230" r="210" fill="url(#' + glowId + ')" opacity=".35"/>');
    add('<circle cx="360" cy="230" r="108" fill="#f8e8bc"/>');
    add('<path d="M0 620 L180 620 L180 450 L280 450 L280 580 L390 580 L390 350 L520 350 L520 560 L650 560 L650 520 L760 520 L760 320 L880 320 L880 560 L1020 560 L1020 470 L1140 470 L1140 600 L1280 600 L1280 420 L1410 420 L1410 550 L1600 550 L1600 1100 L0 1100Z" fill="#1a2752"/>');
    add('<g fill="#ffd86b" opacity=".8">' +
      '<rect x="215" y="500" width="18" height="24" rx="2"/><rect x="250" y="500" width="18" height="24" rx="2"/>' +
      '<rect x="420" y="410" width="18" height="24" rx="2"/><rect x="455" y="460" width="18" height="24" rx="2"/>' +
      '<rect x="802" y="380" width="18" height="24" rx="2"/><rect x="832" y="430" width="18" height="24" rx="2"/>' +
      '<rect x="1320" y="480" width="18" height="24" rx="2"/><rect x="1350" y="530" width="18" height="24" rx="2"/>' +
    '</g>');
    add('<g fill="#f6d7ae" opacity=".28"><rect x="420" y="440" width="18" height="24" rx="2"/><rect x="802" y="410" width="18" height="24" rx="2"/><rect x="1320" y="512" width="18" height="24" rx="2"/></g>');
    add('<path d="M0 800 L230 800 L230 690 L380 690 L380 790 L520 790 L520 620 L710 620 L710 820 L930 820 L930 670 L1130 670 L1130 810 L1330 810 L1330 700 L1600 700 L1600 1100 L0 1100Z" fill="#111b3f"/>');
    add('<g fill="#ffd86b" opacity=".55"><rect x="270" y="725" width="24" height="30" rx="2"/><rect x="560" y="675" width="25" height="28" rx="2"/><rect x="650" y="675" width="25" height="28" rx="2"/><rect x="985" y="715" width="26" height="30" rx="2"/><rect x="1390" y="740" width="28" height="32" rx="2"/></g>');
    add('<path d="M0 1020 C250 940 400 980 580 936 C760 892 990 960 1230 920 C1370 898 1500 930 1600 908 L1600 1100 L0 1100 Z" fill="#0a142e"/>');
    add('<path d="M910 1100 L910 900 L1010 900 L1010 1100" fill="#e7c891" opacity=".33"/>');
    add('<path d="M915 905 L975 850 L1035 905" fill="#e7c891" opacity=".22"/>');
    add(child(515, 960, 1, "#f4654e"));
    add('<path d="M588 930 C628 860 650 825 690 797" fill="none" stroke="#e8d6ad" stroke-width="3" opacity=".7"/>');
    add('<g transform="translate(695 790)"><ellipse cx="0" cy="0" rx="32" ry="42" fill="#e87786"/><ellipse cx="0" cy="0" rx="32" ry="42" fill="none" stroke="#f6c7aa" stroke-width="2" opacity=".6"/><path d="M0 40 L-4 76" stroke="#e8d6ad" stroke-width="2"/></g>');
    add('<g transform="translate(870 975)"><path d="M-52 25 C-58 -16 -20 -38 6 -18 C20 -45 62 -30 57 5 C75 17 60 40 32 39 L-32 39 C-56 39 -66 31 -52 25Z" fill="#141d3a"/><path d="M48 -4 L95 -31 L102 -12 L72 17 Z" fill="#141d3a"/><circle cx="48" cy="-12" r="2.5" fill="#f5dd9b"/></g>');
    add('<circle cx="1390" cy="260" r="3" fill="#fff3c6"/><circle cx="1470" cy="330" r="2" fill="#fff3c6"/>');
  }

  if (kind === "dinosaurs") {
    add('<circle cx="410" cy="260" r="290" fill="url(#' + glowId + ')" opacity=".3"/>');
    add('<circle cx="410" cy="260" r="118" fill="#ffe1a1" opacity=".78"/>');
    add('<path d="M0 640 C250 540 420 580 620 500 C800 430 1000 500 1200 450 C1380 410 1500 460 1600 430 L1600 1100 L0 1100 Z" fill="#31685e" opacity=".55"/>');
    add('<path d="M1180 575 C1260 430 1390 410 1470 470 C1530 515 1550 555 1580 620 L1180 620Z" fill="#24514d"/>');
    add('<path d="M1330 470 C1360 380 1410 350 1450 360 C1430 400 1430 440 1430 470" fill="#b97154" opacity=".65"/>');
    add('<path d="M0 780 C250 690 440 750 620 690 C820 625 1030 700 1220 660 C1380 625 1510 660 1600 640 L1600 1100 L0 1100Z" fill="#1c4d49"/>');
    add('<path d="M0 930 C290 850 480 910 710 860 C920 815 1140 880 1380 820 C1460 802 1550 820 1600 808 L1600 1100 L0 1100Z" fill="#123c3d"/>');
    add('<g transform="translate(1020 760)"><path d="M-190 120 C-160 30 -84 -10 10 0 C88 8 144 55 160 130 L110 205 L-120 205Z" fill="#80a893"/><path d="M-36 -14 C-28 -148 28 -202 92 -172 C160 -140 132 -52 48 -16" fill="#80a893"/><circle cx="94" cy="-172" r="51" fill="#80a893"/><path d="M139 -195 C170 -190 190 -179 203 -164" fill="none" stroke="#80a893" stroke-width="17" stroke-linecap="round"/><circle cx="117" cy="-188" r="5" fill="#173e3d"/><path d="M-155 197 L-162 245 L-128 245 L-107 203" fill="#80a893"/><path d="M72 200 L62 245 L98 245 L106 200" fill="#80a893"/><path d="M-90 82 C-10 120 100 122 156 82" fill="none" stroke="#5d8878" stroke-width="8" opacity=".6"/></g>');
    add('<path d="M0 1050 C300 990 520 1030 760 990 C980 950 1220 1000 1600 940 L1600 1100 L0 1100Z" fill="#0c2d31"/>');
    add('<g fill="#174b45">' +
      '<path d="M90 1060 C70 950 120 890 155 900 C185 910 178 992 220 1060Z"/><path d="M260 1080 C230 970 280 905 316 916 C348 927 322 1004 370 1080Z"/>' +
      '<path d="M1440 1070 C1420 960 1470 900 1505 910 C1535 920 1528 1002 1570 1070Z"/>' +
    '</g>');
    add(child(480, 990, 0.9, "#f4654e"));
    add('<g transform="translate(635 1015)"><path d="M-45 10 C-52 -26 -18 -44 7 -25 C16 -47 54 -36 48 -7 C66 6 54 27 30 27 L-30 27 C-52 27 -59 17 -45 10Z" fill="#7fa58f"/><path d="M46 2 L84 -16 L88 3 L61 23Z" fill="#7fa58f"/><circle cx="45" cy="-5" r="2.3" fill="#183f3c"/></g>');
    add('<path d="M560 450 C610 410 680 405 730 435" fill="none" stroke="#d6dfc3" stroke-width="4" opacity=".35"/>');
    add('<path d="M600 380 C620 360 650 360 670 380" fill="none" stroke="#d6dfc3" stroke-width="4" opacity=".27"/>');
  }

  if (kind === "home") {
    add('<rect width="1600" height="1100" fill="#182441"/>');
    add('<rect x="0" y="760" width="1600" height="340" fill="#0e1931"/>');
    add('<path d="M0 760 L1600 760" stroke="#364e72" stroke-width="3" opacity=".35"/>');
    add('<path d="M145 190 C145 110 235 80 320 110 C410 60 540 100 550 220 L550 690 L145 690 Z" fill="#0a1833"/>');
    add('<path d="M160 220 C200 150 300 140 360 180 C430 140 520 170 535 245 L535 620 L160 620 Z" fill="#101f42"/>');
    add(stars(rand, 28, 520));
    add('<circle cx="465" cy="300" r="110" fill="url(#' + glowId + ')" opacity=".5"/>');
    add('<circle cx="465" cy="295" r="62" fill="#f5e6bd"/>');
    add('<path d="M200 540 C320 520 430 538 520 510 L520 620 L200 620Z" fill="#1b3151"/>');
    add('<path d="M805 0 L1600 0 L1600 760 L805 760 Z" fill="#1e2d4d"/>');
    add('<rect x="1210" y="230" width="210" height="290" rx="4" fill="#d5ad6f" opacity=".13"/>');
    add('<rect x="1235" y="255" width="160" height="240" fill="#0d1c35"/>');
    add('<circle cx="1380" cy="295" r="26" fill="#ffd86b" opacity=".75"/>');
    add('<path d="M1000 780 L1000 545 C1000 490 1070 470 1120 510 C1180 480 1250 515 1245 570 L1245 780Z" fill="#24405f"/>');
    add('<path d="M1035 780 L1035 585 C1035 545 1090 530 1120 558 C1160 535 1210 555 1205 600 L1205 780Z" fill="#355872"/>');
    add('<rect x="880" y="740" width="520" height="140" rx="20" fill="#0e1a32"/>');
    add('<path d="M756 960 C756 880 900 860 1020 900 C1140 940 1240 900 1310 945 C1340 966 1310 1000 1260 1000 L800 1000 C760 1000 740 985 756 960Z" fill="#1d3552"/>');
    add('<ellipse cx="880" cy="1030" rx="420" ry="50" fill="#0a1429" opacity=".65"/>');
    add('<g transform="translate(1035 850)"><circle cx="0" cy="0" r="164" fill="#ffcf65" opacity=".07"/><path d="M-82 168 L-70 50 L-16 0 L40 50 L55 168Z" fill="#0b152c"/><circle cx="0" cy="-35" r="39" fill="#0b152c"/><path d="M-38 30 C-82 80 -82 150 -54 170 L-12 168 L-34 80Z" fill="#0b152c"/><path d="M38 30 C82 80 82 150 54 170 L12 168 L34 80Z" fill="#0b152c"/></g>');
    add('<rect x="975" y="970" width="125" height="68" rx="8" fill="#efe0bc"/>');
    add('<path d="M995 982 L1080 982 M995 1000 L1060 1000 M995 1018 L1070 1018" stroke="#a89774" stroke-width="3" opacity=".55"/>');
    add('<g transform="translate(470 850)">' +
      '<rect x="-58" y="0" width="116" height="188" rx="12" fill="#14233d"/>' +
      '<rect x="-45" y="22" width="90" height="140" rx="8" fill="#263f5c"/>' +
      '<ellipse cx="0" cy="196" rx="82" ry="12" fill="#071127" opacity=".5"/>' +
      '<path d="M0 -4 L0 -190" stroke="#1d304e" stroke-width="8"/>' +
      '<path d="M-80 -158 C-40 -200 45 -196 78 -155 L40 -130 L-42 -132Z" fill="#e6c889" opacity=".88"/>' +
      '<path d="M-54 -154 C-20 -178 30 -177 54 -151 L20 -142 L-25 -143Z" fill="#fff0c4" opacity=".72"/>' +
    '</g>');
    add('<g transform="translate(850 1010)"><path d="M-75 20 C-72 -24 -20 -40 14 -14 C55 -30 88 3 67 30 C90 55 55 66 28 57 L-38 57 C-72 57 -90 40 -75 20Z" fill="#0a1429"/><path d="M58 8 L112 -19 L120 4 L83 34Z" fill="#0a1429"/><circle cx="55" cy="-5" r="3" fill="#ffd86b"/></g>');
    add('<g transform="translate(1410 720)"><path d="M0 0 C20 80 35 140 15 230" stroke="#49725e" stroke-width="10" fill="none"/><path d="M8 24 C-80 10 -100 80 -44 92 C-8 100 6 64 8 24Z" fill="#3d6655"/><path d="M19 70 C100 45 122 110 68 130 C35 142 10 110 19 70Z" fill="#4d785f"/><rect x="-20" y="225" width="75" height="66" rx="8" fill="#b87355"/></g>');
    add('<rect x="1250" y="850" width="250" height="15" rx="7" fill="#715b45"/><rect x="1280" y="865" width="12" height="100" fill="#715b45"/><rect x="1450" y="865" width="12" height="100" fill="#715b45"/>');
    add('<g transform="translate(1350 820)"><rect x="-35" y="-2" width="70" height="40" rx="7" fill="#efe0bc"/><path d="M-25 8 L25 8" stroke="#b58e59" stroke-width="3"/><path d="M-26 18 L15 18" stroke="#b58e59" stroke-width="3"/></g>');
  }

  add('<rect width="1600" height="1100" fill="url(#' + grainId + ')" opacity=".55"/>');
  add('<path d="M0 0 L1600 0 L1600 1100 L0 1100 Z" fill="none" stroke="#f7e8c6" stroke-opacity=".12" stroke-width="3"/>');
  add('</svg>');

  return parts.join("");
};

export const sceneKindForTheme = (theme: string): SceneKind => {
  if (theme === "cosmos") return "cosmos";
  if (theme === "ocean") return "ocean";
  if (theme === "dinosaurs") return "dinosaurs";
  if (theme === "mountains") return "mountains";
  if (theme === "city") return "city";
  return "forest";
};
