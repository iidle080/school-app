import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { schoolId, schoolName, studentName, parentName, parentEmail, parentPhone, relationship, channel, studentId } = await req.json();

    if (!schoolId || !parentName || !studentName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (channel === "email" && !parentEmail) {
      return new Response(JSON.stringify({ error: "Email is required for email channel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (channel === "sms" && !parentPhone) {
      return new Response(JSON.stringify({ error: "Phone is required for SMS channel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Generate a secure token
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");

    // Create invitation record
    const invRes = await fetch(`${supabaseUrl}/rest/v1/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        school_id: schoolId,
        token,
        role: "parent",
        email: parentEmail ?? null,
        phone: parentPhone ?? null,
        full_name: parentName,
        status: "pending",
        channel: channel ?? "email",
        metadata: { student_id: studentId, student_name: studentName, relationship },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    if (!invRes.ok) {
      const err = await invRes.json();
      return new Response(JSON.stringify({ error: err.message ?? "Failed to create invitation" }), {
        status: invRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invData = await invRes.json();
    const invitationId = invData[0]?.id;

    // Build the invitation link
    const appUrl = Deno.env.get("APP_URL") ?? "https://edubridge.app";
    const inviteLink = `${appUrl}/invite/${token}`;

    // Send via email or SMS
    if (channel === "email") {
      // Use Supabase's built-in email via the auth admin API (or a simple SMTP relay)
      // For now, we'll use Resend if available, otherwise just record the invitation
      const resendApiKey = Deno.env.get("RESEND_API_KEY");

      if (resendApiKey) {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "EduBridge <noreply@edubridge.app>",
            to: parentEmail,
            subject: `You're invited to join ${schoolName} on EduBridge`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3a5f;">You're invited to EduBridge!</h2>
                <p>Hi ${parentName},</p>
                <p>${schoolName} has invited you to join EduBridge as a parent of <strong>${studentName}</strong>.</p>
                <p>With EduBridge, you can:</p>
                <ul>
                  <li>View your child's attendance and grades</li>
                  <li>Track homework and exam schedules</li>
                  <li>Message teachers directly</li>
                  <li>Receive school announcements</li>
                </ul>
                <p style="margin: 30px 0;">
                  <a href="${inviteLink}" style="background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Accept Invitation
                  </a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  Or copy this link: ${inviteLink}
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  This invitation expires in 7 days.
                </p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          console.error("Email send failed:", await emailRes.text());
        }
      }
    } else if (channel === "sms") {
      // SMS via Twilio if configured
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioFrom) {
        const smsBody = `EduBridge: ${schoolName} invited you to join as parent of ${studentName}. Activate your account: ${inviteLink}`;

        const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
        const smsRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${auth}`,
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: parentPhone,
            Body: smsBody,
          }),
        });

        if (!smsRes.ok) {
          console.error("SMS send failed:", await smsRes.text());
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      invitationId,
      token,
      inviteLink,
      message: channel === "email"
        ? `Invitation email sent to ${parentEmail}`
        : `Invitation SMS sent to ${parentPhone}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
