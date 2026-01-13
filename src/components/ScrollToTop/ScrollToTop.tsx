// 共通「一番上に戻る」ボタンコンポーネント
import { ArrowUp } from "lucide-solid";
import { createSignal, onCleanup, onMount } from "solid-js";

type Props = {
	scrollContainerSelector?: string; // スクロール対象のセレクタ
	showThreshold?: number; // ボタン表示の閾値(px)
};

export const ScrollToTop = (props: Props) => {
	const selector: string =
		props.scrollContainerSelector ?? "#root > div > div > main";
	const threshold: number = props.showThreshold ?? 200;
	const [show, setShow] = createSignal(true);
	let container: HTMLElement | null = null;

	onMount(() => {
		container = document.querySelector(selector);
		if (!container) return;

		const onScroll = () => {
			setShow(!!container && container.scrollTop > threshold);
		};
		container.addEventListener("scroll", onScroll);
		onScroll();
		onCleanup(() => container?.removeEventListener("scroll", onScroll));
	});

	const scrollToTop = () => {
		container?.scrollTo({ top: 0, behavior: "smooth" });
	};

	return show() ? (
		<button
			type="button"
			aria-label="一番上に移動"
			onClick={scrollToTop}
			class="fixed bottom-26 md:bottom-6 right-5 z-50 bg-white border border-gray-500 text-gray-500 rounded-md shadow-lg p-2.5"
		>
			<ArrowUp size={20} />
		</button>
	) : null;
};
