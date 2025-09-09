import { NextResponse  } from 'next/server';
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) { const { pathname  } = request.nextUrl; // Redirect /leagues/1 to the demo league UUID
  if (pathname === '/leagues/1' || pathname.startsWith('/leagues/1/')) { const newPath = pathname.replace('/leagues/1', '/leagues/00000000-0000-0000-0000-000000000001')
    const url = request.nextUrl.clone();
    url.pathname = newPath
    return NextResponse.redirect(url)
   }
  
  return NextResponse.next()
}
 
config: {

  matcher [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]

}