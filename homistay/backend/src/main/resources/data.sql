-- =============================================
-- Homistay Seed Data
-- This file is executed by Spring Boot on startup
-- to populate the database with demo/test data.
-- =============================================

-- ── Users ────────────────────────────────────
-- Password for all users: "password123" (bcrypt hash)
INSERT INTO users (id, full_name, email, password_hash, role, is_active, avatar_url, created_at)
VALUES
  (1, 'Emma Thompson', 'user1@example.com',
   '$2a$12$qH9q.h4Tb.mMQmMcg20Py.zbKi8uLC1ORj/3WUPCBbFrCYzQjJpFq',
   'GUEST', true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest1', NOW()),
  (2, 'Marco Rossi', 'host1@example.com',
   '$2a$12$qH9q.h4Tb.mMQmMcg20Py.zbKi8uLC1ORj/3WUPCBbFrCYzQjJpFq',
   'HOST', true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=host1', NOW()),
  (3, 'guest2', 'guest2@example.com',
   '$2a$12$qH9q.h4Tb.mMQmMcg20Py.zbKi8uLC1ORj/3WUPCBbFrCYzQjJpFq',
   'GUEST', true, 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest2', NOW())
ON CONFLICT (id) DO NOTHING;

-- Reset sequence after explicit ID inserts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ── Properties (19 properties in India and internationally) ────────
INSERT INTO properties (id, host_id, title, description, type, city, country, address, latitude, longitude,
                        price_per_night, max_guests, bedrooms, bathrooms, amenities, is_active, created_at)
VALUES
  -- 1. Goa Villa
  (1, 2, 'Luxury Beach Villa in Goa',
   'Wake up to the sound of waves in this stunning beachfront property with private access to the sand. The open-plan living area connects seamlessly to the deck overlooking the Arabian Sea. A true tropical paradise with all modern amenities.',
   'VILLA', 'Goa', 'India', '123 Beach Road, Candolim', 15.5164, 73.7632,
   250.00, 6, 3, 2, 'WiFi,Kitchen,Pool,Ocean view,Beach access,Patio or balcony,Free parking', true, NOW()),
  
  -- 2. Bengaluru Apartment
  (2, 2, 'Modern Apartment in Indiranagar',
   'Sleek and minimalist apartment in the heart of Bengaluru. Close to transport and endless dining options. Floor-to-ceiling windows offer stunning city views. Designed with modern style in mind.',
   'APARTMENT', 'Bengaluru', 'India', '456 Indiranagar Double Road', 12.9719, 77.6412,
   80.00, 2, 1, 1, 'WiFi,Kitchen,Washer,Dryer,TV,Workspace,Air conditioning,City view', true, NOW()),
  
  -- 3. Manali Cabin
  (3, 2, 'Cozy Cabin in Manali',
   'A secluded log cabin nestled in the mountains of Manali. Perfect for relaxing in winter or trekking in summer. The indoor fireplace creates a magical atmosphere on cold evenings. This cabin blends rustic charm with all the modern comforts.',
   'CABIN', 'Manali', 'India', '101 Mall Road', 32.2396, 77.1887,
   120.00, 4, 2, 1, 'WiFi,Kitchen,Indoor fireplace,Mountain view,Free parking,Hot tub', true, NOW()),
  
  -- 4. Goa Portuguese House
  (4, 2, 'Portuguese Heritage Beach House',
   'A stunning traditional Portuguese-style heritage villa in Goa. Features beautiful red-tile roofs, local wooden furniture, a private garden, and is only steps from the beach. Experience colonial architectural beauty with all modern comforts.',
   'VILLA', 'Goa', 'India', '45 Fort Aguada Road, Sinquerim', 15.5011, 73.7667,
   180.00, 6, 3, 2, 'WiFi,Kitchen,Beach access,Patio or balcony,Free parking,Garden view', true, NOW()),
  
  -- 5. Mumbai Apartment
  (5, 2, 'Modern High-Rise Apartment',
   'Sleek, upscale high-rise apartment on Marine Drive. Features incredible skyline and Arabian Sea views, top-of-the-line appliances, and a dedicated workspace. Perfect for corporate visitors or urban vacationers.',
   'APARTMENT', 'Mumbai', 'India', '78 Marine Drive', 18.9431, 72.8230,
   150.00, 2, 1, 1, 'WiFi,Kitchen,Washer,Dryer,TV,Workspace,Air conditioning,City view', true, NOW()),
  
  -- 6. Delhi Haveli
  (6, 2, 'Historic Haveli in Old Delhi',
   'A meticulously restored historic Haveli in the heart of Old Delhi. Features beautiful arched doorways, ornate courtyards, traditional hand-carved details, and a rooftop overlooking the historic markets.',
   'VILLA', 'Delhi', 'India', '12 Chandni Chowk Lane', 28.6506, 77.2303,
   110.00, 8, 4, 4, 'WiFi,Kitchen,Air conditioning,Rooftop terrace,Barbecue grill,City view', true, NOW()),
  
  -- 7. Bengaluru Loft
  (7, 2, 'Executive Suite Loft in Bengaluru',
   'A premium executive suite loft situated on MG Road, Bengaluru. Features high-speed fiber internet, workspace, clean minimalist layout, and close proximity to public transport and top IT parks.',
   'LOFT', 'Bengaluru', 'India', '102 MG Road', 12.9733, 77.6112,
   90.00, 2, 1, 1, 'WiFi,Kitchen,Washer,TV,Workspace,Air conditioning,City view', true, NOW()),

  -- 8. Villa Paradiso in Tuscany (prop1)
  (8, 2, 'Villa Paradiso in Tuscany',
   'A beautiful traditional villa surrounded by rolling hills and vineyards. Enjoy sweeping views of the Chianti countryside from the infinity pool. The property features authentic Tuscan architecture with terracotta floors, stone walls, and wooden beams. Perfect for a relaxing getaway or romantic retreat.',
   'VILLA', 'Florence', 'Italy', '123 Chianti Way', 43.5689, 11.3128,
   350.00, 8, 4, 3, 'WiFi,Pool,Kitchen,Air conditioning,Free parking,Washer,Dryer,Patio or balcony,Garden view,Barbecue grill', true, NOW()),

  -- 9. Modern Loft in Tokyo (prop2)
  (9, 2, 'Modern Loft in Downtown Tokyo',
   'Sleek and minimalist apartment in the heart of Shibuya. Close to transport and endless dining options. Floor-to-ceiling windows offer stunning city views. Designed with Japanese minimalism in mind, every detail is thoughtfully curated for the modern traveler.',
   'APARTMENT', 'Tokyo', 'Japan', '456 Shibuya Crossing', 35.6580, 139.7016,
   180.00, 2, 1, 1, 'WiFi,Kitchen,Washer,Dryer,TV,Workspace,Air conditioning,City view', true, NOW()),

  -- 10. Oceanfront Beach House (prop3)
  (10, 2, 'Oceanfront Beach House',
   'Wake up to the sound of waves in this stunning beachfront property with private access to the sand. The open-plan living area connects seamlessly to the deck overlooking the Pacific. A true California dream home with all modern amenities.',
   'HOUSE', 'Malibu', 'USA', '789 Pacific Coast Hwy', 34.0259, -118.7798,
   450.00, 6, 3, 2, 'WiFi,Kitchen,Ocean view,Beach access,Patio or balcony,Free parking,Outdoor shower', true, NOW()),

  -- 11. Cozy Alpine Cabin (prop4)
  (11, 2, 'Cozy Alpine Cabin',
   'A secluded log cabin nestled in the mountains. Perfect for skiing in winter or hiking in summer. The indoor fireplace creates a magical atmosphere on cold evenings. This cabin blends rustic charm with all the modern comforts you need.',
   'CABIN', 'Chamonix', 'France', '101 Mont Blanc Route', 45.9227, 6.8685,
   220.00, 4, 2, 1, 'WiFi,Kitchen,Indoor fireplace,Mountain view,Ski-in/Ski-out,Hot tub,Free parking', true, NOW()),

  -- 12. Overwater Bungalow Maldives (prop5)
  (12, 2, 'Overwater Bungalow Maldives',
   'Experience true paradise in this iconic overwater bungalow with a glass floor and direct lagoon access. Watch tropical fish from your bedroom floor, or snorkel in the crystal-clear waters steps from your deck. An unmatched luxury experience.',
   'VILLA', 'North Male Atoll', 'Maldives', 'Coral Reef Resort', 4.2634, 73.5292,
   890.00, 2, 1, 1, 'WiFi,Pool,Ocean view,Snorkeling gear,Air conditioning,Kayak', true, NOW()),

  -- 13. Parisian Haussmann Apartment (prop6)
  (13, 2, 'Parisian Haussmann Apartment',
   'Classic Haussmann-style apartment on a tree-lined boulevard, a short walk from the Eiffel Tower. Original parquet floors, high ceilings, and vintage furnishings combine with modern comforts. The perfect base to explore the City of Light.',
   'APARTMENT', 'Paris', 'France', '12 Avenue Montaigne', 48.8661, 2.3054,
   310.00, 4, 2, 1, 'WiFi,Kitchen,Washer,Elevator,City view,Workspace,TV', true, NOW()),

  -- 14. Bali Jungle Retreat (prop7)
  (14, 2, 'Bali Jungle Retreat',
   'Immerse yourself in the lush tropical jungle of Ubud. This stunning villa features an open-air living room, private pool surrounded by rice terraces, and daily yoga sessions. A true spiritual and sensory journey.',
   'VILLA', 'Ubud', 'Bali, Indonesia', 'Jl. Monkey Forest', -8.5194, 115.2606,
   195.00, 4, 2, 2, 'WiFi,Pool,Kitchen,Garden view,Yoga studio,Outdoor shower', true, NOW()),

  -- 15. Scottish Highland Estate (prop8)
  (15, 2, 'Scottish Highland Estate',
   'A majestic stone estate set against dramatic Highland landscapes. Roam the private grounds, fish in the loch, or simply sit by the fire with a dram of whisky. Rustic luxury at its most authentic.',
   'VILLA', 'Inverness', 'Scotland, UK', 'Loch Ness Estate', 57.4781, -4.2290,
   480.00, 10, 5, 4, 'Indoor fireplace,Kitchen,Free parking,Mountain view,Lake access,BBQ', true, NOW()),

  -- 16. Santorini Cave House (prop9)
  (16, 2, 'Santorini Cave House',
   'A traditional cycladic cave house carved into the cliffside with breathtaking caldera views. Watch the world-famous Santorini sunset from your private terrace while sipping local wine. An unmistakable Greek island experience.',
   'HOUSE', 'Oia', 'Santorini, Greece', 'Cliffside Terrace 7', 36.4618, 25.3753,
   415.00, 2, 1, 1, 'WiFi,Pool,Ocean view,Patio or balcony,Air conditioning,Breakfast', true, NOW()),

  -- 17. New York SoHo Artist Loft (prop10)
  (17, 2, 'New York SoHo Artist Loft',
   'A stunning artist''s loft in the heart of SoHo with exposed brick walls, vintage factory windows, and an eclectic collection of curated art. Steps from the best galleries, restaurants, and shopping in Manhattan.',
   'LOFT', 'New York', 'USA', '101 Spring Street, SoHo', 40.7246, -74.0018,
   380.00, 4, 2, 2, 'WiFi,Kitchen,Washer,Dryer,Workspace,TV,Gym,Elevator', true, NOW()),

  -- 18. Moroccan Riad in Marrakech (prop11)
  (18, 2, 'Moroccan Riad in Marrakech',
   'A beautifully restored traditional riad in the historic medina, featuring a central courtyard with fountain, ornate tilework, and a rooftop terrace with panoramic views of the Atlas Mountains. A magical step back in time.',
   'HOUSE', 'Marrakech', 'Morocco', 'Derb Bab Luksur, Medina', 31.6295, -7.9811,
   165.00, 6, 3, 2, 'WiFi,Pool,Breakfast,Air conditioning,Rooftop terrace', true, NOW()),

  -- 19. Norwegian Fjord Cabin (prop12)
  (19, 2, 'Norwegian Fjord Cabin',
   'A remote timber cabin perched above a dramatic Norwegian fjord. Hike, kayak, and fish in summer, or witness the Northern Lights dancing overhead in winter. Total serenity in one of the most beautiful landscapes on Earth.',
   'CABIN', 'Flam', 'Norway', 'Sognefjord Panorama', 60.8629, 7.1134,
   270.00, 4, 2, 1, 'Indoor fireplace,Kitchen,Free parking,Fjord view,Kayak,Sauna', true, NOW()),

  -- 20. Goa Apartment
  (20, 2, 'Modern Condo near Baga Beach',
   'A stylish and contemporary apartment located minutes away from the famous Baga Beach. Features a shared pool, air conditioning, modern kitchen, and easy access to local cafes, restaurants, and nightlife.',
   'APARTMENT', 'Goa', 'India', 'Baga-Calangute Road', 15.5550, 73.7580,
   130.00, 3, 1, 1, 'WiFi,Kitchen,Pool,Air conditioning,Free parking', true, NOW()),

  -- 21. Goa Cabin
  (21, 2, 'Secluded Jungle Cabin in South Goa',
   'Nestled deep in the lush green canopy of South Goa, this wooden cabin offers peace and tranquility. Perfect for nature lovers, features outdoor seating, eco-toilet, and is close to wildlife and waterfall trails.',
   'CABIN', 'Goa', 'India', 'Netravali Wildlife Sanctuary Road', 15.1023, 74.1245,
   110.00, 2, 1, 1, 'WiFi,Free parking,Patio or balcony,Garden view', true, NOW()),

  -- 22. Mumbai Apartment
  (22, 2, 'Chic Apartment in Bandra',
   'A trendy boutique apartment located in Mumbai''s most vibrant neighborhood. Surrounded by high-end shopping, art galleries, and famous cafes. Features modern design, high-speed WiFi, and a cozy workspace.',
   'APARTMENT', 'Mumbai', 'India', 'Carter Road, Bandra West', 19.0544, 72.8402,
   95.00, 2, 1, 1, 'WiFi,Kitchen,Washer,TV,Workspace,Air conditioning,City view', true, NOW()),

  -- 23. Mumbai Villa
  (23, 2, 'Luxury Villa near Juhu Beach',
   'An expansive, beautifully designed private villa near Juhu Beach. Features a stunning private garden, spacious living areas, and state-of-the-art kitchen. Ideal for groups or families seeking a premium retreat.',
   'VILLA', 'Mumbai', 'India', 'Juhu Tara Road', 19.1020, 72.8250,
   290.00, 8, 4, 4, 'WiFi,Kitchen,Air conditioning,Rooftop terrace,Barbecue grill,City view,Free parking,Garden view', true, NOW())
ON CONFLICT (id) DO UPDATE SET
  latitude  = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  city      = EXCLUDED.city,
  country   = EXCLUDED.country,
  address   = EXCLUDED.address;

SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties));

-- ── Property Images ──────────────────────────
INSERT INTO property_images (id, property_id, url, display_order, is_primary) VALUES
  -- Goa Villa (1)
  (1, 1, 'https://a0.muscache.com/im/pictures/42044170/f63c4d99_original.jpg?aki_policy=large', 0, true),
  
  -- Bengaluru Apartment (2)
  (2, 2, 'https://a0.muscache.com/im/pictures/236213/33956c43_original.jpg?aki_policy=large', 0, true),
  
  -- Manali Cabin (3)
  (3, 3, 'https://a0.muscache.com/im/pictures/67017008/23f53b40_original.jpg?aki_policy=large', 0, true),

  -- Goa Portuguese House (4)
  (4, 4, 'https://a0.muscache.com/im/pictures/8e132ba0-b68c-4878-92ae-2cf4476df95a.jpg?aki_policy=large', 0, true),

  -- Mumbai Apartment (5)
  (5, 5, 'https://a0.muscache.com/im/pictures/73a80fb8-b7b1-49e8-95a6-786b4ac4cd2c.jpg?aki_policy=large', 0, true),

  -- Delhi Haveli (6)
  (6, 6, 'https://a0.muscache.com/im/pictures/19408864/7c4cd0ec_original.jpg?aki_policy=large', 0, true),

  -- Bengaluru Loft (7)
  (7, 7, 'https://a0.muscache.com/im/pictures/1954127/a4ee760d_original.jpg?aki_policy=large', 0, true),

  -- Tuscany Villa (8)
  (8, 8, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779786738/OIP_3_fg1o1l.jpg', 0, true),
  (9, 8, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779786740/OIP_2_sw1amr.jpg', 1, false),
  (10, 8, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779786743/OIP_1_ao9qi2.jpg', 2, false),
  (11, 8, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779786744/OIP_ocjmr8.jpg', 3, false),

  -- Tokyo Loft (9)
  (12, 9, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787007/OIP_6_u5qwkm.jpg', 0, true),
  (13, 9, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787005/OIP_7_buiot3.jpg', 1, false),
  (14, 9, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779786744/OIP_ocjmr8.jpg', 2, false),
  (15, 9, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779786743/OIP_1_ao9qi2.jpg', 3, false),

  -- Malibu Beach (10)
  (16, 10, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787253/OIP_fhdrnu.jpg', 0, true),
  (17, 10, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787250/OIP_1_qwhnt6.jpg', 1, false),
  (18, 10, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787247/OIP_2_wauf3g.jpg', 2, false),
  (19, 10, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787245/OIP_3_tblyfo.jpg', 3, false),
  (20, 10, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787242/OIP_4_sxviwz.jpg', 4, false),

  -- Chamonix Cabin (11)
  (21, 11, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787553/OIP_5_qvfizj.jpg', 0, true),
  (22, 11, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787551/OIP_6_pffk38.jpg', 1, false),
  (23, 11, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787549/OIP_7_s30hhu.jpg', 2, false),
  (24, 11, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779787547/OIP_8_pjs2fx.jpg', 3, false),

  -- Maldives Bungalow (12)
  (25, 12, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789232/OIP_bigo5r.jpg', 0, true),
  (26, 12, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789229/OIP_1_kbeuw2.jpg', 1, false),
  (27, 12, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789227/OIP_2_yf4nly.jpg', 2, false),
  (28, 12, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789224/OIP_3_cvwjel.jpg', 3, false),

  -- Paris Apartment (13)
  (29, 13, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789425/OIP_rp95pb.jpg', 0, true),
  (30, 13, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789423/OIP_1_svh6ec.jpg', 1, false),
  (31, 13, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789419/OIP_2_uszuys.jpg', 2, false),
  (32, 13, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789506/OIP_4_jxfuxn.jpg', 3, false),

  -- Bali Retreat (14)
  (33, 14, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789671/OIP_8_god6or.jpg', 0, true),
  (34, 14, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789675/OIP_7_upi0s2.jpg', 1, false),
  (35, 14, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789680/OIP_6_shqzmm.jpg', 2, false),
  (36, 14, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789685/OIP_5_naukmj.jpg', 3, false),

  -- Scottish Estate (15)
  (37, 15, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789955/OIP_4_yww04w.jpg', 0, true),
  (38, 15, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789964/OIP_2_i59bv1.jpg', 1, false),
  (39, 15, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789959/OIP_3_afict6.jpg', 2, false),
  (40, 15, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779789974/OIP_vm6lbk.jpg', 3, false),

  -- Santorini Cave House (16)
  (41, 16, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790213/OIP_a5uzof.jpg', 0, true),
  (42, 16, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790208/OIP_1_ztduhs.jpg', 1, false),
  (43, 16, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790204/OIP_2_w3tbnl.jpg', 2, false),
  (44, 16, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790198/OIP_3_qbitbd.jpg', 3, false),

  -- New York SoHo Loft (17)
  (45, 17, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790554/OIP_vpk46n.jpg', 0, true),
  (46, 17, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790546/OIP_1_wsdhca.jpg', 1, false),
  (47, 17, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790541/OIP_2_cikgy4.jpg', 2, false),
  (48, 17, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790537/OIP_3_nvafwf.jpg', 3, false),
  (49, 17, 'https://res.cloudinary.com/duaou63qp/image/upload/v1779790533/OIP_4_y74cfo.jpg', 4, false),

  -- Moroccan Riad (18)
  (50, 18, 'https://a0.muscache.com/im/pictures/101092129/ecc31253_original.jpg?aki_policy=large', 0, true),

  -- Norwegian Fjord Cabin (19)
  (51, 19, 'https://a0.muscache.com/im/pictures/37652090/31aa73c7_original.jpg?aki_policy=large', 0, true),

  -- Goa Condo (20)
  (52, 20, 'https://a0.muscache.com/im/pictures/12064872/b9a3028c_original.jpg?aki_policy=large', 0, true),

  -- Goa Jungle Cabin (21)
  (53, 21, 'https://a0.muscache.com/im/pictures/74032130/331a98cd_original.jpg?aki_policy=large', 0, true),

  -- Mumbai Bandra (22)
  (54, 22, 'https://a0.muscache.com/im/pictures/47201864/cc882bd7_original.jpg?aki_policy=large', 0, true),

  -- Mumbai Villa (23)
  (55, 23, 'https://a0.muscache.com/im/pictures/27301062/770cf8b2_original.jpg?aki_policy=large', 0, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('property_images_id_seq', (SELECT MAX(id) FROM property_images));

-- ── Bookings ─────────────────────────────────
INSERT INTO bookings (id, guest_id, property_id, check_in, check_out, guests_count, total_price, status, created_at)
VALUES
  -- Booking 1-13 (existing)
  (1, 1, 1, '2026-04-10', '2026-04-15', 4, 1250.00, 'COMPLETED', NOW() - INTERVAL '25 days'),
  (2, 3, 2, '2026-04-20', '2026-04-23', 2, 240.00, 'COMPLETED', NOW() - INTERVAL '15 days'),
  (3, 1, 3, '2026-06-01', '2026-06-05', 3, 480.00, 'CONFIRMED', NOW() - INTERVAL '3 days'),
  (4, 3, 1, '2026-05-20', '2026-05-23', 2, 750.00, 'CANCELLED', NOW() - INTERVAL '10 days'),
  (5, 1, 2, '2026-07-10', '2026-07-12', 1, 160.00, 'CONFIRMED', NOW() - INTERVAL '1 day'),
  (6, 3, 3, '2026-08-01', '2026-08-06', 4, 600.00, 'CANCELLED', NOW() - INTERVAL '7 days'),
  (7, 1, 8, '2026-03-15', '2026-03-20', 2, 1750.00, 'COMPLETED', NOW() - INTERVAL '30 days'),
  (8, 3, 8, '2026-02-10', '2026-02-15', 4, 1750.00, 'COMPLETED', NOW() - INTERVAL '50 days'),
  (9, 1, 11, '2026-04-10', '2026-04-15', 4, 1100.00, 'COMPLETED', NOW() - INTERVAL '25 days'),
  (10, 3, 11, '2026-01-05', '2026-01-10', 2, 1100.00, 'COMPLETED', NOW() - INTERVAL '60 days'),
  (11, 1, 16, '2026-05-01', '2026-05-05', 2, 1660.00, 'CONFIRMED', NOW() - INTERVAL '10 days'),
  (12, 3, 16, '2026-06-10', '2026-06-14', 2, 1660.00, 'CONFIRMED', NOW() - INTERVAL '5 days'),
  (13, 3, 18, '2026-04-22', '2026-04-27', 3, 825.00, 'CONFIRMED', NOW() - INTERVAL '15 days'),

  -- Property 1 (Goa Villa) - 2 more completed stays
  (14, 3, 1, '2026-03-10', '2026-03-14', 2, 1000.00, 'COMPLETED', NOW() - INTERVAL '60 days'),
  (15, 1, 1, '2026-02-20', '2026-02-25', 4, 1250.00, 'COMPLETED', NOW() - INTERVAL '80 days'),

  -- Property 2 (Bengaluru Apartment) - 2 more completed stays
  (16, 1, 2, '2026-03-05', '2026-03-08', 2, 240.00, 'COMPLETED', NOW() - INTERVAL '65 days'),
  (17, 3, 2, '2026-02-15', '2026-02-18', 2, 240.00, 'COMPLETED', NOW() - INTERVAL '85 days'),

  -- Property 3 (Manali Cabin) - 3 completed stays
  (18, 1, 3, '2026-04-01', '2026-04-05', 2, 480.00, 'COMPLETED', NOW() - INTERVAL '40 days'),
  (19, 3, 3, '2026-03-15', '2026-03-20', 4, 600.00, 'COMPLETED', NOW() - INTERVAL '55 days'),
  (20, 1, 3, '2026-02-10', '2026-02-14', 2, 480.00, 'COMPLETED', NOW() - INTERVAL '90 days'),

  -- Property 4 (Goa Portuguese House) - 3 completed stays
  (21, 3, 4, '2026-04-10', '2026-04-14', 4, 720.00, 'COMPLETED', NOW() - INTERVAL '35 days'),
  (22, 1, 4, '2026-03-20', '2026-03-25', 3, 900.00, 'COMPLETED', NOW() - INTERVAL '50 days'),
  (23, 3, 4, '2026-01-15', '2026-01-20', 2, 900.00, 'COMPLETED', NOW() - INTERVAL '100 days'),

  -- Property 5 (Mumbai Apartment) - 3 completed stays
  (24, 1, 5, '2026-04-15', '2026-04-18', 2, 450.00, 'COMPLETED', NOW() - INTERVAL '30 days'),
  (25, 3, 5, '2026-03-12', '2026-03-16', 2, 600.00, 'COMPLETED', NOW() - INTERVAL '60 days'),
  (26, 1, 5, '2026-02-05', '2026-02-09', 2, 600.00, 'COMPLETED', NOW() - INTERVAL '95 days'),

  -- Property 6 (Delhi Haveli) - 3 completed stays
  (27, 3, 6, '2026-04-05', '2026-04-09', 6, 440.00, 'COMPLETED', NOW() - INTERVAL '42 days'),
  (28, 1, 6, '2026-03-01', '2026-03-05', 4, 440.00, 'COMPLETED', NOW() - INTERVAL '70 days'),
  (29, 3, 6, '2026-01-20', '2026-01-24', 5, 440.00, 'COMPLETED', NOW() - INTERVAL '110 days'),

  -- Property 7 (Bengaluru Loft) - 3 completed stays
  (30, 1, 7, '2026-04-20', '2026-04-23', 2, 270.00, 'COMPLETED', NOW() - INTERVAL '25 days'),
  (31, 3, 7, '2026-03-10', '2026-03-12', 1, 180.00, 'COMPLETED', NOW() - INTERVAL '62 days'),
  (32, 1, 7, '2026-02-05', '2026-02-09', 2, 360.00, 'COMPLETED', NOW() - INTERVAL '95 days'),

  -- Property 8 (Tuscany Villa) - 1 more completed stay
  (33, 1, 8, '2026-04-25', '2026-04-30', 4, 1750.00, 'COMPLETED', NOW() - INTERVAL '20 days'),

  -- Property 9 (Tokyo Loft) - 3 completed stays
  (34, 3, 9, '2026-04-12', '2026-04-16', 2, 720.00, 'COMPLETED', NOW() - INTERVAL '32 days'),
  (35, 1, 9, '2026-03-18', '2026-03-22', 2, 720.00, 'COMPLETED', NOW() - INTERVAL '58 days'),
  (36, 3, 9, '2026-02-10', '2026-02-14', 1, 720.00, 'COMPLETED', NOW() - INTERVAL '92 days'),

  -- Property 10 (Malibu Beach House) - 3 completed stays
  (37, 1, 10, '2026-04-18', '2026-04-22', 4, 1800.00, 'COMPLETED', NOW() - INTERVAL '28 days'),
  (38, 3, 10, '2026-03-05', '2026-03-10', 6, 2250.00, 'COMPLETED', NOW() - INTERVAL '68 days'),
  (39, 1, 10, '2026-01-20', '2026-01-25', 2, 2250.00, 'COMPLETED', NOW() - INTERVAL '110 days'),

  -- Property 11 (Cozy Alpine Cabin) - 1 more completed stay
  (40, 3, 11, '2026-03-01', '2026-03-06', 3, 1100.00, 'COMPLETED', NOW() - INTERVAL '70 days'),

  -- Property 12 (Maldives Bungalow) - 3 completed stays
  (41, 1, 12, '2026-03-25', '2026-03-28', 2, 2670.00, 'COMPLETED', NOW() - INTERVAL '48 days'),
  (42, 3, 12, '2026-02-14', '2026-02-19', 2, 4450.00, 'COMPLETED', NOW() - INTERVAL '88 days'),
  (43, 1, 12, '2026-01-05', '2026-01-10', 2, 4450.00, 'COMPLETED', NOW() - INTERVAL '120 days'),

  -- Property 13 (Paris Apartment) - 3 completed stays
  (44, 3, 13, '2026-04-05', '2026-04-09', 2, 1240.00, 'COMPLETED', NOW() - INTERVAL '40 days'),
  (45, 1, 13, '2026-03-10', '2026-03-15', 3, 1550.00, 'COMPLETED', NOW() - INTERVAL '64 days'),
  (46, 3, 13, '2026-01-20', '2026-01-24', 2, 1240.00, 'COMPLETED', NOW() - INTERVAL '110 days'),

  -- Property 14 (Bali Retreat) - 3 completed stays
  (47, 1, 14, '2026-04-15', '2026-04-20', 2, 975.00, 'COMPLETED', NOW() - INTERVAL '30 days'),
  (48, 3, 14, '2026-03-05', '2026-03-10', 4, 780.00, 'COMPLETED', NOW() - INTERVAL '68 days'),
  (49, 1, 14, '2026-01-10', '2026-01-14', 2, 780.00, 'COMPLETED', NOW() - INTERVAL '120 days'),

  -- Property 15 (Scottish Estate) - 3 completed stays
  (50, 3, 15, '2026-03-12', '2026-03-17', 8, 2400.00, 'COMPLETED', NOW() - INTERVAL '62 days'),
  (51, 1, 15, '2026-02-15', '2026-02-20', 5, 2400.00, 'COMPLETED', NOW() - INTERVAL '87 days'),
  (52, 3, 15, '2026-01-05', '2026-01-10', 6, 2400.00, 'COMPLETED', NOW() - INTERVAL '125 days'),

  -- Property 16 (Santorini Cave House) - 3 completed stays
  (53, 1, 16, '2026-04-02', '2026-04-06', 2, 1660.00, 'COMPLETED', NOW() - INTERVAL '45 days'),
  (54, 3, 16, '2026-03-10', '2026-03-14', 2, 1660.00, 'COMPLETED', NOW() - INTERVAL '64 days'),
  (55, 1, 16, '2026-01-15', '2026-01-18', 2, 1245.00, 'COMPLETED', NOW() - INTERVAL '115 days'),

  -- Property 17 (New York Loft) - 3 completed stays
  (56, 3, 17, '2026-04-10', '2026-04-14', 2, 1520.00, 'COMPLETED', NOW() - INTERVAL '35 days'),
  (57, 1, 17, '2026-03-01', '2026-03-05', 4, 1520.00, 'COMPLETED', NOW() - INTERVAL '72 days'),
  (58, 3, 17, '2026-01-10', '2026-01-14', 2, 1520.00, 'COMPLETED', NOW() - INTERVAL '120 days'),

  -- Property 18 (Moroccan Riad) - 3 completed stays
  (59, 1, 18, '2026-03-18', '2026-03-22', 4, 660.00, 'COMPLETED', NOW() - INTERVAL '56 days'),
  (60, 3, 18, '2026-02-10', '2026-02-15', 3, 825.00, 'COMPLETED', NOW() - INTERVAL '90 days'),
  (61, 1, 18, '2026-01-05', '2026-01-09', 2, 660.00, 'COMPLETED', NOW() - INTERVAL '125 days'),

  -- Property 19 (Norwegian Fjord Cabin) - 3 completed stays
  (62, 3, 19, '2026-04-05', '2026-04-10', 2, 1350.00, 'COMPLETED', NOW() - INTERVAL '40 days'),
  (63, 1, 19, '2026-03-01', '2026-03-05', 4, 1080.00, 'COMPLETED', NOW() - INTERVAL '73 days'),
  (64, 3, 19, '2026-01-12', '2026-01-16', 2, 1080.00, 'COMPLETED', NOW() - INTERVAL '118 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));

-- ── Payments ─────────────────────────────────
INSERT INTO payments (id, booking_id, amount, status, payment_method, transaction_id, paid_at)
VALUES
  -- Payments 1-13 (existing)
  (1,  1,  1250.00, 'PAID',     'CARD', 'TXN-GOA1A2B3', NOW() - INTERVAL '25 days'),
  (2,  2,   240.00, 'PAID',     'CARD', 'TXN-BLR4C5D6', NOW() - INTERVAL '15 days'),
  (3,  3,   480.00, 'PAID',     'CARD', 'TXN-MNL7E8F9', NOW() - INTERVAL '3 days'),
  (4,  4,   750.00, 'REFUNDED', 'CARD', 'TXN-GOA0G1H2', NOW() - INTERVAL '10 days'),
  (5,  5,   160.00, 'PAID',     'CARD', 'TXN-BLR3I4J5', NOW() - INTERVAL '1 day'),
  (6,  6,   600.00, 'REFUNDED', 'CARD', 'TXN-MNL6K7L8', NOW() - INTERVAL '7 days'),
  (7,  7,  1750.00, 'PAID',     'CARD', 'TXN-TUS1C5A8', NOW() - INTERVAL '30 days'),
  (8,  8,  1750.00, 'PAID',     'CARD', 'TXN-TUS2D6B9', NOW() - INTERVAL '50 days'),
  (9,  9,  1100.00, 'PAID',     'CARD', 'TXN-CHM8X9Y0', NOW() - INTERVAL '25 days'),
  (10, 10, 1100.00, 'PAID',     'CARD', 'TXN-CHM9Z0A1', NOW() - INTERVAL '60 days'),
  (11, 11, 1660.00, 'PAID',     'CARD', 'TXN-SAN3A4B5', NOW() - INTERVAL '10 days'),
  (12, 12, 1660.00, 'PAID',     'CARD', 'TXN-SAN4B5C6', NOW() - INTERVAL '5 days'),
  (13, 13,  825.00, 'PAID',     'CARD', 'TXN-MAR5K6L7', NOW() - INTERVAL '15 days'),

  -- Payments 14-64
  (14, 14, 1000.00, 'PAID', 'CARD', 'TXN-PAY14', NOW() - INTERVAL '60 days'),
  (15, 15, 1250.00, 'PAID', 'CARD', 'TXN-PAY15', NOW() - INTERVAL '80 days'),
  (16, 16,  240.00, 'PAID', 'CARD', 'TXN-PAY16', NOW() - INTERVAL '65 days'),
  (17, 17,  240.00, 'PAID', 'CARD', 'TXN-PAY17', NOW() - INTERVAL '85 days'),
  (18, 18,  480.00, 'PAID', 'CARD', 'TXN-PAY18', NOW() - INTERVAL '40 days'),
  (19, 19,  600.00, 'PAID', 'CARD', 'TXN-PAY19', NOW() - INTERVAL '55 days'),
  (20, 20,  480.00, 'PAID', 'CARD', 'TXN-PAY20', NOW() - INTERVAL '90 days'),
  (21, 21,  720.00, 'PAID', 'CARD', 'TXN-PAY21', NOW() - INTERVAL '35 days'),
  (22, 22,  900.00, 'PAID', 'CARD', 'TXN-PAY22', NOW() - INTERVAL '50 days'),
  (23, 23,  900.00, 'PAID', 'CARD', 'TXN-PAY23', NOW() - INTERVAL '100 days'),
  (24, 24,  450.00, 'PAID', 'CARD', 'TXN-PAY24', NOW() - INTERVAL '30 days'),
  (25, 25,  600.00, 'PAID', 'CARD', 'TXN-PAY25', NOW() - INTERVAL '60 days'),
  (26, 26,  600.00, 'PAID', 'CARD', 'TXN-PAY26', NOW() - INTERVAL '95 days'),
  (27, 27,  440.00, 'PAID', 'CARD', 'TXN-PAY27', NOW() - INTERVAL '42 days'),
  (28, 28,  440.00, 'PAID', 'CARD', 'TXN-PAY28', NOW() - INTERVAL '70 days'),
  (29, 29,  440.00, 'PAID', 'CARD', 'TXN-PAY29', NOW() - INTERVAL '110 days'),
  (30, 30,  270.00, 'PAID', 'CARD', 'TXN-PAY30', NOW() - INTERVAL '25 days'),
  (31, 31,  180.00, 'PAID', 'CARD', 'TXN-PAY31', NOW() - INTERVAL '62 days'),
  (32, 32,  360.00, 'PAID', 'CARD', 'TXN-PAY32', NOW() - INTERVAL '95 days'),
  (33, 33, 1750.00, 'PAID', 'CARD', 'TXN-PAY33', NOW() - INTERVAL '20 days'),
  (34, 34,  720.00, 'PAID', 'CARD', 'TXN-PAY34', NOW() - INTERVAL '32 days'),
  (35, 35,  720.00, 'PAID', 'CARD', 'TXN-PAY35', NOW() - INTERVAL '58 days'),
  (36, 36,  720.00, 'PAID', 'CARD', 'TXN-PAY36', NOW() - INTERVAL '92 days'),
  (37, 37, 1800.00, 'PAID', 'CARD', 'TXN-PAY37', NOW() - INTERVAL '28 days'),
  (38, 38, 2250.00, 'PAID', 'CARD', 'TXN-PAY38', NOW() - INTERVAL '68 days'),
  (39, 39, 2250.00, 'PAID', 'CARD', 'TXN-PAY39', NOW() - INTERVAL '110 days'),
  (40, 40, 1100.00, 'PAID', 'CARD', 'TXN-PAY40', NOW() - INTERVAL '70 days'),
  (41, 41, 2670.00, 'PAID', 'CARD', 'TXN-PAY41', NOW() - INTERVAL '48 days'),
  (42, 42, 4450.00, 'PAID', 'CARD', 'TXN-PAY42', NOW() - INTERVAL '88 days'),
  (43, 43, 4450.00, 'PAID', 'CARD', 'TXN-PAY43', NOW() - INTERVAL '120 days'),
  (44, 44, 1240.00, 'PAID', 'CARD', 'TXN-PAY44', NOW() - INTERVAL '40 days'),
  (45, 45, 1550.00, 'PAID', 'CARD', 'TXN-PAY45', NOW() - INTERVAL '64 days'),
  (46, 46, 1240.00, 'PAID', 'CARD', 'TXN-PAY46', NOW() - INTERVAL '110 days'),
  (47, 47,  975.00, 'PAID', 'CARD', 'TXN-PAY47', NOW() - INTERVAL '30 days'),
  (48, 48,  780.00, 'PAID', 'CARD', 'TXN-PAY48', NOW() - INTERVAL '68 days'),
  (49, 49,  780.00, 'PAID', 'CARD', 'TXN-PAY49', NOW() - INTERVAL '120 days'),
  (50, 50, 2400.00, 'PAID', 'CARD', 'TXN-PAY50', NOW() - INTERVAL '62 days'),
  (51, 51, 2400.00, 'PAID', 'CARD', 'TXN-PAY51', NOW() - INTERVAL '87 days'),
  (52, 52, 2400.00, 'PAID', 'CARD', 'TXN-PAY52', NOW() - INTERVAL '125 days'),
  (53, 53, 1660.00, 'PAID', 'CARD', 'TXN-PAY53', NOW() - INTERVAL '45 days'),
  (54, 54, 1660.00, 'PAID', 'CARD', 'TXN-PAY54', NOW() - INTERVAL '64 days'),
  (55, 55, 1245.00, 'PAID', 'CARD', 'TXN-PAY55', NOW() - INTERVAL '115 days'),
  (56, 56, 1520.00, 'PAID', 'CARD', 'TXN-PAY56', NOW() - INTERVAL '35 days'),
  (57, 57, 1520.00, 'PAID', 'CARD', 'TXN-PAY57', NOW() - INTERVAL '72 days'),
  (58, 58, 1520.00, 'PAID', 'CARD', 'TXN-PAY58', NOW() - INTERVAL '120 days'),
  (59, 59,  660.00, 'PAID', 'CARD', 'TXN-PAY59', NOW() - INTERVAL '56 days'),
  (60, 60,  825.00, 'PAID', 'CARD', 'TXN-PAY60', NOW() - INTERVAL '90 days'),
  (61, 61,  660.00, 'PAID', 'CARD', 'TXN-PAY61', NOW() - INTERVAL '125 days'),
  (62, 62, 1350.00, 'PAID', 'CARD', 'TXN-PAY62', NOW() - INTERVAL '40 days'),
  (63, 63, 1080.00, 'PAID', 'CARD', 'TXN-PAY63', NOW() - INTERVAL '73 days'),
  (64, 64, 1080.00, 'PAID', 'CARD', 'TXN-PAY64', NOW() - INTERVAL '118 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- ── Reviews (one per booking, for completed stays only) ──────────
INSERT INTO reviews (id, booking_id, property_id, reviewer_id, rating, comment, created_at)
VALUES
  -- Reviews 1-6 (existing)
  (1,  1, 1,  1, 5, 'Absolutely stunning villa! The pool was amazing and the beach was just steps away. Will definitely come back!', NOW() - INTERVAL '20 days'),
  (2,  2, 2,  3, 4, 'Great location in Indiranagar, very clean and modern. The workspace setup was perfect for getting some work done.', NOW() - INTERVAL '12 days'),
  (3,  7, 8,  1, 5, 'Absolutely magical stay. The villa exceeded all expectations — the views, the pool, the local wine. Marco was an exceptional host.', NOW() - INTERVAL '28 days'),
  (4,  8, 8,  3, 5, 'We celebrated our anniversary here and it was perfect. Every detail was thought of. Can''t wait to return.', NOW() - INTERVAL '45 days'),
  (5,  9, 11, 1, 5, 'The perfect ski cabin. Marco made everything so easy, from check-in to recommendations for the best runs on the mountain.', NOW() - INTERVAL '22 days'),
  (6, 10, 11, 3, 5, 'Cozy, warm, and beautifully decorated. The fireplace in the evenings was exactly what we needed after a day on the slopes.', NOW() - INTERVAL '55 days'),

  -- Property 1 (Goa Villa)
  (7, 14, 1, 3, 5, 'A paradise by the beach! Clean rooms, beautiful pool, and Candolim beach is literally in the backyard. Host was super responsive.', NOW() - INTERVAL '58 days'),
  (8, 15, 1, 1, 4, 'Wonderful architecture and beach access. Perfect for our family gathering. Highly recommended for a relaxed Goa trip.', NOW() - INTERVAL '78 days'),

  -- Property 2 (Bengaluru Apartment)
  (9, 16, 2, 1, 4, 'Nice quiet apartment despite being in the center of Indiranagar. Extremely clean and comfortable beds. Safe neighborhood.', NOW() - INTERVAL '62 days'),
  (10, 17, 2, 3, 5, 'Perfect base for business travel. High-speed internet worked flawlessly, lots of cafes and restaurants around the corner.', NOW() - INTERVAL '82 days'),

  -- Property 3 (Manali Cabin)
  (11, 18, 3, 1, 5, 'Beautiful quiet escape in the mountains. We loved the fireplace and the mountain views were absolutely outstanding!', NOW() - INTERVAL '38 days'),
  (12, 19, 3, 3, 4, 'Lovely rustic cabin with hot tub. Secluded location in the woods, ideal for hiking. Clean and well maintained.', NOW() - INTERVAL '52 days'),
  (13, 20, 3, 1, 5, 'Incredible winter wonderland experience. Warm, cozy, and right in the middle of beautiful pine forests.', NOW() - INTERVAL '88 days'),

  -- Property 4 (Goa Portuguese House)
  (14, 21, 4, 3, 4, 'A very charming house with a beautiful garden. Extremely close to the beach, perfect for a family trip. Highly recommended.', NOW() - INTERVAL '32 days'),
  (15, 22, 4, 1, 5, 'Amazing traditional heritage feel! The high wooden ceilings and colonial design are stunning. Extremely well kept.', NOW() - INTERVAL '48 days'),
  (16, 23, 4, 3, 5, 'Steps from Sinquerim beach. Great location, helpful staff, and wonderful garden deck for morning coffee.', NOW() - INTERVAL '98 days'),

  -- Property 5 (Mumbai Apartment)
  (17, 24, 5, 1, 5, 'Outstanding location on Marine Drive. Clean, modern, and excellent city and sea views. Highly recommended!', NOW() - INTERVAL '28 days'),
  (18, 25, 5, 3, 4, 'Modern high rise with excellent security. Flat was tidy, check-in was fast, close to great restaurants in South Mumbai.', NOW() - INTERVAL '58 days'),
  (19, 26, 5, 1, 5, 'Superb host and property. Breathtaking sunset views from the living room. Cozy bedroom and workspace.', NOW() - INTERVAL '92 days'),

  -- Property 6 (Delhi Haveli)
  (20, 27, 6, 3, 4, 'Staying in this restored Haveli was a unique experience. Vibrant neighborhood and beautiful rooftop terrace.', NOW() - INTERVAL '40 days'),
  (21, 28, 6, 1, 5, 'A hidden gem in Chandni Chowk. Absolutely gorgeous architecture and peaceful central courtyard. Highlight of our trip.', NOW() - INTERVAL '68 days'),
  (22, 29, 6, 3, 4, 'Beautiful heritage feel, spacious rooms, and delicious local food recommendations from the host.', NOW() - INTERVAL '108 days'),

  -- Property 7 (Bengaluru Loft)
  (23, 30, 7, 1, 5, 'Very convenient suite on MG Road. Close to everything, clean, fast internet. Perfect for business trips.', NOW() - INTERVAL '22 days'),
  (24, 31, 7, 3, 4, 'Sleek executive style loft. Very quiet inside despite being on MG Road. Close to metro.', NOW() - INTERVAL '60 days'),
  (25, 32, 7, 1, 5, 'Exceptional experience. Clean, modern amenities, comfortable bed, and very helpful host.', NOW() - INTERVAL '92 days'),

  -- Property 8 (Tuscany Villa)
  (26, 33, 8, 1, 5, 'Wonderful stay! Breathtaking view of vineyards, relaxing pool, and authentic Italian countryside vibes.', NOW() - INTERVAL '18 days'),

  -- Property 9 (Tokyo Loft)
  (27, 34, 9, 3, 5, 'A perfect Shibuya loft. Clean, minimalist, and very close to the station. Loved the design!', NOW() - INTERVAL '30 days'),
  (28, 35, 9, 1, 4, 'Compact but extremely functional and clean. Fits the Shibuya vibe perfectly. Lots of convenience stores nearby.', NOW() - INTERVAL '55 days'),
  (29, 36, 9, 3, 5, 'Super host! Guided us with directions and recommendations. The loft design is top notch.', NOW() - INTERVAL '90 days'),

  -- Property 10 (Malibu Beach House)
  (30, 37, 10, 1, 5, 'Incredible beach access and stunning ocean views. Truly a dream Malibu getaway!', NOW() - INTERVAL '25 days'),
  (31, 38, 10, 3, 5, 'Perfect place for a family getaway. Direct access to sandy beach, spacious deck, and fully stocked kitchen.', NOW() - INTERVAL '65 days'),
  (32, 39, 10, 1, 5, 'A absolute dream home. Sunsets from the deck are worth every penny. Very clean and upscale.', NOW() - INTERVAL '105 days'),

  -- Property 11 (Cozy Alpine Cabin)
  (33, 40, 11, 3, 5, 'Fabulous alpine stay in Chamonix. Hot tub with mountain views was the perfect way to wind down after skiing.', NOW() - INTERVAL '68 days'),

  -- Property 12 (Maldives Bungalow)
  (34, 41, 12, 1, 5, 'Paradise on Earth. Snorkeling right off the deck, crystal clear lagoon, pure luxury.', NOW() - INTERVAL '45 days'),
  (35, 42, 12, 3, 5, 'Breathtaking overwater bungalow. The glass floor was amazing for watching fish. Five star experience.', NOW() - INTERVAL '85 days'),
  (36, 43, 12, 1, 5, 'Most romantic place we have ever visited. Unbelievable private pool, direct ocean access, stellar service.', NOW() - INTERVAL '118 days'),

  -- Property 13 (Paris Apartment)
  (37, 44, 13, 3, 4, 'Classic Parisian apartment in a great neighborhood. Beautiful city views and comfortable beds.', NOW() - INTERVAL '38 days'),
  (38, 45, 13, 1, 5, 'Walking distance to the Eiffel Tower! Beautiful Haussmann architecture, vintage furniture, clean bathroom.', NOW() - INTERVAL '60 days'),
  (39, 46, 13, 3, 4, 'Very central location close to restaurants, metro, and shops. Quiet tree-lined boulevard. Loved it.', NOW() - INTERVAL '105 days'),

  -- Property 14 (Bali Retreat)
  (40, 47, 14, 1, 5, 'Absolute peace and serenity in the jungle. The private pool and rice terrace views were breathtaking.', NOW() - INTERVAL '28 days'),
  (41, 48, 14, 3, 5, 'Stunning Ubud villa. Open-air living room was amazing. Very close to local markets but quiet.', NOW() - INTERVAL '65 days'),
  (42, 49, 14, 1, 4, 'Magical stay in the middle of nature. Beautiful pool, daily yoga, and very relaxing sounds of the jungle.', NOW() - INTERVAL '115 days'),

  -- Property 15 (Scottish Estate)
  (43, 50, 15, 3, 5, 'Incredible stone house in the Highlands. Warm fires, beautiful loch views, very atmospheric.', NOW() - INTERVAL '60 days'),
  (44, 51, 15, 1, 5, 'Grand historic estate with beautiful grounds. Great hiking trails right outside. Superb host.', NOW() - INTERVAL '85 days'),
  (45, 52, 15, 3, 5, 'Magnificent! Felt like staying in a castle. Spacious bedrooms, large fireplace, beautiful Highland scenery.', NOW() - INTERVAL '120 days'),

  -- Property 16 (Santorini Cave House)
  (46, 53, 16, 1, 5, 'Amazing caldera view from the terrace! Watching the sunset here was unforgettable.', NOW() - INTERVAL '42 days'),
  (47, 54, 16, 3, 5, 'Spectacular cyclic style cave house. Oia sunset view from the hot tub was a lifetime experience.', NOW() - INTERVAL '60 days'),
  (48, 55, 16, 1, 5, 'Perfect location in Oia. Carved into the cliffs with stunning sea views. Very friendly host.', NOW() - INTERVAL '110 days'),

  -- Property 17 (New York Loft)
  (49, 56, 17, 3, 4, 'Very cool artist loft in the heart of SoHo. High ceilings, great art, close to amazing shops.', NOW() - INTERVAL '32 days'),
  (50, 57, 17, 1, 5, 'Extremely spacious for NYC! Exposed brick walls, vintage factory windows, comfortable beds, cool neighborhood.', NOW() - INTERVAL '68 days'),
  (51, 58, 17, 3, 4, 'Perfect Soho base. Close to great restaurants, art galleries, and subway lines. Very stylish.', NOW() - INTERVAL '115 days'),

  -- Property 18 (Moroccan Riad)
  (52, 59, 18, 1, 5, 'A magical courtyard oasis inside the busy Medina. Outstanding host and delicious breakfasts!', NOW() - INTERVAL '52 days'),
  (53, 60, 18, 3, 5, 'Stunning traditional tilework and central pool. Panoramic view of Atlas mountains from rooftop terrace.', NOW() - INTERVAL '86 days'),
  (54, 61, 18, 1, 5, 'Exceeded all expectations. Friendly staff, peaceful atmosphere, close to main markets. Will return!', NOW() - INTERVAL '120 days'),

  -- Property 19 (Norwegian Fjord Cabin)
  (55, 62, 19, 3, 5, 'Spectacular views of the fjord. Remote, peaceful, and the private sauna was amazing.', NOW() - INTERVAL '36 days'),
  (56, 63, 19, 1, 5, 'Stunning timber cabin with fjord panorama view. Kayaking in the morning was incredible. Pure nature.', NOW() - INTERVAL '68 days'),
  (57, 64, 19, 3, 5, 'Ultimate serenity. Cozy interior, great fireplace, sauna, and total silence. Highly recommended!', NOW() - INTERVAL '112 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- ── Feature 4: Property Add-ons seed data ──────────────────
INSERT INTO property_addons (id, property_id, name, description, price, is_active) VALUES
  (1, 1, 'Airport Pickup', 'Private airport transfer from Goa International Airport', 50.00, true),
  (2, 1, 'Daily Breakfast', 'Traditional Goan breakfast served daily', 15.00, true),
  (3, 1, 'Late Checkout', 'Checkout up to 4 PM on departure day', 30.00, true),
  (4, 2, 'Airport Pickup', 'Pickup from Kempegowda International Airport', 25.00, true),
  (5, 2, 'Daily Breakfast', 'Continental breakfast delivered to your door', 10.00, true),
  (6, 3, 'Airport Pickup', 'Pickup from Bhuntar Airport to Manali', 40.00, true),
  (7, 3, 'Guided Trek', 'Full-day guided mountain trek with lunch', 35.00, true),
  (8, 3, 'Hot Tub Prep', 'Pre-heated outdoor hot tub ready on arrival', 20.00, true),
  (9, 5, 'Airport Pickup', 'Airport transfer from Jaipur International Airport', 35.00, true),
  (10, 5, 'Guided Tour', 'Full-day guided city tour of Jaipur', 45.00, true),
  (11, 6, 'Daily Breakfast', 'Traditional Udupi breakfast', 8.00, true),
  (12, 10, 'Breakfast', 'Farm-to-table breakfast with local produce', 12.00, true),
  (13, 10, 'Cooking Class', 'Learn traditional Rajasthani cooking', 30.00, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('property_addons_id_seq', (SELECT MAX(id) FROM property_addons));

-- ── Guest requirements for existing properties (Feature 5) ──
UPDATE properties SET guest_requirements = 'Government ID required, No smoking, No parties/events' WHERE id IN (1, 4, 6, 14, 18, 20, 21);
UPDATE properties SET guest_requirements = 'Government ID required, Minimum age 21, Security deposit required' WHERE id IN (3, 11, 15, 17, 19, 23);
UPDATE properties SET guest_requirements = 'Government ID required, Minimum age 18, No parties/events' WHERE id IN (2, 5, 7, 8, 9, 10, 12, 13, 16, 22);

-- ── Check-in instructions for existing properties (Feature 1) ──
UPDATE properties SET check_in_instructions = E'WiFi: BeachVilla_5G / Password: goa2025\nDoor code: #2580\nParking: Driveway fits 2 cars\nCheck-in: Keys in lockbox at front gate. Code sent via SMS.\nEmergency: Contact host at +91-98765-43210' WHERE id = 1;
UPDATE properties SET check_in_instructions = E'WiFi: IndiraNet / Password: bengaluru123\nDoor code: 7711\nCheck-in: Building has 24/7 security. Use intercom at gate.\nParking: Visitor parking in basement level B2.' WHERE id = 2;
UPDATE properties SET check_in_instructions = E'WiFi: ManaliCabin / Password: himalayas!\nDoor code: Enter through main door (unlocked during day, key under mat at night)\nHeating: Thermostat in living room. Fireplace has wood stacked on deck.\nNote: Roads can be slippery in winter \u2014 4WD recommended.' WHERE id = 3;
UPDATE properties SET check_in_instructions = E'WiFi: HeritageHouse / Password: portugal2025\nDoor code: Key at front desk (host lives next door)\nParking: Street parking available\nCheck-in: 2 PM onwards. Late check-in must be arranged.' WHERE id = 5;
UPDATE properties SET check_in_instructions = E'WiFi: GoaCondo_5G / Password: bagabeach\nDoor code: 2020\nCheck-in: Intercom 202 at gate. Keys in mailbox.' WHERE id = 20;
UPDATE properties SET check_in_instructions = E'WiFi: JungleCabin / Password: naturelovers\nCheck-in: Host will meet you at the Netravali sanctuary gate.' WHERE id = 21;
UPDATE properties SET check_in_instructions = E'WiFi: BandraCondo / Password: bandra95\nDoor code: 1905\nCheck-in: Elevators require keycard. Concierge has keycard.' WHERE id = 22;
UPDATE properties SET check_in_instructions = E'WiFi: JuhuVilla / Password: oceanview23\nDoor code: 1910\nCheck-in: Main gate is locked. Guard will open with your ID.' WHERE id = 23;
