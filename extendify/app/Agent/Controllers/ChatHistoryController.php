<?php

/**
 * Store info about messages/events from chat
 */

namespace Extendify\Agent\Controllers;

defined('ABSPATH') || die('No direct access.');

use Extendify\Shared\Services\Sanitizer;

/**
 * The controller
 */

class ChatHistoryController
{
    /**
     * Initialize the controller and set up the database table.
     *
     * @return \WP_REST_Response
     */
    public static function init()
    {
        self::setupChatHistoryTable();
    }

    /**
     * Get the last 150 messages
     *
     * @return array
     */
    public static function getChatHistory($user_id = null)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_events';
        $user_id = $user_id ?: get_current_user_id();

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table WHERE user_id = %d ORDER BY id DESC LIMIT 150",
                $user_id
            ),
            ARRAY_A
        );
        return array_map(function ($item) {
            return [
                'id'        => $item['event_id'],
                'type'      => $item['type'],
                'details'   => json_decode($item['details'], true),
            ];
        }, $results);
    }


    /**
     * Return the data
     *
     * @return \WP_REST_Response
     */
    public static function get()
    {
        $messages = self::getChatHistory();
        $state = ['state' => ['messages' => Sanitizer::sanitizeArray($messages)]];
        return new \WP_REST_Response($state);
    }

    /**
     * Persist the data
     *
     * @param \WP_REST_Request $request - The request.
     * @return \WP_REST_Response
     */
    public static function store($request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_events';
        $user_id = get_current_user_id();

        $state = $request->get_param('state');
        $parsed = is_string($state) ? json_decode($state, true) : $state;
        $messages = $parsed['state']['messages'] ?? [];

        // Find the latest event and only add new messages since then.
        $latest = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT event_id FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT 1",
                $user_id
            )
        );
        $startIndex = 0;
        if ($latest) {
            foreach ($messages as $i => $msg) {
                if ($msg['id'] === $latest) {
                    $startIndex = $i + 1;
                    break;
                }
            }
        }

        $toInsert = array_slice($messages, $startIndex);
        foreach ($toInsert as $msg) {
            self::upsertEvent($msg, $user_id);
        }

        return self::get();
    }

    /**
     * Upsert an event into the database.
     *
     * @param array $msg The message data.
     * @param int $user_id The user ID.
     * @return void
     */
    private static function upsertEvent($msg, $user_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_events';
        $created_at = current_time('mysql');
        $event_id = Sanitizer::sanitizeText($msg['id']);
        $type = Sanitizer::sanitizeText($msg['type']);
        $details = wp_json_encode(Sanitizer::sanitizeArray($msg['details']));

        $sql = $wpdb->prepare(
            "INSERT INTO $table (created_at, event_id, type, details, user_id)
            VALUES (%s, %s, %s, %s, %d)
            ON DUPLICATE KEY UPDATE
                created_at = VALUES(created_at),
                type = VALUES(type),
                details = VALUES(details)",
            $created_at,
            $event_id,
            $type,
            $details,
            $user_id
        );
        $wpdb->query($sql);
    }

    /**
     * Ensures the custom table exists and is up to date for MySQL.
     * Creates the table if missing, adds missing columns, and ensures an index on user_id.
     *
     * @return void
     */
    private static function setupChatHistoryTable()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_events';
        $columns = [
            'id'         => "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY",
            'created_at' => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            'event_id'  => "VARCHAR(64) NOT NULL",
            'type'       => "VARCHAR(64) NOT NULL",
            'details'    => "LONGTEXT",
            'user_id'    => "BIGINT UNSIGNED NOT NULL"
        ];

        // Check if the table exists and create it if not
        $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
        if (!$exists) {
            $cols = [];
            foreach ($columns as $name => $type) {
                $cols[] = "$name $type";
            }
            $sql = "CREATE TABLE $table (" . implode(',', $cols) . ", INDEX(user_id))";
            $sql .= " " . $wpdb->get_charset_collate() . ";";
            $wpdb->query($sql);
            return;
        }

        // Check existing columns and add missing ones
        $existingCols = array_column($wpdb->get_results("SHOW COLUMNS FROM $table", ARRAY_A), 'Field');
        foreach ($columns as $name => $type) {
            if (!in_array($name, $existingCols, true)) {
                $wpdb->query("ALTER TABLE $table ADD COLUMN $name $type");
            }
        }

        // Unique index on (event_id, user_id)
        $uniqueIndex = $wpdb->get_results("SHOW INDEX FROM $table WHERE Key_name = 'unique_event_id'", ARRAY_A);
        if (empty($uniqueIndex)) {
            $wpdb->query("CREATE UNIQUE INDEX unique_event_id ON $table(event_id, user_id)");
        }

        // Regular index on user_id
        $userIndex = $wpdb->get_results("SHOW INDEX FROM $table WHERE Key_name = 'user_id'", ARRAY_A);
        if (empty($userIndex)) {
            $wpdb->query("CREATE INDEX user_id ON $table(user_id)");
        }
    }
}
