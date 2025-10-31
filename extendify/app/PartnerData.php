<?php

/**
 * The Partner Settings
 */

namespace Extendify;

defined('ABSPATH') || die('No direct access.');

use Extendify\Shared\Services\Sanitizer;

/**
 * Controller for handling partner settings
 */

class PartnerData
{
    /**
     * The partner id
     *
     * @var string
     */
    public static $id;

    /**
     * The partner logo
     *
     * @var string
     */
    public static $logo = '';

    /**
     * The partner display name
     *
     * @var string
     */
    public static $name = '';

    /**
     * The partner colors
     *
     * @var string
     */
    public static $colors = [];

    /**
     * The partner configuration.
     *
     * @var array
     */
    protected static $config = [
        'showDomainBanner' => false,
        'showDomainTask' => false,
        'showSecondaryDomainBanner' => false,
        'showSecondaryDomainTask' => false,
        'domainTLDs' => ['com', 'net'],
        'stagingSites' => ['wordpress'],
        'domainSearchURL' => '',
        'showDraft' => false,
        'showChat' => false,
        'showAIPageCreation' => false,
        'enableImageImports-1-14-6' => false,
        'disableLibraryAutoOpen' => false,
        'enableApexDomain' => false,
        'showLaunch' => false,
        'deactivated' => true,
        'launchRedirectWebsite' => false,
        'showAILogo' => false,
        'showProductRecommendations' => false,
        'productRecommendations' => [
            'showPartnerBranding' => false,
            'disabledProducts' => [],
            'customProducts' => [],
        ],
        'license' => 'active',
        'showAIAgents' => false,
        'showImprint' => [],
        'showLaunchQuestions' => false,
        'pluginGroupId' => null,
        'requiredPlugins' => null,
    ];

    // phpcs:disable Generic.Metrics.CyclomaticComplexity.MaxExceeded
    /**
     * Set up and collect partner data
     *
     * @return void
     */
    public function __construct()
    {
        self::$id = defined('EXTENDIFY_PARTNER_ID') ? constant('EXTENDIFY_PARTNER_ID') : null;
        $data = self::getPartnerData();
        self::$config['showDomainBanner'] = ($data['showDomainBanner'] ?? self::$config['showDomainBanner']);
        self::$config['showDomainTask'] = ($data['showDomainTask'] ?? self::$config['showDomainTask']);
        self::$config['showSecondaryDomainTask'] = ($data['showSecondaryDomainTask']
            ?? self::$config['showSecondaryDomainTask']);
        self::$config['showSecondaryDomainBanner'] = ($data['showSecondaryDomainBanner']
            ?? self::$config['showSecondaryDomainBanner']);
        self::$config['domainTLDs'] = ($data['domainTLDs'] ?? self::$config['domainTLDs']);
        self::$config['stagingSites'] = array_map('trim', ($data['stagingSites'] ?? self::$config['stagingSites']));
        self::$config['domainSearchURL'] = ($data['domainSearchURL'] ?? self::$config['domainSearchURL']);
        self::$logo = isset($data['logo'][0]['thumbnails']['large']['url'])
            ? $data['logo'][0]['thumbnails']['large']['url']
            : self::$logo;
        self::$config['showDraft'] = ($data['showDraft'] ?? self::$config['showDraft']);
        self::$config['showChat'] = ($data['showChat'] ?? self::$config['showChat']);
        self::$config['enableImageImports-1-14-6'] = ($data['enableImageImports-1-14-6']
            ?? self::$config['enableImageImports-1-14-6']);
        self::$config['disableLibraryAutoOpen'] = ($data['disableLibraryAutoOpen']
            ?? self::$config['disableLibraryAutoOpen']);
        self::$config['enableApexDomain'] = ($data['enableApexDomain'] ?? self::$config['enableApexDomain']);
        self::$name = ($data['Name'] ?? self::$name);
        self::$colors = [
            'backgroundColor' => ($data['backgroundColor'] ?? null),
            'foregroundColor' => ($data['foregroundColor'] ?? null),
            'secondaryColor' => ($data['secondaryColor'] ?? ($data['backgroundColor'] ?? null)),
            'secondaryColorText' => '#ffffff',
        ];
        self::$config['showAIPageCreation'] = ($data['showAIPageCreation'] ?? self::$config['showAIPageCreation']);
        self::$config['showLaunch'] = ($data['showLaunch'] ?? self::$config['showLaunch']);
        self::$config['deactivated'] = ($data['deactivated'] ?? self::$config['deactivated']);
        self::$config['launchRedirectWebsite'] = ($data['launchRedirectWebsite']
            ?? self::$config['launchRedirectWebsite']);
        self::$config['showAILogo'] = ($data['showAILogo'] ?? self::$config['showAILogo']);
        self::$config['showProductRecommendations'] = ($data['showProductRecommendations']
            ?? self::$config['showProductRecommendations']);
        self::$config['productRecommendations'] = [
            'showPartnerBranding' => ($data['productRecommendationShowPartnerBranding']
                ?? self::$config['productRecommendations']['showPartnerBranding']),
            'disabledProducts' => ($data['productRecommendationDisabledSlugs']
                ?? self::$config['productRecommendations']['disabledProducts']),
            'customProducts' => ($data['productRecommendationCustomSlugs']
                ?? self::$config['productRecommendations']['customProducts']),
        ];
        self::$config['license'] = ($data['license'] ?? self::$config['license']);
        self::$config['showImprint'] = ($data['showImprint'] ?? self::$config['showImprint']);
        self::$config['showLaunchQuestions'] = ($data['showLaunchQuestions'] ?? self::$config['showLaunchQuestions']);
        self::$config['showAIAgents'] = ($data['showAIAgents'] ?? self::$config['showAIAgents']);
        self::$config['pluginGroupId'] = ($data['pluginGroup'] ?? self::$config['pluginGroupId']);
        self::$config['requiredPlugins'] = ($data['requiredPlugins'] ?? self::$config['requiredPlugins']);

        // Add the job hook to fetch the partner data.
        \add_action('extendify_fetch_partner_data', [self::class, 'fetchPartnerData']);
    }

    /**
     * Retrieve partner data from the options table or from the API.
     *
     * @return array
     */
    public static function getPartnerData()
    {
        // Do not make a request without a partner ID (i.e. it's opt in).
        if (!defined('EXTENDIFY_PARTNER_ID')) {
            return [];
        }

        $partnerData = \get_option('extendify_partner_data_v2', 'empty');
        if ($partnerData !== 'empty') {
            // We have data, but if it's been 10 minutes, check for new data.
            $partnerRefresh = \get_transient('extendify_partner_data_cache_check');
            if (!$partnerRefresh && \is_admin()) {
                \add_action('init', function () {
                    if (!\wp_next_scheduled('extendify_fetch_partner_data')) {
                        \wp_schedule_single_event(time(), 'extendify_fetch_partner_data');
                        \spawn_cron();
                    }
                });
            }

            return array_merge(self::$config, $partnerData);
        }

        $freshData = self::fetchPartnerData();
        $mergedData = array_merge(self::$config, $freshData);
        // Cache here even if empty [] to prevent multiple requests.
        \update_option('extendify_partner_data_v2', $mergedData);
        return $mergedData;
    }

    /**
     * Fetch or refresh the partner data
     *
     * @return array
     */
    public static function fetchPartnerData()
    {
        if (!defined('EXTENDIFY_PARTNER_ID')) {
            return [];
        }

        // Set a 10 minute transient to prevent multiple requests.
        set_transient('extendify_partner_data_cache_check', true, (10 * MINUTE_IN_SECONDS));

        $url = add_query_arg(
            [
                'partner' => self::$id,
                'wp_language' => \get_locale(),
                'site_url' => \home_url(),
            ],
            'https://dashboard.extendify.com/api/onboarding/partner-data/'
        );

        $response = \wp_safe_remote_get($url, ['headers' => ['Accept' => 'application/json']]);

        // If there was an error, we dont update the cache.
        if (\is_wp_error($response) || \wp_remote_retrieve_response_code($response) !== 200) {
            return [];
        }

        $result = json_decode(\wp_remote_retrieve_body($response), true);

        // If the data didn't come back as we expected it to, or if we have an error, don't update the cache.
        if (
            json_last_error() !== JSON_ERROR_NONE
            || !is_array($result)
            || !array_key_exists('data', $result)
            || empty($result['data'])
        ) {
            return [];
        }

        $sanitizedData = array_merge(
            Sanitizer::sanitizeUnknown($result['data']),
            ['consentTermsCustom' => \sanitize_text_field(htmlentities(($result['data']['consentTermsCustom'] ?? '')))]
        );

        // Merge before persisting as this data is accessed directly elsewhere.
        $mergedData = array_merge(self::$config, $sanitizedData);
        \update_option('extendify_partner_data_v2', $mergedData);

        return $mergedData;
    }

    /**
     * Return colors mapped as css variables
     *
     * @return array
     */
    public static function cssVariableMapping()
    {
        $mapping = [
            'backgroundColor' => '--ext-banner-main',
            'foregroundColor' => '--ext-banner-text',
            'secondaryColor' => '--ext-design-main',
            'secondaryColorText' => '--ext-design-text',
        ];

        $cssVariables = [];
        $adminTheme = \get_user_option('admin_color', get_current_user_id());
        if (isset($GLOBALS['_wp_admin_css_colors'][$adminTheme])) {
            $theme = $GLOBALS['_wp_admin_css_colors'][$adminTheme];
            if (in_array($adminTheme, ['modern', 'blue'], true)) {
                $cssVariables['--wp-admin-theme-main'] = $theme->colors[1];
                $cssVariables['--wp-admin-theme-accent'] = $theme->colors[2];
            } else {
                $cssVariables['--wp-admin-theme-bg'] = $theme->colors[0];
                $cssVariables['--wp-admin-theme-main'] = $theme->colors[2];
                $cssVariables['--wp-admin-theme-accent'] = $theme->colors[3];
            }
        }

        // Partner specific colors.
        foreach ($mapping as $color => $variable) {
            if (isset(self::$colors[$color])) {
                $cssVariables[$variable] = self::$colors[$color];
            }
        }

        return $cssVariables;
    }

    /**
     * Retrieves the value of a setting.
     *
     * This method first checks if the setting exists as a static property of the class.
     * If it does, it returns the value of that property. Otherwise, it looks for the
     * setting in the config array and returns its value if found.
     *
     * @param string $settingKey The key of the setting to retrieve.
     * @return mixed The value of the setting if found, or null if not found.
     */
    public static function setting($settingKey)
    {
        if (property_exists(self::class, $settingKey)) {
            return self::$$settingKey;
        }

        return (self::$config[$settingKey] ?? null);
    }
}
