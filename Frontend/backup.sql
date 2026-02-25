-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: complaint_system
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_complaints`
--

DROP TABLE IF EXISTS `academic_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  `course` varchar(100) DEFAULT NULL,
  `complaint_type` varchar(100) NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT '0',
  `user_id` int DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT 'Pending',
  `response` text,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_complaints`
--

LOCK TABLES `academic_complaints` WRITE;
/*!40000 ALTER TABLE `academic_complaints` DISABLE KEYS */;
INSERT INTO `academic_complaints` VALUES (1,'The grading seems unfair for the last Math exam.','Mathematics','Grading Issue',0,1,'2025-05-02 06:47:03','pending',NULL,'2025-05-16 06:40:50',NULL),(2,'The course material for Data Structures is outdated.','Computer Science','Course Material',1,NULL,'2025-05-16 06:40:50','pending',NULL,'2025-05-16 06:40:50',NULL),(3,'Faculty not completing syllabus in time.','Engineering','Faculty Conduct',0,2,'2025-05-16 06:40:50','pending',NULL,'2025-05-16 06:40:50',NULL);
/*!40000 ALTER TABLE `academic_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administration_complaints`
--

DROP TABLE IF EXISTS `administration_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administration_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` text NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT '0',
  `user_id` int DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `resolved_by` varchar(100) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `response` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administration_complaints`
--

LOCK TABLES `administration_complaints` WRITE;
/*!40000 ALTER TABLE `administration_complaints` DISABLE KEYS */;
INSERT INTO `administration_complaints` VALUES (1,'The admin office does not respond to queries on time.',0,3,'Resolved','Admin','2025-05-16 06:41:16','2025-05-16 07:42:49','will check'),(2,'Lack of communication about fee deadlines.',1,NULL,'Resolved','Admin','2025-05-16 06:41:16','2025-05-16 06:49:12','The email about the fees structure has already been sent by SDSC please kindly go through'),(3,'ID card renewal process is very slow.',0,1,'pending',NULL,'2025-05-16 06:41:16','2025-05-16 06:41:16',NULL),(4,'check',0,4,'resolved','Principal','2025-05-16 07:40:31','2025-05-16 07:41:38','checked'),(5,'The green shade from the admin block to the canten',0,4,'Resolved','Admin','2025-05-16 07:44:28','2025-05-18 18:48:06','hi');
/*!40000 ALTER TABLE `administration_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `description` text,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Administration'),(2,'Academics'),(3,'Hostel'),(4,'Transportation'),(5,'Sanitation');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `food_complaints`
--

DROP TABLE IF EXISTS `food_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` text NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT '0',
  `user_id` int DEFAULT NULL,
  `campus` varchar(100) DEFAULT NULL,
  `issueType` varchar(100) DEFAULT NULL,
  `response` text,
  `status` varchar(50) DEFAULT 'Pending',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `food_complaints_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `food_complaints`
--

LOCK TABLES `food_complaints` WRITE;
/*!40000 ALTER TABLE `food_complaints` DISABLE KEYS */;
INSERT INTO `food_complaints` VALUES (1,'Lunch quality has dropped significantly.',0,3,NULL,NULL,'The chef has been informed the food will be good starting from tomorrow','Resolved','2025-05-16 06:42:16',NULL),(2,'Canteen served stale food yesterday.',1,NULL,NULL,NULL,NULL,'pending','2025-05-16 06:42:16',NULL),(3,'Food is too oily and lacks nutrition.',0,2,NULL,NULL,NULL,'pending','2025-05-16 06:42:16',NULL);
/*!40000 ALTER TABLE `food_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_complaints`
--

DROP TABLE IF EXISTS `hostel_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `block` varchar(10) NOT NULL,
  `roomNumber` varchar(10) NOT NULL,
  `text` text NOT NULL,
  `isAnonymous` tinyint(1) DEFAULT '0',
  `submittedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `response` text,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_hostel_user` (`user_id`),
  CONSTRAINT `fk_hostel_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_complaints`
--

LOCK TABLES `hostel_complaints` WRITE;
/*!40000 ALTER TABLE `hostel_complaints` DISABLE KEYS */;
INSERT INTO `hostel_complaints` VALUES (1,'A Block','212','Water supply is irregular on the 2nd floor.',0,'2025-05-16 06:42:38',NULL,'pending',NULL,NULL),(2,'B Block','212','No security guard at the gate during night.',0,'2025-05-16 06:43:10',NULL,'pending',NULL,NULL);
/*!40000 ALTER TABLE `hostel_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sanitation_complaints`
--

DROP TABLE IF EXISTS `sanitation_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sanitation_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` text NOT NULL,
  `isAnonymous` tinyint(1) DEFAULT '0',
  `location` varchar(255) NOT NULL,
  `issueType` varchar(255) NOT NULL,
  `urgency` enum('low','medium','high') DEFAULT 'medium',
  `status` varchar(50) DEFAULT 'pending',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolvedBy` varchar(255) DEFAULT NULL,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sanitation_complaints`
--

LOCK TABLES `sanitation_complaints` WRITE;
/*!40000 ALTER TABLE `sanitation_complaints` DISABLE KEYS */;
INSERT INTO `sanitation_complaints` VALUES (1,'Restrooms in Block A are not cleaned regularly.',0,'Classroom Block','Restroom Maintenance','medium','pending','2025-05-16 06:45:10',NULL,NULL),(2,'Trash is not collected from canteen area.',0,'Cafeteria','Waste Accumulation','low','resolved','2025-05-16 06:45:28','Already taken care off ',NULL),(3,'The classrooms are dirty and smell bad',0,'Main Building','Odor Issues','high','pending','2025-05-16 06:45:53',NULL,NULL);
/*!40000 ALTER TABLE `sanitation_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport_complaints`
--

DROP TABLE IF EXISTS `transport_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleNumber` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `text` text,
  `response` text,
  `isAnonymous` tinyint(1) DEFAULT '0',
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport_complaints`
--

LOCK TABLES `transport_complaints` WRITE;
/*!40000 ALTER TABLE `transport_complaints` DISABLE KEYS */;
INSERT INTO `transport_complaints` VALUES (1,'KA01AB3322','Driver Behavior','Driver was speeding dangerously.',NULL,1,'pending','2025-05-02 06:48:08',NULL,NULL),(2,'KA01BV6567','Bus Schedule','Bus arrived 30 minutes late today.',NULL,0,'pending','2025-05-16 06:44:10',NULL,NULL),(3,'KA01MN4569','Vehicle Condition','No AC in the morning college bus.','AC was affected due to rain will be in affect from the evening',0,'resolved','2025-05-16 06:44:42',NULL,NULL);
/*!40000 ALTER TABLE `transport_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('student','admin','principal') DEFAULT 'student',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Test Student','student@example.com','$2b$10$kLKEderxaR5d8gW0pzzywOwUrYTR71GnJ3n9yKXtSm.dWGkUMZULi','student'),(2,'Test User','complaintmanagementsystemnie@gmail.com','$2b$10$8dikA1/QMEh1DzUwpRGZVOpKdLMIIhgDHvQLADMdOiPGSWH52OmK2','student'),(3,NULL,'2023ci_tanisharora_b@gmail.com','1234','student'),(4,NULL,'2023ci_tanisharora_b@nie.ac.in','$2b$10$pndZctD8REgqXohfTxNZb.8QIg44sVbmhTIztyrPESCrI20MX.nFO','student'),(5,'Admin User','admin@nie.ac.in','$2b$10$pt6mgJUImKybIyALc8KKzOsXq5qNc5qBP1CLbCfs.zadPE9YxfYEK','admin'),(6,'Principal','principal.talkback@gmail.com','$2b$10$oosY4LpoF4thJE1WduDRO.Ks1ONK7ytBIWRT2e6hZz5mDegq6ryUe','principal');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-19 10:34:17
