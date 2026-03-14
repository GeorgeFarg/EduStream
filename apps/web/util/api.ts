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
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "An error occurred";
    return { ok: false, data: null, error: message };
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
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "An error occurred";
    return { ok: false, data: null, error: message };
  }
}

export async function update<T = any>(
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
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "An error occurred";
    return { ok: false, data: null, error: message };
  }
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
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "An error occurred";
    return { ok: false, data: null, error: message };
  }
}
