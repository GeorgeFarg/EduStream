import request from 'supertest';
import app from '../src/app';
import { prisma } from './setup';
import path from 'path';
import fs from 'fs';

describe('Integration Tests - Critical Workflows', () => {
  let teacherToken: string;
  let studentToken: string;
  let teacherId: number;
  let studentId: number;
  let assignmentId: number;

  // Test 1: Complete authentication flow
  describe('Authentication Flow', () => {
    it('should register a new teacher, login, and access protected route', async () => {
      // Register teacher
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Teacher',
          email: 'teacher@test.com',
          password: 'password123',
          role: 'TEACHER',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body).toHaveProperty('token');
      expect(registerRes.body.user.role).toBe('TEACHER');

      const token = registerRes.body.token;
      teacherId = registerRes.body.user.id;

      // Login with same credentials
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@test.com',
          password: 'password123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user.email).toBe('teacher@test.com');

      // Access protected route (get announcements)
      const protectedRes = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedRes.status).toBe(200);
      expect(Array.isArray(protectedRes.body)).toBe(true);
    });

    it('should register a student for later tests', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'STUDENT',
        });

      expect(registerRes.status).toBe(201);
      studentToken = registerRes.body.token;
      studentId = registerRes.body.user.id;
    });
  });

  // Test 2: Teacher creating assignment with future due date
  describe('Assignment Creation', () => {
    beforeAll(async () => {
      // Register teacher if not already done
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Teacher Two',
          email: 'teacher2@test.com',
          password: 'password123',
          role: 'TEACHER',
        });
      teacherToken = registerRes.body.token;
      teacherId = registerRes.body.user.id;
    });

    it('should create assignment with future due date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Test Assignment',
          description: 'This is a test assignment description',
          dueDate: futureDate.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Assignment');
      expect(new Date(res.body.dueDate).getTime()).toBeGreaterThan(Date.now());
      
      assignmentId = res.body.id;
    });
  });

  // Test 3 & 4: Student submitting before and after due date
  describe('Submission Timing', () => {
    let earlyAssignmentId: number;
    let lateAssignmentId: number;

    beforeAll(async () => {
      // Ensure we have tokens
      if (!teacherToken) {
        const teacherRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Teacher Three',
            email: 'teacher3@test.com',
            password: 'password123',
            role: 'TEACHER',
          });
        teacherToken = teacherRes.body.token;
        teacherId = teacherRes.body.user.id;
      }

      if (!studentToken) {
        const studentRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Student Two',
            email: 'student2@test.com',
            password: 'password123',
            role: 'STUDENT',
          });
        studentToken = studentRes.body.token;
        studentId = studentRes.body.user.id;
      }

      // Create assignment with future due date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const earlyRes = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Early Submission Assignment',
          description: 'Test early submission',
          dueDate: futureDate.toISOString(),
        });
      earlyAssignmentId = earlyRes.body.id;

      // Create assignment with past due date (by directly inserting into DB)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const lateAssignment = await prisma.assignment.create({
        data: {
          title: 'Late Submission Assignment',
          description: 'Test late submission',
          dueDate: pastDate,
          teacherId: teacherId,
        },
      });
      lateAssignmentId = lateAssignment.id;
    });

    it('should submit before due date with isLate = false', async () => {
      // Create a test file
      const testFilePath = path.join(process.cwd(), '__tests__', 'test-submission.pdf');
      fs.writeFileSync(testFilePath, 'Test PDF content');

      const res = await request(app)
        .post(`/api/assignments/${earlyAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', testFilePath);

      expect(res.status).toBe(201);
      expect(res.body.isLate).toBe(false);
      expect(res.body.assignmentId).toBe(earlyAssignmentId);

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    it('should submit after due date with isLate = true', async () => {
      // Create a test file
      const testFilePath = path.join(process.cwd(), '__tests__', 'test-submission-late.pdf');
      fs.writeFileSync(testFilePath, 'Test PDF content for late submission');

      const res = await request(app)
        .post(`/api/assignments/${lateAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', testFilePath);

      expect(res.status).toBe(201);
      expect(res.body.isLate).toBe(true);
      expect(res.body.assignmentId).toBe(lateAssignmentId);

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });
  });

  // Test 5: RBAC enforcement - student attempting to create announcement
  describe('RBAC Enforcement', () => {
    beforeAll(async () => {
      if (!studentToken) {
        const studentRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Student RBAC',
            email: 'student-rbac@test.com',
            password: 'password123',
            role: 'STUDENT',
          });
        studentToken = studentRes.body.token;
      }
    });

    it('should return 403 when student attempts to create announcement', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Announcement',
          content: 'This should not be created',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });
  });

  // Test 6: File upload validation - uploading .exe file
  describe('File Upload Validation', () => {
    beforeAll(async () => {
      if (!studentToken) {
        const studentRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Student File',
            email: 'student-file@test.com',
            password: 'password123',
            role: 'STUDENT',
          });
        studentToken = studentRes.body.token;
      }

      if (!assignmentId) {
        if (!teacherToken) {
          const teacherRes = await request(app)
            .post('/api/auth/register')
            .send({
              name: 'Teacher File',
              email: 'teacher-file@test.com',
              password: 'password123',
              role: 'TEACHER',
            });
          teacherToken = teacherRes.body.token;
        }

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const assignmentRes = await request(app)
          .post('/api/assignments')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            title: 'File Validation Assignment',
            description: 'Test file validation',
            dueDate: futureDate.toISOString(),
          });
        assignmentId = assignmentRes.body.id;
      }
    });

    it('should return 400 when uploading .exe file', async () => {
      // Create a test .exe file
      const testFilePath = path.join(process.cwd(), '__tests__', 'malicious.exe');
      fs.writeFileSync(testFilePath, 'Fake executable content');

      const res = await request(app)
        .post(`/api/assignments/${assignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', testFilePath);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });
  });

  // Test 7: Duplicate submission prevention
  describe('Duplicate Submission Prevention', () => {
    let dupAssignmentId: number;

    beforeAll(async () => {
      if (!teacherToken) {
        const teacherRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Teacher Dup',
            email: 'teacher-dup@test.com',
            password: 'password123',
            role: 'TEACHER',
          });
        teacherToken = teacherRes.body.token;
      }

      if (!studentToken) {
        const studentRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Student Dup',
            email: 'student-dup@test.com',
            password: 'password123',
            role: 'STUDENT',
          });
        studentToken = studentRes.body.token;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const assignmentRes = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Duplicate Test Assignment',
          description: 'Test duplicate submission',
          dueDate: futureDate.toISOString(),
        });
      dupAssignmentId = assignmentRes.body.id;
    });

    it('should return 409 when submitting twice to same assignment', async () => {
      // Create test file
      const testFilePath = path.join(process.cwd(), '__tests__', 'first-submission.pdf');
      fs.writeFileSync(testFilePath, 'First submission content');

      // First submission
      const firstRes = await request(app)
        .post(`/api/assignments/${dupAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', testFilePath);

      expect(firstRes.status).toBe(201);

      // Second submission (should fail)
      const secondRes = await request(app)
        .post(`/api/assignments/${dupAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', testFilePath);

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.error).toBeDefined();

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });
  });

  // Test 8: Teacher grading submission they don't own
  describe('Grading Authorization', () => {
    let teacher1Token: string;
    let teacher2Token: string;
    let teacher1Id: number;
    let testAssignmentId: number;
    let testSubmissionId: number;

    beforeAll(async () => {
      // Register two teachers
      const teacher1Res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Teacher One',
          email: 'teacher-one@test.com',
          password: 'password123',
          role: 'TEACHER',
        });
      teacher1Token = teacher1Res.body.token;
      teacher1Id = teacher1Res.body.user.id;

      const teacher2Res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Teacher Two',
          email: 'teacher-two@test.com',
          password: 'password123',
          role: 'TEACHER',
        });
      teacher2Token = teacher2Res.body.token;

      // Register a student
      if (!studentToken) {
        const studentRes = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Student Grade',
            email: 'student-grade@test.com',
            password: 'password123',
            role: 'STUDENT',
          });
        studentToken = studentRes.body.token;
        studentId = studentRes.body.user.id;
      }

      // Teacher 1 creates assignment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const assignmentRes = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          title: 'Grading Test Assignment',
          description: 'Test grading authorization',
          dueDate: futureDate.toISOString(),
        });
      testAssignmentId = assignmentRes.body.id;

      // Student submits to assignment
      const testFilePath = path.join(process.cwd(), '__tests__', 'grade-test.pdf');
      fs.writeFileSync(testFilePath, 'Submission for grading test');

      const submissionRes = await request(app)
        .post(`/api/assignments/${testAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', testFilePath);

      testSubmissionId = submissionRes.body.id;
      fs.unlinkSync(testFilePath);
    });

    it('should return 403 when teacher tries to grade submission they do not own', async () => {
      const res = await request(app)
        .patch(`/api/submissions/${testSubmissionId}/grade`)
        .set('Authorization', `Bearer ${teacher2Token}`)
        .send({
          grade: 85,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    it('should allow teacher to grade their own assignment submission', async () => {
      const res = await request(app)
        .patch(`/api/submissions/${testSubmissionId}/grade`)
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          grade: 90,
        });

      expect(res.status).toBe(200);
      expect(res.body.grade).toBe(90);
    });
  });
});
