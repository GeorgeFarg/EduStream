import { Request } from 'express';

declare global {
  namespace Express {
    interface AuthRequest extends Request {
      user?: {
        id: number;
        email: string;
        role: 'TEACHER' | 'STUDENT';
      };
    }

    interface ClassMemeberRequest extends AuthRequest {
      memperShip?: {
        isTeacher: boolean,
      }
    }
  }
}

export { AuthRequest, ClassMemeberRequest };
