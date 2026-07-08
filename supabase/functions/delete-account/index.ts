import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
      }),
      {
        status: 401,
        headers: corsHeaders,
      },
    );
  }

  // клиент пользователя (проверяем кто вошёл)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({
        error: "User not allowed",
      }),
      {
        status: 401,
        headers: corsHeaders,
      },
    );
  }

  // админ клиент для удаления
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,

    Deno.env.get("SERVICE_ROLE_KEY")!,
  );

  // удаляем профиль
  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return new Response(
      JSON.stringify({
        error: profileError.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }

  // удаляем auth пользователя
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return new Response(
      JSON.stringify({
        error: deleteError.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
    }),

    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});
