/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from "next/server";
import { Op, type Includeable } from "sequelize";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Product, {
  type ProductAttributes,
  type ProductCreationAttributes,
  type ProductDescription,
  type ProductSpecification,
} from "./productModel";
import ProductIngredient from "./productIngredientModel";
import Category from "../productCategory/productCatetgoryModel";
import { logger } from "@/lib/logger";
import { AppError, errorResponse } from "@/lib/apiError";

const CTX = "ProductController";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ATTRIBUTES = ["id", "categoryName", "parentId"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

// Standard include used across reads — always pull category + ingredients
const PRODUCT_INCLUDE: Includeable[] = [
  { model: Category,          as: "category",    attributes: CATEGORY_ATTRIBUTES },
  { model: ProductIngredient, as: "ingredients" },
];

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    logger.debug(CTX, "Created upload directory", { path: UPLOAD_DIR });
  }
}

function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function parsePagination(searchParams: URLSearchParams) {
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * parseDescriptions — accepts:
 *   - Already an array: [{ title, content }, ...]
 *   - JSON string:      "[{\"title\":\"...\",\"content\":\"...\"}]"
 *   - Plain string:     converts to [{ title: "Description", content: value }]
 */
function parseDescriptions(raw: unknown): ProductDescription[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((d) => d?.content)
      .map((d) => ({ title: String(d.title ?? "").trim(), content: String(d.content).trim() }));
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseDescriptions(parsed);
    } catch { /* not JSON — treat as plain text */ }
    // plain text fallback
    return raw.trim() ? [{ title: "Description", content: raw.trim() }] : [];
  }
  return [];
}

/**
 * parseSpecifications — accepts:
 *   - Array: [{ key, value }, ...]
 *   - JSON string of above
 */
function parseSpecifications(raw: unknown): Array<{ key: string; value: string }> {
  if (!raw) return [];
  let list: unknown[] = [];
  if (typeof raw === "string") {
    try { list = JSON.parse(raw); } catch { return []; }
  } else if (Array.isArray(raw)) {
    list = raw;
  }
  return list
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object" && !!(s as Record<string, unknown>).key && !!(s as Record<string, unknown>).value)
    .map((s) => ({
      key: String(s.key).trim(),
      value: String(s.value).trim(),
    }));
}

/**
 * parseSuitableFor — accepts:
 *   - Array: ["vegetarian", "vegan", "gluten_free", ...]
 *   - JSON string of above
 *   - Comma-separated string: "vegetarian,vegan,children"
 */
function parseSuitableFor(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseSuitableFor(parsed);
    } catch { /* not JSON */ }
    // Comma-separated fallback
    return raw.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

/**
 * parseIngredients — accepts:
 *   - Array: [{ ingredientName, quantity?, unit?, sortOrder? }, ...]
 *   - JSON string of above
 */
function parseIngredients(raw: unknown): Array<{ ingredientName: string; quantity?: string; unit?: string; sortOrder?: number }> {
  if (!raw) return [];
  let list: unknown[] = [];
  if (typeof raw === "string") {
    try { list = JSON.parse(raw); } catch { return []; }
  } else if (Array.isArray(raw)) {
    list = raw;
  }
  return list
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object" && !!(i as Record<string, unknown>).ingredientName)
    .map((i, idx) => ({
      ingredientName: String(i.ingredientName).trim(),
      quantity:       i.quantity ? String(i.quantity).trim() : undefined,
      unit:           i.unit     ? String(i.unit).trim()     : undefined,
      sortOrder:      i.sortOrder != null ? toNum(i.sortOrder) : idx,
    }));
}

// ─── GET /api/products ────────────────────────────────────────────────────────
// ?isActive, ?categoryId, ?search, ?page, ?limit

export async function getAllProducts(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "getAllProducts — start");

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const isActiveParam = searchParams.get("isActive");
    const categoryId    = searchParams.get("categoryId");
    const search        = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (isActiveParam !== null) where.isActive   = isActiveParam === "true";
    if (categoryId)             where.categoryId  = categoryId;
    if (search)                 where.productName = { [Op.iLike]: `%${search}%` };

    logger.debug(CTX, "getAllProducts — query", { where, page, limit });

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: PRODUCT_INCLUDE,
      order: [["productName", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    logger.info(CTX, `getAllProducts — ${rows.length} of ${count}`);

    // Serialize rows to plain JSON to ensure JSONB fields are properly formatted
    const serializedRows = rows.map(row => {
      const plain = row.get({ plain: true });
      return {
        ...plain,
        productImages: Array.isArray(plain.productImages) ? plain.productImages : [],
      };
    });

    return NextResponse.json({
      success: true,
      pagination: {
        total:   count,
        page,
        limit,
        pages:   Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
      data: serializedRows,
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getAllProducts — failed", error);
    return errorResponse(error);
  }
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────

export async function getProductById(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "getProductById — start", { id });

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id, { include: PRODUCT_INCLUDE });
    if (!product) {
      logger.warn(CTX, "getProductById — not found", { id });
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    logger.info(CTX, "getProductById — found", { id, name: product.productName });
    
    const plain = product.get({ plain: true });
    const serialized = {
      ...plain,
      productImages: Array.isArray(plain.productImages) ? plain.productImages : [],
    };
    
    return NextResponse.json({ success: true, data: serialized }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "getProductById — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────
// multipart/form-data OR JSON.
//
// JSON body example:
// {
//   categoryId, productName, dosageForm, strength, packSize, unitType,
//   sellingPrice, originalPrice, tax?, discount?, isActive?,
//   imageUrl?,
//   productDescriptions: [{ title: "How to use", content: "..." }, ...],
//   specifications: [{ key: "Manufacturer", value: "PharmaCo Ltd" }, ...],
//   suitableFor: ["vegetarian", "vegan", "gluten_free", "children"],
//   ingredients: [{ ingredientName: "Paracetamol", quantity: "500", unit: "mg" }, ...]
// }

export async function createProduct(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "createProduct — start");

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, unknown> = {};
    let imageValue: string | null = null;
    const extraImages: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key !== "image" && !key.startsWith("gallery_")) fields[key] = value;
      }
      // Primary image
      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        ensureUploadDir();
        const ext      = path.extname(file.name) || ".jpg";
        const filename = `${uuidv4()}${ext}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
        imageValue = `/uploads/products/${filename}`;
        logger.debug(CTX, "createProduct — saved local image", { imageValue });
      } else if (fields.imageUrl) {
        imageValue = String(fields.imageUrl);
      }
      // Gallery images (gallery_0, gallery_1, ...)
      for (let i = 0; ; i++) {
        const galleryFile = formData.get(`gallery_${i}`) as File | null;
        if (!galleryFile || galleryFile.size === 0) break;
        ensureUploadDir();
        const ext = path.extname(galleryFile.name) || ".jpg";
        const filename = `${uuidv4()}${ext}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(await galleryFile.arrayBuffer()));
        extraImages.push(`/uploads/products/${filename}`);
      }
      // Merge with existing URL-based images from productImages field
      if (fields.productImages) {
        try {
          const existingImages = typeof fields.productImages === "string" 
            ? JSON.parse(fields.productImages) 
            : fields.productImages;
          if (Array.isArray(existingImages)) {
            extraImages.unshift(...existingImages); // Add existing URLs first
          }
          logger.debug(CTX, "createProduct — merged gallery", { existingCount: existingImages?.length || 0, newCount: extraImages.length });
        } catch (err) {
          logger.warn(CTX, "createProduct — failed to parse productImages", err);
        }
      }
    } else {
      fields     = await req.json();
      imageValue = (fields.imageUrl ?? fields.productImage ?? null) as string | null;
      // For JSON request, productImages might already be provided
      if (fields.productImages && Array.isArray(fields.productImages)) {
        extraImages.push(...fields.productImages);
      }
    }

    logger.debug(CTX, "createProduct — payload", { ...fields, imageValue });

    // Required validation
    for (const f of ["categoryId", "productName", "dosageForm", "strength", "packSize", "unitType", "sellingPrice", "originalPrice"]) {
      if (!String(fields[f] ?? "").trim()) {
        throw new AppError(`${f} is required.`, 400, "VALIDATION_ERROR");
      }
    }

    const category = await Category.findByPk(String(fields.categoryId));
    if (!category) throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");

    const descriptions = parseDescriptions(fields.productDescriptions);
    const specifications = parseSpecifications(fields.specifications);
    const suitableFor  = parseSuitableFor(fields.suitableFor);
    const howToUse     = parseSuitableFor(fields.howToUse);        // reuse string[] parser
    const safetyInfo   = parseSuitableFor(fields.safetyInformation);
    const ingredients  = parseIngredients(fields.ingredients);

    const product = await Product.create({
      categoryId:          String(fields.categoryId),
      productName:         String(fields.productName).trim(),
      productImage:        imageValue,
      productImages:       extraImages,
      dosageForm:          String(fields.dosageForm).trim(),
      strength:            String(fields.strength).trim(),
      packSize:            String(fields.packSize).trim(),
      unitType:            String(fields.unitType).trim(),
      sellingPrice:        toNum(fields.sellingPrice),
      originalPrice:       toNum(fields.originalPrice),
      tax:                 toNum(fields.tax    ?? 0),
      discount:            toNum(fields.discount ?? 0),
      productDescriptions: descriptions,
      specifications,
      suitableFor,
      howToUse,
      safetyInformation: safetyInfo,
      isActive:            fields.isActive !== undefined ? String(fields.isActive) !== "false" : true,
    });

    logger.debug(CTX, "createProduct — saved to DB", { productImages: extraImages });

    // Bulk-create ingredients if provided
    if (ingredients.length > 0) {
      await ProductIngredient.bulkCreate(
        ingredients.map((ing) => ({ ...ing, productId: product.id })),
        { validate: true },
      );
    }

    const result = await Product.findByPk(product.id, { include: PRODUCT_INCLUDE });

    logger.info(CTX, "createProduct — created", {
      id: product.id, name: product.productName,
      descriptions: descriptions.length,
      specifications: specifications.length,
      suitableFor: suitableFor.length,
      ingredients: ingredients.length,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "createProduct — failed", error);
    return errorResponse(error);
  }
}

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
// When productDescriptions is provided it fully replaces the existing array.
// When ingredients is provided it fully replaces all existing ingredient rows.

export async function updateProduct(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "updateProduct — start", { id });

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id);
    if (!product) {
      logger.warn(CTX, "updateProduct — not found", { id });
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    const contentType = req.headers.get("content-type") ?? "";
    let fields: Record<string, unknown> = {};
    let imageValue: string | null | undefined = undefined;
    const extraImages: string[] = [];
    let hasGalleryUpdate = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key !== "image" && !key.startsWith("gallery_")) fields[key] = value;
      }
      // Primary image
      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        ensureUploadDir();
        const ext      = path.extname(file.name) || ".jpg";
        const filename = `${uuidv4()}${ext}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
        imageValue = `/uploads/products/${filename}`;
      } else if ("imageUrl" in fields) {
        imageValue = String(fields.imageUrl || "") || null;
      }
      // Gallery images
      for (let i = 0; ; i++) {
        const galleryFile = formData.get(`gallery_${i}`) as File | null;
        if (!galleryFile || galleryFile.size === 0) break;
        ensureUploadDir();
        const ext = path.extname(galleryFile.name) || ".jpg";
        const filename = `${uuidv4()}${ext}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(await galleryFile.arrayBuffer()));
        extraImages.push(`/uploads/products/${filename}`);
        hasGalleryUpdate = true;
      }
      // Merge with existing URL-based images from productImages field
      if (fields.productImages !== undefined) {
        hasGalleryUpdate = true;
        try {
          const existingImages = typeof fields.productImages === "string" 
            ? JSON.parse(fields.productImages) 
            : fields.productImages;
          if (Array.isArray(existingImages)) {
            extraImages.unshift(...existingImages); // Add existing URLs first, then new uploads
          }
          logger.debug(CTX, "updateProduct — merged gallery", { existingCount: existingImages?.length || 0, newCount: extraImages.length });
        } catch (err) {
          logger.warn(CTX, "updateProduct — failed to parse productImages", err);
        }
      }
    } else {
      fields = await req.json();
      if ("imageUrl" in fields || "productImage" in fields) {
        imageValue = (fields.imageUrl ?? fields.productImage ?? null) as string | null;
      }
      if ("productImages" in fields) hasGalleryUpdate = true;
    }

    if (fields.categoryId && String(fields.categoryId) !== product.categoryId) {
      const category = await Category.findByPk(String(fields.categoryId));
      if (!category) throw new AppError("Category not found.", 404, "CATEGORY_NOT_FOUND");
    }

    const updates: Partial<ProductAttributes> = {
      ...(fields.categoryId          != null && { categoryId:          String(fields.categoryId) }),
      ...(fields.productName         != null && { productName:         String(fields.productName).trim() }),
      ...(imageValue !== undefined            && { productImage:        imageValue }),
      ...(fields.dosageForm          != null && { dosageForm:          String(fields.dosageForm).trim() }),
      ...(fields.strength            != null && { strength:            String(fields.strength).trim() }),
      ...(fields.packSize            != null && { packSize:            String(fields.packSize).trim() }),
      ...(fields.unitType            != null && { unitType:            String(fields.unitType).trim() }),
      ...(fields.sellingPrice        != null && { sellingPrice:        toNum(fields.sellingPrice) }),
      ...(fields.originalPrice       != null && { originalPrice:       toNum(fields.originalPrice) }),
      ...(fields.tax                 != null && { tax:                 toNum(fields.tax) }),
      ...(fields.discount            != null && { discount:            toNum(fields.discount) }),
      ...(fields.isActive            != null && { isActive:            String(fields.isActive) !== "false" && String(fields.isActive) !== "0" }),
      ...(fields.productDescriptions != null && { productDescriptions: parseDescriptions(fields.productDescriptions) }),
      ...(fields.specifications      != null && { specifications:      parseSpecifications(fields.specifications) as ProductSpecification[] }),
      ...(fields.suitableFor         != null && { suitableFor:         parseSuitableFor(fields.suitableFor) }),
      ...(fields.howToUse            != null && { howToUse:            parseSuitableFor(fields.howToUse) }),
      ...(fields.safetyInformation   != null && { safetyInformation:   parseSuitableFor(fields.safetyInformation) }),
      ...(hasGalleryUpdate && {
        productImages: extraImages.length > 0
          ? extraImages
          : (fields.productImages ? (Array.isArray(fields.productImages) ? fields.productImages as string[] : JSON.parse(String(fields.productImages))) : []),
      }),
    };

    await product.update(updates);

    // If ingredients sent → replace all rows for this product
    if (fields.ingredients != null) {
      const ingredients = parseIngredients(fields.ingredients);
      await ProductIngredient.destroy({ where: { productId: id } });
      if (ingredients.length > 0) {
        await ProductIngredient.bulkCreate(
          ingredients.map((ing) => ({ ...ing, productId: id })),
          { validate: true },
        );
      }
      logger.debug(CTX, "updateProduct — replaced ingredients", { id, count: ingredients.length });
    }

    const result = await Product.findByPk(id, { include: PRODUCT_INCLUDE });

    logger.info(CTX, "updateProduct — updated", { id, name: product.productName });
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "updateProduct — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── PATCH /api/products/:id/toggle-active ────────────────────────────────────

export async function toggleProductActive(
  _req: NextRequest,
  id: string,
): Promise<NextResponse> {
  logger.info(CTX, "toggleProductActive — start", { id });

  try {
    if (!id) throw new AppError("Product ID is required.", 400, "MISSING_ID");

    const product = await Product.findByPk(id);
    if (!product) {
      logger.warn(CTX, "toggleProductActive — not found", { id });
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    const previous = product.isActive;
    await product.update({ isActive: !previous });

    logger.info(CTX, "toggleProductActive — toggled", {
      id, name: product.productName, from: previous, to: product.isActive,
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.productName}" is now ${product.isActive ? "active" : "inactive"}.`,
      data: { id: product.id, isActive: product.isActive },
    }, { status: 200 });
  } catch (error) {
    logger.error(CTX, "toggleProductActive — failed", { id, error });
    return errorResponse(error);
  }
}

// ─── POST /api/products/bulk ──────────────────────────────────────────────────
// JSON array OR Excel (.xlsx/.xls).
// ingredients and productDescriptions in Excel are JSON-encoded strings in their cells.

export async function bulkCreateProducts(req: NextRequest): Promise<NextResponse> {
  logger.info(CTX, "bulkCreateProducts — start");

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let rows: Record<string, unknown>[] = [];

    if (contentType.includes("multipart/form-data")) {
      logger.debug(CTX, "bulkCreateProducts — parsing Excel");
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) throw new AppError("No file uploaded. Field name must be 'file'.", 400, "NO_FILE");
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new AppError("Only .xlsx or .xls files accepted.", 400, "INVALID_FILE_TYPE");
      }
      const XLSX = require("xlsx");
      const wb   = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      logger.debug(CTX, `bulkCreateProducts — parsed ${rows.length} rows from Excel`);
    } else {
      const body = await req.json();
      if (!Array.isArray(body)) throw new AppError("Body must be a JSON array.", 400, "INVALID_BODY");
      rows = body;
    }

    if (rows.length === 0) throw new AppError("No rows found.", 400, "EMPTY_DATA");

    const categoryIds = [...new Set(rows.map((r) => String(r.categoryId ?? "").trim()).filter(Boolean))];
    const existingCats = await Category.findAll({
      where: { id: { [Op.in]: categoryIds } },
      attributes: ["id"],
    });
    const validCategoryIds = new Set(existingCats.map((c) => c.id));

    const toCreate: ProductCreationAttributes[] = [];
    const ingredientMap: Map<number, ReturnType<typeof parseIngredients>> = new Map();
    const errors: { row: number; reason: string }[] = [];

    rows.forEach((r, idx) => {
      const rowNum      = idx + 2;
      const productName = String(r.productName ?? r["Product Name"] ?? "").trim();
      const categoryId  = String(r.categoryId  ?? r["Category ID"]  ?? "").trim();

      if (!productName) { errors.push({ row: rowNum, reason: "Missing productName" }); return; }
      if (!categoryId)  { errors.push({ row: rowNum, reason: "Missing categoryId"  }); return; }
      if (!validCategoryIds.has(categoryId)) {
        errors.push({ row: rowNum, reason: `Category ID "${categoryId}" not found` }); return;
      }

      const imageRaw   = String(r.imageUrl ?? r["Image URL"] ?? r.productImage ?? "").trim();
      const imageValue = imageRaw ? (isValidUrl(imageRaw) ? imageRaw : imageRaw) : null;

      // ── Flat column fallbacks (ChatGPT Excel format) ──────────────────────
      // productDescriptions: prefer JSON column, fall back to flat howToUse / sideEffects / storage
      let descriptionsRaw = r.productDescriptions ?? r["Product Descriptions"] ?? r.productDescription ?? r["Description"];
      if (!descriptionsRaw) {
        const sections: { title: string; content: string }[] = [];
        const howToUse   = String(r.howToUse   ?? r["howToUse"]   ?? r["How To Use"]   ?? r["how_to_use"]   ?? "").trim();
        const sideEffects = String(r.sideEffects ?? r["sideEffects"] ?? r["Side Effects"] ?? r["side_effects"] ?? "").trim();
        const storage    = String(r.storage    ?? r["storage"]    ?? r["Storage"]    ?? "").trim();
        if (howToUse)    sections.push({ title: "How to Use",   content: howToUse });
        if (sideEffects) sections.push({ title: "Side Effects", content: sideEffects });
        if (storage)     sections.push({ title: "Storage",      content: storage });
        descriptionsRaw = sections.length > 0 ? sections : "";
      }
      const descriptions = parseDescriptions(descriptionsRaw);

      // specifications: prefer JSON column, fall back to flat manufacturer / countryOfOrigin / shelfLife
      let specificationsRaw = r.specifications ?? r["Specifications"];
      if (!specificationsRaw) {
        const specs: { key: string; value: string }[] = [];
        const manufacturer    = String(r.manufacturer    ?? r["manufacturer"]    ?? r["Manufacturer"]    ?? r["manufacturerName"] ?? "").trim();
        const countryOfOrigin = String(r.countryOfOrigin ?? r["countryOfOrigin"] ?? r["Country of Origin"] ?? r["country_of_origin"] ?? "").trim();
        const shelfLife       = String(r.shelfLife       ?? r["shelfLife"]       ?? r["Shelf Life"]       ?? r["shelf_life"]       ?? "").trim();
        if (manufacturer)    specs.push({ key: "Manufacturer",      value: manufacturer });
        if (countryOfOrigin) specs.push({ key: "Country of Origin", value: countryOfOrigin });
        if (shelfLife)       specs.push({ key: "Shelf Life",        value: shelfLife });
        specificationsRaw = specs.length > 0 ? specs : [];
      }
      const specifications = parseSpecifications(specificationsRaw);

      const suitableFor = parseSuitableFor(
        r.suitableFor ?? r["Suitable For"] ?? r["suitableFor"] ?? [],
      );

      // ingredients: prefer JSON column, fall back to flat ingredientName / quantity / ingredientUnit / unit
      let ingredientsRaw = r.ingredients ?? r["Ingredients"];
      if (!ingredientsRaw) {
        const ingName = String(r.ingredientName ?? r["ingredientName"] ?? r["Ingredient Name"] ?? r["ingredient_name"] ?? "").trim();
        const ingQty  = String(r.quantity       ?? r["quantity"]       ?? r["Quantity"]       ?? "").trim();
        const ingUnit = String(r.ingredientUnit ?? r["ingredientUnit"] ?? r["unit"]           ?? r["Unit"] ?? r["Ingredient Unit"] ?? "").trim();
        if (ingName) {
          ingredientsRaw = [{ ingredientName: ingName, quantity: ingQty || undefined, unit: ingUnit || undefined }];
        } else {
          ingredientsRaw = [];
        }
      }
      const ings = parseIngredients(ingredientsRaw);
      ingredientMap.set(toCreate.length, ings);

      toCreate.push({
        categoryId,
        productName,
        productImage:        imageValue,
        dosageForm:          String(r.dosageForm   ?? r["Dosage Form"]   ?? "").trim(),
        strength:            String(r.strength     ?? r["Strength"]      ?? "").trim(),
        packSize:            String(r.packSize     ?? r["Pack Size"]     ?? "").trim(),
        unitType:            String(r.unitType     ?? r["Unit Type"]     ?? "").trim(),
        sellingPrice:        toNum(r.sellingPrice  ?? r["Selling Price"]),
        originalPrice:       toNum(r.originalPrice ?? r["Original Price"]),
        tax:                 toNum(r.tax           ?? r["Tax"]           ?? 0),
        discount:            toNum(r.discount      ?? r["Discount"]      ?? 0),
        productDescriptions: descriptions,
        specifications:      specifications as ProductSpecification[],
        suitableFor,
        howToUse:          parseSuitableFor(r.howToUse ?? r["How To Use"] ?? r["howToUse"] ?? []),
        safetyInformation: parseSuitableFor(r.safetyInformation ?? r["Safety Information"] ?? r["safetyInformation"] ?? []),
        isActive:            String(r.isActive ?? "true").toLowerCase() !== "false",
      });
    });

    logger.info(CTX, `bulkCreateProducts — ${toCreate.length} to create, ${errors.length} errors`);

    const created = await Product.bulkCreate(toCreate, { validate: true });

    // Attach ingredients for products that had them
    const allIngredients: Array<{ productId: string; ingredientName: string; quantity?: string; unit?: string; sortOrder: number }> = [];
    created.forEach((p, idx) => {
      const ings = ingredientMap.get(idx) ?? [];
      ings.forEach((ing) => allIngredients.push({ ...ing, sortOrder: ing.sortOrder ?? 0, productId: p.id }));
    });
    if (allIngredients.length > 0) {
      await ProductIngredient.bulkCreate(allIngredients, { validate: true });
    }

    logger.info(CTX, "bulkCreateProducts — done", {
      total: rows.length, created: created.length, failed: errors.length,
    });

    return NextResponse.json({
      success: true,
      summary: { total: rows.length, created: created.length, failed: errors.length },
      errors,
      data: created,
    }, { status: 201 });
  } catch (error) {
    logger.error(CTX, "bulkCreateProducts — failed", error);
    return errorResponse(error);
  }
}
