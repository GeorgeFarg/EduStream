export function ThrowError(errorCode: number, ErrorMessage: string): never {
    const error = new Error(ErrorMessage) as any;
    error.statusCode = errorCode;
    throw error;
}