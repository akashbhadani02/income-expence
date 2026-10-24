import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getUserId, unauthorized } from '@/lib/auth';
import Person from '@/models/Person';
export const runtime = 'nodejs';
export async function GET() { const uid = await getUserId(); if (!uid)
    return unauthorized(); await connectDB(); const people = await Person.find({ userId: uid }).sort({ name: 1 }).lean(); return NextResponse.json({ people }); }
export async function POST(req: NextRequest) { const uid = await getUserId(); if (!uid)
    return unauthorized(); try {
    const { name } = await req.json();
    if (!name?.trim())
        return NextResponse.json({ error: 'વ્યક્તિનું નામ લખો.' }, { status: 400 });
    await connectDB();
    const person = await Person.create({ userId: uid, name: name.trim() });
    return NextResponse.json({ person }, { status: 201 });
}
catch {
    return NextResponse.json({ error: 'આ નામ પહેલેથી હોઈ શકે છે.' }, { status: 409 });
} }
