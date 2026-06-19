import { NextResponse, type NextRequest } from 'next/server'

// Middleware temporalmente desactivado para diagnóstico
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
