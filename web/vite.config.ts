import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		strictPort: true,
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		restoreMocks: true,
	},
});
