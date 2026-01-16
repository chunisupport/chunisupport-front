module.exports = {
	theme: {
		extend: {
			fontFamily: {
				sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
				serif: ['"Noto Serif JP"', "ui-serif", "serif"],
				mono: [
					'"JetBrains Mono"',
					"ui-monospace",
					"SFMono-Regular",
					"monospace",
				],
			},
			animation: {
				marquee: "marquee 8s linear infinite",
			},
			keyframes: {
				marquee: {
					"0%": { transform: "translateX(0%)" },
					"100%": { transform: "translateX(-100%)" },
				},
			},
		},
	},
};
