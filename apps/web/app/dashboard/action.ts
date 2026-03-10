'use server'

import { apiBaseUrl } from '@/config/env';
import { CreateClassReturnAction, JoinClassReturnAction } from '@/types/classroom-return';
import { post } from '@/util/api';
import { z } from 'zod';

// ─── Validation schemas ────────────────────────────────────────────────────────

const createClassSchema = z.object({
    name: z.string().min(2, 'Class name must be at least 2 characters'),
    description: z.string().optional(),
});

const joinClassSchema = z.object({
    code: z.string().min(1, 'Class code is required'),
});

// ─── Create Class Action ───────────────────────────────────────────────────────

export const CreateClassAction = async (
    state: any,
    formData: FormData
): Promise<CreateClassReturnAction> => {
    const rawFormData = {
        name: formData.get('name')?.toString() || '',
        description: formData.get('description')?.toString() || '',
    };

    const validated = createClassSchema.safeParse(rawFormData);

    if (!validated.success) {
        return {
            success: false,
            errors: validated.error.flatten().fieldErrors,
            values: rawFormData,
        };
    }

    const endpoint = `${apiBaseUrl}/api/classes`;

    try {
        const result = await post<{
            id: number;
            name: string;
            description: string | null;
            code: string;
            ownerId: number;
            createdAt: string;
            updatedAt: string;
        }>(endpoint, {
            name: rawFormData.name,
            description: rawFormData.description,
        });

        if (!result.ok) {
            return {
                success: false,
                errors: {
                    api: (result.error as any)?.error?.message ?? 'Failed to create class',
                    Errorcode: (result.error as any)?.error?.code,
                },
                values: rawFormData,
            };
        }

        return {
            success: true,
            data: result.data,
        };
    } catch (error: any) {
        return {
            success: false,
            errors: {
                api: error?.message ?? 'Something went wrong. Please try again.',
            },
            values: rawFormData,
        };
    }
};

// ─── Join Class Action ─────────────────────────────────────────────────────────

export const JoinClassAction = async (
    state: any,
    formData: FormData
): Promise<JoinClassReturnAction> => {
    const rawFormData = {
        code: formData.get('code')?.toString() || '',
    };

    const validated = joinClassSchema.safeParse(rawFormData);

    if (!validated.success) {
        return {
            success: false,
            errors: validated.error.flatten().fieldErrors,
            values: rawFormData,
        };
    }

    const endpoint = `${apiBaseUrl}/api/classes/join`;

    try {
        const result = await post<{
            message: string;
            class: {
                id: number;
                name: string;
                description: string | null;
                code: string;
                ownerId: number;
                createdAt: string;
                updatedAt: string;
            };
        }>(endpoint, { code: rawFormData.code });

        if (!result.ok) {
            return {
                success: false,
                errors: {
                    api: (result.error as any)?.error?.message ?? 'Failed to join class',
                    Errorcode: (result.error as any)?.error?.code,
                },
                values: rawFormData,
            };
        }

        return {
            success: true,
            data: result.data,
        };
    } catch (error: any) {
        return {
            success: false,
            errors: {
                api: error?.message ?? 'Something went wrong. Please try again.',
            },
            values: rawFormData,
        };
    }
};
