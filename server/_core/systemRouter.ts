import { z } from "zod";
import { notifyAll } from "../modules/notifications/service";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure.input(z.object({ timestamp: z.number().min(0) }).optional()).query(() => ({ ok: true })),
  notifyUsers: adminProcedure.input(z.object({ title: z.string().min(1).max(1200), content: z.string().min(1).max(20_000) })).mutation(async ({ input }) => ({ success: Boolean(await notifyAll({ type: "system", title: input.title, message: input.content })) })),
});
