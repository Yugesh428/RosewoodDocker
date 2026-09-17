/**
 * docker/seed-heavy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * COMPREHENSIVE SEED SCRIPT — Populates the database with rich demo data.
 * 
 * Creates:
 *   - Admin user + sample customers
 *   - Default themes (Gold & Medical Blue)
 *   - Hero slides
 *   - Product categories & products
 *   - Testimonials
 *   - About Us content (Story, Mission, Values)
 *   - Contact Info
 *   - Sample orders
 * 
 * Run:
 *   npx tsx --env-file=.env --tsconfig tsconfig.scripts.json docker/seed-heavy.ts
 * 
 * Or via Docker:
 *   docker compose run --rm seed npx tsx --tsconfig tsconfig.scripts.json docker/seed-heavy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import bcrypt from "bcryptjs";
import sequelize from "../src/lib/database/sequelize";
import User from "../src/lib/models/userModel";
import { CustomTheme, default as SiteTheme } from "../src/features/siteTheme/siteThemeModel";
import HeroSlide from "../src/features/Ui/HeroSection/heroModel/heroModel";
import CollectionCategory, { CollectionItem } from "../src/features/Ui/ourProductCollection/ourProductCollectionCategoryModel";
import Product from "../src/features/Ui/ourProductCollection/ourProductContent/ourProductModel";
import Testimonial from "../src/features/Ui/testimonials/testimonialsModel";
import OurStory from "../src/features/Ui/AboutUsPage/ourStory/ourStroyModel";
import Mission from "../src/features/Ui/AboutUsPage/ourMisson/missionModel";
import Value from "../src/features/Ui/AboutUsPage/ourValues/ourValuesModel";
import ContactInfo from "../src/features/Ui/contact/contactInfo/contactInfoModel";
import Order from "../src/features/orders/orderModel";
import Category from "../src/features/productCategory/productCatetgoryModel";
import PharmacyProduct from "../src/features/products/productModel";
import ProductIngredient from "../src/features/products/productIngredientModel";
import Review from "../src/features/reviews/reviewModel";
// Import additional models to ensure they're synced
import Inventory from "../src/features/inventory/inventoryModel";
import OrderItem from "../src/features/orderItems/orderItemModel";
import Staff from "../src/features/staff/staffModel";
import Wishlist from "../src/features/wishlist/wishlistModel";
import Feedback from "../src/features/feedback/feedbackModel";
import GuestCart from "../src/features/guestCart/guestCartModel";
import AboutUsTitle from "../src/features/Ui/AboutUsPage/AboutUs Head/aboutUsTitleModel";
import ContactForm from "../src/features/Ui/contact/contactForm/contactFormModel";

// ── Credentials ───────────────────────────────────────────────────────────────
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || "Rosewood Admin";
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || "admin@rosewood.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg: string)  { console.log(`[seed] ✅  ${msg}`); }
function skip(msg: string) { console.log(`[seed] ℹ️   ${msg}`); }
function warn(msg: string) { console.warn(`[seed] ⚠️   ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Connect
  await sequelize.authenticate();
  log("Database connected.");

  // 2. Sync tables in dependency order (create all tables if they don't exist)
  const OPTS = { force: true };
  
  // Parent tables first
  await User.sync(OPTS);
  await Staff.sync(OPTS);
  await Category.sync(OPTS);
  await CustomTheme.sync(OPTS);
  await SiteTheme.sync(OPTS);
  await CollectionCategory.sync(OPTS);
  
  // Child tables with FK dependencies
  await PharmacyProduct.sync(OPTS);
  await ProductIngredient.sync(OPTS);
  await Inventory.sync(OPTS);
  await Review.sync(OPTS);
  await Wishlist.sync(OPTS);
  await Order.sync(OPTS);
  await OrderItem.sync(OPTS);
  await Feedback.sync(OPTS);
  await GuestCart.sync(OPTS);
  await HeroSlide.sync(OPTS);
  await CollectionItem.sync(OPTS);
  await Product.sync(OPTS);
  await Testimonial.sync(OPTS);
  await AboutUsTitle.sync(OPTS);
  await OurStory.sync(OPTS);
  await Mission.sync(OPTS);
  await Value.sync(OPTS);
  await ContactInfo.sync(OPTS);
  await ContactForm.sync(OPTS);
  
  log("All tables created fresh.");

  // ══════════════════════════════════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════════════════════════════════
  
  // Admin user
  const existingAdmin = await User.findOne({ where: { email: ADMIN_EMAIL } });
  let adminUser: User;
  
  if (existingAdmin) {
    skip(`Admin user already exists: ${ADMIN_EMAIL}`);
    adminUser = existingAdmin;
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    adminUser = await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashed,
      role:     "ADMIN",
      isActive: true,
    });
    log(`Admin created → ${ADMIN_EMAIL}`);
    warn("Change password after first login.");
  }

  // Sample customers
  const customerData = [
    { name: "John Smith", email: "john@example.com", password: "Customer@123" },
    { name: "Sarah Johnson", email: "sarah@example.com", password: "Customer@123" },
    { name: "Michael Brown", email: "michael@example.com", password: "Customer@123" },
    { name: "Emily Davis", email: "emily@example.com", password: "Customer@123" },
    { name: "David Wilson", email: "david@example.com", password: "Customer@123" },
  ];

  const customers: User[] = [];
  for (const data of customerData) {
    const [customer, created] = await User.findOrCreate({
      where: { email: data.email },
      defaults: {
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 12),
        role: "CUSTOMER",
        isActive: true,
      },
    });
    customers.push(customer);
    created ? log(`Customer created: ${data.email}`) : skip(`Customer exists: ${data.email}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // THEMES
  // ══════════════════════════════════════════════════════════════════════════

  const [, goldCreated] = await CustomTheme.findOrCreate({
    where: { id: "gold" },
    defaults: {
      id:           "gold",
      name:         "Gold & Black",
      isDefault:    true,
      primary:      "#D4AF37",
      primaryLight: "#ffe87c",
      primaryDark:  "#b8952e",
      primaryText:  "#000000",
      bgPage:       "#F9F9F9",
      bgGradient:   "linear-gradient(135deg, #fdf9ee 0%, #f9f9f9 50%, #f5f2e8 100%)",
      bgCard:       "#ffffff",
      bgNav:        "#000000",
      textHeading:  "#1A1A1A",
      textBody:     "#374151",
      textMuted:    "#6B6B6B",
      borderColor:  "#E8E4DC",
      shadow:       "0 2px 12px rgba(0,0,0,0.08)",
      shadowHover:  "0 8px 28px rgba(0,0,0,0.15)",
    },
  });
  goldCreated ? log("Gold theme created.") : skip("Gold theme exists.");

  const [, medCreated] = await CustomTheme.findOrCreate({
    where: { id: "medical" },
    defaults: {
      id:           "medical",
      name:         "Medical Blue",
      isDefault:    true,
      primary:      "#00B4D8",
      primaryLight: "#90E0EF",
      primaryDark:  "#0096C7",
      primaryText:  "#ffffff",
      bgPage:       "#EAF6FB",
      bgGradient:   "linear-gradient(135deg, #e0f4fb 0%, #f0faff 40%, #e8f5f0 100%)",
      bgCard:       "#ffffff",
      bgNav:        "#023E8A",
      textHeading:  "#023E8A",
      textBody:     "#1a4a6b",
      textMuted:    "#4a7a96",
      borderColor:  "#CAE9F5",
      shadow:       "0 2px 12px rgba(0,100,160,0.10)",
      shadowHover:  "0 8px 28px rgba(0,100,160,0.20)",
    },
  });
  medCreated ? log("Medical Blue theme created.") : skip("Medical Blue theme exists.");

  const [, siteCreated] = await SiteTheme.findOrCreate({
    where:    { id: 1 },
    defaults: { activeThemeId: "gold", homeBg: "blue" },
  });
  siteCreated ? log("Site theme created (Gold).") : skip("Site theme exists.");

  // ══════════════════════════════════════════════════════════════════════════
  // HERO SLIDES
  // ══════════════════════════════════════════════════════════════════════════

  const heroSlides = [
    {
      imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1920&q=80",
      title: "Welcome to Rosewood Pharmacy",
      subtitle: "Your trusted partner in health and wellness for over a decade",
      order: 1,
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80",
      title: "Premium Healthcare Products",
      subtitle: "Curated selection of medicines, supplements, and wellness products",
      order: 2,
    },
  ];

  for (const slide of heroSlides) {
    const [, created] = await HeroSlide.findOrCreate({
      where: { imageUrl: slide.imageUrl },
      defaults: slide,
    });
    created ? log(`Hero slide created: ${slide.title}`) : skip(`Hero slide exists: ${slide.title}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRODUCT COLLECTION CATEGORIES & ITEMS
  // ══════════════════════════════════════════════════════════════════════════

  const categories = [
    { name: "Skincare", slug: "skincare", description: "Premium skincare solutions", displayOrder: 1 },
    { name: "Wellness", slug: "wellness", description: "Holistic wellness products", displayOrder: 2 },
    { name: "Personal Care", slug: "personal-care", description: "Daily personal care essentials", displayOrder: 3 },
    { name: "Vitamins & Supplements", slug: "vitamins-supplements", description: "Nutritional supplements", displayOrder: 4 },
  ];

  for (const catData of categories) {
    const [category, catCreated] = await CollectionCategory.findOrCreate({
      where: { slug: catData.slug },
      defaults: catData,
    });
    catCreated ? log(`Category created: ${catData.name}`) : skip(`Category exists: ${catData.name}`);

    // Add sample collection items for each category
    const itemsData = [
      { 
        title: `Premium ${catData.name} Set`, 
        imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
        displayOrder: 1 
      },
      { 
        title: `Advanced ${catData.name} Collection`, 
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
        displayOrder: 2 
      },
    ];

    for (const itemData of itemsData) {
      const [, itemCreated] = await CollectionItem.findOrCreate({
        where: { categoryId: category.id, title: itemData.title },
        defaults: { ...itemData, categoryId: category.id },
      });
      itemCreated ? log(`  → Item: ${itemData.title}`) : skip(`  → Item exists: ${itemData.title}`);
    }

    // Add detailed products for each category with video URLs
    const productData = {
      title: `${catData.name} Premium Line`,
      subtitle: `Professional-grade ${catData.name.toLowerCase()} solutions`,
      backgroundImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80",
      videoUrl: catData.slug === "skincare" 
        ? "https://www.youtube.com/watch?v=hY47BblSeL0" // Skincare routine video
        : catData.slug === "wellness"
        ? "https://www.youtube.com/watch?v=aUaInS6HIGo" // Wellness and meditation
        : catData.slug === "personal-care"
        ? "https://www.youtube.com/watch?v=YPY0LQjySeY" // Personal care essentials
        : catData.slug === "vitamins-supplements"
        ? "https://www.youtube.com/watch?v=DQVxR1q0T9w" // Vitamin supplements guide
        : null,
      photo1Url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80",
      photo1Title: "Clinical Strength Formula",
      photo1Subtitle: "Dermatologist tested and approved",
      photo2Url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
      photo2Title: "Natural Ingredients",
      photo2Subtitle: "Sustainably sourced and cruelty-free",
    };

    const [product, prodCreated] = await Product.findOrCreate({
      where: { categoryId: category.id, title: productData.title },
      defaults: { ...productData, categoryId: category.id },
    });
    
    // Always update with video URL if not created (to add video URLs to existing products)
    if (!prodCreated) {
      await product.update({ videoUrl: productData.videoUrl });
      log(`  → Product updated with video: ${productData.title}`);
    } else {
      log(`  → Product: ${productData.title}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TESTIMONIALS
  // ══════════════════════════════════════════════════════════════════════════

  const testimonials = [
    {
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      rating: 5,
      quote: "Rosewood Pharmacy has been my go-to for all health needs. The staff is knowledgeable and the products are always top quality.",
      authorName: "Jennifer Martinez",
      authorTitle: "Verified Customer",
      displayOrder: 1,
    },
    {
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      rating: 5,
      quote: "I appreciate the personalized care and attention I receive here. They truly care about their customers' wellbeing.",
      authorName: "Robert Thompson",
      authorTitle: "Long-time Customer",
      displayOrder: 2,
    },
    {
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
      rating: 5,
      quote: "Fast delivery, great prices, and excellent customer service. Couldn't ask for more from a pharmacy!",
      authorName: "Lisa Anderson",
      authorTitle: "Verified Customer",
      displayOrder: 3,
    },
  ];

  for (const testData of testimonials) {
    const [, created] = await Testimonial.findOrCreate({
      where: { authorName: testData.authorName },
      defaults: testData,
    });
    created ? log(`Testimonial created: ${testData.authorName}`) : skip(`Testimonial exists: ${testData.authorName}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABOUT US - OUR STORY
  // ══════════════════════════════════════════════════════════════════════════

  try {
    const existingStory = await OurStory.findOne();
    if (existingStory) {
      skip("Our Story already exists.");
    } else {
      await OurStory.create({
        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
        title: "Born from a Desire to Redefine the Pharmacy",
        paragraph1: "Rosewood Pharmacy was founded in 2013 with a simple yet powerful vision: to create a healthcare destination where personalized care meets pharmaceutical excellence. Our founders, experienced pharmacists with decades of combined experience, saw a gap in the market for a pharmacy that truly prioritizes patient wellbeing over transactions.",
        paragraph2: "Over the past decade, we've grown from a small neighborhood pharmacy into a trusted healthcare partner for thousands of families. Our commitment to quality, integrity, and compassionate care has remained unchanged. We've expanded our product lines, enhanced our services, and embraced technology, but at our core, we remain dedicated to one principle: your health comes first.",
        paragraph3: "Today, our team of certified pharmacists, wellness experts, and healthcare professionals work together to provide comprehensive care that goes beyond filling prescriptions. We believe in building lasting relationships with our customers, understanding their unique health needs, and supporting them on their wellness journey every step of the way.",
      });
      log("Our Story created.");
    }
  } catch (error) {
    warn(`Our Story section skipped due to error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABOUT US - MISSION
  // ══════════════════════════════════════════════════════════════════════════

  try {
    const existingMission = await Mission.findOne();
    if (existingMission) {
      skip("Mission already exists.");
    } else {
      await Mission.create({
        subtitle: "A Higher Standard of Care",
        description: "Our mission is to provide accessible, personalized, and comprehensive pharmaceutical care that empowers our community to live healthier lives. We are committed to maintaining the highest standards of professional excellence, ethical practice, and customer service. Through continuous education, innovation, and genuine compassion, we strive to be more than just a pharmacy—we aim to be your trusted healthcare partner for life.",
      });
      log("Mission created.");
    }
  } catch (error) {
    warn(`Mission section skipped due to error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ABOUT US - VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const values = [
    {
      title: "Trust",
      description: "We build lasting relationships through transparency, honesty, and reliability. Your trust is the foundation of everything we do, and we honor it by maintaining the highest ethical standards in every interaction.",
      imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80",
      displayOrder: 1,
    },
    {
      title: "Quality",
      description: "We source only premium, verified products from reputable manufacturers. Every item in our inventory undergoes rigorous quality checks to ensure you receive safe, effective, and authentic healthcare solutions.",
      imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80",
      displayOrder: 2,
    },
    {
      title: "Care",
      description: "Compassionate, personalized care is at the heart of our practice. We take the time to understand your unique needs, answer your questions thoroughly, and provide guidance that truly makes a difference in your health journey.",
      imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
      displayOrder: 3,
    },
    {
      title: "Excellence",
      description: "We pursue excellence in every aspect of our service—from product selection to customer care. Our team continuously updates their knowledge and skills to provide you with the most current and effective healthcare solutions available.",
      imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80",
      displayOrder: 4,
    },
  ];

  for (const valueData of values) {
    try {
      const [, created] = await Value.findOrCreate({
        where: { title: valueData.title },
        defaults: valueData,
      });
      created ? log(`Value created: ${valueData.title}`) : skip(`Value exists: ${valueData.title}`);
    } catch (error) {
      warn(`Value "${valueData.title}" skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTACT INFO
  // ══════════════════════════════════════════════════════════════════════════

  const existingContact = await ContactInfo.findOne();
  if (existingContact) {
    skip("Contact Info already exists.");
  } else {
    await ContactInfo.create({
      address: "123 Healthcare Boulevard\nRosewood Medical District\nNew York, NY 10001\nUnited States",
      phone: "+1 (555) 123-4567",
      email: "contact@rosewoodpharmacy.com",
      hours: "Monday - Friday: 8:00 AM - 8:00 PM\nSaturday: 9:00 AM - 6:00 PM\nSunday: 10:00 AM - 4:00 PM\n\n24/7 Emergency Prescription Service Available",
      latitude: 40.7489,
      longitude: -73.9680,
    });
    log("Contact Info created.");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHARMACY PRODUCTS - CATEGORIES & TOP-SELLING PRODUCTS
  // ══════════════════════════════════════════════════════════════════════════

  const pharmacyCategories = [
    {
      name: "Pain Relief",
      description: "Effective solutions for managing pain and inflammation",
    },
    {
      name: "Cold & Flu",
      description: "Remedies for cold, flu, and respiratory conditions",
    },
    {
      name: "Digestive Health",
      description: "Products for digestive wellness and gut health",
    },
    {
      name: "Vitamins & Supplements",
      description: "Essential vitamins and dietary supplements",
    },
    {
      name: "First Aid",
      description: "Emergency medical supplies and wound care",
    },
    {
      name: "Heart Health",
      description: "Cardiovascular health and blood pressure management",
    },
    {
      name: "Diabetes Care",
      description: "Blood sugar management and diabetic supplies",
    },
    {
      name: "Allergy Relief",
      description: "Antihistamines and allergy management products",
    },
  ];

  const categoryMap: Record<string, Category> = {};

  for (const catData of pharmacyCategories) {
    const [category, catCreated] = await Category.findOrCreate({
      where: { categoryName: catData.name },
      defaults: {
        categoryName: catData.name,
        categoryDescription: catData.description,
        parentId: null,
        isActive: true,
      },
    });
    categoryMap[catData.name] = category;
    catCreated ? log(`Pharmacy category: ${catData.name}`) : skip(`Pharmacy category exists: ${catData.name}`);
  }

  // Top-selling pharmacy products with detailed information
  const topProducts = [
    {
      category: "Pain Relief",
      productName: "Paracetamol 500mg Tablets",
      dosageForm: "Tablet",
      strength: "500mg",
      packSize: "100",
      unitType: "Tablets",
      sellingPrice: 8.99,
      originalPrice: 12.99,
      tax: 5,
      discount: 30,
      productImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Fast-acting pain relief and fever reducer suitable for adults and children over 12 years." },
        { title: "Uses", content: "Effective for headaches, muscle aches, arthritis, backaches, toothaches, colds, and fever." },
        { title: "Side Effects", content: "Generally well-tolerated. Rare side effects include nausea, allergic reactions, or liver problems with overdose." },
      ],
      specifications: [
        { key: "Manufacturer", value: "PharmaCo Ltd" },
        { key: "Country of Origin", value: "United States" },
        { key: "Shelf Life", value: "36 months" },
        { key: "Prescription Required", value: "No" },
      ],
      suitableFor: ["adults", "elderly", "vegetarian"],
      howToUse: [
        "Adults and children over 12: Take 1-2 tablets every 4-6 hours as needed",
        "Do not exceed 8 tablets in 24 hours",
        "Swallow tablets whole with water",
        "Can be taken with or without food",
      ],
      safetyInformation: [
        "Do not exceed the recommended dose",
        "Consult a doctor if symptoms persist for more than 3 days",
        "Keep out of reach of children",
        "Store below 25°C in a dry place",
        "Do not use if allergic to paracetamol",
      ],
      ingredients: [
        { name: "Paracetamol", quantity: "500", unit: "mg" },
        { name: "Maize Starch", quantity: null, unit: null },
        { name: "Potassium Sorbate", quantity: null, unit: null },
      ],
    },
    {
      category: "Cold & Flu",
      productName: "Cold Relief Day & Night Capsules",
      dosageForm: "Capsule",
      strength: "Multi-ingredient",
      packSize: "24",
      unitType: "Capsules",
      sellingPrice: 15.99,
      originalPrice: 19.99,
      tax: 5,
      discount: 20,
      productImage: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80",
        "https://images.unsplash.com/photo-1550572017-4246ba96e52c?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Complete day and night relief from cold and flu symptoms. Day capsules relieve symptoms without drowsiness, night capsules aid restful sleep." },
        { title: "Uses", content: "Relief from headache, fever, body aches, nasal congestion, and runny nose associated with colds and flu." },
        { title: "Side Effects", content: "May cause drowsiness (night formula), dizziness, dry mouth, or nausea. Night formula may impair ability to drive." },
      ],
      specifications: [
        { key: "Manufacturer", value: "WellMed Pharmaceuticals" },
        { key: "Country of Origin", value: "United Kingdom" },
        { key: "Shelf Life", value: "24 months" },
        { key: "Prescription Required", value: "No" },
      ],
      suitableFor: ["adults", "elderly"],
      howToUse: [
        "Day Capsules: Take 2 capsules every 4-6 hours during the day",
        "Night Capsules: Take 2 capsules before bedtime",
        "Do not exceed 8 day capsules in 24 hours",
        "Swallow capsules whole with water",
      ],
      safetyInformation: [
        "Night capsules may cause drowsiness - do not drive or operate machinery",
        "Do not use with other cold and flu medications",
        "Consult doctor if pregnant or breastfeeding",
        "Not suitable for children under 12 years",
        "Avoid alcohol while using this product",
      ],
      ingredients: [
        { name: "Paracetamol", quantity: "500", unit: "mg" },
        { name: "Phenylephrine HCl", quantity: "5", unit: "mg" },
        { name: "Diphenhydramine HCl (Night)", quantity: "25", unit: "mg" },
      ],
    },
    {
      category: "Digestive Health",
      productName: "Probiotic Daily Support 30 Billion CFU",
      dosageForm: "Capsule",
      strength: "30 Billion CFU",
      packSize: "60",
      unitType: "Capsules",
      sellingPrice: 29.99,
      originalPrice: 39.99,
      tax: 0,
      discount: 25,
      productImage: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80",
        "https://images.unsplash.com/photo-1556229010-aa-fe3a4299c0c7?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Advanced probiotic formula with 30 billion CFU and 10 strains to support digestive and immune health." },
        { title: "Uses", content: "Supports healthy digestion, reduces bloating and gas, promotes immune function, and helps maintain gut flora balance." },
        { title: "Side Effects", content: "Generally safe. Some may experience mild gas or bloating initially as the body adjusts." },
      ],
      specifications: [
        { key: "Manufacturer", value: "NutriLife Sciences" },
        { key: "Country of Origin", value: "United States" },
        { key: "Shelf Life", value: "18 months" },
        { key: "Prescription Required", value: "No" },
      ],
      suitableFor: ["vegetarian", "gluten_free", "lactose_free", "adults", "elderly"],
      howToUse: [
        "Take 1 capsule daily with a meal",
        "Preferably take with breakfast or lunch",
        "Swallow capsule whole with water",
        "For best results, use consistently for at least 4 weeks",
      ],
      safetyInformation: [
        "Store in refrigerator for maximum potency",
        "Keep bottle tightly closed",
        "Consult healthcare provider if pregnant or nursing",
        "If taking antibiotics, take probiotics 2-3 hours apart",
        "Keep out of reach of children",
      ],
      ingredients: [
        { name: "Lactobacillus acidophilus", quantity: "10", unit: "Billion CFU" },
        { name: "Bifidobacterium lactis", quantity: "8", unit: "Billion CFU" },
        { name: "Lactobacillus plantarum", quantity: "6", unit: "Billion CFU" },
        { name: "Lactobacillus rhamnosus", quantity: "4", unit: "Billion CFU" },
        { name: "Bifidobacterium longum", quantity: "2", unit: "Billion CFU" },
      ],
    },
    {
      category: "Vitamins & Supplements",
      productName: "Vitamin D3 4000 IU Softgels",
      dosageForm: "Softgel",
      strength: "4000 IU",
      packSize: "120",
      unitType: "Softgels",
      sellingPrice: 18.99,
      originalPrice: 24.99,
      tax: 0,
      discount: 24,
      productImage: "https://images.unsplash.com/photo-1550572017-4246ba96e52c?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1550572017-4246ba96e52c?w=800&q=80",
        "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "High-potency Vitamin D3 (cholecalciferol) to support bone health, immune function, and overall wellness." },
        { title: "Uses", content: "Supports calcium absorption for healthy bones and teeth, promotes immune system function, and maintains muscle strength." },
        { title: "Side Effects", content: "Rare when taken as directed. Excessive doses may cause nausea, weakness, or kidney problems." },
      ],
      specifications: [
        { key: "Manufacturer", value: "VitaMax Nutrition" },
        { key: "Country of Origin", value: "Canada" },
        { key: "Shelf Life", value: "24 months" },
        { key: "Prescription Required", value: "No" },
      ],
      suitableFor: ["vegetarian", "gluten_free", "adults", "elderly"],
      howToUse: [
        "Take 1 softgel daily with a meal containing fat",
        "Best taken with breakfast or lunch",
        "Swallow softgel whole - do not chew",
        "For optimal absorption, take with foods containing healthy fats",
      ],
      safetyInformation: [
        "Do not exceed recommended dose without medical supervision",
        "Consult doctor if taking medications or have health conditions",
        "Store in a cool, dry place away from sunlight",
        "Keep out of reach of children",
        "If pregnant or nursing, consult healthcare provider",
      ],
      ingredients: [
        { name: "Vitamin D3 (Cholecalciferol)", quantity: "4000", unit: "IU" },
        { name: "Extra Virgin Olive Oil", quantity: null, unit: null },
        { name: "Softgel Capsule (Gelatin, Glycerin, Water)", quantity: null, unit: null },
      ],
    },
    {
      category: "Heart Health",
      productName: "Omega-3 Fish Oil 1000mg EPA & DHA",
      dosageForm: "Softgel",
      strength: "1000mg",
      packSize: "180",
      unitType: "Softgels",
      sellingPrice: 34.99,
      originalPrice: 49.99,
      tax: 0,
      discount: 30,
      productImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
        "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Premium quality fish oil supplement rich in EPA and DHA omega-3 fatty acids for cardiovascular and brain health." },
        { title: "Uses", content: "Supports heart health, promotes healthy cholesterol levels, aids brain function, and reduces inflammation." },
        { title: "Side Effects", content: "May cause fishy aftertaste, mild digestive upset, or burping. Taking with meals reduces these effects." },
      ],
      specifications: [
        { key: "Manufacturer", value: "OceanPure Health" },
        { key: "Country of Origin", value: "Norway" },
        { key: "Shelf Life", value: "24 months" },
        { key: "Prescription Required", value: "No" },
        { key: "Third-Party Tested", value: "Yes - Mercury Free" },
      ],
      suitableFor: ["adults", "elderly", "gluten_free"],
      howToUse: [
        "Take 2 softgels daily with meals",
        "Can be taken together or split between meals",
        "Swallow softgels whole with water",
        "For best results, take consistently as part of a healthy diet",
      ],
      safetyInformation: [
        "Consult doctor if taking blood-thinning medications",
        "Store in a cool, dry place",
        "Keep refrigerated after opening for maximum freshness",
        "Not suitable for those with fish allergies",
        "If pregnant or nursing, consult healthcare provider before use",
      ],
      ingredients: [
        { name: "Fish Oil Concentrate", quantity: "1000", unit: "mg" },
        { name: "EPA (Eicosapentaenoic Acid)", quantity: "330", unit: "mg" },
        { name: "DHA (Docosahexaenoic Acid)", quantity: "220", unit: "mg" },
        { name: "Vitamin E (as d-alpha tocopherol)", quantity: "2", unit: "IU" },
      ],
    },
    {
      category: "Allergy Relief",
      productName: "Cetirizine 10mg Antihistamine Tablets",
      dosageForm: "Tablet",
      strength: "10mg",
      packSize: "90",
      unitType: "Tablets",
      sellingPrice: 12.99,
      originalPrice: 17.99,
      tax: 5,
      discount: 28,
      productImage: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Non-drowsy 24-hour allergy relief from hay fever and other allergic conditions." },
        { title: "Uses", content: "Relief from sneezing, runny nose, itchy/watery eyes, and itching of nose or throat caused by allergies." },
        { title: "Side Effects", content: "May cause drowsiness in some people, headache, dry mouth, or fatigue." },
      ],
      specifications: [
        { key: "Manufacturer", value: "AllerCare Pharma" },
        { key: "Country of Origin", value: "India" },
        { key: "Shelf Life", value: "36 months" },
        { key: "Prescription Required", value: "No" },
      ],
      suitableFor: ["adults", "children", "vegetarian"],
      howToUse: [
        "Adults and children over 6: Take 1 tablet once daily",
        "Take at the same time each day for best results",
        "Can be taken with or without food",
        "Swallow tablet whole with water",
      ],
      safetyInformation: [
        "Do not exceed 1 tablet in 24 hours",
        "May cause drowsiness - be cautious when driving",
        "Avoid alcohol while using this medication",
        "Consult doctor if pregnant or breastfeeding",
        "Store below 25°C in original packaging",
      ],
      ingredients: [
        { name: "Cetirizine Hydrochloride", quantity: "10", unit: "mg" },
        { name: "Lactose Monohydrate", quantity: null, unit: null },
        { name: "Microcrystalline Cellulose", quantity: null, unit: null },
      ],
    },
    {
      category: "Diabetes Care",
      productName: "Blood Glucose Test Strips (50 Count)",
      dosageForm: "Test Strip",
      strength: "N/A",
      packSize: "50",
      unitType: "Strips",
      sellingPrice: 24.99,
      originalPrice: 29.99,
      tax: 0,
      discount: 17,
      productImage: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80",
        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Accurate and easy-to-use blood glucose test strips compatible with most standard glucose meters." },
        { title: "Uses", content: "For self-testing of blood glucose levels in people with diabetes. Helps monitor and manage blood sugar levels." },
        { title: "Important", content: "Results should be used in conjunction with medical advice and regular doctor visits." },
      ],
      specifications: [
        { key: "Manufacturer", value: "DiabCare Medical" },
        { key: "Country of Origin", value: "Germany" },
        { key: "Shelf Life", value: "18 months" },
        { key: "Prescription Required", value: "No" },
        { key: "Accuracy", value: "ISO 15197:2013 Compliant" },
      ],
      suitableFor: ["diabetic_friendly", "adults", "elderly"],
      howToUse: [
        "Wash and dry hands thoroughly before testing",
        "Insert test strip into glucose meter",
        "Apply small blood sample to test strip",
        "Read result on meter display within 5 seconds",
        "Record results in diabetes logbook",
      ],
      safetyInformation: [
        "For in vitro diagnostic use only",
        "Store strips in original container with cap tightly closed",
        "Keep away from direct sunlight and moisture",
        "Do not use after expiration date",
        "Discard used strips safely in sharps container",
        "Keep out of reach of children",
      ],
      ingredients: [],
    },
    {
      category: "First Aid",
      productName: "Sterile Adhesive Bandages Variety Pack",
      dosageForm: "Bandage",
      strength: "N/A",
      packSize: "100",
      unitType: "Bandages",
      sellingPrice: 9.99,
      originalPrice: 12.99,
      tax: 0,
      discount: 23,
      productImage: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
      productImages: [
        "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
        "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=800&q=80",
      ],
      productDescriptions: [
        { title: "Overview", content: "Comprehensive assortment of sterile adhesive bandages in various sizes for wound protection and minor injury care." },
        { title: "Uses", content: "Protection of minor cuts, scrapes, abrasions, and blisters. Keeps wounds clean and promotes healing." },
        { title: "Features", content: "Flexible fabric design, strong adhesive, non-stick pad, breathable material." },
      ],
      specifications: [
        { key: "Manufacturer", value: "FirstCare Medical Supplies" },
        { key: "Country of Origin", value: "United States" },
        { key: "Shelf Life", value: "60 months" },
        { key: "Prescription Required", value: "No" },
        { key: "Sterility", value: "Individually Wrapped & Sterile" },
      ],
      suitableFor: ["adults", "children", "elderly", "latex_free"],
      howToUse: [
        "Clean wound gently with soap and water",
        "Dry the area around the wound",
        "Open bandage wrapper carefully",
        "Remove protective strips and apply bandage to wound",
        "Press edges firmly for secure adhesion",
        "Change bandage daily or when wet/dirty",
      ],
      safetyInformation: [
        "For external use only",
        "Do not apply to infected wounds without medical advice",
        "Discontinue use if rash or irritation develops",
        "Seek medical attention for deep cuts or serious injuries",
        "Store in cool, dry place",
        "Keep out of reach of young children",
      ],
      ingredients: [],
    },
  ];

  for (const productData of topProducts) {
    const category = categoryMap[productData.category];
    if (!category) continue;

    const [product, productCreated] = await PharmacyProduct.findOrCreate({
      where: { 
        productName: productData.productName,
        categoryId: category.id,
      },
      defaults: {
        categoryId: category.id,
        productName: productData.productName,
        productImage: productData.productImage,
        productImages: productData.productImages,
        dosageForm: productData.dosageForm,
        strength: productData.strength,
        packSize: productData.packSize,
        unitType: productData.unitType,
        sellingPrice: productData.sellingPrice,
        originalPrice: productData.originalPrice,
        tax: productData.tax,
        discount: productData.discount,
        productDescriptions: productData.productDescriptions,
        specifications: productData.specifications,
        suitableFor: productData.suitableFor,
        howToUse: productData.howToUse,
        safetyInformation: productData.safetyInformation,
        isActive: true,
      },
    });

    if (productCreated) {
      log(`Product: ${productData.productName} ($${productData.sellingPrice})`);

      // Add ingredients
      for (let i = 0; i < productData.ingredients.length; i++) {
        const ing = productData.ingredients[i];
        await ProductIngredient.create({
          productId: product.id,
          ingredientName: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          sortOrder: i + 1,
        });
      }
      if (productData.ingredients.length > 0) {
        log(`  → ${productData.ingredients.length} ingredients added`);
      }
    } else {
      skip(`Product exists: ${productData.productName}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHARMACY PRODUCTS - REVIEWS
  // ══════════════════════════════════════════════════════════════════════════

  // Get all pharmacy products for reviews
  const allPharmacyProducts = await PharmacyProduct.findAll();
  
  const reviewsData = [
    {
      rating: 5,
      reviewText: "Excellent pain relief! Works quickly and effectively. I keep these in my medicine cabinet at all times.",
      isVerifiedPurchase: true,
      isApproved: true,
    },
    {
      rating: 4,
      reviewText: "Good product, does what it says. The day formula doesn't make me drowsy which is great for work.",
      isVerifiedPurchase: true,
      isApproved: true,
    },
    {
      rating: 5,
      reviewText: "My digestion has improved significantly since taking these probiotics daily. Highly recommend!",
      isVerifiedPurchase: true,
      isApproved: true,
    },
    {
      rating: 5,
      reviewText: "Great quality fish oil. No fishy aftertaste which is a huge plus. Will definitely buy again.",
      isVerifiedPurchase: true,
      isApproved: true,
    },
    {
      rating: 4,
      reviewText: "Very effective for my seasonal allergies. Takes about 30 minutes to work but lasts all day.",
      isVerifiedPurchase: true,
      isApproved: true,
    },
    {
      rating: 5,
      reviewText: "These test strips are accurate and easy to use. Much more affordable than brand name versions.",
      isVerifiedPurchase: true,
      isApproved: true,
    },
    {
      rating: 5,
      reviewText: "Perfect for my gym bag and first aid kit at home. Good variety of sizes and they stick well.",
      isVerifiedPurchase: false,
      isApproved: true,
    },
    {
      rating: 4,
      reviewText: "Good value for money. I feel more energetic since starting this vitamin D supplement.",
      isVerifiedPurchase: true,
      isApproved: true,
    },
  ];

  // Create reviews from different customers for different products
  let reviewCount = 0;
  for (let i = 0; i < Math.min(reviewsData.length, allPharmacyProducts.length); i++) {
    const customer = customers[i % customers.length];
    const product = allPharmacyProducts[i];
    const reviewData = reviewsData[i];

    const [, created] = await Review.findOrCreate({
      where: {
        customerId: customer.id,
        productId: product.id,
      },
      defaults: {
        customerId: customer.id,
        productId: product.id,
        rating: reviewData.rating,
        reviewText: reviewData.reviewText,
        isVerifiedPurchase: reviewData.isVerifiedPurchase,
        isApproved: reviewData.isApproved,
      },
    });

    if (created) {
      reviewCount++;
      log(`Review: ${customer.name} → ${product.productName} (${reviewData.rating}⭐)`);
    }
  }

  if (reviewCount === 0) {
    skip(`All reviews already exist`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SAMPLE ORDERS
  // ══════════════════════════════════════════════════════════════════════════

  const orderStatuses: Array<"pending" | "confirmed" | "processing" | "shipped" | "delivered"> = 
    ["pending", "confirmed", "processing", "shipped", "delivered"];
  const paymentMethods: Array<"cash" | "card" | "online" | "upi"> = ["cash", "card", "online", "upi"];
  
  const addresses = [
    "456 Oak Street, Apartment 3B, New York, NY 10002",
    "789 Maple Avenue, Suite 100, Brooklyn, NY 11201",
    "321 Pine Road, Queens, NY 11354",
    "654 Elm Street, Manhattan, NY 10011",
    "987 Cedar Lane, Bronx, NY 10451",
  ];

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const orderCount = Math.floor(Math.random() * 3) + 1; // 1-3 orders per customer

    for (let j = 0; j < orderCount; j++) {
      const subtotal = Math.floor(Math.random() * 20000) + 5000; // $50-$250
      const taxAmount = subtotal * 0.08; // 8% tax
      const discountAmount = Math.random() > 0.5 ? subtotal * 0.1 : 0; // 10% discount sometimes
      const totalAmount = subtotal + taxAmount - discountAmount;

      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const orderData = {
        customerId: customer.id,
        isGuest: false,
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        orderStatus: status,
        paymentStatus: "paid" as const,
        paymentMethod,
        subtotal: subtotal / 100, // Convert cents to dollars
        taxAmount: taxAmount / 100,
        discountAmount: discountAmount / 100,
        totalAmount: totalAmount / 100,
        deliveryAddress: addresses[i],
        deliveryNotes: Math.random() > 0.5 ? "Please ring doorbell" : null,
        confirmedAt: status !== "pending" ? new Date(Date.now() - 86400000 * Math.random() * 7) : null,
        shippedAt: ["shipped", "delivered"].includes(status) ? new Date(Date.now() - 86400000 * Math.random() * 3) : null,
        deliveredAt: status === "delivered" ? new Date(Date.now() - 86400000 * Math.random()) : null,
      };

      const [, created] = await Order.findOrCreate({
        where: { 
          customerId: customer.id,
          deliveryAddress: orderData.deliveryAddress,
          totalAmount: orderData.totalAmount,
        },
        defaults: orderData,
      });

      if (created) {
        log(`Order created: ${customer.name} - $${orderData.totalAmount.toFixed(2)} [${status}]`);
      }
    }
  }

  // Add a few guest orders
  for (let i = 0; i < 3; i++) {
    const subtotal = Math.floor(Math.random() * 15000) + 3000;
    const taxAmount = subtotal * 0.08;
    const totalAmount = subtotal + taxAmount;

    const guestData = {
      customerId: null,
      isGuest: true,
      guestName: `Guest Customer ${i + 1}`,
      guestEmail: `guest${i + 1}@example.com`,
      guestPhone: `+1-555-000-000${i}`,
      orderStatus: "confirmed" as const,
      paymentStatus: "paid" as const,
      paymentMethod: "online" as const,
      subtotal: subtotal / 100,
      taxAmount: taxAmount / 100,
      discountAmount: 0,
      totalAmount: totalAmount / 100,
      deliveryAddress: `${100 + i} Guest Street, New York, NY 1000${i}`,
      deliveryNotes: "Guest order - call before delivery",
      confirmedAt: new Date(Date.now() - 86400000 * Math.random() * 5),
    };

    const [, created] = await Order.findOrCreate({
      where: {
        guestEmail: guestData.guestEmail,
        deliveryAddress: guestData.deliveryAddress,
      },
      defaults: guestData,
    });

    created ? log(`Guest order created: ${guestData.guestName}`) : skip(`Guest order exists: ${guestData.guestName}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPLETE
  // ══════════════════════════════════════════════════════════════════════════

  console.log("\n" + "═".repeat(80));
  console.log("🎉  HEAVY SEEDING COMPLETE");
  console.log("═".repeat(80));
  console.log("\n📊 Database Summary:");
  console.log(`  • Users:            ${await User.count()} (${await User.count({ where: { role: "CUSTOMER" } })} customers)`);
  console.log(`  • Themes:           ${await CustomTheme.count()}`);
  console.log(`  • Hero Slides:      ${await HeroSlide.count()}`);
  console.log(`  • UI Categories:    ${await CollectionCategory.count()}`);
  console.log(`  • UI Products:      ${await Product.count()}`);
  console.log(`  • Testimonials:     ${await Testimonial.count()}`);
  console.log(`  • Values:           ${await Value.count()}`);
  console.log(`  • Pharmacy Categories: ${await Category.count()}`);
  console.log(`  • Pharmacy Products:   ${await PharmacyProduct.count()}`);
  console.log(`  • Product Reviews:     ${await Review.count()}`);
  console.log(`  • Orders:           ${await Order.count()}`);
  console.log("\n🔐 Admin Login:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  URL:      http://localhost:3000/admin/login`);
  console.log("\n💳 Sample Customer Login:");
  console.log(`  Email:    john@example.com`);
  console.log(`  Password: Customer@123`);
  console.log("\n🏪 Top-Selling Products Seeded:");
  console.log(`  • Pain Relief: Paracetamol 500mg`);
  console.log(`  • Cold & Flu: Day & Night Capsules`);
  console.log(`  • Digestive: Probiotic 30B CFU`);
  console.log(`  • Vitamins: Vitamin D3 4000 IU`);
  console.log(`  • Heart Health: Omega-3 Fish Oil`);
  console.log(`  • Allergy: Cetirizine 10mg`);
  console.log(`  • Diabetes: Glucose Test Strips`);
  console.log(`  • First Aid: Bandage Variety Pack`);
  console.log("\n⭐ Product Reviews:");
  console.log(`  • ${await Review.count()} verified customer reviews`);
  console.log(`  • Average rating: 4.6/5.0 stars`);
  console.log("\n🎨 Active Theme:");
  console.log(`  • Gold & Black (Luxury pharmacy theme)`);
  console.log("\n" + "═".repeat(80) + "\n");
}

main()
  .catch(err => { 
    console.error("\n[seed] ❌ FAILED:", err); 
    process.exit(1); 
  })
  .finally(() => sequelize.close());
