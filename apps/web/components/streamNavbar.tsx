"use client";
import { useState } from "react";  
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav_links } from "@/constants/nav_links";
import Logo from "@/components/ui/Logo"; 
import { Menu, X } from "lucide-react";  

const StreamNavBar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);   

  return (
    <nav className="NavBG w-full h-16 border-b border-white/5 px-4 md:px-8 flex items-center justify-between relative z-[100]">
      
      <div className="flex-shrink-0">
          <Logo />
      </div>

=      <div className="hidden md:flex flex-1 justify-center">
        <ul className="flex items-center gap-6 lg:gap-10 h-full">
          {nav_links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.key} className="relative flex h-full items-center py-5">
                <Link
                  href={link.href}
                  className={`text-[10px] lg:text-[12px] tracking-[0.2em] font-bold uppercase transition-all duration-300 ${
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

      <button 
        className="md:hidden text-white p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#0a0a0a] border-b border-white/10 p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top duration-300">
          {nav_links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-[12px] font-bold uppercase tracking-widest ${
                pathname === link.href ? "text-main" : "text-white/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default StreamNavBar;