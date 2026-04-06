import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("SignIn callback - user:", user?.email);
      console.log("SignIn callback - profile:", profile);
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url);
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token, user }) {
      console.log("Session callback - session:", session?.user?.email);
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (account) {
        console.log("JWT callback - account provider:", account.provider);
      }
      return token;
    }
  },
  debug: true,
});