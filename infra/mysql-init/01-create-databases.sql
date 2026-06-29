-- =============================================================================
-- Database-per-service bootstrap
-- -----------------------------------------------------------------------------
-- Runs once, on first MySQL initialisation (empty data dir). Creates the three
-- per-service schemas and grants the application user access to each. After this
-- the services own their own schema and there are no cross-service FKs.
--
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `identity_db`
	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `employees_db`
	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `attendances_db`
	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The application user is created by the image from MYSQL_USER/MYSQL_PASSWORD
-- with rights only on MYSQL_DATABASE; extend it to the per-service schemas.
GRANT ALL PRIVILEGES ON `identity_db`.* TO 'dexa'@'%';
GRANT ALL PRIVILEGES ON `employees_db`.* TO 'dexa'@'%';
GRANT ALL PRIVILEGES ON `attendances_db`.* TO 'dexa'@'%';
FLUSH PRIVILEGES;