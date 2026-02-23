'use client'

import React, { useActionState, useEffect, useRef, useState } from 'react'
import Logo from '@/components/ui/Logo'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { LoginAction } from './action'
import { loginReturnAction } from '@/types/login-return'
import { useToastAction } from '@/hooks/useToast'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'

const initialState: loginReturnAction = {
    errors: {},
    values: {
        email: '',
        password: '',
        remember: false
    },
    success: false
}

const LoginPage = () => {

    const [state, formAction, pending] = useActionState(LoginAction, initialState)

    const [SuccessFullLogin, setSuccessFullLogin] = useState(false)

    const audio = useRef<HTMLAudioElement | null>(null)

    const router = useRouter()

    // Add a ref for the success image
    const imageRef = useRef<HTMLImageElement | null>(null);

    useToastAction<loginReturnAction>({
        state: state,
        pending,
        onSuccess: () => {
            if (state.success)
                toast.success('Logged-in successfully!', {
                    id: "success-toast"
                });
        },
        onError: () => {
            if (state.success) return
            if (state.errors?.api) {
                if (state.errors.Errorcode === 500)
                    toast.error("It's not you, it's us. please try again later");
                else
                    toast.error(state.errors.api ?? "There was an issue logging-in the account");
            }
            else {
                toast.error("There was an invalid field");
            }
        }
    })

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (!!state.success) {
            if (audio.current)
                audio.current.play();
            setSuccessFullLogin(true);

            if (imageRef.current) {
                // Only require gsap on the client side
                gsap.set(imageRef.current, { rotate: 0, x: -400, y: -100, scale: 0.6 });
                gsap.to(imageRef.current, {
                    opacity: 1,
                    duration: 0.6,
                    scale: 1.5,
                    rotate: 720,
                    x: 0,
                    y: 0,
                    ease: "elastic.out(1,0.6)"
                });
                gsap.to(imageRef.current, {
                    rotate: 1080,
                    y: -30,
                    x: 900,
                    delay: 1.5,
                    duration: 0.7,
                    scale: 1,
                    ease: "back.inOut(2)"
                });
                gsap.to(imageRef.current, {
                    rotate: 0,
                    y: -70,
                    x: 100,
                    delay: 4,
                    duration: 0.7,
                    scale: 1,
                    ease: "back.inOut"
                });
            }

            // Delay for 5 seconds before routing
            timeoutId = setTimeout(() => {
                router.push('/')
            }, 7000);
        }
        return () => {
            if (audio.current)
                audio.current.pause();

            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [state.success]);

    return (
        <div className="min-h-screen gradient-bg dark:bg-dark bg-slate-50 flex flex-col items-center justify-center px-4 py-8 relative">
            {/* Logo */}
            <div className="mb-8">
                <Logo />
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md">
                <div className="NavBG dark:NavBG bg-white/80 dark:bg-white/5 rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-white/10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                            Sign in to your EduStream account
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6" action={formAction}>
                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Email Address
                            </label>
                            <Input
                                icon={<Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                id='email'
                                placeholder='email'
                                defaultValue={!state.success ? state.values?.email : ''}
                                type='text'
                                isError={!state.success ? !!state.errors.email : false}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Password
                            </label>
                            <PasswordInput
                                icon={<Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                id='password'
                                placeholder='Enter your password'
                                defaultValue={!state.success ? state.values?.password : ''}
                                isError={!state.success ? !!state.errors.password : false} />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center">
                                <input
                                    name="remember"
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-main focus:ring-main focus:ring-offset-0"
                                    id='remember'
                                />
                                <label
                                    htmlFor="remember"
                                    className="ml-2 text-sm text-slate-700 dark:text-slate-300"
                                >
                                    Remember me
                                </label>
                            </div>
                            <a
                                href="#"
                                className="text-sm text-main hover:text-main/80 transition-colors font-medium"
                            >
                                Forgot password?
                            </a>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            className={`w-full bg-main hover:bg-main/90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-main/30 hover:shadow-main/50 ${pending ? "opacity-50 cursor-progress" : ""}`}
                            disabled={pending}
                        >
                            Sign In
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-slate-300 dark:border-white/10"></div>
                        <span className="px-4 text-sm text-slate-500 dark:text-slate-400">or</span>
                        <div className="flex-1 border-t border-slate-300 dark:border-white/10"></div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link
                                href="/signup"
                                className="text-main hover:text-main/80 font-medium transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <p className="text-center text-slate-600 dark:text-slate-500 text-sm mt-6">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-main hover:text-main/80">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-main hover:text-main/80">Privacy Policy</a>
                </p>
            </div>
            <Image
                ref={imageRef}
                hidden={!SuccessFullLogin}
                src={'/happy-cat.gif'} width={100} height={100} alt='success cat meme'
                className='absolute left-64'
            />

            <audio ref={audio}>
                <source src='/happy.mp3' type='audio/mp3' />
            </audio>
        </div>
    )
}

export default LoginPage