import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const projectSchema = z.object({
  title: z.string().min(2, 'Project title must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project selection is required'),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['Admin', 'Project Manager', 'Member', 'Viewer']),
});

export const channelSchema = z.object({
  name: z.string().min(2, 'Channel name must be at least 2 characters'),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
  projectId: z.string().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  fileId: z.string().optional(),
});
