import { NextResponse } from 'next/server';

const COOKIE_NAMES = ['session', 'receptionist_session', 'pharmacy_session', 'psychologist_session'];

function clearAllCookies(response) {
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    });
  }
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearAllCookies(response);
}

export async function GET(request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  return clearAllCookies(response);
}