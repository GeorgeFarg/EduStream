// app/Stream/layout.tsx
import ClassSideBar from "@/components/ClasssideBar";
import NavBar from "@/components/streamNavbar";

export default function StreamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen flex flex-col gradient-bg overflow-hidden text-white font-sans">
            <header className="w-full shrink-0 z-50">
                <NavBar />
            </header>

            <div className="flex flex-1 overflow-hidden">
                <ClassSideBar />

                <main className="flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}