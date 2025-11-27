import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/auth/complete-signup'
  
  // Get the pending role from query params (we'll pass it from client)
  const pendingRole = searchParams.get('role')

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
    let userRole = 'driver'; // default
    
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
        
        // Determine role: use pendingRole from query params or default to 'driver'
        if (pendingRole && ['driver', 'owner', 'operator'].includes(pendingRole)) {
          userRole = pendingRole;
          console.log(`✅ Setting role to: ${userRole} (from query params)`);
        } else {
          console.log('⚠️  No valid role in query params, defaulting to driver');
        }
        
        // Get username from user metadata (set during signup)
        const username = user.user_metadata.username;
        
        // Create profile with the correct role from the start
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          role: userRole,
          full_name: user.user_metadata.full_name || user.user_metadata.name,
          username: username || null, // Add username from metadata
        });
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError);
        } else {
          console.log(`✅ Profile created with role: ${userRole} and username: ${username}`);
        }
      } else {
        console.log('👤 Existing user found...');
        console.log('👤 Current role in database:', existingProfile.role);
        
        // If user is coming from signup with a different role, update it
        if (pendingRole && ['driver', 'owner', 'operator'].includes(pendingRole)) {
          if (existingProfile.role !== pendingRole) {
            console.log(`🔄 Updating role from "${existingProfile.role}" to "${pendingRole}"`);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: pendingRole })
              .eq('id', user.id);
            
            if (updateError) {
              console.error('❌ Error updating role:', updateError);
              userRole = existingProfile.role; // Keep old role if update fails
            } else {
              console.log(`✅ Role updated to: ${pendingRole}`);
              userRole = pendingRole; // Use new role
            }
          } else {
            console.log('✅ Role already correct:', existingProfile.role);
            userRole = existingProfile.role;
          }
        } else {
          // No role in query params, use existing role (normal login)
          console.log('ℹ️  No role in query params, using existing role');
          userRole = existingProfile.role;
        }
      }
    }
    
    // Redirect based on role (both new and existing users)
    console.log(`➡️  Redirecting to dashboard based on role: ${userRole}`);
    
    if (userRole === 'owner') {
      console.log('➡️  Redirecting to owner dashboard');
      return NextResponse.redirect(`${origin}/owner/dashboard`);
    } else if (userRole === 'operator') {
      console.log('➡️  Redirecting to operator dashboard');
      return NextResponse.redirect(`${origin}/operator/dashboard`);
    } else {
      console.log('➡️  Redirecting to driver dashboard');
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // No code provided - redirect to error
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('No authentication code found')}`)
}