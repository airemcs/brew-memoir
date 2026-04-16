import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import clientPromise from "@/lib/mongoClient";
import { verifyPassword } from "@/lib/utils";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as AuthOptions["adapter"],

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select("+passwordHash");
        if (!user || !user.passwordHash) return null;
        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Persist the user's MongoDB _id on the JWT so we can use it in API routes.
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.userId as string;
      }
      return session;
    },
  },

  events: {
    // When a new user signs in via Google for the first time, create the
    // corresponding application-level User document in Mongoose.
    async signIn({ user, account, isNewUser }) {
      if (account?.provider === "google" && isNewUser) {
        await connectDB();
        const existing = await User.findOne({ email: user.email! });
        if (!existing) {
          await User.create({
            name: user.name ?? "Unnamed",
            email: user.email!,
            image: user.image,
            authProvider: "google",
          });
        }
      }
    },
  },

  pages: {
    signIn: "/auth/signin",
    // error: "/auth/error", // uncomment when the error page is built
  },
};
