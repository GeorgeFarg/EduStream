'use client'

import React, { useActionState } from 'react'
import Logo from '@/components/ui/Logo'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import Link from 'next/link'
import { SignupAction } from './action'
import toast from 'react-hot-toast'
import { signupReturnAction } from '@/types/signup-return'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import { useToastAction } from '@/hooks/useToast'

const initialState: signupReturnAction = {
    errors: {},
    values: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false,
    },
    success: false,
};

const SignupPage = () => {
    const [state, formAction, pending] = useActionState(SignupAction, initialState)

    useToastAction<signupReturnAction>({
        state: state,
        pending,
        onSuccess: () => {
            toast.success('Account created successfully!');
        },
        onError: () => {
            if (state.success) return
            if (state.errors?.api) {
                if (state.errors.Errorcode === 500)
                    toast.error("It's not you, it's us. please try again later");
                else
                    toast.error(state.errors.api ?? "There was an issue creating the account");
            }
            else if (state.errors?.terms)
                toast("You have to accept the terms and conditions to create the account", {
                    icon: '⛔',
                    duration: 3000,
                });
            else {
                toast.error("There was an invalid field");
            }
        }
    })

    return (
        <div className="min-h-screen gradient-bg dark:bg-dark bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
            {/* Logo */}
            <div className="mb-8">
                <Logo />
            </div>

            {/* Signup Card */}
            <div className="w-full max-w-md">
                <div className="NavBG dark:NavBG bg-white/80 dark:bg-white/5 rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-white/10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Create Account
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                            Join EduStream and start your learning journey
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5" action={formAction}>
                        {/* Name Input */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Full Name
                            </label>
                            <Input
                                defaultValue={state.values?.name}
                                icon={<User className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                id='name'
                                type='text'
                                placeholder="John Doe"
                                isError={!state.success ? !!state.errors?.name : false}
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Email Address
                            </label>
                            <Input
                                id="email"
                                icon={<Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                type="email"
                                placeholder="you@example.com"
                                defaultValue={state.values?.email}
                                isError={!state.success ? !!state.errors?.email : false}
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
                                id="password"
                                icon={<Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                placeholder='Create a password'
                                defaultValue={state.values?.password}
                                isError={!state.success ? !!state.errors?.password : false}
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                            >
                                Confirm Password
                            </label>
                            <PasswordInput
                                icon={<Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                                placeholder='Confirm your password'
                                id='confirmPassword'
                                defaultValue={state.values?.confirmPassword}
                                isError={!state.success ? !!state.errors?.confirmPassword : false}
                            />
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                className={
                                    `w-4 h-4 rounded bg-white dark:bg-white/10 text-main focus:ring-main focus:ring-offset-0 mt-1
                                    border-slate-300 dark:border-white/20
                                    ${!state.success && state.errors?.terms ? "border-red-500 focus:ring-red-500 dark:border-red-400" : ""}`
                                }
                                aria-invalid={!state.success && !!state.errors?.terms}
                            />
                            <label
                                htmlFor="terms"
                                className={
                                    `ml-2 text-sm 
                                    ${!state.success && state.errors?.terms
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-slate-700 dark:text-slate-300"}`
                                }
                            >
                                I agree to the{' '}
                                <a href="#" className="text-main hover:text-main/80 font-medium">
                                    Terms of Service
                                </a>
                                {' '}and{' '}
                                <a href="#" className="text-main hover:text-main/80 font-medium">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            className="w-full bg-main hover:bg-main/90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-main/30 hover:shadow-main/50"
                            disabled={pending}
                        >
                            Create Account
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-slate-300 dark:border-white/10"></div>
                        <span className="px-4 text-sm text-slate-500 dark:text-slate-400">or</span>
                        <div className="flex-1 border-t border-slate-300 dark:border-white/10"></div>
                    </div>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-main hover:text-main/80 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupPage