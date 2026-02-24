

## Import Bella Vita Product Catalog

### What's in Your File
Your Excel file is a Shopify product export containing ~30 Bella Vita products across these categories:
- **Perfumes** (Narco, Devil, Pure Musk, Beast, Ghost, CEO Woman, zodiac series like Taurus, Gemini, Leo, Virgo, Pisces, Aquarius)
- **Skincare** (Detan Body Wash, Face Mask for Men, Sunscreen SPF 50)
- **Shower Gels** (KLUB Man, DATE Woman)
- **Gift Sets** (DC Women's, combo packs like Klub Man + White Oud, Date Woman + Glam Woman, etc.)
- **Cosmetics** (Black Magic Duo hair powder)
- **Attars** (TAAJ Ameer)

Each product includes: name, price, compare-at price, images (Shopify CDN URLs), descriptions, and product handles.

### What Will Happen

**Step 1: Clear existing demo products**
Remove the current placeholder products (electronics, fashion, home items) and their discounts from the database.

**Step 2: Insert all Bella Vita products**
Insert ~30 products into the `products` table, mapping:
- **name** from Title column
- **price** from Compare At Price (original MRP) when higher than sale price, otherwise Variant Price
- **description** from Body HTML (cleaned to plain text)
- **image_url** from Image Src (position 1 only -- the primary product photo)
- **external_link** constructed as `https://bellavitaorganic.com/products/{handle}` (handle without "-cbd"/"-swiggy" suffix where applicable)
- **category** mapped to: Perfume, Skincare, Shower Gel, Gift Set, Cosmetics, or Attar
- **rating** set to 4.5 for bestsellers, 4.2 default (no rating data in spreadsheet)

**Step 3: Insert discounts**
For products where Compare At Price > Variant Price (meaning there's a real discount), create entries in the `discounts` table with auto-generated coupon codes like "BELLA10", "BELLA20" based on discount percentage.

**Step 4: Update homepage category filters**
Update `src/pages/Index.tsx` to replace the old filter tabs ("Electronics", "Fashion", "Home") with the new Bella Vita categories: "Perfume", "Skincare", "Gift Set", "Cosmetics", "Shower Gel", "Attar".

### Technical Details

**Database operations (using insert tool):**
- `DELETE FROM discounts;` -- remove old discounts
- `DELETE FROM products;` -- remove old demo products
- `INSERT INTO products (name, price, description, image_url, external_link, category, rating, tags)` for each product
- `INSERT INTO discounts (coupon_code, discount_percent, applicable_category, is_active)` for category-wide discounts

**File changes:**
- `src/pages/Index.tsx` -- Update FILTERS array and category icons to match new product categories

**Products to be inserted (sample):**

| Product | Sale Price | MRP | Category |
|---------|-----------|-----|----------|
| Narco Unisex Perfume - 100ml | 399 | 899 | Perfume |
| TAAJ Ameer Attar - 12ml | 299 | 599 | Attar |
| DC Women's Gift Set | 499 | 799 | Gift Set |
| Party Perfect Detan Body Wash | 299 | 349 | Skincare |
| Suncare Brightening Sunscreen | 269 | 299 | Skincare |
| Black Magic Duo | 649 | 1098 | Cosmetics |
| Beast Perfume - 100ml | 799 | 899 | Perfume |
| Taurus Perfume - 100ml | 899 | -- | Perfume |
| ...and ~22 more products | | | |

All product images will use the existing Shopify CDN URLs from your spreadsheet, so they'll load without needing to upload anything.

