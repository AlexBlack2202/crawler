-- phpMyAdmin SQL Dump
-- version 4.2.12deb2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Dec 14, 2015 at 05:35 PM
-- Server version: 5.6.25-0ubuntu0.15.04.1
-- PHP Version: 5.6.4-4ubuntu6.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `test`
--

-- --------------------------------------------------------

--
-- Table structure for table `quotev_chapter`
--

CREATE TABLE IF NOT EXISTS `quotev_chapter` (
`id` int(11) NOT NULL,
  `story_id` int(11) NOT NULL,
  `story_name` varchar(500) NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `chapter_name` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `status` tinyint(4) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `quotev_story`
--

CREATE TABLE IF NOT EXISTS `quotev_story` (
`id` int(11) NOT NULL,
  `story_name` varchar(500) NOT NULL,
  `link` varchar(500) NOT NULL,
  `description` text,
  `status` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `quotev_chapter`
--
ALTER TABLE `quotev_chapter`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quotev_story`
--
ALTER TABLE `quotev_story`
 ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `quotev_chapter`
--
ALTER TABLE `quotev_chapter`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=21;
--
-- AUTO_INCREMENT for table `quotev_story`
--
ALTER TABLE `quotev_story`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=21;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
