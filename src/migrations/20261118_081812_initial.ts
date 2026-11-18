import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_article\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`variant\` text,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_article_order_idx\` ON \`pages_blocks_article\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_article_parent_id_idx\` ON \`pages_blocks_article\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_article_path_idx\` ON \`pages_blocks_article\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_text_wide\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`variant\` text,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_text_wide_order_idx\` ON \`pages_blocks_text_wide\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_text_wide_parent_id_idx\` ON \`pages_blocks_text_wide\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_text_wide_path_idx\` ON \`pages_blocks_text_wide\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_download_download_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_download\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_download_links_order_idx\` ON \`pages_blocks_download_download_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_download_links_parent_id_idx\` ON \`pages_blocks_download_download_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_download\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`network\` text DEFAULT 'mainnet',
  	\`title\` text,
  	\`big_image_id\` integer,
  	\`small_image_id\` integer,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`big_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`small_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_order_idx\` ON \`pages_blocks_download\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_parent_id_idx\` ON \`pages_blocks_download\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_path_idx\` ON \`pages_blocks_download\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_big_image_idx\` ON \`pages_blocks_download\` (\`big_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_download_small_image_idx\` ON \`pages_blocks_download\` (\`small_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_information\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_information_order_idx\` ON \`pages_blocks_hero_information\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_information_parent_id_idx\` ON \`pages_blocks_hero_information\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_comparisons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`description\` text,
  	\`active\` integer DEFAULT false,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_comparisons_order_idx\` ON \`pages_blocks_hero_comparisons\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_comparisons_parent_id_idx\` ON \`pages_blocks_hero_comparisons\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_comparisons_image_idx\` ON \`pages_blocks_hero_comparisons\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`main_quote_text\` text,
  	\`main_quote_author\` text,
  	\`main_quote_source\` text,
  	\`main_quote_avatar_id\` integer,
  	\`main_quote_small_avatar_id\` integer,
  	\`side_quote_text\` text,
  	\`side_quote_author\` text,
  	\`side_quote_source\` text,
  	\`side_quote_avatar_id\` integer,
  	\`side_quote_small_avatar_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`main_quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`main_quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`side_quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`side_quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_main_quote_main_quote_avatar_idx\` ON \`pages_blocks_hero\` (\`main_quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_main_quote_main_quote_small_avatar_idx\` ON \`pages_blocks_hero\` (\`main_quote_small_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_side_quote_side_quote_avatar_idx\` ON \`pages_blocks_hero\` (\`side_quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_side_quote_side_quote_small_avatar_idx\` ON \`pages_blocks_hero\` (\`side_quote_small_avatar_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_technology_scenes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`scene\` text,
  	\`title\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_technology\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_scenes_order_idx\` ON \`pages_blocks_technology_scenes\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_scenes_parent_id_idx\` ON \`pages_blocks_technology_scenes\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_technology\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`quote_text\` text,
  	\`quote_author\` text,
  	\`quote_source\` text,
  	\`quote_avatar_id\` integer,
  	\`quote_small_avatar_id\` integer,
  	\`body\` text,
  	\`fallback_image_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`fallback_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_order_idx\` ON \`pages_blocks_technology\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_parent_id_idx\` ON \`pages_blocks_technology\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_path_idx\` ON \`pages_blocks_technology\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_quote_quote_avatar_idx\` ON \`pages_blocks_technology\` (\`quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_quote_quote_small_avatar_idx\` ON \`pages_blocks_technology\` (\`quote_small_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_technology_fallback_image_idx\` ON \`pages_blocks_technology\` (\`fallback_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_independent\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`description\` text,
  	\`quote_text\` text,
  	\`quote_author\` text,
  	\`quote_source\` text,
  	\`quote_avatar_id\` integer,
  	\`quote_small_avatar_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_independent_order_idx\` ON \`pages_blocks_independent\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_independent_parent_id_idx\` ON \`pages_blocks_independent\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_independent_path_idx\` ON \`pages_blocks_independent\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_independent_quote_quote_avatar_idx\` ON \`pages_blocks_independent\` (\`quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_independent_quote_quote_small_avatar_idx\` ON \`pages_blocks_independent\` (\`quote_small_avatar_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_big_changes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`text\` text,
  	\`quote_text\` text,
  	\`quote_author\` text,
  	\`quote_source\` text,
  	\`quote_avatar_id\` integer,
  	\`quote_small_avatar_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_big_changes_order_idx\` ON \`pages_blocks_big_changes\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_big_changes_parent_id_idx\` ON \`pages_blocks_big_changes\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_big_changes_path_idx\` ON \`pages_blocks_big_changes\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_big_changes_quote_quote_avatar_idx\` ON \`pages_blocks_big_changes\` (\`quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_big_changes_quote_quote_small_avatar_idx\` ON \`pages_blocks_big_changes\` (\`quote_small_avatar_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_timeline\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_order_idx\` ON \`pages_blocks_timeline\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_parent_id_idx\` ON \`pages_blocks_timeline\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_path_idx\` ON \`pages_blocks_timeline\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_team\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`body\` text,
  	\`visible_count\` numeric DEFAULT 4,
  	\`show_all_label\` text DEFAULT 'Show all',
  	\`show_less_label\` text DEFAULT 'Show less',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_team_order_idx\` ON \`pages_blocks_team\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_team_parent_id_idx\` ON \`pages_blocks_team\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_team_path_idx\` ON \`pages_blocks_team\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_blocks_exchanges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`intro\` text DEFAULT 'You can buy or sell GBYTE (the native currency of Obyte) on the following cryptocurrency exchanges:',
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_exchanges_order_idx\` ON \`pages_blocks_exchanges\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_exchanges_parent_id_idx\` ON \`pages_blocks_exchanges\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_exchanges_path_idx\` ON \`pages_blocks_exchanges\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages_breadcrumbs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`doc_id\` integer,
  	\`url\` text,
  	\`label\` text,
  	FOREIGN KEY (\`doc_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pages_breadcrumbs_order_idx\` ON \`pages_breadcrumbs\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_breadcrumbs_parent_id_idx\` ON \`pages_breadcrumbs\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_breadcrumbs_doc_idx\` ON \`pages_breadcrumbs\` (\`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`path\` text,
  	\`menu_title\` text,
  	\`sitemap_priority\` numeric DEFAULT 0.8,
  	\`parent_id\` integer,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_path_idx\` ON \`pages\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_parent_idx\` ON \`pages\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_meta_meta_image_idx\` ON \`pages\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_article\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`variant\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_article_order_idx\` ON \`_pages_v_blocks_article\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_article_parent_id_idx\` ON \`_pages_v_blocks_article\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_article_path_idx\` ON \`_pages_v_blocks_article\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_text_wide\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`variant\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_text_wide_order_idx\` ON \`_pages_v_blocks_text_wide\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_text_wide_parent_id_idx\` ON \`_pages_v_blocks_text_wide\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_text_wide_path_idx\` ON \`_pages_v_blocks_text_wide\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_download_download_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_download\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_download_links_order_idx\` ON \`_pages_v_blocks_download_download_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_download_links_parent_id_idx\` ON \`_pages_v_blocks_download_download_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_download\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`network\` text DEFAULT 'mainnet',
  	\`title\` text,
  	\`big_image_id\` integer,
  	\`small_image_id\` integer,
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`big_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`small_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_order_idx\` ON \`_pages_v_blocks_download\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_parent_id_idx\` ON \`_pages_v_blocks_download\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_path_idx\` ON \`_pages_v_blocks_download\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_big_image_idx\` ON \`_pages_v_blocks_download\` (\`big_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_download_small_image_idx\` ON \`_pages_v_blocks_download\` (\`small_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_information\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_information_order_idx\` ON \`_pages_v_blocks_hero_information\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_information_parent_id_idx\` ON \`_pages_v_blocks_hero_information\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_comparisons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`description\` text,
  	\`active\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_comparisons_order_idx\` ON \`_pages_v_blocks_hero_comparisons\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_comparisons_parent_id_idx\` ON \`_pages_v_blocks_hero_comparisons\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_comparisons_image_idx\` ON \`_pages_v_blocks_hero_comparisons\` (\`image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`main_quote_text\` text,
  	\`main_quote_author\` text,
  	\`main_quote_source\` text,
  	\`main_quote_avatar_id\` integer,
  	\`main_quote_small_avatar_id\` integer,
  	\`side_quote_text\` text,
  	\`side_quote_author\` text,
  	\`side_quote_source\` text,
  	\`side_quote_avatar_id\` integer,
  	\`side_quote_small_avatar_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`main_quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`main_quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`side_quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`side_quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_main_quote_main_quote_avatar_idx\` ON \`_pages_v_blocks_hero\` (\`main_quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_main_quote_main_quote_small_avatar_idx\` ON \`_pages_v_blocks_hero\` (\`main_quote_small_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_side_quote_side_quote_avatar_idx\` ON \`_pages_v_blocks_hero\` (\`side_quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_side_quote_side_quote_small_avatar_idx\` ON \`_pages_v_blocks_hero\` (\`side_quote_small_avatar_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_technology_scenes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`scene\` text,
  	\`title\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_technology\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_scenes_order_idx\` ON \`_pages_v_blocks_technology_scenes\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_scenes_parent_id_idx\` ON \`_pages_v_blocks_technology_scenes\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_technology\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`quote_text\` text,
  	\`quote_author\` text,
  	\`quote_source\` text,
  	\`quote_avatar_id\` integer,
  	\`quote_small_avatar_id\` integer,
  	\`body\` text,
  	\`fallback_image_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`fallback_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_order_idx\` ON \`_pages_v_blocks_technology\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_parent_id_idx\` ON \`_pages_v_blocks_technology\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_path_idx\` ON \`_pages_v_blocks_technology\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_quote_quote_avatar_idx\` ON \`_pages_v_blocks_technology\` (\`quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_quote_quote_small_avatar_idx\` ON \`_pages_v_blocks_technology\` (\`quote_small_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_technology_fallback_image_idx\` ON \`_pages_v_blocks_technology\` (\`fallback_image_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_independent\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`description\` text,
  	\`quote_text\` text,
  	\`quote_author\` text,
  	\`quote_source\` text,
  	\`quote_avatar_id\` integer,
  	\`quote_small_avatar_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_independent_order_idx\` ON \`_pages_v_blocks_independent\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_independent_parent_id_idx\` ON \`_pages_v_blocks_independent\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_independent_path_idx\` ON \`_pages_v_blocks_independent\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_independent_quote_quote_avatar_idx\` ON \`_pages_v_blocks_independent\` (\`quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_independent_quote_quote_small_avatar_idx\` ON \`_pages_v_blocks_independent\` (\`quote_small_avatar_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_big_changes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`text\` text,
  	\`quote_text\` text,
  	\`quote_author\` text,
  	\`quote_source\` text,
  	\`quote_avatar_id\` integer,
  	\`quote_small_avatar_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`quote_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_small_avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_big_changes_order_idx\` ON \`_pages_v_blocks_big_changes\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_big_changes_parent_id_idx\` ON \`_pages_v_blocks_big_changes\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_big_changes_path_idx\` ON \`_pages_v_blocks_big_changes\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_big_changes_quote_quote_avatar_idx\` ON \`_pages_v_blocks_big_changes\` (\`quote_avatar_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_big_changes_quote_quote_small_avatar_idx\` ON \`_pages_v_blocks_big_changes\` (\`quote_small_avatar_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_timeline\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_order_idx\` ON \`_pages_v_blocks_timeline\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_parent_id_idx\` ON \`_pages_v_blocks_timeline\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_path_idx\` ON \`_pages_v_blocks_timeline\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_team\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`body\` text,
  	\`visible_count\` numeric DEFAULT 4,
  	\`show_all_label\` text DEFAULT 'Show all',
  	\`show_less_label\` text DEFAULT 'Show less',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_team_order_idx\` ON \`_pages_v_blocks_team\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_team_parent_id_idx\` ON \`_pages_v_blocks_team\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_team_path_idx\` ON \`_pages_v_blocks_team\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_exchanges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_id\` text,
  	\`title\` text,
  	\`intro\` text DEFAULT 'You can buy or sell GBYTE (the native currency of Obyte) on the following cryptocurrency exchanges:',
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_exchanges_order_idx\` ON \`_pages_v_blocks_exchanges\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_exchanges_parent_id_idx\` ON \`_pages_v_blocks_exchanges\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_exchanges_path_idx\` ON \`_pages_v_blocks_exchanges\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v_version_breadcrumbs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`doc_id\` integer,
  	\`url\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`doc_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_breadcrumbs_order_idx\` ON \`_pages_v_version_breadcrumbs\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_breadcrumbs_parent_id_idx\` ON \`_pages_v_version_breadcrumbs\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_breadcrumbs_doc_idx\` ON \`_pages_v_version_breadcrumbs\` (\`doc_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_path\` text,
  	\`version_menu_title\` text,
  	\`version_sitemap_priority\` numeric DEFAULT 0.8,
  	\`version_parent_id\` integer,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_path_idx\` ON \`_pages_v\` (\`version_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_parent_idx\` ON \`_pages_v\` (\`version_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_meta_version_meta_image_idx\` ON \`_pages_v\` (\`version_meta_image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`events_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`events_images_order_idx\` ON \`events_images\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`events_images_parent_id_idx\` ON \`events_images\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`events_images_image_idx\` ON \`events_images\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`date\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`content\` text,
  	\`video_provider\` text,
  	\`video_video_id\` text,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`events_date_idx\` ON \`events\` (\`date\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`faq\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`faq__order_idx\` ON \`faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`faq_updated_at_idx\` ON \`faq\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`faq_created_at_idx\` ON \`faq\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`timeline_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`date\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`timeline_events_date_idx\` ON \`timeline_events\` (\`date\`);`)
  await db.run(
    sql`CREATE INDEX \`timeline_events_updated_at_idx\` ON \`timeline_events\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`timeline_events_created_at_idx\` ON \`timeline_events\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`team_members_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT 'link' NOT NULL,
  	\`custom_icon_id\` integer,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`custom_icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`team_members\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`team_members_links_order_idx\` ON \`team_members_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`team_members_links_parent_id_idx\` ON \`team_members_links\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`team_members_links_custom_icon_idx\` ON \`team_members_links\` (\`custom_icon_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`team_members\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`photo_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`role\` text NOT NULL,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`team_members__order_idx\` ON \`team_members\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`team_members_photo_idx\` ON \`team_members\` (\`photo_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`team_members_name_idx\` ON \`team_members\` (\`name\`);`)
  await db.run(
    sql`CREATE INDEX \`team_members_updated_at_idx\` ON \`team_members\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`team_members_created_at_idx\` ON \`team_members\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`exchanges\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`name\` text NOT NULL,
  	\`link\` text NOT NULL,
  	\`logo_id\` integer NOT NULL,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`exchanges__order_idx\` ON \`exchanges\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`exchanges_name_idx\` ON \`exchanges\` (\`name\`);`)
  await db.run(sql`CREATE INDEX \`exchanges_logo_idx\` ON \`exchanges\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`exchanges_updated_at_idx\` ON \`exchanges\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`exchanges_created_at_idx\` ON \`exchanges\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`coin_trackers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`name\` text NOT NULL,
  	\`link\` text NOT NULL,
  	\`logo_id\` integer NOT NULL,
  	\`logo_hover_id\` integer NOT NULL,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_hover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`coin_trackers__order_idx\` ON \`coin_trackers\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`coin_trackers_name_idx\` ON \`coin_trackers\` (\`name\`);`)
  await db.run(sql`CREATE INDEX \`coin_trackers_logo_idx\` ON \`coin_trackers\` (\`logo_id\`);`)
  await db.run(
    sql`CREATE INDEX \`coin_trackers_logo_hover_idx\` ON \`coin_trackers\` (\`logo_hover_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`coin_trackers_updated_at_idx\` ON \`coin_trackers\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`coin_trackers_created_at_idx\` ON \`coin_trackers\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`social_links\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`name\` text NOT NULL,
  	\`link\` text NOT NULL,
  	\`icon_id\` integer NOT NULL,
  	\`icon_hover_id\` integer NOT NULL,
  	\`show_on_site\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`icon_hover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`social_links__order_idx\` ON \`social_links\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`social_links_name_idx\` ON \`social_links\` (\`name\`);`)
  await db.run(sql`CREATE INDEX \`social_links_icon_idx\` ON \`social_links\` (\`icon_id\`);`)
  await db.run(
    sql`CREATE INDEX \`social_links_icon_hover_idx\` ON \`social_links\` (\`icon_hover_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`social_links_updated_at_idx\` ON \`social_links\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`social_links_created_at_idx\` ON \`social_links\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`source_hash\` text,
  	\`source_path\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_webp_url\` text,
  	\`sizes_webp_width\` numeric,
  	\`sizes_webp_height\` numeric,
  	\`sizes_webp_mime_type\` text,
  	\`sizes_webp_filesize\` numeric,
  	\`sizes_webp_filename\` text,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_source_hash_idx\` ON \`media\` (\`source_hash\`);`)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(
    sql`CREATE INDEX \`media_sizes_webp_sizes_webp_filename_idx\` ON \`media\` (\`sizes_webp_filename\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`,
  )
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`roles\` text DEFAULT 'editor' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`events_id\` integer,
  	\`faq_id\` integer,
  	\`timeline_events_id\` integer,
  	\`team_members_id\` integer,
  	\`exchanges_id\` integer,
  	\`coin_trackers_id\` integer,
  	\`social_links_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_id\`) REFERENCES \`faq\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`timeline_events_id\`) REFERENCES \`timeline_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`team_members_id\`) REFERENCES \`team_members\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`exchanges_id\`) REFERENCES \`exchanges\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`coin_trackers_id\`) REFERENCES \`coin_trackers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`social_links_id\`) REFERENCES \`social_links\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_timeline_events_id_idx\` ON \`payload_locked_documents_rels\` (\`timeline_events_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_team_members_id_idx\` ON \`payload_locked_documents_rels\` (\`team_members_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_exchanges_id_idx\` ON \`payload_locked_documents_rels\` (\`exchanges_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_coin_trackers_id_idx\` ON \`payload_locked_documents_rels\` (\`coin_trackers_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_social_links_id_idx\` ON \`payload_locked_documents_rels\` (\`social_links_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`header_nav_items_children\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`link\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_nav_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`header_nav_items_children_order_idx\` ON \`header_nav_items_children\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`header_nav_items_children_parent_id_idx\` ON \`header_nav_items_children\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`header_nav_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`link\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`header_nav_items_order_idx\` ON \`header_nav_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`header_nav_items_parent_id_idx\` ON \`header_nav_items\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`header_mobile_extra_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`link\` text NOT NULL,
  	\`new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`header_mobile_extra_links_order_idx\` ON \`header_mobile_extra_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`header_mobile_extra_links_parent_id_idx\` ON \`header_mobile_extra_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`header\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`cta_label\` text DEFAULT 'Download wallet' NOT NULL,
  	\`cta_link\` text DEFAULT '/#download' NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`footer_columns_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`link\` text NOT NULL,
  	\`new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_columns\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`footer_columns_links_order_idx\` ON \`footer_columns_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`footer_columns_links_parent_id_idx\` ON \`footer_columns_links\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`footer_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_columns_order_idx\` ON \`footer_columns\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`footer_columns_parent_id_idx\` ON \`footer_columns\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`footer\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`newsletter_enabled\` integer DEFAULT true,
  	\`newsletter_action\` text DEFAULT 'https://static.mailerlite.com/webforms/submit/t1t7v1',
  	\`newsletter_placeholder\` text DEFAULT 'Email for Obyte newsletter',
  	\`newsletter_button_label\` text DEFAULT 'Subscribe',
  	\`newsletter_success_title\` text DEFAULT 'Thank you!',
  	\`newsletter_success_text\` text,
  	\`copyright\` text DEFAULT '© 2016-{year} Obyte.',
  	\`mobile_copyright\` text DEFAULT '© {year} Obyte.',
  	\`copyright_link_label\` text DEFAULT 'Proudly blocked in China',
  	\`copyright_link_url\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`releases_mainnet_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`releases\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`releases_mainnet_files_order_idx\` ON \`releases_mainnet_files\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`releases_mainnet_files_parent_id_idx\` ON \`releases_mainnet_files\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`releases_testnet_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`releases\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`releases_testnet_files_order_idx\` ON \`releases_testnet_files\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`releases_testnet_files_parent_id_idx\` ON \`releases_testnet_files\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`releases_aliases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`filename\` text NOT NULL,
  	\`network\` text NOT NULL,
  	\`platform\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`releases\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`releases_aliases_order_idx\` ON \`releases_aliases\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`releases_aliases_parent_id_idx\` ON \`releases_aliases\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`releases\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`mainnet_version\` text,
  	\`testnet_version\` text,
  	\`apps_app_store_badge_id\` integer,
  	\`apps_google_play_badge_id\` integer,
  	\`apps_mainnet_app_store\` text,
  	\`apps_mainnet_google_play\` text,
  	\`apps_testnet_app_store\` text,
  	\`apps_testnet_google_play\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`apps_app_store_badge_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`apps_google_play_badge_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`releases_apps_apps_app_store_badge_idx\` ON \`releases\` (\`apps_app_store_badge_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`releases_apps_apps_google_play_badge_idx\` ON \`releases\` (\`apps_google_play_badge_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_title\` text DEFAULT 'Obyte — a fully decentralized, DAG based crypto.' NOT NULL,
  	\`default_description\` text NOT NULL,
  	\`default_og_image_id\` integer,
  	\`twitter_site\` text DEFAULT '@ObyteOrg',
  	\`llms_intro\` text,
  	\`contact_email\` text DEFAULT 'o@obyte.org' NOT NULL,
  	\`jobs_email\` text DEFAULT 'jobs@obyte.org' NOT NULL,
  	\`github_url\` text DEFAULT 'https://github.com/byteball',
  	\`explorer_url\` text DEFAULT 'https://explorer.obyte.org',
  	\`testnet_explorer_url\` text DEFAULT 'https://testnetexplorer.obyte.org',
  	\`discord_url\` text DEFAULT 'https://discord.obyte.org',
  	\`telegram_url\` text DEFAULT 'https://t.me/obyteorg',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`default_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`site_settings_default_og_image_idx\` ON \`site_settings\` (\`default_og_image_id\`);`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_article\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_text_wide\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_download_download_links\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_download\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_information\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_comparisons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_technology_scenes\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_technology\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_independent\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_big_changes\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_timeline\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_team\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_exchanges\`;`)
  await db.run(sql`DROP TABLE \`pages_breadcrumbs\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_article\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_text_wide\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_download_download_links\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_download\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_information\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_comparisons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_technology_scenes\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_technology\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_independent\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_big_changes\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_timeline\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_team\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_exchanges\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_version_breadcrumbs\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`events_images\`;`)
  await db.run(sql`DROP TABLE \`events\`;`)
  await db.run(sql`DROP TABLE \`faq\`;`)
  await db.run(sql`DROP TABLE \`timeline_events\`;`)
  await db.run(sql`DROP TABLE \`team_members_links\`;`)
  await db.run(sql`DROP TABLE \`team_members\`;`)
  await db.run(sql`DROP TABLE \`exchanges\`;`)
  await db.run(sql`DROP TABLE \`coin_trackers\`;`)
  await db.run(sql`DROP TABLE \`social_links\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`header_nav_items_children\`;`)
  await db.run(sql`DROP TABLE \`header_nav_items\`;`)
  await db.run(sql`DROP TABLE \`header_mobile_extra_links\`;`)
  await db.run(sql`DROP TABLE \`header\`;`)
  await db.run(sql`DROP TABLE \`footer_columns_links\`;`)
  await db.run(sql`DROP TABLE \`footer_columns\`;`)
  await db.run(sql`DROP TABLE \`footer\`;`)
  await db.run(sql`DROP TABLE \`releases_mainnet_files\`;`)
  await db.run(sql`DROP TABLE \`releases_testnet_files\`;`)
  await db.run(sql`DROP TABLE \`releases_aliases\`;`)
  await db.run(sql`DROP TABLE \`releases\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
}
