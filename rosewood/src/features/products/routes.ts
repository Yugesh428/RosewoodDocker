/**
 * Product Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Base: /api/products
 *
 * ┌───────────────────────────────────────────────────────────┬──────────────────────────────────┐
 * │ Endpoint                                                  │ Handler                          │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ GET    /api/products                                      │ getAllProducts                    │
 * │        ?isActive, ?categoryId, ?search, ?page, ?limit     │                                  │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ POST   /api/products                                      │ createProduct                    │
 * │        multipart/form-data OR JSON                        │                                  │
 * │        productDescriptions: [{ title, content }, ...]     │                                  │
 * │        ingredients: [{ ingredientName, quantity?, unit? }]│                                  │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ POST   /api/products/bulk                                 │ bulkCreateProducts               │
 * │        JSON array OR .xlsx/.xls                           │                                  │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ GET    /api/products/:id                                  │ getProductById                   │
 * │        includes: category + ingredients                   │                                  │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ PUT    /api/products/:id                                  │ updateProduct                    │
 * │        productDescriptions → replaces array               │                                  │
 * │        ingredients → replaces all rows                    │                                  │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ PATCH  /api/products/:id/toggle-active                    │ toggleProductActive              │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ GET    /api/products/:productId/ingredients               │ getIngredientsByProduct          │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ POST   /api/products/:productId/ingredients               │ addIngredient                    │
 * │        { ingredientName, quantity?, unit?, sortOrder? }   │                                  │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ PUT    /api/products/:productId/ingredients               │ replaceIngredients               │
 * │        [ { ingredientName, quantity?, unit? }, ... ]      │ Full replace                     │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ PUT    /api/products/:productId/ingredients/:id           │ updateIngredient                 │
 * ├───────────────────────────────────────────────────────────┼──────────────────────────────────┤
 * │ DELETE /api/products/:productId/ingredients/:id           │ deleteIngredient                 │
 * └───────────────────────────────────────────────────────────┴──────────────────────────────────┘
 */

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
  bulkCreateProducts,
} from "./productController";

export {
  getIngredientsByProduct,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  replaceIngredients,
} from "./productIngredientController";

export const PRODUCT_ROUTES = {
  list:               "GET    /api/products",
  create:             "POST   /api/products",
  bulk:               "POST   /api/products/bulk",
  getById:            "GET    /api/products/:id",
  update:             "PUT    /api/products/:id",
  toggleActive:       "PATCH  /api/products/:id/toggle-active",
  ingredients:        "GET    /api/products/:productId/ingredients",
  addIngredient:      "POST   /api/products/:productId/ingredients",
  replaceIngredients: "PUT    /api/products/:productId/ingredients",
  updateIngredient:   "PUT    /api/products/:productId/ingredients/:id",
  deleteIngredient:   "DELETE /api/products/:productId/ingredients/:id",
} as const;
