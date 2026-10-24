import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db'; import { getUserId, unauthorized } from '@/lib/auth'; import User from '@/models/User';
export const runtime = 'nodejs';
export async function GET() { const uid = await getUserId(); if (!uid) return unauthorized(); await connectDB(); const user = await User.findById(uid).select('name email').lean(); if (!user) return unauthorized(); return NextResponse.json({ user }); }
