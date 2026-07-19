import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/app/lib/mongodb";
import { ServiceProvider } from "@/app/models/ServiceProvider"; // FIXED

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        // 1. කලින් register වී සිටින Service Provider කෙනෙක්දැයි පරීක්ෂා කිරීම
        const provider = await ServiceProvider.findOne({ email });
        if (!provider) {
          throw new Error("No registered Service Provider found with this email.");
        }

        // 2. Password එක නිවැරදිදැයි පරීක්ෂා කිරීම
        const isPasswordCorrect = await provider.comparePassword(password);
        if (!isPasswordCorrect) {
          throw new Error("Incorrect password. Please try again.");
        }

        // 3. සාර්ථක නම් Partner User object එක return කිරීම
        return {
          id: provider._id.toString(),
          name: provider.fullName,
          email: provider.email,
          role: "partner",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "customer"; // Default Google logins are customer
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});