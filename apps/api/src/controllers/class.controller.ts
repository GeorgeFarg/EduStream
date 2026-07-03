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
  next: NextFunction,
) => {
  try {
    let { id: userId } = (req as any).user as USER_TYPE;

    let classes = await prisma.class.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!classes.length) {
      return res.status(404).json({
        error: {
          message: "No classes found",
          code: "NOT FOUND",
        },
        userId,
      });
    }

    res.json({ classes, userId });
  } catch (err) {
    res.status(500).json({
      error: {
        message: "Server error",
        code: "SERVERERROR",
      },
    });
  }
};

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
          message: "Already a member of this class",
        },
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

export const searchClassUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classId = Number(req.params.id);
    const query = String(req.query.q || '').trim();

    if (!classId || Number.isNaN(classId)) {
      return res.status(400).json({ error: { message: 'Class ID is required' } });
    }

    if (!query) {
      return res
        .status(400)
        .json({ error: { message: 'Search query is required' } });
    }

    // Teacher-only enforced by middleware
    const classMembers = await prisma.classMembership.findMany({
      where: { classId },
      select: { userId: true },
    });

    const memberIds = classMembers.map((m) => m.userId);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          ...(memberIds.length ? [{ id: { notIn: memberIds } }] : []),
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};


export const addUserToClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classId = Number(req.params.id);
    const { userId, role } = req.body as {
      userId?: number;
      role?: keyof typeof ClassRole;
    };

    if (!classId || Number.isNaN(classId)) {
      return res.status(400).json({ error: { message: "Class ID is required" } });
    }

    if (!userId || Number.isNaN(Number(userId))) {
      return res.status(400).json({
        error: { message: "userId is required" },
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!existingUser) {
      return res.status(404).json({ error: { message: "User not found" } });
    }

    const existingMembership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId: Number(userId),
          classId,
        },
      },
    });

    if (existingMembership) {
      return res.status(400).json({ error: { message: "User already in class" } });
    }

    const membership = await prisma.classMembership.create({
      data: {
        userId: Number(userId),
        classId,
        role:
          role && String(role).toUpperCase() === "TEACHER"
            ? ClassRole.TEACHER
            : ClassRole.STUDENT,
      },
      select: { id: true, userId: true, classId: true, role: true, joinedAt: true },
    });

    return res.status(201).json({ membership });
  } catch (error: any) {
    // Unique constraint safety net (in case of race)
    if (error?.code === "P2002") {
      return res.status(400).json({
        error: { message: "User already in class" },
      });
    }
    next(error);
  }
};

