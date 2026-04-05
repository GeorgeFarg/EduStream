'use client'
import Link from "next/link";
import React from "react";

const NotFound = () => (
    <div className="bg-background-dark min-h-screen flex flex-col text-slate-100 font-display">
        {/* Main Content */}
        <main className="grow flex flex-col items-center justify-center px-6 py-12 relative">
            <div className="max-w-3xl w-full text-center space-y-8 relative">
                {/* Illustration */}
                <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center mt-4">
                    {/* Abstract Glow/3D */}
                    <div className="absolute inset-0 bg-main/5 rounded-full blur-3xl scale-75"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-64 h-64 bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-700 transform rotate-3 relative">
                            {/* Top right floating book icon */}
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-main rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-12">
                                <span className="material-symbols-outlined text-4xl">menu_book</span>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <span className="material-symbols-outlined text-8xl text-slate-700">
                                    search_off
                                </span>
                                <div className="w-32 h-2 bg-slate-700 rounded-full"></div>
                                <div className="w-24 h-2 bg-slate-700 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    {/* Floating decorations */}
                    <div className="absolute top-10 left-10 w-12 h-12 bg-main/20 rounded-lg backdrop-blur-sm flex items-center justify-center text-main animate-bounce">
                        <span className="material-symbols-outlined">edit</span>
                    </div>
                    <div className="absolute bottom-20 right-5 w-10 h-10 bg-slate-800 rounded-full shadow-sm flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-sm">question_mark</span>
                    </div>
                    {/* 404 large in background */}
                    <h1 className="text-8xl font-black text-white tracking-tighter opacity-10 absolute left-1/2 -translate-x-1/2 top-5/7 select-none pointer-events-none">
                        404
                    </h1>
                </div>
                {/* Info */}
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
                        The page you're looking for might have been moved, deleted, or never existed.
                    </p>
                </div>
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                    <Link
                        className="group flex items-center justify-center gap-2 px-8 py-4 bg-main text-white rounded-xl font-semibold shadow-lg shadow-main/20 hover:shadow-main/30 hover:scale-[1.02] transition-all w-full sm:w-auto"
                        href="/dashboard"
                    >
                        <span className="material-symbols-outlined text-xl">dashboard</span>
                        <span>Back to Dashboard</span>
                    </Link>
                    <Link
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl font-semibold hover:bg-slate-700 transition-all w-full sm:w-auto"
                        href="#"
                    >
                        <span className="material-symbols-outlined text-xl">search</span>
                        <span>Search Courses</span>
                    </Link>
                </div>
            </div>
        </main>
        {/* Footer */}
        <footer className="w-full py-8 border-t border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-500 text-sm font-medium">
                    © 2026 EduStream LMS. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    <a
                        className="text-slate-400 hover:text-main transition-colors text-sm"
                        href="#"
                    >
                        Help Center
                    </a>
                    <a
                        className="text-slate-400 hover:text-main transition-colors text-sm"
                        href="#"
                    >
                        System Status
                    </a>
                    <a
                        className="text-slate-400 hover:text-main transition-colors text-sm"
                        href="#"
                    >
                        Privacy Policy
                    </a>
                </div>
            </div>
        </footer>

        {/* Material Symbols font (For local dev, assumes this is loaded globally) */}
        <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
        />
        {/* Display font (Lexend) */}
        <link
            href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
        />
        <style jsx global>{`
      body,
      .font-display {   
        font-family: 'Lexend', sans-serif;
      }
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    `}</style>
    </div>
);

export default NotFound;