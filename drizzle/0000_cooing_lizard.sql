CREATE TABLE `analysis_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_url` text NOT NULL,
	`final_url` text NOT NULL,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`network` text NOT NULL,
	`max_severity` text NOT NULL,
	`findings` text NOT NULL,
	`title` text,
	`thumbnail` text,
	`size_approx` integer
);
