'use server'

import { apiBaseUrl } from '@/config/env'
import { signupReturnAction } from '@/types/signup-return';
import { post } from '@/util/api'
import { cookies } from 'next/headers';
import toast from 'react-hot-toast';
import { success, z } from 'zod'




const signupSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid Email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    terms: z.any(),
}).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
        ctx.addIssue({
            code: "custom",
            path: ["confirmPassword"],
            message: "Passwords do not match",
        });
    }
    if (!data.terms) {
        ctx.addIssue({
            code: "custom",
            path: ["terms"],
            message: "You must agree to the terms",
        });
    }
});

export const SignupAction = async (state: any, formData: FormData): Promise<signupReturnAction> => {
    const rawFormData = {
        name: formData.get('name')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        password: formData.get('password')?.toString() || '',
        confirmPassword: formData.get('confirmPassword')?.toString() || '',
        terms: !!formData.get('terms'),
    };

    const validated = signupSchema.safeParse(rawFormData);

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            values: {
                ...rawFormData
            },
            success: false
        }
    }

    // Replace the endpoint if your API uses a different path
    const endpoint = `${apiBaseUrl}/api/auth/register`;

    try {
        const result = await post<{
            token: string;
            user: {
                id: number;
                name: string;
                email: string;
            };
        }>(endpoint, {
            name: rawFormData.name,
            email: rawFormData.email,
            password: rawFormData.password,
        });

        if (!result.ok) {
            return {
                success: false,
                errors: {
                    api: result.error.error.message,
                    Errorcode: result.error.error.code
                },
                values: {
                    ...rawFormData
                }
            }
        } else {
            (await cookies()).set('session', result.data.token);

            return {
                success: true,
                data: result,
            }
        }


    } catch (error: any) {
        return {
            errors: {
                api: `Catch: ${error.message}` || 'Signup failed. Please try again.'
            },
            success: false,
            values: {
                ...rawFormData
            }
        }
    }
}
