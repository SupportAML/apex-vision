import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const { handlers } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim());
      if (allowedEmails.length > 0 && allowedEmails[0] !== "") {
        return allowedEmails.includes(user.email ?? "");
      }
      return true;
    },
  },
});

export const { GET, POST } = handlers;
