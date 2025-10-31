<?php

/**
 * Image Controller
 */

namespace Extendify\Draft\Controllers;

defined('ABSPATH') || die('No direct access.');

// Try to execute set the limit to something that will work for 60s duration.
// phpcs:ignore WordPress.PHP.NoSilencedErrors, Generic.PHP.NoSilencedErrors.Discouraged
if (strpos(@ini_get('disable_functions'), 'set_time_limit') === false) {
    // phpcs:ignore WordPress.PHP.NoSilencedErrors, Generic.PHP.NoSilencedErrors.Discouraged
    @set_time_limit(60);
}

use Extendify\Shared\Services\Sanitizer;

/**
 * The controller for uploading images to the Media Library.
 */

class ImageController
{
    /**
     * Upload the provided image
     *
     * @param \WP_REST_Request $request - The request.
     * @return \WP_REST_Response
     */
    public static function uploadMedia(\WP_REST_Request $request)
    {
        if (! function_exists('\media_sideload_image')) {
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $imageId = \media_sideload_image($request->get_param('source'), 0, null, 'id');

        if ($request->get_param('alt_text')) {
            update_post_meta(
                $imageId,
                '_wp_attachment_image_alt',
                Sanitizer::sanitizeText($request->get_param('alt_text'))
            );
        }

        if ($request->get_param('caption')) {
            wp_update_post(
                Sanitizer::sanitizeArray([
                    'ID'           => $imageId,
                    'post_excerpt' => $request->get_param('caption'),
                ])
            );
        }

        $imageObject = \get_post($imageId);
        $altText = (get_post_meta($imageId, '_wp_attachment_image_alt', true))
            ? get_post_meta($imageId, '_wp_attachment_image_alt', true)
            : '';

        return new \WP_REST_Response(
            [
                'id'         => $imageId,
                'caption'    => ['raw' => $imageObject->post_excerpt],
                'source_url' => wp_get_attachment_url($imageId),
                'alt_text'   => $altText,
            ]
        );
    }
}
