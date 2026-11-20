-- Ratings move from 0.5–5 (half stars) to 1–10 (whole points).
UPDATE `beers` SET `rating` = `rating` * 2 WHERE `rating` IS NOT NULL;
