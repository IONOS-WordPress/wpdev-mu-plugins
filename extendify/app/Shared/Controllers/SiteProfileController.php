<?php

/**
 * Controls Site Profile options
 */

namespace Extendify\Shared\Controllers;

defined('ABSPATH') || die('No direct access.');

use Extendify\Shared\Services\Sanitizer;

/**
 * The controller for persisting site data
 */

class SiteProfileController
{
    /**
     * Persist single data
     *
     * @param \WP_REST_Request $request - The request.
     * @return \WP_REST_Response
     */
    public static function store($request)
    {
        $value = $request->get_param('value');
        \update_option('extendify_site_profile', Sanitizer::sanitizeUnknown($value));
        return new \WP_REST_Response($value);
    }

    /**
     * Get option data by name.
     *
     * @return \WP_REST_Response
     */
    public static function get()
    {
        $data = \get_option('extendify_site_profile', []);
        return new \WP_REST_Response($data);
    }
}
