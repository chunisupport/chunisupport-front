import { Checkbox } from "@kobalte/core/checkbox";
import { Check } from "lucide-solid";
import type { Component } from "solid-js";
import { For } from "solid-js";

type GenreSectionProps = {
	genres: string[];
	selected: string[];
	onToggle: (genre: string) => void;
	onSelectAll: () => void;
	onClear: () => void;
};

const GenreSection: Component<GenreSectionProps> = (props) => (
	<div>
		<span class="block text-sm font-medium mb-1">ジャンル</span>
		<div class="flex gap-2 mb-1">
			<button
				type="button"
				class="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
				onClick={props.onSelectAll}
			>
				すべて選択
			</button>
			<button
				type="button"
				class="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs"
				onClick={props.onClear}
			>
				すべて解除
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<For each={props.genres}>
				{(genre, index) => {
					const id = `filter-genre-${index()}`;
					return (
						<Checkbox
							checked={props.selected.includes(genre)}
							onChange={() => props.onToggle(genre)}
							class="flex"
						>
							<Checkbox.Input id={id} />
							<Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-blue-600 data-checked:bg-blue-600 data-checked:text-white flex items-center justify-center mr-2">
								<Checkbox.Indicator>
									<Check class="h-4 w-4" />
								</Checkbox.Indicator>
							</Checkbox.Control>
							<Checkbox.Label for={id}>{genre}</Checkbox.Label>
						</Checkbox>
					);
				}}
			</For>
		</div>
	</div>
);

export default GenreSection;
