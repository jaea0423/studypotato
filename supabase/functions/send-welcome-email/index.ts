// ============================================================
// send-welcome-email
// 회원가입 완료 환영 메일 발송 (Resend API)
//
// 호출: 클라이언트 finishSignup 성공 직후 fire-and-forget
// 환경변수: RESEND_API_KEY (이미 등록되어 있음)
// 매개변수: { email, nickname }
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, nickname } = await req.json();

    // 입력 검증
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'invalid_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const safeNickname = (typeof nickname === 'string' && nickname.length > 0)
      ? nickname.replace(/[<>&"']/g, '')  // XSS 방지 — 메일 본문에 그대로 들어가는 값
      : '감자';

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'config_missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 메일 본문 (한글 디자인, 인라인 CSS)
    const html = `
<div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; color: #1A1A1A; background: #F7F3EC; padding: 40px 24px;">
  <div style="background: #FFFFFF; border-radius: 22px; padding: 40px 32px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">

    <div style="font-size: 64px; line-height: 1; margin-bottom: 16px;">🥔</div>
    <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.025em; color: #1A1A1A;">${safeNickname} 님, 환영해요!</h1>
    <p style="font-size: 15px; color: #555E68; line-height: 1.6; margin: 0 0 32px;">공부하는 감자에 가입해주셔서<br>감사합니다 🙏</p>

    <div style="background: #F7F3EC; border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 14px;">
        <tr>
          <td valign="top" width="28" style="font-size: 16px;">🤝</td>
          <td valign="top" style="padding-left: 4px;">
            <div style="font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px;">매칭이 잡히면 바로 알려드릴게요</div>
            <div style="font-size: 13px; color: #555E68; line-height: 1.5;">매칭 결과, 응답 요청 등 중요한 알림은 이 메일로 발송됩니다.</div>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 14px;">
        <tr>
          <td valign="top" width="28" style="font-size: 16px;">📚</td>
          <td valign="top" style="padding-left: 4px;">
            <div style="font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px;">먼저 팀을 만들어두면 매칭이 빨라져요</div>
            <div style="font-size: 13px; color: #555E68; line-height: 1.5;">관심 분야 / 시간대 / 인원을 정해두면 자동으로 비슷한 사람을 찾아드려요.</div>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="top" width="28" style="font-size: 16px;">🔑</td>
          <td valign="top" style="padding-left: 4px;">
            <div style="font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px;">이 메일로도 로그인할 수 있어요</div>
            <div style="font-size: 13px; color: #555E68; line-height: 1.5;">강원대 웹메일이 잘 안 떠오를 때 편하게 들어오세요.</div>
          </td>
        </tr>
      </table>
    </div>

    <a href="https://studypotato.com" style="display: inline-block; background: #0047BB; color: #FFFFFF; padding: 14px 28px; border-radius: 16px; font-size: 15px; font-weight: 700; text-decoration: none; margin-bottom: 20px;">공부하는 감자 시작하기 →</a>

    <div style="background: #E5ECF8; border-radius: 16px; padding: 14px 18px; font-size: 13px; color: #00347E; line-height: 1.6; text-align: left;">
      ℹ️ 본 서비스는 강원대학교에서 운영하는 공식 서비스가 아니에요. 강원대학교 재학생이 운영하고 있습니다.
    </div>

  </div>

  <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #8B95A4; line-height: 1.6;">
    공부하는 감자 · <a href="https://studypotato.com" style="color: #8B95A4; text-decoration: underline;">studypotato.com</a><br>
    이 메일은 회원가입 시 자동 발송됐어요.
  </div>
</div>
`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '공부하는 감자 <noreply@studypotato.com>',
        to: [email],
        subject: `🥔 ${safeNickname} 님, 공부하는 감자에 오신 것을 환영해요`,
        html: html
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Resend error:', res.status, errorText);
      return new Response(
        JSON.stringify({ error: 'send_failed', detail: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await res.json();
    console.log('✓ Welcome email sent:', email, 'nickname:', safeNickname, 'id:', result.id);
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({ error: 'unknown', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
