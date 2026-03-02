import React from "react";
import Logo from "./ui/Logo";
import routes from "@/constants/landing-routes";
import NavRoute from "./ui/NavBar/NavRoute";
import MainButton from "./ui/MainButton";

const NavBar = () => {
  return (
    <div className="py-2 px-4 flex justify-between items-center w-full fixed NavBG z-50">
      <Logo />
      <div className="gap-5 hidden md:flex">
        {routes.map((route) => (
          <NavRoute key={route} underLineOnHover route={route} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <NavRoute underLineOnHover={false} href="/chat" route="AI Chat" />
        <NavRoute underLineOnHover={false} href="/login" route="Login" />
        <MainButton text="Get Started" />
      </div>
    </div>
  );
};

export default NavBar;
