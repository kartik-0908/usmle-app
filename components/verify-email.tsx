import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

export function EmailTemplate({ link }: { link: string }) {
  return (
    <html>
      <body>
        <h1>Welcome to Our Service</h1>
        <p>Click the link below to verify your email:</p>
        <a href={link}>Verify Email</a>
      </body>
    </html>
  );
}
