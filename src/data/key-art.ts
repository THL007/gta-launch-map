import type { ImageSource } from 'expo-image';

/** Display copies of assets/art. The 4K originals stay in that folder and are not bundled. */
export type Poster = {
  id: string;
  source: ImageSource;
  alt: string;
  width: number;
  height: number;
  /** Pixel width of the file. The frame will not scale past it. */
  maxWidth: number;
};

export const POSTERS: Poster[] = [
  {
    id: 'duo',
    source: require('../../assets/art/display/duo.jpg'),
    alt: 'Lucia and Jason outside a Vice City gas station at dusk, bandanas up, a car door open behind them.',
    width: 1600,
    height: 900,
    maxWidth: 1600,
  },
  {
    id: 'collage',
    source: require('../../assets/art/display/collage.jpg'),
    alt: 'Grand Theft Auto VI collage with Lucia and Jason at the centre, surrounded by a helicopter, a boat, a sports car, an alligator and Vice City scenes.',
    width: 1600,
    height: 900,
    maxWidth: 1600,
  },
  {
    id: 'lockup',
    source: require('../../assets/art/display/lockup.jpg'),
    alt: 'Grand Theft Auto VI logo on a pink sunset, with palm silhouettes.',
    width: 1200,
    height: 900,
    maxWidth: 1200,
  },
  {
    id: 'leonida',
    source: require('../../assets/art/display/leonida.jpg'),
    alt: 'Map of Leonida labelled Vice City, Port Gellhorn, Grassrivers, Mount Kalaga, Ambrosia and Leonida Keys. The file still carries marks from other sites.',
    width: 407,
    height: 491,
    maxWidth: 407,
  },
];
