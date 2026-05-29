import { BiDirectionalPrefixDictionary } from "./dict";
import { sowpodsWords } from "./sowpods";
import { twl06 } from "./twl06";

export const SowpodsDictionary = new BiDirectionalPrefixDictionary(sowpodsWords);
export const Twl06Dictionary = new BiDirectionalPrefixDictionary(twl06);
