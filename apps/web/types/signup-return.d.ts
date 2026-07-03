export type signupReturnAction = {
    errors: {
        name?: string[] | undefined;
        email?: string[] | undefined;
        password?: string[] | undefined;
        confirmPassword?: string[] | undefined;
        terms?: string[] | undefined;
        api?: string;
        Errorcode?: number
    };
    values: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
        terms: boolean;
    };
    success: false;
} | {
    success: true;
    values?: undefined;
    data: undefined;
} | {
    success: boolean;
    data: {
        ok: true;
        data: {
            token: string;
            user: {
                id: number;
                name: string;
                email: string;
            };
        };
        error: null;
    };
    errors?: undefined;
    values?: undefined;
}