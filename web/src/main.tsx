import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, useLocation } from "react-router-dom";
import { SampleStudio } from "./components/SampleStudio";
import { TheoryStudio } from "./components/TheoryStudio";
import { ApiError } from "./lib/api";
import "./style.css";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

function StudioEntry() {
  const theory = useLocation().pathname === "/studio/theory";
  if (theory) return <div className="theory-shell"><nav aria-label="Studio navigation"><Link to="/">Sample library</Link><Link to="/studio/synth">Synthesizer</Link></nav><main><TheoryStudio /></main></div>;
  return <><SampleStudio /><Link className="theory-launch" to="/studio/theory">Music theory</Link></>;
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <StudioEntry />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
