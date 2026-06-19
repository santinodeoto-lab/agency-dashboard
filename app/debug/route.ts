import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  return NextResponse.json({
    cookieNames: allCookies.map(c => c.name),
    hasAuthCookie: allCookies.some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token')),
    cookieCount: allCookies.length,
  })
}
