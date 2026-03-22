import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { ThrowError } from '../utils/ThrowError';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  // token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Register a new user
 * @param data - User registration data
 * @returns Promise resolving to auth response with token and user data
 * @throws Error with status 409 if email already exists
 */
export const register = async (data: RegisterDTO): Promise<AuthResponse> => {
  // Check if user with email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    ThrowError(409, "User already exists")
  }

  // Hash the password
  const hashedPassword = await hashPassword(data.password);

  // Create the user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  // // Generate JWT token
  // const token = generateToken({
  //   userId: user.id,
  //   email: user.email,
  // });

  return {
    // token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

/**
 * Login an existing user
 * @param data - User login credentials
 * @returns Promise resolving to auth response with token and user data
 * @throws Error with status 401 if credentials are invalid
 */
export const login = async (data: LoginDTO): Promise<AuthResponse> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    ThrowError(401, "Invalid credentials")
  }

  // Compare password
  const isPasswordValid = await comparePassword(data.password, user.password);

  if (!isPasswordValid) {
    ThrowError(401, "Invalid credentials")
  }

  // Generate JWT token
  // const token = generateToken({
  //   userId: user.id,
  //   email: user.email,
  // });

  return {
    // token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};
