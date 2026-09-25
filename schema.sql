-- Fresh MySQL/MariaDB schema for the Akiwa API.
-- The API stores each model document as JSON so existing request/response
-- shapes (including nested order/payment fields) remain unchanged.
-- Collections and fields represented in `data`:
-- products(name, category, price, oldPrice, offerExpiresAt, stock, badge,
--   image, images, short, details, description, specs, includes, isActive)
-- services(name, category, price, timeline, description, summary, image,
--   deliverables, isActive)
-- reviews(name, project, rating, image, text, isApproved)
-- contactMessages(name, email, phone, subject, message, status)
-- quoteRequests(name, email, phone, note, items, status)
-- users(name, email, password, phone)
-- addresses(userId, fullName, phone, street, city, state, pinCode, addressType, isDefault)
-- orders(userId, status, trackingNumber, items, total, address, payment, email,
--   cancellationReason, cancelledBy, cancelledAt)
-- siteSettings (all homepage, hero, heroTitleSize/heroCopySize, contact, and footer settings)
-- admins(uid, email, role, active), categories(name, slug, type, description,
--   image, sortOrder, isActive), banners(title, subtitle, image, linkLabel,
--   linkUrl, placement, sortOrder, isActive)
-- blogPosts(title, slug, excerpt, content, image, author, tags, published, publishedAt)
-- freelanceRequests(name, email, phone, projectType, projectDescription, budget, timeline, status)

CREATE TABLE IF NOT EXISTS app_records (
  collection_name VARCHAR(64) NOT NULL,
  id VARCHAR(191) NOT NULL,
  data LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (collection_name, id),
  KEY app_records_created_idx (collection_name, created_at),
  CONSTRAINT app_records_json CHECK (JSON_VALID(data))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS uploads (
  id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(150) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  size BIGINT UNSIGNED NOT NULL,
  sha256 CHAR(64) NOT NULL,
  cache_control VARCHAR(255) NOT NULL,
  metadata LONGTEXT NOT NULL,
  content LONGBLOB NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uploads_filename_idx (filename),
  KEY uploads_sha_idx (sha256),
  CONSTRAINT uploads_metadata_json CHECK (JSON_VALID(metadata))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
