// 難易度の略称を返す
export function difficultyShort(difficulty: string): string {
	switch (difficulty) {
		case "BASIC":
			return "B";
		case "ADVANCED":
			return "A";
		case "EXPERT":
			return "E";
		case "MASTER":
			return "M";
		case "ULTIMA":
			return "U";
		default:
			return "";
	}
}

// 難易度の色クラスを返す（RecordTable用）
export function difficultyColor(difficulty: string): string {
	switch (difficulty) {
		case "BASIC":
			return "bg-green-100 text-green-800";
		case "ADVANCED":
			return "bg-yellow-100 text-yellow-800";
		case "EXPERT":
			return "bg-pink-100 text-pink-800";
		case "MASTER":
			return "bg-purple-100 text-purple-800";
		case "ULTIMA":
			return "bg-red-100 text-red-800";
		default:
			return "";
	}
}

// 難易度の色クラスを返す（UserRecordCard用）
export function difficultyCardColor(difficulty: string): string {
	switch (difficulty) {
		case "BASIC":
			return "border-green-500 bg-green-200";
		case "ADVANCED":
			return "border-orange-500 bg-orange-200";
		case "EXPERT":
			return "border-red-500 bg-red-200";
		case "MASTER":
			return "border-purple-500 bg-purple-200";
		case "ULTIMA":
			return "border-red-500 bg-black text-white";
		default:
			return "border-gray-500 bg-gray-200";
	}
}
