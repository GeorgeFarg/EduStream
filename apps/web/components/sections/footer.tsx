'use client'
import Logo from "../ui/Logo"
import NavRoute from "../ui/NavBar/NavRoute"


const Footer = () => {
    return (
        <footer className="flex flex-col gap-8 bg-slate-950 px-6 py-12 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            <Logo />
            <div className="flex flex-wrap gap-6 text-slate-400">
                <NavRoute underLineOnHover route="Privacy Policy" />
                <NavRoute underLineOnHover route="Terms of Service" />
                <NavRoute underLineOnHover route="Support" />
            </div>
            <p className="text-slate-400">2026 EduStream Inc. All rights reserved.</p>
        </footer>
    )
}

export default Footer
