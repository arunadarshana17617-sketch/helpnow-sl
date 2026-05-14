import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ["state"],
    }),
  ],
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback - user:", user?.email);
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url);
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token }) {
      console.log("Session callback - session:", session?.user?.email);
      return session;
    },
    async jwt({ token, user, account }) {
      if (account) {
        console.log("JWT callback - account provider:", account.provider);
      }
      return token;
    }
  },
  debug: true,
});