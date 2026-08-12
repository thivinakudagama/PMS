import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email, role, orgId } = await request.json();

    if (!email || !role || !orgId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the caller is authenticated
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify the caller is an Admin of the organization
    const { data: memberData, error: memberError } = await (supabase
      .from('organization_members') as any)
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData || memberData.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can invite members' }, { status: 403 });
    }

    const adminAuthClient = createAdminClient();

    // 3. Check if the user already exists in the system (public.profiles)
    let targetUserId: string | undefined;

    const { data: existingProfile } = await (supabase
      .from('profiles') as any)
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      targetUserId = existingProfile.id;
    } else {
      // 4. User does not exist, send an email invitation using the Admin API
      // Construct the absolute URL for the redirect
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const { data: inviteData, error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/update-password`
      });
      
      if (inviteError) {
        // If the user already registered in auth.users but no profile exists for some reason, catch it
        if (inviteError.message.includes('already registered')) {
          return NextResponse.json({ error: 'User is partially registered. Please delete them from auth.users first.' }, { status: 400 });
        }
        return NextResponse.json({ error: `Failed to invite user: ${inviteError.message}` }, { status: 400 });
      }

      if (inviteData?.user) {
        targetUserId = inviteData.user.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Failed to resolve user ID' }, { status: 500 });
    }

    // 5. Check if they are already in the organization
    const { data: existingOrgMember } = await (supabase
      .from('organization_members') as any)
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', targetUserId)
      .single();

    if (existingOrgMember) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
    }

    // 6. Add them to the organization
    // Use the admin client to bypass RLS for inserting the member, just in case they haven't accepted the invite yet
    const { data: newMember, error: insertError } = await (adminAuthClient
      .from('organization_members') as any)
      .insert({
        org_id: orgId,
        user_id: targetUserId,
        role: role,
      })
      .select('*, user:profiles(*)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Failed to add member to organization: ${insertError.message}` }, { status: 500 });
    }

    // 7. Log the activity
    await (adminAuthClient.from('activity_logs') as any).insert({
      org_id: orgId,
      user_id: user.id,
      action: `invited ${email} as ${role}`,
      entity_type: 'member',
      entity_id: newMember.id,
    });

    return NextResponse.json({ member: newMember });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
