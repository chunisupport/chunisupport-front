import { NumberField } from "@kobalte/core/number-field";
import type { Component } from "solid-js";

type ConstRangeSectionProps = {
	minValue: string;
	maxValue: string;
	onMinInput: (value: string) => void;
	onMaxInput: (value: string) => void;
	onMinCommit: (value: string) => void;
	onMaxCommit: (value: string) => void;
};

const ConstRangeSection: Component<ConstRangeSectionProps> = (props) => (
	<div class="flex gap-2">
		<div class="flex-1">
			<NumberField
				value={props.minValue}
				onChange={(value: string) => props.onMinInput(value)}
				class="w-full"
				format={false}
				allowedInput={/[0-9.]/}
				step={0.1}
			>
				<NumberField.Label class="block text-sm font-medium mb-1">
					定数(最小)
				</NumberField.Label>
				<NumberField.Input
					id="filter-const-min"
					class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400  focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
					onFocus={(event) => event.currentTarget.select()}
					onBlur={(event) => props.onMinCommit(event.currentTarget.value)}
				/>
			</NumberField>
		</div>
		<div class="flex-1">
			<NumberField
				value={props.maxValue}
				onChange={(value: string) => props.onMaxInput(value)}
				class="w-full"
				format={false}
				allowedInput={/[0-9.]/}
				step={0.1}
			>
				<NumberField.Label class="block text-sm font-medium mb-1">
					定数(最大)
				</NumberField.Label>
				<NumberField.Input
					id="filter-const-max"
					min={0}
					max={15.9}
					step={0.1}
					class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
					onFocus={(event) => event.currentTarget.select()}
					onBlur={(event) => props.onMaxCommit(event.currentTarget.value)}
				/>
			</NumberField>
		</div>
	</div>
);

export default ConstRangeSection;
