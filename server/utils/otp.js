import nodemailer from 'nodemailer';

import { encryptEmail } from './emailEncrypt.js';
import User from '../models/User.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tayyibtechbd@gmail.com',
    pass: 'guakpogxseqxjwyp'
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(email) {
  const encEmail = encryptEmail(email);
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  console.log(`Generated OTP for ${email}: ${otp}`);
  await User.findOneAndUpdate({ email: encEmail }, { otp, otpExpires });
  await transporter.sendMail({
    from: 'uiuBot <tayyibtechbd@gmail.com>',
    to: email,
    subject: 'Your uiuBot OTP',
    text: `Your OTP is: ${otp}`
  });
}

export async function verifyOTP(email, otp) {
  const encEmail = encryptEmail(email);
  const user = await User.findOne({ email: encEmail });
  if (!user || user.otp !== otp) return false;
  if (user.otpExpires < new Date()) return false;
  await User.findOneAndUpdate({ email: encEmail }, { otp: null, otpExpires: null });
  return true;
}
