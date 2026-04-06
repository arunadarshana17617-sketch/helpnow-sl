import Provider from './Components/SessionProvider';
import { auth } from '@/auth';
import './globals.css';

export default async function RootLayout({ children }) {
  // Try to get session, but don't break if it fails
  let session = null;
  try {
    session = await auth();
    console.log("Session loaded successfully:", !!session);
  } catch (error) {
    console.error("Failed to load session in layout:", error.message);
    // Session will be null, but the client will handle it
  }
  
  return (
    <html lang="en">
      <body>
        <Provider session={session}>
          {children}
        </Provider>
      </body>
    </html>
  );
}