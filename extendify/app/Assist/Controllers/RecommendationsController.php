<?php

/**
 * Controls Recommendations
 */

namespace Extendify\Assist\Controllers;

defined('ABSPATH') || die('No direct access.');

/**
 * The controller for fetching recommendations
 */

class RecommendationsController
{
    /**
     * The url for the server.
     *
     * @var string
     */
    public static $host = 'https://dashboard.extendify.com';

    /**
     * Return recommendations from source.
     *
     * @return \WP_REST_Response
     */
    public static function fetchRecommendations()
    {
        if (!defined('EXTENDIFY_PARTNER_ID')) {
            return new \WP_REST_Response([], 200);
        }

        $partnerData = \get_option('extendify_partner_data_v2', []);
        if (($partnerData['disableRecommendations'] ?? false)) {
            return new \WP_REST_Response([], 200);
        }

        $params = http_build_query([
            'wp_language' => get_locale(),
            'sdk_partner' => defined('EXTENDIFY_PARTNER_ID') ? EXTENDIFY_PARTNER_ID : '',
        ]);
        $response = \wp_remote_get(
            sprintf('%s/api/assist/recommendations?%s', static::$host, $params),
            [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
            ]
        );

        if (\is_wp_error($response)) {
            return new \WP_REST_Response([], 500);
        }

        $body = json_decode(\wp_remote_retrieve_body($response), true);
        if (!isset($body['success']) || !isset($body['data'])) {
            return new \WP_REST_Response([], 500);
        }

        return new \WP_REST_Response($body['data'], \wp_remote_retrieve_response_code($response));
    }
}
