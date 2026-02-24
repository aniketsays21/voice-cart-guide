import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products and discounts for context
    const [{ data: products }, { data: discounts }] = await Promise.all([
      supabase.from("products").select("*").limit(50),
      supabase.from("discounts").select("*").eq("is_active", true),
    ]);

    const productCatalog = (products || [])
      .map((p: any) => {
        const applicableDiscounts = (discounts || []).filter(
          (d: any) =>
            d.product_id === p.id || d.applicable_category === p.category
        );
        const bestDiscount = applicableDiscounts.sort(
          (a: any, b: any) => b.discount_percent - a.discount_percent
        )[0];
        return `- ${p.name} | ₹${p.price} | Category: ${p.category || "General"} | Rating: ${p.rating}/5 | ID: ${p.id}${bestDiscount ? ` | Discount: ${bestDiscount.discount_percent}% off (code: ${bestDiscount.coupon_code})` : ""} | Link: ${p.external_link}`;
      })
      .join("\n");

    const systemPrompt = `You are a friendly, helpful AI shopping assistant. You help users discover and buy products. You speak English and Hindi — always respond in the same language the user uses.

AVAILABLE PRODUCTS:
${productCatalog || "No products available yet."}

INSTRUCTIONS:
- Understand the user's needs through conversation (budget, preferences, use case)
- Recommend relevant products from the catalog above
- When recommending products, ALWAYS use this exact format for each product card:

:::product
name: Product Name
description: Short one-line description
price: ₹1299
discount_price: ₹999
discount_code: SAVE20
image: https://image-url.jpg
link: https://store-link.com
rating: 4.5
:::

- Show original price AND discounted price when a discount is available
- Guide users through the shopping journey — ask follow-up questions
- Users can add products to their cart directly from your recommendations using the "Add to Cart" button on each product card
- When a user adds an item to cart, discounts are AUTO-APPLIED automatically — tell them: "Great choice! The discount has been auto-applied to your cart."
- When users ask about discounts, proactively mention available coupon codes and reassure them: "Don't worry, the discount will be auto-applied when you add it to cart!"
- Encourage users to tap "Add to Cart" instead of visiting external links
- If a user asks to buy or checkout, remind them to review their cart by tapping the cart icon in the header
- Be conversational, warm, and helpful
- If no products match, say so honestly and suggest what you do have
- Keep responses concise but helpful`;


    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await supabase
        .from("conversations")
        .insert({ session_id: sessionId || crypto.randomUUID(), language: "en" })
        .select("id")
        .single();
      convId = conv?.id;
    }

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && convId) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: lastUserMsg.content,
      });
    }

    // Call AI
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We need to collect the full response to save it, while also streaming
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        // Extract content from SSE for saving
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {}
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Save assistant response
        if (fullResponse && convId) {
          await supabase.from("messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: fullResponse,
          });
        }
      },
    });

    const stream = response.body!.pipeThrough(transformStream);

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Conversation-Id": convId || "",
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
