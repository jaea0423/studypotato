// ============================================================
// send-pre-register-email
// 사전신청 완료 안내 메일 발송 (Resend API)
//
// 호출: 클라이언트에서 supabaseClient.functions.invoke(...)
// 환경변수: RESEND_API_KEY (Project Settings → Edge Functions → Secrets)
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS 헤더 — 브라우저에서 다른 도메인 호출 허용
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1) CORS preflight 응답
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2) 요청 본문에서 email 추출
    const { email } = await req.json();

    // 3) 간단한 입력 검증
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'invalid_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4) Resend API 키 확인 (없으면 config 미설정)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'config_missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5) 메일 본문 (한글 디자인, 인라인 CSS)
    //    ※ 메일 클라이언트 호환성을 위해 모든 스타일은 inline으로
    const html = `
<div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; color: #1A1A1A; background: #F7F3EC; padding: 40px 24px;">
  <div style="background: #FFFFFF; border-radius: 22px; padding: 40px 32px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">

    <div style="font-size: 64px; line-height: 1; margin-bottom: 16px;">🥔</div>
    <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.025em; color: #1A1A1A;">사전신청이 완료됐어요!</h1>
    <p style="font-size: 15px; color: #555E68; line-height: 1.6; margin: 0 0 32px;">공부하는 감자에 관심 가져주셔서<br>감사합니다 🙏</p>

    <div style="background: #F7F3EC; border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 14px;">
        <tr>
          <td valign="top" width="28" style="font-size: 16px;">📬</td>
          <td valign="top" style="padding-left: 4px;">
            <div style="font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px;">정식 출시 시 가장 먼저 알려드릴게요</div>
            <div style="font-size: 13px; color: #555E68; line-height: 1.5;">강원대학교 춘천캠퍼스 학생들의 스터디 매칭 서비스가 곧 시작됩니다.</div>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="top" width="28" style="font-size: 16px;">🔒</td>
          <td valign="top" style="padding-left: 4px;">
            <div style="font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px;">메일 주소는 6개월간 안전하게 보관됩니다</div>
            <div style="font-size: 13px; color: #555E68; line-height: 1.5;">출시 알림 발송 외 다른 용도로 사용하지 않아요.</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #E5ECF8; border-radius: 16px; padding: 14px 18px; font-size: 13px; color: #00347E; line-height: 1.6; text-align: left;">
      ℹ️ 본 서비스는 강원대학교에서 운영하는 공식 서비스가 아니에요. 강원대학교 재학생이 운영하고 있습니다.
    </div>

  </div>

  <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #8B95A4; line-height: 1.6;">
    공부하는 감자 · <a href="https://studypotato.com" style="color: #8B95A4; text-decoration: underline;">studypotato.com</a><br>
    이 메일은 사전신청 시 자동 발송됐어요.
  </div>
</div>
`;

    // 6) Resend API 호출 (메일 발송)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '공부하는 감자 <noreply@studypotato.com>',
        to: [email],
        subject: '🥔 공부하는 감자 사전신청이 완료됐어요',
        html: html
      })
    });

    // 7) 실패 처리
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Resend error:', res.status, errorText);
      return new Response(
        JSON.stringify({ error: 'send_failed', detail: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8) 성공
    const result = await res.json();
    console.log('✓ Pre-register email sent:', email, 'id:', result.id);
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
