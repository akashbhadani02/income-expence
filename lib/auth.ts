import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return new TextEncoder().encode(value);
};
export async function createToken(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret());
}
export async function getUserId() {
  const token = cookies().get('finance_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret()); return typeof payload.userId === 'string' ? payload.userId : null; } catch { return null; }
}
export function unauthorized() { return NextResponse.json({ error: 'કૃપા કરીને લૉગિન કરો.' }, { status: 401 }); }
