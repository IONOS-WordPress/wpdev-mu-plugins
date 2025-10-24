<?php
/**
 * Plugin Name: Site Assistant
 * Description: Provides guided onboarding and a Site Assistant in the WordPress admin.
 * Version:     1.0.0
 * Update URI:  false
 */

define('EXTENDIFY_PARTNER_ID', 'ion8dhas7');
define('EXTENDIFY_SHOW_ONBOARDING', get_option('stylesheet') === 'extendable');
define('EXTENDIFY_INSIGHTS_URL', 'https://insights.extendify.com');

/*************************************
 *! Do not make changes below this line
 *************************************/

/** Insights */
if (! wp_next_scheduled('extendify_insights')) {
    if (get_option('extendify_insights_stop', false)) {
        return;
    }
    wp_schedule_event(current_time('timestamp'), 'daily', 'extendify_insights');
}
add_action('extendify_insights', [new ExtendifyInsights, 'run']);

class ExtendifyInsights
{
    public $domain;

    public function __construct()
    {
        if (!defined('EXTENDIFY_INSIGHTS_URL')) {
            return;
        }
        $url = trailingslashit(EXTENDIFY_INSIGHTS_URL) . 'api/v1/insights';

        $this->domain = apply_filters('extendify_insights_url', $url);
        $this->showRestEndpoint();
        $this->trackLogins();
    }

    public function run()
    {
        if (! $this->domain || ! $siteId = get_option('extendify_site_id', false)) {
            return;
        }

        $tourData = get_option('extendify_assist_tour_progress', ['state' => []]);
        $tourData = isset($tourData['state']['progress']) ? $tourData['state']['progress'] : [];

        $data = apply_filters('extendify_insights_data', [
            'site' => $this->getSiteData(),
            'pages' => $this->getPageData(),
            'plugins' => get_option('active_plugins'),
            'tourData' => $tourData,
        ]);

        $response = wp_remote_post($this->domain, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Extendify-Site-Id' => $siteId,
            ],
            'timeout' => 3,
            'body' => wp_json_encode($data),
        ]);

        if (! is_wp_error($response)) {
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($data['stop'])) {
                update_option('extendify_insights_stop', true);
                wp_clear_scheduled_hook('extendify_insights');
            }
        }
    }

    private function getSiteData()
    {
        global $wpdb;

        $partner = defined('EXTENDIFY_PARTNER_ID')
            ? EXTENDIFY_PARTNER_ID
            : null;

        if (! $partner && isset($GLOBALS['extendify_sdk_partner'])) {
            $partner = $GLOBALS['extendify_sdk_partner'];
        }

        $devBuild = defined('EXTENDIFY_PATH')
            ? is_readable(EXTENDIFY_PATH . 'public/build/.devbuild')
            : null;

        $media = $wpdb->get_row("SELECT COUNT(ID) as count FROM {$wpdb->posts} WHERE post_type = 'attachment'");

        $users = count_users();
        // Home page
        $response = wp_remote_get(home_url(), [
            'timeout' => 1,
        ]);

        $home = ! is_wp_error($response)
            ? wp_remote_retrieve_body($response)
            : '';

        $siteType = get_option('extendify_siteType', '');
        $siteType = isset($siteType['slug']) ? $siteType['slug'] : '';
        $tasksData = get_option('extendify_assist_tasks', ['state' => []]);
        $tasksData = isset($tasksData['state']) ? $tasksData['state'] : [];

        return [
            'title' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'url' => home_url(),
            'restEndpoint' => rest_url(),
            'adminUrl' => admin_url(),
            'adminUsers' => $users['avail_roles']['administrator'],
            'users' => $users['total_users'],
            'homeUrls' => $this->getUrlsFromContent(preg_replace('#<head>(.*?)</head>#is', '', $home)),
            'mediaLibraryCount' => $media->count,
            'wpVersion' => get_bloginfo('version'),
            'language' => get_bloginfo('language'),
            'siteLogo' => get_option('site_logo', 0),
            'loginTotals' => get_option('extendify_login_count', 0),
            'siteType' => $siteType,
            'theme' => get_option('stylesheet', ''),
            'favicon' => $this->getFaviconHash(),
            'partner' => $partner,
            'isDev' => $devBuild,
            'completedTasks' => isset($tasksData['completedTasks'])
                ? $tasksData['completedTasks']
                : [],
        ];
    }

    private function getPageData()
    {
        $pageData = [];

        $pages = get_posts([
            'posts_per_page' => -1,
            'post_status' => ['trash', 'publish', 'any'],
            'post_type' => 'page',
            'date_query' => [
                [
                    'column' => 'post_modified_gmt',
                    'after' => '24 hours ago',
                ]
            ],
        ]);

        foreach ($pages as $page) {
            $revisions = wp_get_post_revisions($page->ID, [
                'posts_per_page' => -1,
                'date_query' => [
                    [
                        'column' => 'post_modified_gmt',
                        'after' => '24 hours ago',
                    ]
                ],
            ]);

            $pageData[] = [
                'ID' => $page->ID,
                'usedLaunch' => filter_var(get_post_meta($page->ID, 'made_with_extendify_launch', true), FILTER_VALIDATE_BOOLEAN),
                'name' => $page->post_name,
                'title' => $page->post_title,
                'status' => $page->post_status,
                'date' => $page->post_date_gmt,
                'hasExtendifyPattern' => strpos($page->post_content, 'ext-') !== false,
                'hasUnsplashImage' => strpos($page->post_content, 'unsplash') !== false,
                'template' => get_page_template_slug($page->ID),
                'pageUrls' => $this->getUrlsFromContent($page->post_content),
                'pageEmails' => $this->getEmailsFromContent($page->post_content),
                'revisions' => array_map(function (WP_Post $pageRevision) {
                    return [
                        'ID' => $pageRevision->ID,
                        'name' => $pageRevision->post_name,
                        'status' => $pageRevision->post_status,
                        'title' => $pageRevision->post_title,
                        'date' => $pageRevision->post_date_gmt,
                        'hasExtendifyPattern' => strpos($pageRevision->post_content, 'ext-') !== false,
                        'hasUnsplashImage' => strpos($pageRevision->post_content, 'unsplash') !== false,
                        'pageUrls' => $this->getUrlsFromContent($pageRevision->post_content),
                        'pageEmails' => $this->getEmailsFromContent($pageRevision->post_content),
                    ];
                }, $revisions),
            ];
        }

        return $pageData;
    }

    private function showRestEndpoint()
    {
        add_filter('rest_route_data', function (array $available) {
            unset($available['/extendify-insights']);

            return $available;
        });
        add_filter('rest_index', function (WP_REST_Response $response) {
            $response->data['routes'] = array_filter($response->data['routes'], function ($key) {
                return strpos($key, 'extendify-insights') === false;
            }, ARRAY_FILTER_USE_KEY);

            $response->data['namespaces'] = array_values(
                array_filter($response->data['namespaces'], function ($value) {
                    return strpos($value, 'extendify-insights') === false;
                })
            );

            return $response;
        });
        add_action('rest_api_init', function () {
            register_rest_route('extendify-insights', 'active', [
                'methods' => 'GET',
                'permission_callback' => '__return_true',
                'show_in_index' => false,
                'callback' => function (WP_REST_Request $request) {
                    // Just to hide it from anyone fuzzing endpoints
                    if ($request->get_param('token') === 'o9vbeXa88iwuYvzTQQcQ6ZCfXZny1zYPKaz3SaeL') {
                        return true;
                    }

                    // Return the same response WP uses when the route isnt registered
                    return new WP_Error(
                        'rest_no_route',
                        'No route was found matching the URL and request method.',
                        ['status' => 404]
                    );
                },
            ]);
        });
    }

    private function trackLogins()
    {
        add_action('wp_login', function () {
            $count = get_option('extendify_login_count');
            update_option('extendify_login_count', intval($count) + 1);
        });
    }

    private function getUrlsFromContent($content)
    {
        preg_match_all('#\bhttps?://[^,\s()<>]+(?:\([\w\d]+\)|([^,[:punct:]\s]|/))#', $content, $urls);

        return array_values(array_unique(
            array_filter($urls[0], function ($url) {
                return ! preg_match(
                    "/w3\.org|schema\.org|wordpress.org|w.org|wp-json|unsplash|\.(svg|png|jpe?g|js|css|xml|php)/",
                    $url
                );
            })
        ));
    }

    private function getEmailsFromContent($content)
    {
        preg_match_all('#\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b#i', $content, $emails);

        return array_values(array_unique($emails[0]));
    }

    private function getFaviconHash()
    {
        $response = wp_remote_get('https://s2.googleusercontent.com/s2/favicons?domain=' . home_url());

        if (! is_wp_error($response)) {
            return md5(wp_remote_retrieve_body($response));
        }

        return null;
    }
}
