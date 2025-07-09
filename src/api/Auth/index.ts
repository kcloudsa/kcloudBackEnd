import { Request, Response } from 'express';

import { ExpressAuth } from '@auth/express';
import GoogleProvider from '@auth/express/providers/google';
import CredentialsProvider from '@auth/express/providers/credentials';
import EmailProvider from '@auth/express/providers/email';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../services/userServices';
import Iuser from '../../interfaces/Iuser';

export const AuthAPI = (req: Request, res: Response, next: any) => {
  // Validate required environment variables
  const requiredEnvVars = [
    'AUTH_SECRET'
  ];
  
  const optionalEnvVars = [
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET', 
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_PORT',
    'EMAIL_FROM',
    'EMAIL_PASS'
  ];
  
  const missingRequiredVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingRequiredVars.length > 0) {
    console.error('Missing REQUIRED environment variables:', missingRequiredVars);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const missingOptionalVars = optionalEnvVars.filter(envVar => !process.env[envVar]);
  if (missingOptionalVars.length > 0) {
    console.warn('Missing optional environment variables (some providers may not work):', missingOptionalVars);
  }

  // Build providers array based on available environment variables
  const providers: any[] = [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = (await getUserByEmail(
          credentials.email as string,
        )) as Iuser | null;

        if (
          user &&
          user.password?.hashed &&
          bcrypt.compareSync(credentials.password as string, user.password.hashed)
        ) {
          return {
            id: user.userID,
            email: user.contactInfo?.email?.email,
          };
        }

        return null;
      },
    })
  ];

  // Add Google provider only if credentials are available
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }));
  }

  // Add Email provider only if email credentials are available
  if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PORT && process.env.EMAIL_FROM && process.env.EMAIL_PASS) {
    providers.push(EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT, 10),
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASS,
        },
      },
      from: process.env.EMAIL_FROM,
    }));
  }

  return ExpressAuth({
    providers,
    callbacks: {
      async session({ session, token }: { session: any; token: any }) {
        session.user.id = token.sub;
        return session;
      },
    },
    secret: process.env.AUTH_SECRET!,
    trustHost: true,
  })(req, res, next);
};
