import { useEffect } from 'react';
import toast from 'react-hot-toast';

// Reflects the full shape passed as 'state' in the form page, e.g. `{ errors, values, success }`
type ToastOptions<T> = {
    pending: boolean;
    state: T;
    onSuccess: () => void;
    onError: () => void;
};

export const useToastAction = <T extends { success?: boolean; errors?: Record<string, any> }>({
    pending,
    state,
    onSuccess,
    onError,
}: ToastOptions<T>) => {
    useEffect(() => {
        if (pending) {
            toast.loading('Loading...', { id: 'signup-loading' });
        } else if (state?.success) {
            toast.dismiss('signup-loading');
            onSuccess();
        } else if (state?.errors && Object.keys(state.errors).length > 0) {
            toast.dismiss('signup-loading');
            onError();
        }
    }, [pending, state, onSuccess, onError]);
};
