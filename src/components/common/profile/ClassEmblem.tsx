import { type Component, Show } from 'solid-js'
import base1 from '../../../assets/classEmblem/base_1.svg'
import base2 from '../../../assets/classEmblem/base_2.svg'
import base3 from '../../../assets/classEmblem/base_3.svg'
import base4 from '../../../assets/classEmblem/base_4.svg'
import base5 from '../../../assets/classEmblem/base_5.svg'
import baseExtra from '../../../assets/classEmblem/base_extra.svg'
import baseInf from '../../../assets/classEmblem/base_inf.svg'
import emblem1 from '../../../assets/classEmblem/emblem_1.svg'
import emblem2 from '../../../assets/classEmblem/emblem_2.svg'
import emblem3 from '../../../assets/classEmblem/emblem_3.svg'
import emblem4 from '../../../assets/classEmblem/emblem_4.svg'
import emblem5 from '../../../assets/classEmblem/emblem_5.svg'
import emblemExtra from '../../../assets/classEmblem/emblem_extra.svg'
import emblemInf from '../../../assets/classEmblem/emblem_inf.svg'
import { CLASS_EMBLEM_LABEL } from './ClassEmblem.constants'

/** クラスエンブレムのマスタ名とSVGの対応。`extra` はゲーム内に存在しないEXクラス用の独自デザイン */
const CLASS_EMBLEM_SRC: Record<string, string> = {
  '1': emblem1,
  '2': emblem2,
  '3': emblem3,
  '4': emblem4,
  '5': emblem5,
  inf: emblemInf,
  extra: emblemExtra,
}

/** クラスエンブレムベースのマスタ名とSVGの対応。`extra` はゲーム内に存在しないEXクラス用の独自デザイン */
const CLASS_EMBLEM_BASE_SRC: Record<string, string> = {
  '1': base1,
  '2': base2,
  '3': base3,
  '4': base4,
  '5': base5,
  inf: baseInf,
  extra: baseExtra,
}

type Props = {
  /** クラスエンブレムのマスタ名。未設定時は null */
  emblem: string | null
  /** クラスエンブレムベースのマスタ名。未設定時は null */
  base: string | null
  /** 表示サイズなどの追加クラス。既定は高さ 2rem（元SVGの縦横比 94:46 を維持） */
  class?: string
  /** スクリーンリーダー向けラベル。未指定時は汎用の「クラスエンブレム」 */
  label?: string
}

/**
 * クラスエンブレムの台座と本体を重ねて表示する。
 * 両方とも未設定・未対応の名前の場合は何も描画しない。
 *
 * @param props - エンブレム名・ベース名・追加クラスとスクリーンリーダー向けラベル。
 * @returns エンブレムの JSX 要素。
 */
export const ClassEmblem: Component<Props> = (props) => {
  const baseSrc = () => (props.base ? CLASS_EMBLEM_BASE_SRC[props.base] : undefined)
  const emblemSrc = () => (props.emblem ? CLASS_EMBLEM_SRC[props.emblem] : undefined)

  return (
    <Show when={baseSrc() || emblemSrc()}>
      <span
        class={`relative inline-block aspect-[94/46] shrink-0 ${props.class ?? 'h-8'}`}
        role="img"
        aria-label={props.label ?? CLASS_EMBLEM_LABEL}
      >
        <Show when={baseSrc()}>
          {(src) => <img src={src()} alt="" class="absolute inset-0 h-full w-full" />}
        </Show>
        <Show when={emblemSrc()}>
          {(src) => <img src={src()} alt="" class="absolute inset-0 h-full w-full" />}
        </Show>
      </span>
    </Show>
  )
}
