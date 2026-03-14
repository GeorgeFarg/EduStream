import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { generateClassCode } from "../utils/codeGenerator";
import { ClassRole } from "../generated/prisma/client";
import type { USER_TYPE } from "../types/user";

export const createClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, description } = req.body;
    const { id: userId } = (req as any).user as USER_TYPE;

    // Generate unique code
    let code = generateClassCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.class.findUnique({ where: { code } });
      if (!existing) isUnique = true;
      else code = generateClassCode();
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        code,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: ClassRole.TEACHER,
          },
        },
      },
    });

    res.status(201).json(newClass);
  } catch (error) {
    next(error);
  }
};


export const getClasses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { id: userId } = (req as any).user as USER_TYPE;

    let classes = await prisma.class.findMany({
      where: {
        members: {
          some: {
            userId,
          }
        }
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true
          }
        },
      }
    });

    if (!classes.length) {
      return res.status(404).json({
        error: {
          message: "No classes found",
          code: "NOT FOUND"
        },
        userId
      });
    }

    res.json({ classes, userId });

  } catch (err) {
    res.status(500).json({
      error: {
        message: "Server error",
        code: "SERVERERROR",
      },
    })
  }
}


export const joinClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code } = req.body;
    const { id: userId } = (req as any).user as USER_TYPE;

    const classToJoin = await prisma.class.findUnique({
      where: { code },
    });

    if (!classToJoin) {
      return res.status(404).json({ error: "Class not found" });
    }

    const existingMember = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId,
          classId: classToJoin.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({
        error: {
          message: "Already a member of this class"
        }
      });
    }

    await prisma.classMembership.create({
      data: {
        userId,
        classId: classToJoin.id,
        role: ClassRole.STUDENT,
      },
    });

    res
      .status(200)
      .json({ message: "Joined class successfully", class: classToJoin });
  } catch (error) {
    next(error);
  }
};

export const inviteClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    const classId = Number(req.params.id);

    // Mock invite - in real app, send email
    const classInfo = await prisma.class.findUnique({ where: { id: classId } });

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    console.log(
      `[MOCK EMAIL] Inviting ${email} to class ${classInfo.name} with code: ${classInfo.code}`,
    );

    res.status(200).json({ message: "Invitation sent (mock)" });
  } catch (error) {
    next(error);
  }
};
