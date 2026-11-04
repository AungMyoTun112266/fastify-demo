import { z } from "zod";

export const apiSuccessSchema = <T extends z.ZodType>(
  dataSchema: T,
): z.ZodObject<{ success: z.ZodLiteral<true>; data: T }> =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const apiFailureSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});
