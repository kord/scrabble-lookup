/**
 * Scrabble dictionary instances.
 *
 * Dictionary reconstitution is handled by the auto-generated manifest
 * produced by `scripts/build-dicts.mjs`. The manifest imports the
 * optimal set of compiled chunk files and assembles each dictionary.
 */

import {
    SowpodsDictionary,
    Csw22Dictionary,
    Twl06Dictionary,
    Wow24Dictionary,
} from './compiled/manifest';
import type { BiDirectionalDictionary } from './dict';

export { SowpodsDictionary, Csw22Dictionary, Twl06Dictionary, Wow24Dictionary };

/**
 * Dictionary metadata for the selector UI
 */
export interface DictionaryInfo {
    id: 'sowpods' | 'twl06' | 'csw22' | 'wow24';
    name: string;
    description: string;
    instance: BiDirectionalDictionary;
}

export const AVAILABLE_DICTIONARIES: DictionaryInfo[] = [
    {
        id: 'sowpods',
        name: 'SOWPODS',
        description: 'Int\'l tournament standard (OSW + TWL)',
        instance: SowpodsDictionary,
    },
    {
        id: 'twl06',
        name: 'TWL06',
        description: 'North American tournament list',
        instance: Twl06Dictionary,
    },
    {
        id: 'csw22',
        name: 'CSW22',
        description: '2022 Collins Scrabble Words (latest)',
        instance: Csw22Dictionary,
    },
    {
        id: 'wow24',
        name: 'WOW24',
        description: 'Words of Wonder 2024 word list',
        instance: Wow24Dictionary,
    },
];

export type { BiDirectionalDictionary };
