'use server'

import { apiBaseUrl } from '@/config/env';
import { useLoginStore } from '@/store';
import { loginReturnAction } from '@/types/login-return';
import { post } from '@/util/api';
import { z } from 'zod'

const schema = z.object({
    email: z.string().email('Invalid Email'),
    password: z.string().min(2, 'Password is required')
})

export const LoginAction = async (state: any, formData: FormData): Promise<loginReturnAction> => {
    const rawFormData = {
        email: formData.get('email')?.toString() || '',
        password: formData.get('password')?.toString() || '',
        remember: !!formData.get('remember'),
    }
    const validatedFields = schema.safeParse(rawFormData)

    console.log(rawFormData);

    // Return early if the form data is invalid
    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            values: {
                ...rawFormData
            },
            success: false
        }
    }


    const loginEndpoint = `${apiBaseUrl}/api/auth/login`;

    try {
        const result = await post<{
            token: string,
            user: {
                id: number,
                name: string,
                email: string
            }
        }>(
            loginEndpoint,
            {
                email: rawFormData.email,
                password: rawFormData.password,
                remember: rawFormData.remember,
            }
        );

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
            const { setLogin } = useLoginStore();
            const data: loginReturnAction = {
                success: true,
                data: result
            }

            setLogin(result.data.token, result.data.user.email)

            return data;
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