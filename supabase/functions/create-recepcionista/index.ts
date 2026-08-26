import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = {
  nombre?: string;
  email?: string;
  password?: string;
  gimnasioId?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    return json({ error: 'Variables de entorno incompletas' }, 500);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const nombre = body.nombre?.trim();
  const email = body.email?.trim();
  const password = body.password?.trim();
  const gimnasioId = body.gimnasioId?.trim();

  if (!nombre || !email || !password || !gimnasioId) {
    return json({ error: 'Faltan campos obligatorios' }, 400);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (createUserError || !authUser.user) {
    return json({ error: createUserError?.message ?? 'No se pudo crear el usuario' }, 400);
  }

  const { error: insertError } = await supabase.from('usuarios').insert({
    auth_id: authUser.user.id,
    gimnasio_id: gimnasioId,
    nombre,
    email,
    rol: 'recepcionista',
    activo: true,
  });

  if (insertError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true, auth_id: authUser.user.id });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
