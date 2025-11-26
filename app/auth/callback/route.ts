import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/auth/complete-signup'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth Exchange Error:", error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    let isNewUser = false;
    
    if (user) {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // Only create profile if it doesn't exist (new signup)
      if (!existingProfile) {
        isNewUser = true;
        console.log('🆕 New user detected, creating profile...');
        
        // For new users, create profile with default role 'driver'
        // The role will be updated from the client side using localStorage
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          role: 'driver', // default, will be updated
          full_name: user.user_metadata.full_name || user.user_metadata.name
        });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      } else {
        console.log('👤 Existing user logging in...');
        console.log('👤 User role:', existingProfile.role);
      }
    }
    
    // Redirect based on whether this is a new signup or existing login
    if (isNewUser) {
      // New user - go to complete-signup to set role from localStorage
      console.log('➡️  Redirecting to complete-signup');
      return NextResponse.redirect(`${origin}/auth/complete-signup`)
    } else {
      // Existing user - check their role and redirect accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();
      
      console.log('➡️  Existing user role:', profile?.role);
      
      if (profile?.role === 'owner') {
        console.log('➡️  Redirecting to owner dashboard');
        return NextResponse.redirect(`${origin}/owner/dashboard`);
      } else if (profile?.role === 'operator') {
        console.log('➡️  Redirecting to operator dashboard');
        return NextResponse.redirect(`${origin}/operator/dashboard`);
      } else {
        console.log('➡️  Redirecting to driver dashboard');
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  }

  // No code provided - redirect to error
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('No authentication code found')}`)
}