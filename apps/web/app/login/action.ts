"use server";

import { apiBaseUrl } from "@/config/env";
import { loginReturnAction } from "@/types/login-return";
import { post } from "@/util/api";
import { z } from "zod";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email("Invalid Email"),
  password: z.string().min(2, "Password is required"),
});

export const LoginAction = async (
  state: any,
  formData: FormData,
): Promise<loginReturnAction> => {
  const rawFormData = {
    email: formData.get("email")?.toString() || "",
    password: formData.get("password")?.toString() || "",
    remember: !!formData.get("remember"),
  };
  const validatedFields = schema.safeParse(rawFormData);

  // console.log(rawFormData);

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    // console.log(validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      values: {
        ...rawFormData,
      },
      success: false,
    };
  }

  const loginEndpoint = `${apiBaseUrl}/api/auth/login`;

  try {
    const result = await post<{
      token: string;
      user: { id: number; name: string; email: string };
      sessionToken?: string;
      expiresAt?: string;
    }>(
      loginEndpoint,
      {
        email: rawFormData.email,
        password: rawFormData.password,
        remember: rawFormData.remember,
      },
      { withCredentials: true },
    );

    if (!result.ok) {
      return {
        success: false,
        errors: {
          api: result.error.error.message,
          Errorcode: result.error.error.code,
        },
        values: { ...rawFormData },
      };
    }

    // Set session cookie on the response sent to the browser (server-side calls
    // don't receive Set-Cookie from the API, so we set it here from the JSON body).
    if (result.data.sessionToken) {
      const expiresAt = result.data.expiresAt
        ? new Date(result.data.expiresAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      (await cookies()).set("session", result.data.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
      });
    }

    return { success: true, data: result };
  } catch (error: any) {
    return {
      errors: {
        api: `Catch: ${error.message}` || "Signup failed. Please try again.",
      },
      success: false,
      values: {
        ...rawFormData,
      },
    };
  }
};
