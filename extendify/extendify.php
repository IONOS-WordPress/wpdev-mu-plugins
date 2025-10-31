<?php

// phpcs:disable Generic.Files.LineLength.TooLong
/**
 * Plugin Name:       Extendify WordPress Onboarding and AI Assistant
 * Description:       AI-powered WordPress assistant for onboarding and ongoing editing offered exclusively through select WordPress hosting providers.
 * Plugin URI:        https://extendify.com/?utm_source=wp-plugins&utm_campaign=plugin-uri&utm_medium=wp-dash
 * Author:            Extendify
 * Author URI:        https://extendify.com/?utm_source=wp-plugins&utm_campaign=author-uri&utm_medium=wp-dash
 * Version:           2.2.1
 * Requires at least: 6.5
 * Requires PHP:      7.0
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       extendify-local
 * Domain Path:       /languages
 *
 * Extendify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * any later version.
 *
 * Extendify is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */
// phpcs:enable Generic.Files.LineLength.TooLong

defined('ABSPATH') || exit;

use Extendify\PartnerData;

/** ExtendifySdk is the previous class name used */
if (!class_exists('ExtendifySdk') && !class_exists('Extendify')) :

    /**
     * The Extendify Library
     */
    // phpcs:ignore PSR1.Classes.ClassDeclaration.MissingNamespace
    final class Extendify
    {
        /**
         * Var to make sure we only load once
         *
         * @var boolean $loaded
         */
        public static $loaded = false;

        /**
         * Set up the Library
         *
         * @return void
         */
        public function __invoke()
        {
            // Allow users to disable the library. The latter is left in for historical reasons.
            if (!apply_filters('extendify_load_library', true) || !apply_filters('extendifysdk_load_library', true)) {
                return;
            }

            if (version_compare(PHP_VERSION, '7.0', '<') || version_compare($GLOBALS['wp_version'], '6.5', '<')) {
                return;
            }

            if (!self::$loaded) {
                self::$loaded = true;
                require dirname(__FILE__) . '/bootstrap.php';
                if (!defined('EXTENDIFY_BASE_URL')) {
                    define('EXTENDIFY_BASE_URL', plugin_dir_url(__FILE__));
                }
            }
        }
    }

    add_action('plugins_loaded', function () {
        $extendify = new Extendify();
        $extendify();
    });

    add_action('update_option', function ($option) {
        if (in_array($option, ['WPLANG', 'blogname'], true)) {
            \delete_transient('extendify_recommendations');
            \delete_transient('extendify_domains');
            \delete_transient('extendify_supportArticles');
        }

        // Delete the partner transient so we can fetch new data when the locale is switched.
        if (($option === 'WPLANG') && get_transient('extendify_partner_data_cache_check')) {
            delete_transient('extendify_partner_data_cache_check');
            PartnerData::getPartnerData();
        }
    });

    // Delete the partner transient so we can fetch new data when the locale is switched via WP-CLI.
    add_action('cli_init', function () {
        $command = sanitize_text_field(wp_unslash(($_SERVER['argv'][1] ?? '')));
        if ($command === 'language' && get_transient('extendify_partner_data_cache_check')) {
            delete_transient('extendify_partner_data_cache_check');
            PartnerData::getPartnerData();
        }
    });

    // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundBeforeLastUsed
    add_action('upgrader_process_complete', function ($upgrader, $options) {
        $updatedExtendify = isset($options['plugins']) && array_filter($options['plugins'], function ($plugin) {
            return strpos($plugin, 'extendify') !== false;
        });

        if (!$updatedExtendify) {
            return;
        }

        \delete_transient('extendify_recommendations');
        \delete_transient('extendify_domains');
        \delete_transient('extendify_supportArticles');
    }, 10, 2);

    // Redirect logins to the Extendify Assist dashboard if they are an admin.
    // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundBeforeLastUsed
    \add_filter('login_redirect', function ($redirectTo, $requestedRedirectTo, $user) {
        // Only redirect if going to the admin page.
        if ($redirectTo !== \admin_url()) {
            return $redirectTo;
        }

        if (!$user || !is_a($user, 'WP_User') || !defined('EXTENDIFY_PARTNER_ID')) {
            return $redirectTo;
        }

        $partnerData = get_option('extendify_partner_data_v2', []);
        if (!$user->has_cap('manage_options') || empty($partnerData)) {
            return $redirectTo;
        }

        return \admin_url() . 'admin.php?page=extendify-assist';
    }, 10, 3);

    // Redirect to a safe place if the user doesn't have access.
    add_action('admin_page_access_denied', function () {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if (isset($_GET['page']) && strpos(sanitize_text_field(wp_unslash($_GET['page'])), 'extendify') !== false) {
            wp_safe_redirect(admin_url());
            exit;
        }
    });

    // Allow Extendify requests to have a longer timeout.
    add_filter('http_request_args', function ($args, $url) {
        if (strpos($url, 'extendify') !== false) {
            $args['timeout'] = 45;
        }

        return $args;
    }, 100, 2);
endif;
