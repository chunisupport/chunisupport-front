import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import {
	createMemo,
	createResource,
	createSignal,
	ErrorBoundary,
	Suspense,
} from "solid-js";

import { fetchUserProfile } from "../../../api/users";
import { Loading } from "../../../components";
import FilterDialog from "./components/FilterDialog";
import RecordTable from "./components/RecordTable";
import type { ComboLamp, Difficulty, FilterState } from "./types/types";

const defaultFilter: FilterState = {
	title: "",
	difficulties: [],
	constMin: null,
	constMax: null,
	scoreMin: null,
	scoreMax: null,
	lamps: [],
};

const UserRecord: Component = () => {
	const params = useParams<{ username: string }>();
	const [userProfile] = createResource(() => params.username, fetchUserProfile);

	// フィルター状態
	const [filters, setFilters] = createSignal<FilterState>({ ...defaultFilter });
	// ダイアログ開閉
	const [filterOpen, setFilterOpen] = createSignal(false);

	// フィルター適用
	const filteredRecords = createMemo(() => {
		const records = userProfile()?.records.all ?? [];
		const f = filters();
		return records.filter((record) => {
			// 曲名
			if (
				f.title &&
				!record.title.toLowerCase().includes(f.title.toLowerCase())
			)
				return false;
			// 難易度
			if (
				f.difficulties.length > 0 &&
				!f.difficulties.includes(record.difficulty as Difficulty)
			)
				return false;
			// 定数
			if (f.constMin !== null && record.const < f.constMin) return false;
			if (f.constMax !== null && record.const > f.constMax) return false;
			// スコア
			if (f.scoreMin !== null && record.score < f.scoreMin) return false;
			if (f.scoreMax !== null && record.score > f.scoreMax) return false;
			// ランプ
			if (
				f.lamps.length > 0 &&
				!f.lamps.includes(record.combo_lamp as ComboLamp)
			)
				return false;
			return true;
		});
	});

	// 件数表示
	const totalCount = () => userProfile()?.records.all.length ?? 0;
	const filteredCount = () => filteredRecords().length;

	return (
		<>
			<Title>{params.username}さんのページ - Chunisupport</Title>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}
				>
					<div class="my-4 mx-2">
						<div class="flex items-center mb-4 gap-4">
							<div>
								{filteredCount() === totalCount()
									? `全${totalCount()}件`
									: `${totalCount()}件中${filteredCount()}件を表示`}
							</div>
							<button
								class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
								onClick={() => setFilterOpen(true)}
								type="button"
							>
								フィルター
							</button>
						</div>
						<RecordTable records={filteredRecords()} />
						<FilterDialog
							open={filterOpen()}
							onOpenChange={setFilterOpen}
							filters={filters()}
							onChange={setFilters}
							onReset={() => setFilters({ ...defaultFilter })}
						/>
					</div>
				</ErrorBoundary>
			</Suspense>
		</>
	);
};

export default UserRecord;
