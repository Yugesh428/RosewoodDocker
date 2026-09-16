/* eslint-disable @typescript-eslint/no-require-imports */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/login",   // default sign-in page (customer)
    error:  "/login",   // auth errors go here too
  },
  trustHost: true, // Trust all hosts (required for Render deployment)
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Pass expected role so each login form controls what's allowed
        expectedRole: { label: "Expected Role", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
          const { Pool } = require("pg") as typeof import("pg");

          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 2,
            // Force IPv4
            host: process.env.DATABASE_URL?.match(/\/\/[^:]+:([^@]+)@([^:]+)/)?.[2],
          });

          const email = (credentials.email as string).toLowerCase().trim();
          const expectedRole = (credentials.expectedRole as string) ?? "CUSTOMER";

          const { rows } = await pool.query(
            "SELECT id, name, email, password, role FROM users WHERE email = $1 LIMIT 1",
            [email],
          );
          await pool.end();

          if (rows.length === 0) return null;
          const user = rows[0];

          // Only allow the role that the login form expects
          if (user.role !== expectedRole) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (err) {
          console.error("[AUTH] error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
