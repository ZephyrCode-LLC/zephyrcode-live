import type { SiteSeed } from "./types";
import { homeSeed } from "./home";
import { antyodayaSeed } from "./antyodaya";
import { storiesSeed } from "./stories";
import { operatorSeed } from "./operator";
import { arcadeSeed } from "./arcade";
import { readSeed } from "./read";
import { watchSeed } from "./watch";
import { listenSeed } from "./listen";
import { temperSeed } from "./temper";

export const ALL_SITES: SiteSeed[] = [
  homeSeed,
  antyodayaSeed,
  storiesSeed,
  operatorSeed,
  temperSeed,
  arcadeSeed,
  readSeed,
  watchSeed,
  listenSeed,
];
