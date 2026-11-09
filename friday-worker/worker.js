const cors = (origin) => ({
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
  ...(origin ? {"Access-Control-Allow-Origin": origin, "Vary": "Origin"} : {})
});
const reply = (data, status=200, origin="") => new Response(JSON.stringify(data), {
  status, headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...cors(origin)}
});
const originAllowed = o => !o || o === "https://friday.rkanashik.workers.dev" ||
  /^http:\/\/(localhost|127\.0\.0\.1):(3000|5173|8787)$/.test(o);

// --- Telephony Imports ---
import { ExotelProvider } from "./lib/telephony.js";
import { VoiceEngine } from "./lib/voice.js";

async function getUser(req, env) {
  const token = (req.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;
  const r = await fetch(env.SUPABASE_URL.replace(/\\/,"") + "/auth/v1/user", {
    headers: {apikey:env.SUPABASE_PUBLISHABLE_KEY, Authorization:"Bearer "+token},
    signal: AbortSignal.timeout(10000)
  });
  if (!r.ok) return null;
  const u = await r.json();
  return typeof u.id === "string" ? {id:u.id} : null;
}

async function ollama(message, env) {
  const r = await fetch("https://ollama.com/v1/chat/completions", {
    method:"POST",
    headers:{Authorization:"Bearer "+env.OLLAMA_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:env.OLLAMA_MODEL || "minimax-m3:cloud", stream:false,
      messages:[
        {role:"system",content:"You are FRIDAY, a helpful, safe, concise personal AI assistant. Do not claim to perform actions. This API is chat-only."},
        {role:"user",content:message}
      ]
    }),
    signal:AbortSignal.timeout(30000)
  });
  if (!r.ok) throw Error("Ollama unavailable");
  const d=await r.json(), t=d?.choices?.[0]?.message?.content;
  if(typeof t!=="string" || !t.trim()) throw Error("Empty response");
  return t.trim();
}

async function gemini(message, env) {
  if(!env.GEMINI_MODEL) throw Error("Gemini model not configured");
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(env.GEMINI_MODEL)+":generateContent",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
    body:JSON.stringify({
      systemInstruction:{parts:[{text:"You are FRIDAY, a helpful, safe, concise personal AI assistant. Do not claim to perform actions. This API is chat-only."}]},
      contents:[{role:"user",parts:[{text:message}]}]
    }),
    signal:AbortSignal.timeout(30000)
  });
  if(!r.ok) throw Error("Gemini unavailable");
  const d=await r.json();
  const t=(d?.candidates?.[0]?.content?.parts||[]).map(p=>typeof p.text==="string"?p.text:"").join("").trim();
  if(!t) throw Error("Empty response");
  return t;
}

export default { async fetch(request, env) {
  const url=new URL(request.url), origin=request.headers.get("Origin")||"";
  if(!originAllowed(origin)) return reply({error:"ORIGIN_NOT_ALLOWED"},403);
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors(origin)});
  if(request.method==="GET" && (url.pathname==="/" || url.pathname==="/health"))
    return reply({
      service:"FRIDAY",status:"online",environment:"production",
      authConfigured:!!(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY),
      primaryProvider:"ollama",fallbackProvider:"gemini",budgetMode:"starter",
      aiReady:!!(env.OLLAMA_API_KEY&&env.OLLAMA_FREE_CREDITS_CONFIRMED==="true")
    },200,origin);

  // --- Device List ---
  if(request.method==="GET" && url.pathname==="/v1/devices") {
    let user;
    try { user=await getUser(request,env); } catch { return reply({error:"AUTH_SERVICE_UNAVAILABLE"},503,origin); }
    if(!user) return reply({error:"UNAUTHENTICATED"},401,origin);

    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/devices?user_id=eq.${user.id}&select=*`, {
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` }
    }).then(res => res.json());
    return reply({ devices: r }, 200, origin);
  }

  // --- Telephony Webhooks ---

  if(url.pathname==="/webhook/exotel") {
    const callSid = url.searchParams.get("CallSid");
    if(!callSid) return reply({error:"MISSING_CALL_SID"},400,origin);

    const id = env.CALL_SESSIONS.idFromName(callSid);
    const session = env.CALL_SESSIONS.get(id);

    return session.fetch(request);
  }

  // --- Outbound Call Trigger ---
  if(url.pathname==="/api/call/outbound") {
    let user;
    try { user=await getUser(request,env); }
    catch { return reply({error:"AUTH_SERVICE_UNAVAILABLE"},503,origin); }
    if(!user) return reply({error:"UNAUTHENTICATED"},401,origin);

    let body;
    try {
      const raw=await request.text();
      body=JSON.parse(raw);
    } catch { return reply({error:"INVALID_JSON"},400,origin); }

    const { phoneNumber } = body;
    if(!phoneNumber) return reply({error:"PHONE_NUMBER_REQUIRED"},400,origin);

    const verifiedNumber = await fetch(
      `${env.SUPABASE_URL}/rest/v1/phone_numbers?user_id=eq.${user.id}&phone_number=eq.${phoneNumber}&verified=eq.true`,
      {
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    ).then(r => r.json());

    if (!verifiedNumber || verifiedNumber.length === 0) {
      return reply({error:"UNAUTHORIZED_NUMBER", message:"You can only call your own verified number."}, 403, origin);
    }

    const telephony = new ExotelProvider(env);
    const callbackUrl = `${url.origin}/webhook/exotel`;

    try {
      const sid = await telephony.initiateOutgoingCall(phoneNumber, env.FRIDAY_VIRTUAL_NUMBER, callbackUrl);
      return reply({ success: true, callSid: sid }, 200, origin);
    } catch (e) {
      return reply({ error: "TELEPHONY_PROVIDER_FAILED", message: e.message }, 502, origin);
    }
  }

  if(request.method!=="POST" || !["/v1/auth/verify","/v1/chat","/v1/devices/pairing/start","/v1/devices/pairing/complete"].includes(url.pathname)) {
    if(request.method!=="GET" || !["/v1/devices"].includes(url.pathname)) {
      return reply({error:"NOT_FOUND"},404,origin);
    }
  }


  let user;
  try { user=await getUser(request,env); }
  catch { return reply({error:"AUTH_SERVICE_UNAVAILABLE"},503,origin); }
  if(!user) return reply({error:"UNAUTHENTICATED"},401,origin);
  if(url.pathname==="/v1/devices/pairing/start") {
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await fetch(`${env.SUPABASE_URL}/rest/v1/device_pairing_codes`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ user_id: user.id, pairing_code: pairingCode, expires_at: expiresAt })
    }).then(r => r.json());

    if (error) return reply({ error: "PAIRING_FAILED", message: error.message }, 500, origin);
    return reply({ pairingCode, expiresAt }, 200, origin);
  }

  if(url.pathname==="/v1/devices/pairing/complete") {
    const { pairingCode, deviceName, platform } = await request.json().catch(() => ({}));
    if(!pairingCode || !deviceName || !platform) return reply({error:"MISSING_PARAMS"},400,origin);

    const codes = await fetch(`${env.SUPABASE_URL}/rest/v1/device_pairing_codes?pairing_code=eq.${pairingCode}&user_id=eq.${user.id}&used_at=is.null&expires_at=gt.${new Date().toISOString()}`, {
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
    }).then(r => r.json());

    if(!codes || codes.length === 0) return reply({error:"INVALID_OR_EXPIRED_CODE"},403,origin);
    const codeId = codes[0].id;

    const { error: devError } = await fetch(`${env.SUPABASE_URL}/rest/v1/devices`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ user_id: user.id, device_name: deviceName, platform, status: "online" })
    }).then(r => r.json());

    if(devError) return reply({ error: "DEVICE_REGISTRATION_FAILED", message: devError.message }, 500, origin);

    await fetch(`${env.SUPABASE_URL}/rest/v1/device_pairing_codes`, {
      method: "PATCH",
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ used_at: new Date().toISOString() })
    });

    return reply({ success: true, message: "Device paired successfully" }, 200, origin);
  }

  if(url.pathname==="/v1/auth/verify") return reply({authenticated:true,userId:user.id},200,origin);

  if(Number(request.headers.get("Content-Length")||"0")>8192)
    return reply({error:"REQUEST_TOO_LARGE"},413,origin);
  let body;
  try {
    const raw=await request.text();
    if(raw.length>8192) return reply({error:"REQUEST_TOO_LARGE"},413,origin);
    body=JSON.parse(raw);
  } catch { return reply({error:"INVALID_JSON"},400,origin); }
  const message=body?.message;
  if(typeof message!=="string" || !message.trim() || message.length>4000)
    return reply({error:"MESSAGE_MUST_BE_1_TO_4000_CHARACTERS"},400,origin);

  const p=!!(env.OLLAMA_API_KEY&&env.OLLAMA_FREE_CREDITS_CONFIRMED==="true");
  const f=!!(env.GEMINI_API_KEY&&env.GEMINI_FREE_TIER_CONFIRMED==="true"&&env.GEMINI_MODEL);
  if(!p&&!f) return reply({error:"AI_NOT_CONFIGURED",message:"No verified zero-charge allowance. No provider was called."},503,origin);
  if(p) {
    try { return reply({reply:await ollama(message.trim(),env),provider:"ollama"},200,origin); }
    catch { if(!f) return reply({error:"PRIMARY_PROVIDER_FAILED",fallbackAvailable:false},502,origin); }
  }
  if(f) {
    try { return reply({reply:await gemini(message.trim(),env),provider:"gemini",fallback:true},200,origin); }
    catch { return reply({error:"AI_PROVIDERS_UNAVAILABLE"},502,origin); }
  }
  return reply({error:"AI_NOT_CONFIGURED"},503,origin);
}};
