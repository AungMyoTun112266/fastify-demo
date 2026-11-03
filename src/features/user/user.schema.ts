import { z } from "zod";

export const userIdParamsSchema = z.object({
  user_id: z.uuid(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.email().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "更新する項目を1つ以上指定してください。",
  });

export const userSchema = z.object({
  user_id: z.uuid(),
  name: z.string(),
  email: z.email(),
  created_at: z.iso.datetime(),
});

export const usersSchema = z.array(userSchema);

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userSchema>;
