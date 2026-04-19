/**
 * app/api/auth/otp/send/route.js
 * POST /api/auth/otp/send
 * Generates a 6-digit OTP and emails it to the user.
 */
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveOtp } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const otp = generateOtp();
    saveOtp(email, otp);

    const transporter = buildTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Your Wallpaper Hub Login Code',
      html: `
        <div style="font-family:Inter,sans-serif;background:#0f0f13;color:#e2e2e8;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#4f46e5);font-weight:900;font-size:18px;color:#fff;margin-bottom:12px;">WH</div>
            <h1 style="margin:0;font-size:22px;font-weight:800;">Wallpaper Hub</h1>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">Your one-time login code</h2>
          <p style="color:#9090a8;margin-bottom:24px;font-size:14px;">Enter this code on the login page. It expires in <strong style="color:#e2e2e8;">10 minutes</strong>.</p>
          <div style="background:#1a1a24;border:1px solid #2d2d3d;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#a78bfa;">${otp}</span>
          </div>
          <p style="color:#6060788;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
