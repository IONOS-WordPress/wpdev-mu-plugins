<?php

/**
 * Data Controller
 */

namespace Extendify\Shared\Controllers;

use Extendify\Shared\Services\HttpClient;
use Extendify\PartnerData;

defined('ABSPATH') || die('No direct access.');

/**
 * The controller for handling general data
 */

class DataController
{
    /**
     * Get Partner Plugins information.
     *
     * @return \WP_REST_Response
     */
    public static function getPartnerPlugins()
    {
        $response = HttpClient::get(
            'https://dashboard.extendify.com/api/onboarding/partner-plugins',
            ['params' => ['partner' => PartnerData::$id]]
        );

        return new \WP_REST_Response($response['response'], $response['code']);
    }

    /**
     * Just here to check for 200 (vs server rate limting)
     *
     * @return \WP_REST_Response
     */
    public static function ping()
    {
        return new \WP_REST_Response(true, 200);
    }
}
