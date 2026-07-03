"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, CheckSquare, GraduationCap, ChevronDown, MessageSquare } from "lucide-react";

const StreamSideBar = () => {
  const pathname = usePathname();
  
  const basicLinks = [
    { key: 'home', label: 'HOME', href: '/class/1', icon: <Home size={18} /> },
    {
      key: 'chat',
      label: 'CHAT',
      href: '/messages',
      icon: <MessageSquare size={18} />,
    },
    { 
      key: 'calendar', 
      label: 'CALENDAR', 
      href: '/calendar', 
      icon: <Calendar size={18} />,
      isExternal: true 
    },
    { key: 'todo', label: 'TO-DO', href: '/todo', icon: <CheckSquare size={18} /> },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 h-screen bg-sidebar border-r border-sidebar-border flex-col pt-6 sticky top-0">

        <ul className="flex flex-col pr-4">
          {basicLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.key} className="mb-2">
                <Link
                  href={link.href}
                  target={link.isExternal ? "_blank" : "_self"}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                  className={`flex items-center gap-4 px-6 py-3 rounded-r-xl text-[12px] font-bold tracking-wider transition-all ${
                    isActive
                    ? "bg-primary/15 text-primary shadow-[inset_4px_0_0_0_#0d7ff2]"
                    : "text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary"

                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="my-6 px-6 opacity-50"><hr className="border-sidebar-border" /></div>

        
        <div className="px-6 py-3 flex items-center justify-between text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary cursor-pointer rounded-r-xl mr-4 transition-all mt-auto mb-6">

          <div className="flex items-center gap-4">
            <GraduationCap size={18} />
            <span className="text-[12px] font-bold uppercase">Enrolled</span>
          </div>
          <ChevronDown size={14} className="opacity-30" />
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-white/5 z-50 flex items-center justify-around px-2">
        {basicLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.key}
              href={link.href}
              target={link.isExternal ? "_blank" : "_self"}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? "text-main" : "text-white/40"
              }`}
            >
              {link.icon}
              <span className="text-[10px] font-bold">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default StreamSideBar;