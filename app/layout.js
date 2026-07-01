import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "FB AutoReply AI",
  description: "AI-powered auto reply and lead scoring for Facebook Marketplace.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
