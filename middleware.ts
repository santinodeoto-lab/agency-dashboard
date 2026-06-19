import { NextResponse, type NextRequest } from 'next/server'

// El middleware Edge no puede leer la cookie de Supabase (límite de tamaño de headers).
// La autenticación la manejan las páginas Server Component con getUser() en Node.js runtime.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
