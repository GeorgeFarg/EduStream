import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

export interface CreateMaterialDTO {
  title: string;
  category: string;
  fileUrl: string;
  uploadedBy: number;
  classId: number;
}

export interface MaterialResponse {
  id: number;
  title: string;
  fileUrl: string;
  category: string;
  uploadedBy: number;
  uploaderName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new material
 * @param data - Material creation data
 * @returns Promise resolving to created material with uploader name
 */
export const createMaterial = async (
  data: CreateMaterialDTO
): Promise<MaterialResponse> => {
  const material = await prisma.material.create({
    data: {
      title: data.title,
      category: data.category,
      fileUrl: data.fileUrl,
      uploadedBy: data.uploadedBy,
      classId: data.classId,
    },
    include: {
      uploader: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    id: material.id,
    title: material.title,
    fileUrl: material.fileUrl,
    category: material.category,
    uploadedBy: material.uploadedBy,
    uploaderName: material.uploader.name,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
};

/**
 * Get all materials with uploader name, ordered by createdAt desc
 * @param classId - Class ID
 * @returns Promise resolving to array of materials
 */
export const getAllMaterials = async (classId: number): Promise<MaterialResponse[]> => {
  const materials = await prisma.material.findMany({
    where: {
      classId,
    },
    include: {
      uploader: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return materials.map((material) => ({
    id: material.id,
    title: material.title,
    fileUrl: material.fileUrl,
    category: material.category,
    uploadedBy: material.uploadedBy,
    uploaderName: material.uploader.name,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  }));
};

/**
 * Get materials filtered by category
 * @param classId - Class ID
 * @param category - Category to filter by
 * @returns Promise resolving to array of materials in the specified category
 */
export const getMaterialsByCategory = async (
  classId: number,
  category: string
): Promise<MaterialResponse[]> => {
  const materials = await prisma.material.findMany({
    where: {
      classId,
      category,
    },
    include: {
      uploader: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return materials.map((material) => ({
    id: material.id,
    title: material.title,
    fileUrl: material.fileUrl,
    category: material.category,
    uploadedBy: material.uploadedBy,
    uploaderName: material.uploader.name,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  }));
};
/**
 * Delete a material by ID
 */
export const deleteMaterial = async (
  materialId: number,
  teacherId: number
): Promise<void> => {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material) {
    throw new Error('Material not found');
  }

  // حذف الملف الفعلي من الـ disk
  const filePath = path.join(process.cwd(), material.fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.material.delete({ where: { id: materialId } });
};

/**
 * Rename a material (update title)
 */
export const renameMaterial = async (
  materialId: number,
  title: string
): Promise<MaterialResponse> => {
  const material = await prisma.material.update({
    where: { id: materialId },
    data: { title },
    include: { uploader: { select: { name: true } } },
  });

  return {
    id: material.id,
    title: material.title,
    fileUrl: material.fileUrl,
    category: material.category,
    uploadedBy: material.uploadedBy,
    uploaderName: material.uploader.name,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
};