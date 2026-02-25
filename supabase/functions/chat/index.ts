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

    // --- Smart Intent Extraction from conversation ---
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const allUserText = messages
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.content.toLowerCase())
      .join(" ");

    // Category detection
    const categoryKeywords: Record<string, string[]> = {
      Perfume: ["perfume", "fragrance", "scent", "cologne", "smell", "spray"],
      Attar: ["attar", "itr", "traditional fragrance"],
      Skincare: ["skincare", "skin", "face wash", "body wash", "sunscreen", "detan", "face mask", "moisturizer", "lotion"],
      "Gift Set": ["gift", "combo", "set", "hamper", "pack"],
      "Shower Gel": ["shower gel", "body wash", "bath"],
      Cosmetics: ["cosmetic", "makeup", "hair powder", "kajal", "lipstick"],
    };

    const detectedCategories: string[] = [];
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lastUserMsg.includes(kw) || allUserText.includes(kw))) {
        detectedCategories.push(category);
      }
    }

    // Price/budget detection
    const priceMatch = lastUserMsg.match(/(?:under|below|within|less than|upto|up to|budget)\s*(?:rs\.?|₹|inr)?\s*(\d+)/i)
      || lastUserMsg.match(/(?:rs\.?|₹|inr)\s*(\d+)/i);
    const maxBudget = priceMatch ? parseInt(priceMatch[1]) : null;

    // Gender detection
    const genderKeywords = {
      men: ["for men", "men's", "male", "masculine", "him", "boyfriend", "husband"],
      women: ["for women", "women's", "female", "feminine", "her", "girlfriend", "wife"],
      unisex: ["unisex", "anyone", "all"],
    };
    let detectedGender: string | null = null;
    for (const [gender, keywords] of Object.entries(genderKeywords)) {
      if (keywords.some((kw) => lastUserMsg.includes(kw))) {
        detectedGender = gender;
        break;
      }
    }

    // Occasion/use-case keywords to highlight in search
    const occasionKeywords = ["party", "date", "office", "daily", "casual", "wedding", "gift", "travel", "gym", "summer", "winter"];
    const detectedOccasions = occasionKeywords.filter((kw) => lastUserMsg.includes(kw));

    // --- Database-level filtering ---
    let productQuery = supabase.from("products").select("*");

    if (detectedCategories.length === 1) {
      productQuery = productQuery.eq("category", detectedCategories[0]);
    } else if (detectedCategories.length > 1) {
      productQuery = productQuery.in("category", detectedCategories);
    }

    // We fetch with a higher limit, then apply price filter after discount calculation
    const [{ data: products }, { data: discounts }] = await Promise.all([
      productQuery.limit(50),
      supabase.from("discounts").select("*").eq("is_active", true),
    ]);

    // Build enriched catalog with sale prices and filtering
    const enrichedProducts = (products || []).map((p: any) => {
      const applicableDiscounts = (discounts || []).filter(
        (d: any) => d.product_id === p.id || d.applicable_category === p.category
      );
      const bestDiscount = applicableDiscounts.sort(
        (a: any, b: any) => b.discount_percent - a.discount_percent
      )[0];
      const salePrice = bestDiscount
        ? Math.round(p.price * (1 - bestDiscount.discount_percent / 100))
        : p.price;
      return { ...p, salePrice, bestDiscount };
    });

    // Apply budget filter on effective sale price
    const filteredProducts = maxBudget
      ? enrichedProducts.filter((p: any) => p.salePrice <= maxBudget)
      : enrichedProducts;

    // Apply gender filter via tags/name/description
    const genderFiltered = detectedGender && detectedGender !== "unisex"
      ? filteredProducts.filter((p: any) => {
          const text = `${p.name} ${p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
          if (detectedGender === "men") return text.includes("men") || text.includes("man") || text.includes("unisex") || text.includes("him");
          if (detectedGender === "women") return text.includes("women") || text.includes("woman") || text.includes("unisex") || text.includes("her");
          return true;
        })
      : filteredProducts;

    // Use gender-filtered if it has results, otherwise fall back to price-filtered
    const finalProducts = genderFiltered.length > 0 ? genderFiltered : filteredProducts;

    // If filters returned nothing, fall back to full catalog
    const catalogProducts = finalProducts.length > 0 ? finalProducts : enrichedProducts;

    const productCatalog = catalogProducts
      .map((p: any) => {
        const lines = [
          `- ${p.name} | MRP: ₹${p.price}${p.salePrice < p.price ? ` | Sale Price: ₹${p.salePrice}` : ""} | Category: ${p.category || "General"} | Rating: ${p.rating}/5 | ID: ${p.id}`,
        ];
        if (p.description) lines.push(`  Description: ${p.description.replace(/<[^>]*>/g, "").substring(0, 200)}`);
        if (p.tags && p.tags.length > 0) lines.push(`  Tags: ${p.tags.join(", ")}`);
        if (p.bestDiscount) lines.push(`  Discount: ${p.bestDiscount.discount_percent}% off (code: ${p.bestDiscount.coupon_code})`);
        lines.push(`  Link: ${p.external_link}`);
        return lines.join("\n");
      })
      .join("\n\n");

    // Build search context summary for the AI
    const searchContext = [
      detectedCategories.length > 0 ? `Category filter: ${detectedCategories.join(", ")}` : null,
      maxBudget ? `Budget: under ₹${maxBudget}` : null,
      detectedGender ? `Gender preference: ${detectedGender}` : null,
      detectedOccasions.length > 0 ? `Occasion: ${detectedOccasions.join(", ")}` : null,
      `Products matched: ${catalogProducts.length} of ${(products || []).length} total`,
    ].filter(Boolean).join(" | ");

    const systemPrompt = `You are a friendly, helpful AI voice shopping assistant. You help users discover and buy products. You speak English and Hindi — always respond in the same language the user uses.

IMPORTANT - VOICE OUTPUT RULES:
- Your responses will be read aloud via text-to-speech. NEVER use special characters, markdown formatting, asterisks, hashtags, bullet points, or emojis in your spoken text.
- Write in plain, natural sentences. Use commas and periods only.
- Do NOT use *, #, _, ~, >, |, [], (), {}, or any markdown syntax in your commentary text.
- Numbers and currency symbols like ₹ are fine.

SEARCH CONTEXT (pre-filtered for this query):
${searchContext}

MATCHING PRODUCTS (filtered from database):
${productCatalog || "No products match the current filters."}

SMART MATCHING INSTRUCTIONS:
- Products above have already been pre-filtered by category, budget, and gender when the user specified them.
- When comparing prices, ALWAYS use the Sale Price (discounted price) if available, not MRP.
- Match user intent against product Description and Tags for deeper relevance: scent notes (sandalwood, musk, jasmine), ingredients (aloe vera, charcoal), skin type, occasion.
- Prioritize bestsellers and higher-rated products when multiple options match.
- If the filtered list is small, recommend the best matches. If empty, say honestly that nothing matches their criteria and suggest alternatives from what you have.

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
- Guide users through the shopping journey, ask follow-up questions
- Users can add products to their cart directly from your recommendations
- When a user adds an item to cart, discounts are auto-applied automatically. Tell them the discount has been auto-applied.
- When users ask about discounts, proactively mention available coupon codes
- Be conversational, warm, and helpful
- If no products match, say so honestly and suggest what you do have
- Keep responses concise but helpful

ACTION COMMANDS - Use these when the user asks to open a product or add to cart:

When the user says "show me more about X", "open X", "tell me about X product" - include this action block:
:::action
type: open_product
product_name: Product Name
:::

When the user says "add X to cart", "buy X", "add it to cart" - include this action block:
:::action
type: add_to_cart
product_name: Product Name
:::

- When a user is viewing a product (message starts with "[The user is viewing the product"), answer about THAT product only. Do not recommend other products unless asked.
- If the user says "add this to cart" or "buy this" while viewing a product, use the add_to_cart action with that product name.
- You can include BOTH product cards AND action blocks in the same response.`;


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
