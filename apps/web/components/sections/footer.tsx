'use client'
import { GIFtext } from "../ui/GIFtext"
import Logo from "../ui/Logo"
import NavRoute from "../ui/NavBar/NavRoute"


const Footer = () => {
    return (
        <div className="dark:bg-dark py-14 px-12 flex justify-between items-center">
            <Logo />
            <div className="flex text-slate-600 gap-8">
                <NavRoute underLineOnHover route="Privacy Policy" />
                <NavRoute underLineOnHover route="Terms of Service" />
                <NavRoute underLineOnHover route="Support" />
            </div>
            <p className="text-slate-400">@ <GIFtext GifName="happy-cat.gif" >2026</GIFtext> EduStream Inc. All rights reserved.</p>
        </div>
    )
}

export default Footer
