Here’s a detailed prompt you can paste directly into **Lovable**:

---

# Website Design Prompt: Ammikulavi Estates

Create a **premium, elegant, nature-inspired website** for **Ammikulavi Estates**, an estate primarily focused on **specialty coffee cultivation**, while also producing **premium pepper**.

The website should feel authentic, sophisticated, warm, and deeply connected to nature and the estate's landscape.

## Brand Identity & Logo

Use the uploaded **Ammikulavi Estate logo** prominently throughout the website.

The logo features natural elements and should inspire the overall visual identity.

### Colour Palette

Extract and use the primary colours from the logo:

* **Deep Forest Green** – primary brand colour
* **Rich Coffee Brown / Dark Espresso** – secondary colour
* **Warm Gold / Muted Olive Gold** – accent colour
* **Cream / Natural Beige** – primary background colour
* **Soft Off-White** – secondary background colour
* **Black / Charcoal** – typography and contrast

The overall aesthetic should feel:

**Premium • Organic • Heritage • Sustainable • Minimal • Elegant**

Avoid overly bright colours, excessive gradients, or a generic corporate appearance.

---

# Website Structure

## 1. Home Page

Create a visually immersive homepage.

### Hero Section

A large, elegant hero section featuring:

* Coffee estate imagery or cinematic plantation visuals
* The Ammikulavi Estates logo
* A strong headline such as:

**"From the Estate to Every Cup."**

Alternative supporting text:

> Cultivating exceptional coffee and pepper amidst the richness of nature.

Include buttons:

* **Explore Our Coffee**
* **Discover the Estate**

Use subtle animations and smooth scrolling.

---

## 2. About Ammikulavi Estates

Create a storytelling-focused section covering:

* The history of Ammikulavi Estates
* The estate's location and environment
* The philosophy behind cultivation
* Sustainable and responsible farming
* The connection between nature, soil, climate, and flavour

Use large editorial-style photography and elegant typography.

Suggested heading:

**Rooted in Nature. Crafted with Care.**

---

# 3. Coffee

This should be one of the most important sections of the website.

Create a dedicated **Coffee** page featuring:

### Coffee Overview

* Estate-grown coffee
* Coffee varieties
* Growing altitude
* Processing methods
* Harvesting practices
* Flavour profiles

### Coffee Journey Section

Create a visual storytelling timeline:

**Seed → Plantation → Harvest → Processing → Roasting → Cup**

Use elegant icons and imagery.

### Coffee Gallery

Allow the owner to upload:

* Plantation photos
* Coffee cherries
* Harvest images
* Processing images
* Coffee products
* Videos

---

# 4. Pepper

Create a dedicated page for the estate's pepper production.

Include:

* Estate-grown pepper
* Cultivation process
* Harvesting
* Processing
* Quality and flavour characteristics

Suggested heading:

**The Spice of the Estate**

Use imagery of pepper vines, green pepper, black pepper, and harvesting.

---

# 5. Estate Gallery

Create a beautiful, highly visual gallery.

### Gallery Features

Organize content into:

* Coffee
* Pepper
* Estate Life
* Nature
* Harvest
* People
* Videos

The gallery must support:

* Image uploads
* Video uploads
* Captions
* Categories
* Featured images
* Lightbox viewing
* Responsive masonry/grid layout

---

# 6. Journal / Blog

Create a premium editorial-style blog section called:

## **The Estate Journal**

The owner should be able to easily create and manage blog posts.

Blog topics may include:

* Coffee cultivation
* Harvest stories
* Pepper cultivation
* Sustainability
* Estate life
* Coffee education
* Behind the scenes
* Seasonal updates

### Blog CMS Features

The admin should be able to:

* Create blog posts
* Edit posts
* Delete posts
* Save drafts
* Publish/unpublish posts
* Add featured images
* Upload images within articles
* Embed videos
* Add categories
* Add tags
* Edit publication dates

### Blog Page Layout

Each article should include:

* Featured image
* Title
* Author
* Publication date
* Category
* Article content
* Related posts
* Social sharing

Create a clean, editorial reading experience.

---

# 7. Media / Stories

Create a section specifically for visual storytelling.

Allow:

* Videos
* Short estate films
* Coffee processing videos
* Harvest videos
* Interviews
* Behind-the-scenes content

The CMS should allow the owner to easily upload, replace, edit, and remove videos.

---

# 8. Sustainability

Create a dedicated sustainability page.

Focus on:

* Responsible farming
* Soil health
* Biodiversity
* Water conservation
* Sustainable cultivation
* Respect for nature

Use immersive photography and storytelling rather than excessive statistics.

Suggested heading:

**Growing With Nature, Not Against It.**

---

# 9. Contact

Create a beautiful contact page including:

* Estate contact information
* Email
* Phone number
* Location/map
* Social media links
* Contact form

Optional fields:

* Name
* Email
* Phone
* Subject
* Message

Include spam protection.

---

# CMS / ADMIN REQUIREMENTS

The website MUST include a secure and easy-to-use **CMS dashboard**.

The estate owner should be able to log in and manage the website without needing technical knowledge.

## Recommended Technical Setup

Use:

* **Lovable**
* **Supabase** for backend
* Supabase Authentication for admin login
* Supabase Database
* Supabase Storage for images and videos

Create a secure admin dashboard accessible only to authorized users.

---

# Admin Dashboard

Create a clean and intuitive dashboard.

### Dashboard Sections

#### 1. Media Manager

The owner should be able to:

* Upload photos
* Upload videos
* Delete media
* Replace media
* Add captions
* Add alt text
* Categorize images
* Select featured images
* Reorder gallery images

#### 2. Blog Manager

The owner should be able to:

* Create blogs
* Edit blogs
* Delete blogs
* Save drafts
* Publish posts
* Upload featured images
* Add categories and tags

#### 3. Homepage Manager

Allow editing of:

* Hero headline
* Hero description
* Hero image/video
* Featured sections
* Featured coffee content
* Featured blog posts

#### 4. Estate Content

Allow editing of:

* About Us
* Coffee page content
* Pepper page content
* Sustainability content
* Contact information

---

# CMS DATABASE STRUCTURE

Create database tables for:

### Users / Admins

* id
* name
* email
* role
* created_at

### Blog Posts

* id
* title
* slug
* excerpt
* content
* featured_image
* author
* category
* tags
* status
* published_at
* created_at
* updated_at

### Media

* id
* file_url
* file_type
* title
* caption
* alt_text
* category
* featured
* created_at

### Website Content

Allow editable content blocks for:

* Homepage
* About
* Coffee
* Pepper
* Sustainability
* Contact

---

# Design Style

The website should feel like a combination of:

* Luxury coffee brand
* Boutique estate
* Nature documentary
* Heritage agricultural estate

### Typography

Use elegant typography with:

* A refined serif font for headings
* A clean modern sans-serif font for body text

Headings should feel editorial and luxurious.

---

# UI & UX

The website should include:

* Smooth scrolling
* Subtle animations
* Gentle parallax effects
* Elegant hover effects
* Image fade-ins
* Responsive design
* Excellent mobile experience
* Fast loading
* SEO-friendly structure

Do NOT overuse animations.

The design should feel calm, premium, and timeless.

---

# Homepage Suggested Sections

1. Hero
2. Introduction to Ammikulavi Estates
3. Coffee Feature
4. Pepper Feature
5. Estate Philosophy
6. Visual Gallery Preview
7. Latest Journal Posts
8. Sustainability
9. Contact / Visit the Estate
10. Footer

---

# Footer

Include:

* Ammikulavi Estates logo
* Navigation links
* Coffee
* Pepper
* Estate Journal
* Gallery
* Sustainability
* Contact
* Social media links
* Copyright

---

# Important Functional Requirements

* Fully responsive for desktop, tablet, and mobile
* Secure admin authentication
* CMS must be easy for a non-technical owner to use
* Image uploads should use Supabase Storage
* Video uploads should be supported
* Blog management should be fully functional
* All website content should be editable through the CMS where practical
* Implement SEO metadata for every page and blog post
* Use semantic HTML and accessibility best practices
* Optimize images for performance
* Include proper loading states and error handling

---

# Final Design Direction

The final website should feel like visiting a **beautiful, premium coffee estate surrounded by nature**.

It should communicate:

**Authenticity. Craftsmanship. Heritage. Nature. Exceptional Coffee.**

The visual identity should strongly follow the **Ammikulavi Estates logo**, especially its deep greens, rich coffee browns, warm gold accents, and elegant cream backgrounds.

**Use the uploaded Ammikulavi Estates logo as the primary brand logo throughout the website. Do not redesign or replace the logo.**

---

If you want, I can also create a **second, more advanced Lovable prompt specifically focused on the CMS/database architecture and Supabase setup**, so you can build the design first and then add a professional owner dashboard.
