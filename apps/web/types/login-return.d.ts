export type loginReturnAction = {
    success: false;
    errors: {
        Errorcode?: number
        api?: string;
        email?: string[] | undefined;
        password?: string[] | undefined;
        remember?: boolean;
        api?: string
    };
    values: {
        email: string,
        password: string,
        remember: boolean
    }
} | {
    success: true;
    data: {
        ok: true;
        data: {
            token: string,
            user: {
                id: number,
                name: string,
                email: string
            }
        }
    };
} | {
    values: undefined;
    data: undefined;
    success: true;
}


