import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { getUserId, unauthorized } from '@/lib/auth';
import User from '@/models/User';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  try {
    const body = await req.json();
    const currentPassword = body?.currentPassword;
    const newPassword = body?.newPassword;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128)
      return NextResponse.json({ error: 'નવો પાસવર્ડ ઓછામાં ઓછા 8 અક્ષરનો હોવો જોઈએ.' }, { status: 400 });
    await connectDB();
    const user = await User.findById(userId).select('+passwordHash');
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))
      return NextResponse.json({ error: 'જૂનો પાસવર્ડ ખોટો છે.' }, { status: 400 });
    if (currentPassword === newPassword)
      return NextResponse.json({ error: 'નવો પાસવર્ડ જૂના પાસવર્ડથી અલગ રાખો.' }, { status: 400 });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return NextResponse.json({ message: 'પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો.' });
  } catch {
    return NextResponse.json({ error: 'પાસવર્ડ બદલી શકાયો નથી. ફરી પ્રયાસ કરો.' }, { status: 500 });
  }
}
