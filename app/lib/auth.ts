import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "../generated/prisma";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/verify-email";
const resend = new Resend(process.env.RESEND_API_KEY);

const prisma = new PrismaClient();
export const auth = betterAuth({
  advanced: {
    cookiePrefix: "mak",
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        console.log("Sending magic link to:", email);
        console.log("Magic link token:", token);
        console.log("Magic link URL:", url);
        // send email to user
        const { data, error } = await resend.emails.send({
          from: "Kartik <no-reply@verify.stepgenie.app>",
          to: email,
          subject: "Verify your email",
          react: EmailTemplate({ link: url }),
        });
      },
    }),
  ],
});
