import * as React from "react";

interface EmailTemplateProps {
  link: string;
}

export function EmailTemplate({ link }: EmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email - Step Genie</title>
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
        color: '#333333',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '40px 20px',
          backgroundColor: '#f8fafc'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px 12px 0 0',
            padding: '40px 32px 24px',
            textAlign: 'center' as const,
            borderBottom: '3px solid #3b82f6'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                letterSpacing: '-0.5px'
              }}>
                Step Genie
              </h1>
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              AI-Powered USMLE Preparation Platform
            </p>
          </div>

          {/* Main Content */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              Verify Your Email Address
            </h2>
            
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              color: '#475569'
            }}>
              Hello,
            </p>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              color: '#475569',
              lineHeight: '1.7'
            }}>
              Welcome to <strong>Step Genie</strong>! We're excited to help you ace your USMLE exams with our AI-powered preparation platform.
            </p>

            <p style={{
              margin: '0 0 32px 0',
              fontSize: '16px',
              color: '#475569',
              lineHeight: '1.7'
            }}>
              To complete your login and access your personalized study materials, please verify your email address by clicking the button below:
            </p>

            {/* CTA Button */}
            <div style={{ textAlign: 'center' as const, margin: '32px 0' }}>
              <a 
                href={link}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '16px 32px',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Verify Email Address
              </a>
            </div>

            <p style={{
              margin: '32px 0 0 0',
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style={{
              margin: '8px 0 24px 0',
              fontSize: '14px',
              wordBreak: 'break-all' as const,
              backgroundColor: '#f1f5f9',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <a href={link} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                {link}
              </a>
            </p>

            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '24px',
              marginTop: '32px'
            }}>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <strong>What's next?</strong> Once verified, you'll get access to:
              </p>
              <ul style={{
                margin: '0 0 16px 0',
                paddingLeft: '20px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <li style={{ marginBottom: '4px' }}>AI-generated practice questions</li>
                <li style={{ marginBottom: '4px' }}>Personalized study plans</li>
                <li style={{ marginBottom: '4px' }}>Progress tracking and analytics</li>
                {/* <li style={{ marginBottom: '4px' }}>Expert explanations and rationales</li> */}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center' as const,
            padding: '24px 0',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              This email was sent by Step Genie. If you didn't request this verification, you can safely ignore this email.
            </p>
            <p style={{ margin: '0' }}>
              © 2025 Step Genie. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}