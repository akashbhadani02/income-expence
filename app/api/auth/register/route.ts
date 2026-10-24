import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { createToken } from '@/lib/auth';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();
        if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || typeof password !== 'string' || password.length < 8)
            return NextResponse.json({ error: 'નામ, માન્ય ઇમેઇલ અને ઓછામાં ઓછા 8 અક્ષરનો પાસવર્ડ આપો.' }, { status: 400 });
        await connectDB();
        if (await User.findOne({ email: email.toLowerCase() }))
            return NextResponse.json({ error: 'આ ઇમેઇલ પહેલેથી નોંધાયેલ છે.' }, { status: 409 });
        const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) });
        const token = await createToken(String(user._id));
        const res = NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 });
        res.cookies.set('finance_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
        return res;
    }
    catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'નોંધણી થઈ શકી નહીં. સેટિંગ્સ તપાસો.' }, { status: 500 });
    }
}
