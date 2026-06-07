import { pgTable, text, serial, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sellersTable = pgTable("sellers", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  ownerName: text("owner_name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  categories: text("categories").array().notNull().default([]),
  whatsapp: text("whatsapp").notNull(),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  isPremium: boolean("is_premium").notNull().default(false),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  productCount: integer("product_count").notNull().default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  isVerified: boolean("is_verified").notNull().default(false),
  kycStatus: text("kyc_status").notNull().default("none"),
  kycWhatsapp: text("kyc_whatsapp"),
  kycSubmittedAt: timestamp("kyc_submitted_at"),
});

export const insertSellerSchema = createInsertSchema(sellersTable).omit({ id: true, joinedAt: true, rating: true, reviewCount: true, productCount: true });
export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type Seller = typeof sellersTable.$inferSelect;
