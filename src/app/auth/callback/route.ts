import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // This route was used for Supabase OAuth.
  // It now simply redirects to the dashboard.
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
