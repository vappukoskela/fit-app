import { Outlet } from "react-router-dom";
import { Header } from "./components/Header.tsx";

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Outlet />
    </div>
  );
}