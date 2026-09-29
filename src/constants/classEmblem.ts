import base1 from '../assets/classEmblem/base_1.svg'
import base2 from '../assets/classEmblem/base_2.svg'
import base3 from '../assets/classEmblem/base_3.svg'
import base4 from '../assets/classEmblem/base_4.svg'
import base5 from '../assets/classEmblem/base_5.svg'
import baseInf from '../assets/classEmblem/base_inf.svg'
import emblem1 from '../assets/classEmblem/emblem_1.svg'
import emblem2 from '../assets/classEmblem/emblem_2.svg'
import emblem3 from '../assets/classEmblem/emblem_3.svg'
import emblem4 from '../assets/classEmblem/emblem_4.svg'
import emblem5 from '../assets/classEmblem/emblem_5.svg'
import emblemInf from '../assets/classEmblem/emblem_inf.svg'

/** クラスエンブレム本体のマスタ名称ごとの画像URL */
export const CLASS_EMBLEM_IMAGE_URLS: Readonly<Record<string, string>> = {
  '1': emblem1,
  '2': emblem2,
  '3': emblem3,
  '4': emblem4,
  '5': emblem5,
  inf: emblemInf,
}

/** クラスエンブレム台座のマスタ名称ごとの画像URL */
export const CLASS_EMBLEM_BASE_IMAGE_URLS: Readonly<Record<string, string>> = {
  '1': base1,
  '2': base2,
  '3': base3,
  '4': base4,
  '5': base5,
  inf: baseInf,
}

/** クラスエンブレム画像のアクセシブル名 */
export const CLASS_EMBLEM_ALT = 'クラスエンブレム'
