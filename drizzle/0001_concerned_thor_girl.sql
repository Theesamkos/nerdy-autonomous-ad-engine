CREATE TABLE `ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`primaryText` text NOT NULL,
	`headline` varchar(255) NOT NULL,
	`description` text,
	`ctaButton` varchar(64) NOT NULL,
	`imagePrompt` text,
	`imageUrl` text,
	`generationMode` enum('standard','creative_spark','adversarial','self_healing') NOT NULL DEFAULT 'standard',
	`iterationNumber` int NOT NULL DEFAULT 1,
	`parentAdId` int,
	`promptTokens` int NOT NULL DEFAULT 0,
	`completionTokens` int NOT NULL DEFAULT 0,
	`estimatedCostUsd` float NOT NULL DEFAULT 0,
	`qualityScore` float,
	`isPublishable` boolean NOT NULL DEFAULT false,
	`status` enum('generating','evaluating','approved','rejected','archived') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adversarial_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`competitorAdText` text NOT NULL,
	`competitorSource` varchar(255),
	`bestOurAdId` int,
	`roundsCompleted` int NOT NULL DEFAULT 0,
	`winStatus` enum('pending','winning','losing','tied') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adversarial_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`audienceSegment` text NOT NULL,
	`product` text NOT NULL,
	`campaignGoal` enum('awareness','conversion','retargeting') NOT NULL,
	`tone` enum('empowering','urgent','friendly','professional','playful') NOT NULL,
	`brandVoiceNotes` text,
	`weightClarity` int NOT NULL DEFAULT 20,
	`weightValueProp` int NOT NULL DEFAULT 25,
	`weightCta` int NOT NULL DEFAULT 20,
	`weightBrandVoice` int NOT NULL DEFAULT 15,
	`weightEmotionalResonance` int NOT NULL DEFAULT 20,
	`currentQualityThreshold` float NOT NULL DEFAULT 7,
	`totalAdsGenerated` int NOT NULL DEFAULT 0,
	`totalTokensUsed` int NOT NULL DEFAULT 0,
	`totalCostUsd` float NOT NULL DEFAULT 0,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creative_spark_ideas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`concept` text NOT NULL,
	`hook` text NOT NULL,
	`angle` varchar(128),
	`wildFactor` int NOT NULL DEFAULT 5,
	`isSaved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creative_spark_ideas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adId` int NOT NULL,
	`campaignId` int NOT NULL,
	`scoreClarity` float NOT NULL,
	`scoreValueProp` float NOT NULL,
	`scoreCta` float NOT NULL,
	`scoreBrandVoice` float NOT NULL,
	`scoreEmotionalResonance` float NOT NULL,
	`weightedScore` float NOT NULL,
	`rationaleClarity` text,
	`rationaleValueProp` text,
	`rationaleCta` text,
	`rationaleBrandVoice` text,
	`rationaleEmotionalResonance` text,
	`weakestDimension` varchar(64),
	`improvementSuggestion` text,
	`emotionalArcData` json,
	`promptTokens` int NOT NULL DEFAULT 0,
	`completionTokens` int NOT NULL DEFAULT 0,
	`estimatedCostUsd` float NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `iteration_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`adId` int NOT NULL,
	`parentAdId` int,
	`iterationNumber` int NOT NULL,
	`triggerReason` text,
	`targetDimension` varchar(64),
	`scoreBefore` float,
	`scoreAfter` float,
	`improvement` float,
	`strategyUsed` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iteration_logs_id` PRIMARY KEY(`id`)
);
