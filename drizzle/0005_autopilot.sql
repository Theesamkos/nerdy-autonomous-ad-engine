ALTER TABLE `campaigns` ADD `autopilotEnabled` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `autopilotFrequencyHours` int NOT NULL DEFAULT 24;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `autopilotLastRunAt` timestamp;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `autopilotTotalRuns` int NOT NULL DEFAULT 0;
