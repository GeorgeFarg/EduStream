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
    const query = String(req.query.q || "").trim();

    if (!classId || Number.isNaN(classId)) {
      return res
        .status(400)
        .json({ error: { message: "Class ID is required" } });
    }

    if (!query) {
      return res
        .status(400)
        .json({ error: { message: "Search query is required" } });
    }

    // Teacher-only enforced by middleware
    const classMembers = await prisma.classMembership.findMany({
      where: { classId },
      select: { userId: true },
    });

    const memberIds = classMembers.map((m) => m.userId);

    // Show users that match the query.
    // Keep existing-members visible as well (front-end will still prevent adding duplicates).
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 20,
      orderBy: { createdAt: "desc" },
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
      return res
        .status(400)
        .json({ error: { message: "Class ID is required" } });
    }

    if (!userId || Number.isNaN(Number(userId))) {
      return res.status(400).json({
        error: { message: "userId is required" },
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
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
      return res
        .status(400)
        .json({ error: { message: "User already in class" } });
    }

    // Teachers add members as STUDENT only.
    // Ignore any unexpected role input from the client.
    const membership = await prisma.classMembership.create({
      data: {
        userId: Number(userId),
        classId,
        role: ClassRole.STUDENT,
      },
      select: {
        id: true,
        userId: true,
        classId: true,
        role: true,
        joinedAt: true,
      },
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

export const getClassById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classId = Number(req.params.classId);
    if (!classId || Number.isNaN(classId)) {
      return res
        .status(400)
        .json({ error: { message: "Class ID is required" } });
    }

    const klass = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        ownerId: true,
      },
    });

    if (!klass) {
      return res.status(404).json({ error: { message: "Class not found" } });
    }

    return res.status(200).json({ class: klass });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classId = Number(req.params.classId);
    const { name, description } = req.body as {
      name?: string;
      description?: string;
    };

    // Ensure teacher/owner can update by requiring membership
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: {
          userId,
          classId,
        },
      },
    });

    if (!membership || membership.role !== ClassRole.TEACHER) {
      return res.status(403).json({ error: { message: "Access denied" } });
    }

    if (!classId || Number.isNaN(classId)) {
      return res
        .status(400)
        .json({ error: { message: "Class ID is required" } });
    }

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!trimmedName) {
      return res
        .status(400)
        .json({ error: { message: "Class name is required" } });
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        ownerId: true,
      },
    });

    return res.status(200).json({ class: updated });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: { message: "Class not found" } });
    }
    next(error);
  }
};

export const deleteClass = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classId = Number(req.params.classId);
    const userId = (req as any).user?.id as number | undefined;

    if (!classId || Number.isNaN(classId)) {
      return res
        .status(400)
        .json({ error: { message: "Class ID is required" } });
    }

    if (!userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    // Allow only TEACHER in this class (owner is also expected to be TEACHER)
    const membership = await prisma.classMembership.findUnique({
      where: {
        userId_classId: { userId, classId },
      },
    });

    if (!membership || membership.role !== ClassRole.TEACHER) {
      return res.status(403).json({ error: { message: "Access denied" } });
    }

    await prisma.class.delete({ where: { id: classId } });

    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: { message: "Class not found" } });
    }
    next(error);
  }
};

export const deleteClassMembershipLeave = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const classId = Number(req.params.classId);
    const userId = (req as any).user?.id as number | undefined;

    if (!classId || Number.isNaN(classId)) {
      return res
        .status(400)
        .json({ error: { message: "Class ID is required" } });
    }

    if (!userId) {
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    const membership = await prisma.classMembership.findUnique({
      where: { userId_classId: { userId, classId } },
    });

    if (!membership) {
      return res
        .status(403)
        .json({ error: { message: "Not a member of this class" } });
    }

    await prisma.classMembership.delete({
      where: { userId_classId: { userId, classId } },
    });

    return res.status(200).json({ message: "Left class successfully" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res
        .status(404)
        .json({ error: { message: "Membership not found" } });
    }
    next(error);
  }
};
