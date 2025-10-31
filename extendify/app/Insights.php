<?php

/**
 * Insights setup
 */

namespace Extendify;

defined('ABSPATH') || die('No direct access.');

use Extendify\Shared\Services\Sanitizer;
use Extendify\PartnerData;

/**
 * Controller for handling various Insights related things.
 * WP code reviewers: This is used in another plugin and not invoked here.
 */

class Insights
{
    /**
     * An array of active tests. 'A' should be the control.
     * For weighted tests, try ['A', 'A', 'A', 'A', 'B']
     *
     * @var array
     */
    protected $activeTests = [];

    /**
     * Process the readme file to get version and name
     *
     * @return void
     */
    public function __construct()
    {
        // If there isn't a siteId, then create one.
        if (!\get_option('extendify_site_id', false)) {
            \update_option('extendify_site_id', \wp_generate_uuid4());
        }

        if (
            defined('EXTENDIFY_INSIGHTS_URL')
            && class_exists('ExtendifyInsights')
            && !\get_option('extendify_insights_checkedin_once', 0)
        ) {
            \update_option('extendify_insights_checkedin_once', gmdate('Y-m-d H:i:s'));
            // WP code reviewers: This job is defined in another plugin (i.e. it's opt-in).
            \add_action('init', function () {
                // Run this once but wait 10 minutes.
                \wp_schedule_single_event((time() + 10 * MINUTE_IN_SECONDS), 'extendify_insights');
                \spawn_cron();
            });
        }

        $this->setUpActiveTests();
        $this->filterExternalInsights();
        $this->setupAdminLoginInsights();
    }

    /**
     * Returns the active tests for the user, and sets up tests as needed.
     *
     * @return void
     */
    public function setUpActiveTests()
    {
        // Make sure that the active tests are set.
        $currentTests = \get_option('extendify_active_tests', []);
        $newTests = array_map(function ($test) {
            // Pick from value randomly.
            return $test[array_rand($test)];
        }, array_diff_key($this->activeTests, $currentTests));
        $testsCombined = array_merge($currentTests, $newTests);
        if ($newTests) {
            \update_option('extendify_active_tests', Sanitizer::sanitizeArray($testsCombined));
        }
    }

    /**
     * Add additional data to the opt-in insights
     *
     * @return void
     */
    public function filterExternalInsights()
    {
        add_filter('extendify_insights_data', function ($data) {
            // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
            $readme = file_get_contents(EXTENDIFY_PATH . 'readme.txt');
            preg_match('/Stable tag: ([0-9.:]+)/', $readme, $version);

            $insights = array_merge($data, [
                'launch' => Config::$showLaunch,
                'launchRedirectedAt' => \get_option('extendify_attempted_redirect', null),
                'launchLoadedAt' => \get_option('extendify_launch_loaded', null),
                'partner' => defined('EXTENDIFY_PARTNER_ID') ? constant('EXTENDIFY_PARTNER_ID') : null,
                'siteCreatedAt' => SiteSettings::getSiteCreatedAt(),
                'assistRouterData' => \get_option('extendify_assist_router', null),
                'libraryData' => \get_option('extendify_library_site_data', null),
                'draftSettingsData' => \get_option('extendify_draft_settings', null),
                'activity' => \get_option('extendify_shared_activity', null),
                'domainsActivities' => \get_option('extendify_domains_recommendations_activities', null),
                'extendifyVersion' => ($version[1] ?? null),
                'siteProfile' => \get_option('extendify_site_profile', null),
                'pluginSearchTerms' => \get_option('extendify_plugin_search_terms', []),
                'blockSearchTerms' => \get_option('extendify_block_search_terms', []),
                'phpVersion' => PHP_VERSION,
                'themeSearchTerms' => \get_option('extendify_theme_search_terms', []),
                'license' => PartnerData::setting('license'),
                'pagesCount' => $this->getPostsCount('page'),
                'postsCount' => $this->getPostsCount('post'),
                'lastUpdatedPage' => $this->getLastUpdatedPost('page'),
                'lastUpdatedPost' => $this->getLastUpdatedPost('post'),
                'lastLoginAdmin' => $this->getLastAdminLogin(),
                'hasImprint' => $this->hasImprint(),
            ]);
            return $insights;
        });
    }

    /**
     * Get the number of posts/pages
     *
     * @param string $type The type of post/page to get the count for (post or page)
     * @return int The number of posts/pages
     */
    protected function getPostsCount($type = 'post')
    {
        $count = wp_count_posts($type);
        return isset($count->publish) ? (int) $count->publish : 0;
    }

    /**
     * Set up admin login insights to monitor when admin users log in
     *
     * @return void
     */
    protected function setupAdminLoginInsights()
    {
        add_action('wp_login', function ($user_login, $user) {
            // Only get insights for admin users
            if (user_can($user, 'manage_options')) {
                update_user_meta($user->ID, 'extendify_last_login', gmdate('Y-m-d H:i:s'));
            }
        }, 10, 2);
    }

    /**
     * Get the last time a post/page was updated
     *
     * @return string|null The last updated post timestamp or null if no posts found
     */
    protected function getLastUpdatedPost($type = 'post')
    {
        $posts = get_posts([
            'post_type' => $type,
            'post_status' => 'publish',
            'orderby' => 'modified',
            'order' => 'DESC',
            'numberposts' => 1,
            'fields' => 'ids'
        ]);

        if (!empty($posts)) {
            $post = get_post($posts[0]);
            return $post ? $post->post_modified : null;
        }
        return null;
    }

    /**
     * Get the last time an admin user logged in
     *
     * @return string|null The most recent admin login timestamp or null if no data found
     */
    protected function getLastAdminLogin()
    {
        $admins = get_users([
            'role' => 'administrator',
            'meta_key' => 'extendify_last_login',
            'orderby' => 'meta_value',
            'order' => 'DESC',
            'number' => 1
        ]);

        if (!empty($admins)) {
            return get_user_meta($admins[0]->ID, 'extendify_last_login', true);
        }
        return null;
    }

    /**
     * Check if the site has an imprint based on the site profile and language settings
     *
     * @return bool True if the site has an imprint, false otherwise
     */
    protected function hasImprint()
    {
        $siteProfile = \get_option('extendify_site_profile', []);
        if (empty($siteProfile)) {
            return false;
        }

        $imprintLanguages = array_filter(PartnerData::setting('showImprint') ?? [], function ($value) {
            return $value === get_locale();
        });

        return !empty($imprintLanguages) && strtolower($siteProfile['aiSiteCategory']) === 'business';
    }
}
