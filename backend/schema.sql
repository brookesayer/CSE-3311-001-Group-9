-- Drop in FK-safe order
DROP TABLE IF EXISTS trip_places;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(512) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cities (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  state VARCHAR(255),
  slug VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE places (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  city VARCHAR(255),
  description TEXT,
  address TEXT,
  lat DOUBLE,
  lon DOUBLE,
  rating DOUBLE,
  category_id INT,
  city_id INT,
  price_level INT,
  image_url TEXT,
  photo_url TEXT,
  maps_url TEXT,
  UNIQUE KEY uniq_place (name(255), address(255)),
  KEY idx_places_category_id (category_id),
  KEY idx_places_city_id (city_id),
  CONSTRAINT fk_places_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_places_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trips (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility ENUM('private','unlisted','public') NOT NULL DEFAULT 'private',
  share_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_trips_user_id (user_id),
  KEY idx_trips_share_token (share_token),
  CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trip_places (
  trip_id VARCHAR(64) NOT NULL,
  place_id INT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (trip_id, place_id),
  KEY idx_trip_places_place_id (place_id),
  CONSTRAINT fk_trip_places_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_places_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
