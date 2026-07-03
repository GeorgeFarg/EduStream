import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

type ApiResult<T> =
  | { ok: true; data: T; error: null }
  | {
      ok: false;
      data: null;
      error: {
        error: {
          message: string;
          code: number;
        };
      };
    };

export async function get<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<ApiResult<T>> {
  try {
    const response: AxiosResponse<T> = await axios.get(url, {
      withCredentials: true,
      ...config,
    });
    return { ok: true, data: response.data, error: null };
  } catch (error: any) {
    const errorData = error?.response?.data;
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      error?.message ||
      "An error occurred";
    const code = errorData?.error?.code || errorData?.code || 500;
    return { ok: false, data: null, error: { error: { message, code } } };
  }
}

export async function post<T = any>(
  url: string,
  body: any = {},
  config: AxiosRequestConfig = {},
): Promise<ApiResult<T>> {
  try {
    const response: AxiosResponse<T> = await axios.post(url, body, {
      withCredentials: true,
      ...config,
    });
    return { ok: true, data: response.data, error: null };
  } catch (error: any) {
    const errorData = error?.response?.data;
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      error?.message ||
      "An error occurred";
    const code = errorData?.error?.code || errorData?.code || 500;
    return { ok: false, data: null, error: { error: { message, code } } };
  }
}

export async function put<T = any>(
  url: string,
  body: any = {},
  config: AxiosRequestConfig = {},
): Promise<ApiResult<T>> {
  try {
    const response: AxiosResponse<T> = await axios.put(url, body, {
      withCredentials: true,
      ...config,
    });
    return { ok: true, data: response.data, error: null };
  } catch (error: any) {
    const errorData = error?.response?.data;
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      error?.message ||
      "An error occurred";
    const code = errorData?.error?.code || errorData?.code || 500;
    return { ok: false, data: null, error: { error: { message, code } } };
  }
}

export async function update<T = any>(
  url: string,
  body: any = {},
  config: AxiosRequestConfig = {},
): Promise<ApiResult<T>> {
  return put<T>(url, body, config);
}

export async function del<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<ApiResult<T>> {
  try {
    const response: AxiosResponse<T> = await axios.delete(url, {
      withCredentials: true,
      ...config,
    });
    return { ok: true, data: response.data, error: null };
  } catch (error: any) {
    const errorData = error?.response?.data;
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      error?.message ||
      "An error occurred";
    const code = errorData?.error?.code || errorData?.code || 500;
    return { ok: false, data: null, error: { error: { message, code } } };
  }
}
