import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const analysisLogs = sqliteTable('analysis_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  originalUrl: text('original_url').notNull(),
  finalUrl: text('final_url').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  network: text('network').notNull(), // 'instagram' or 'x'
  maxSeverity: text('max_severity').notNull(), // 'Low', 'Medium', 'High'
  findings: text('findings', { mode: 'json' }).notNull(), // JSON string of vulnerability findings
  title: text('title'),
  thumbnail: text('thumbnail'),
  sizeApprox: integer('size_approx'),
});