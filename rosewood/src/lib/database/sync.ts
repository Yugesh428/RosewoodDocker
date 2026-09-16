/**
 * db:sync — creates all tables that don't exist yet.
 * Run: npm run db:sync
 *
 * NOTE: Sequelize 6 + PostgreSQL has a known bug where alter:true generates
 * invalid SQL for columns with foreign key references. This is a Sequelize bug,
 * not a project bug. Use npm run db:migrate to add new columns safely.
 *
 * Workflow:
 *   - New project / fresh DB  → npm run db:sync   (creates all tables)
 *   - Added a new column      → npm run db:migrate (adds the column safely)
 */

import sequelize from "./sequelize";
import User             from "../models/userModel";
import Category         from "../../features/productCategory/productCatetgoryModel";
import Product          from "../../features/products/productModel";
import ProductIngredient from "../../features/products/productIngredientModel";
import Inventory        from "../../features/inventory/inventoryModel";
import Order            from "../../features/orders/orderModel";
import OrderItem        from "../../features/orderItems/orderItemModel";
import Staff            from "../../features/staff/staffModel";
import Wishlist         from "../../features/wishlist/wishlistModel";
import Review           from "../../features/reviews/reviewModel";
import Feedback         from "../../features/feedback/feedbackModel";
import GuestCart        from "../../features/guestCart/guestCartModel";
import HeroSection      from "../../features/Ui/HeroSection/heroModel/heroModel";
import OurProductCollectionCategory from "../../features/Ui/ourProductCollection/ourProductCollectionCategoryModel";
import OurProduct       from "../../features/Ui/ourProductCollection/ourProductContent/ourProductModel";
import Testimonial      from "../../features/Ui/testimonials/testimonialsModel";
import AboutUsTitle     from "../../features/Ui/AboutUsPage/AboutUs Head/aboutUsTitleModel";
import OurStory         from "../../features/Ui/AboutUsPage/ourStory/ourStroyModel";
import Mission          from "../../features/Ui/AboutUsPage/ourMisson/missionModel";
import OurValues        from "../../features/Ui/AboutUsPage/ourValues/ourValuesModel";
import ContactInfo      from "../../features/Ui/contact/contactInfo/contactInfoModel";
import ContactForm      from "../../features/Ui/contact/contactForm/contactFormModel";
import SiteTheme, { CustomTheme } from "../../features/siteTheme/siteThemeModel";

const OPTS = { force: false, alter: false } as const;

async function sync() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    // Parent tables first, then children (FK dependency order)
    await User.sync(OPTS);
    await Staff.sync(OPTS);
    await Category.sync(OPTS);
    await Product.sync(OPTS);
    await ProductIngredient.sync(OPTS);
    await Inventory.sync(OPTS);
    await Review.sync(OPTS);
    await Wishlist.sync(OPTS);
    await Order.sync(OPTS);
    await OrderItem.sync(OPTS);
    await Feedback.sync(OPTS);
    await GuestCart.sync(OPTS);
    await HeroSection.sync(OPTS);
    await OurProductCollectionCategory.sync(OPTS);
    await OurProduct.sync(OPTS);
    await Testimonial.sync(OPTS);
    await AboutUsTitle.sync(OPTS);
    await OurStory.sync(OPTS);
    await Mission.sync(OPTS);
    await OurValues.sync(OPTS);
    await ContactInfo.sync(OPTS);
    await ContactForm.sync(OPTS);
    await CustomTheme.sync(OPTS);
    await SiteTheme.sync(OPTS);

    console.log("✅ All tables created (if not exist).");
    console.log("\n💡 To add new columns, run: npm run db:migrate");
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

sync();
