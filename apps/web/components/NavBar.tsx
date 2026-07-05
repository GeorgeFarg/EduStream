"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, MessageCircle, UserCircle } from "lucide-react";
import Logo from "./ui/Logo";
import routes from "@/constants/landing-routes";
import NavRoute from "./ui/NavBar/NavRoute";
import MainButton from "./ui/MainButton";
import { useLoginStore } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const NavBar = ({ initialIsLoggedIn = false }: { initialIsLoggedIn?: boolean }) => {
  const isLoggedIn = useLoginStore((state) => state.isLoggedIn);
  const setLogin = useLoginStore((state) => state.setLogin);

  useEffect(() => {
    if (initialIsLoggedIn) {
      setLogin("session");
    }
  }, [initialIsLoggedIn, setLogin]);

  const showAccountMenu = initialIsLoggedIn || isLoggedIn;

  return (
    <div className="fixed z-50 flex w-full items-center justify-between border-b border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-xl">
      <Logo />
      <div className="hidden gap-6 md:flex">
        {routes.map((route) => (
          <NavRoute key={route} underLineOnHover route={route} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        {showAccountMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-sky-400/20 to-slate-950/20 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.25)] transition hover:from-sky-400/30 hover:to-slate-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/80"
                aria-label="Account"
              >
                <UserCircle size={20} className="text-white" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 border border-white/10 bg-slate-950 text-white shadow-2xl"
            >
              <DropdownMenuLabel className="text-cyan-100">Account</DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 focus:bg-white/10 focus:text-white">
                <Link href="/dashboard" className="flex w-full items-center gap-2">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 focus:bg-white/10 focus:text-white">
                <Link href="/private-chat" className="flex w-full items-center gap-2">
                  <MessageCircle size={16} />
                  Private Chat
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <NavRoute underLineOnHover={false} href="/login" route="Login" />
            <MainButton text="Get Started" />
          </>
        )}
      </div>
    </div>
  );
};

export default NavBar;
