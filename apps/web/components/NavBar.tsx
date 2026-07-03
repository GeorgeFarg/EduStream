import React from "react";
import Logo from "./ui/Logo";
import routes from "@/constants/landing-routes";
import NavRoute from "./ui/NavBar/NavRoute";
import MainButton from "./ui/MainButton";

const NavBar = () => {
  return (
    <div className="fixed z-50 flex w-full items-center justify-between border-b border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-xl">
      <Logo />
      <div className="hidden gap-6 md:flex">
        {routes.map((route) => (
          <NavRoute key={route} underLineOnHover route={route} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <NavRoute underLineOnHover={false} href="/login" route="Login" />
        <MainButton text="Get Started" />
      </div>
    </div>
  );
};

export default NavBar;
