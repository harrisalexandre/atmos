import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AtmosApp } from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<StrictMode><AtmosApp /></StrictMode>);
