import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SampleStudio } from "./components/SampleStudio";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<SampleStudio />
		</BrowserRouter>
	</React.StrictMode>,
);
