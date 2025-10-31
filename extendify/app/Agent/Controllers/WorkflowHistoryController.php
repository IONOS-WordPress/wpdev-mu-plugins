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

class WorkflowHistoryController
{
    /**
     * Initialize the controller and set up the database table.
     *
     * @return \WP_REST_Response
     */
    public static function init()
    {
        self::setupWorkflowsTable();
    }

    /**
     * Get the last 5 workflows
     *
     * @return array
     */
    public static function getWorkflowHistory($user_id = null)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_workflows';
        $user_id = $user_id ?: get_current_user_id();

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table WHERE user_id = %d AND status = %s ORDER BY created_at DESC LIMIT 5",
                $user_id,
                'completed'
            ),
            ARRAY_A
        );
        return array_map(function ($item) {
            return [
                'workflowId' => $item['workflow_id'],
                'answerId'   => $item['answer_id'],
                'summary'    => $item['summary'],
                'status'     => $item['status'],
                'errorMsg'   => $item['error_msg'],
                'agentName'  => $item['agent_name'],
                'createdAt'  => $item['created_at'],
            ];
        }, $results);
    }

    /**
     * Persist the data
     *
     * @param \WP_REST_Request $request - The request.
     * @return \WP_REST_Response
     */
    public static function add($request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_workflows';
        $user_id = get_current_user_id();

        $wpdb->insert($table, [
            'workflow_id' => Sanitizer::sanitizeText($request->get_param('workflowId')),
            'answer_id'   => Sanitizer::sanitizeText($request->get_param('answerId')),
            'summary'     => Sanitizer::sanitizeTextarea($request->get_param('summary')),
            'status'      => Sanitizer::sanitizeText($request->get_param('status')),
            'error_msg'   => Sanitizer::sanitizeText($request->get_param('errorMsg')),
            'agent_name'  => Sanitizer::sanitizeText($request->get_param('agentName')),
            'user_id'     => $user_id,
            'created_at'  => current_time('mysql'),
        ]);

        return new \WP_REST_Response(null, 204);
    }


    /**
     * Ensures the custom table exists and is up to date for MySQL.
     * Creates the table if missing, adds missing columns, and ensures an index on user_id.
     *
     * @return void
     */
    private static function setupWorkflowsTable()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'extendify_agent_workflows';
        $columns = [
            'id'          => "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY",
            'workflow_id' => "VARCHAR(64) NOT NULL",
            'answer_id'   => "VARCHAR(64) NOT NULL",
            'summary'     => "TEXT",
            'error_msg'   => "TEXT",
            'agent_name'  => "VARCHAR(64) NOT NULL",
            'status'      => "VARCHAR(20) NOT NULL",
            'user_id'     => "BIGINT UNSIGNED NOT NULL",
            'created_at'  => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
        ];

        $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
        if (!$exists) {
            $cols = [];
            foreach ($columns as $name => $type) {
                $cols[] = "$name $type";
            }
            $sql = "CREATE TABLE $table (" . implode(',', $cols) . ", INDEX(user_id)) ";
            $sql .= $wpdb->get_charset_collate() . ";";
            $wpdb->query($sql);
            return;
        }

        $existingCols = array_column($wpdb->get_results("SHOW COLUMNS FROM $table", ARRAY_A), 'Field');
        foreach ($columns as $name => $type) {
            if (!in_array($name, $existingCols, true)) {
                $wpdb->query("ALTER TABLE $table ADD COLUMN $name $type");
            }
        }

        // Indexes
        $userIndex = $wpdb->get_results("SHOW INDEX FROM $table WHERE Key_name = 'user_id'", ARRAY_A);
        if (empty($userIndex)) {
            $wpdb->query("CREATE INDEX user_id ON $table(user_id)");
        }
    }
}
