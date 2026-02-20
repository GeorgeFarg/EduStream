"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav_links } from "@/constants/nav_links";
import Logo from "@/components/ui/Logo"; 

const NavBar = () => {
  const pathname = usePathname();

  return (
    <nav className="NavBG w-full h-16 border-b border-white/5 px-8 flex items-center justify-between">
      
      <div className="flex-shrink-0">
          <Logo />
      </div>

      <div className="flex-1 flex justify-center">
        <ul className="flex items-center gap-10 h-full">
          {nav_links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.key} className="relative flex h-full items-center py-5">
                <Link
                  href={link.href}
                  className={`text-[12px] tracking-[0.2em] font-bold uppercase transition-all duration-300 ${
                    isActive ? "text-main" : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-main shadow-[0_-2px_12px_rgba(13,127,242,0.6)] rounded-t-full" />
                )}
              </li>
            );
          })}
        </ul>
      </div>
          </nav>
  );
};

export default NavBar;