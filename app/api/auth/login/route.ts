import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { createToken } from '@/lib/auth';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        await connectDB();
        const user = await User.findOne({ email: String(email || '').toLowerCase() });
        if (!user || !await bcrypt.compare(password || '', user.passwordHash))
            return NextResponse.json({ error: 'ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.' }, { status: 401 });
        const token = await createToken(String(user._id));
        const res = NextResponse.json({ user: { name: user.name, email: user.email } });
        res.cookies.set('finance_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
        return res;
    }
    catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'લૉગિન થઈ શક્યું નહીં. સેટિંગ્સ તપાસો.' }, { status: 500 });
    }
}
