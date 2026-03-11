CREATE TABLE `campaign_share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `campaign_share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaign_share_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `competitor_ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(128) NOT NULL,
	`primaryText` text NOT NULL,
	`headline` varchar(256) NOT NULL,
	`description` varchar(256),
	`ctaButton` varchar(64),
	`sourceUrl` varchar(512),
	`scoreClarity` float,
	`scoreValueProp` float,
	`scoreCta` float,
	`scoreBrandVoice` float,
	`scoreEmotionalResonance` float,
	`weightedScore` float,
	`hook` text,
	`emotionalTrigger` varchar(256),
	`weaknesses` text,
	`strengths` text,
	`analysisNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competitor_ads_id` PRIMARY KEY(`id`)
);
