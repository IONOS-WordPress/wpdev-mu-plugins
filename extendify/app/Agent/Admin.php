<?php

/**
 * Admin.
 */

namespace Extendify\Agent;

defined('ABSPATH') || die('No direct access.');

use Extendify\Agent\Controllers\ChatHistoryController;
use Extendify\Agent\Controllers\TourController;
use Extendify\Agent\Controllers\WorkflowHistoryController;
use Extendify\Config;
use Extendify\Shared\Services\Escaper;
use Extendify\Agent\TagBlocks;
use Extendify\Agent\TagTemplateParts;
use Extendify\Agent\Controllers\SiteNavigationController;
use Extendify\Shared\DataProvider\ProductsData;

/**
 * This class handles any file loading for the admin area.
 */
class Admin
{
    /**
     * Adds various actions to set up the page
     *
     * @return void
     */
    public function __construct()
    {
        \add_action('admin_enqueue_scripts', [$this, 'loadScriptsAndStyles']);
        \add_action('wp_enqueue_scripts', [$this, 'loadScriptsAndStyles']);
        ChatHistoryController::init();
        WorkflowHistoryController::init();

        // Tag blocks so we can identify them later
        TagBlocks::init();
        TagTemplateParts::init();

        // Add the site navigation ids to the navigation blocks
        SiteNavigationController::init();
    }

    /**
     * Adds various JS scripts and styles
     *
     * @return void
     */
    public function loadScriptsAndStyles()
    {
        $version = constant('EXTENDIFY_DEVMODE') ? uniqid() : Config::$version;
        $scriptAssetPath = EXTENDIFY_PATH . 'public/build/' . Config::$assetManifest['extendify-agent.php'];
        $fallback = [
            'dependencies' => [],
            'version' => $version,
        ];
        $scriptAsset = file_exists($scriptAssetPath) ? require $scriptAssetPath : $fallback;

        foreach ($scriptAsset['dependencies'] as $style) {
            \wp_enqueue_style($style);
        }

        \wp_enqueue_script(
            Config::$slug . '-agent-scripts',
            EXTENDIFY_BASE_URL . 'public/build/' . Config::$assetManifest['extendify-agent.js'],
            array_merge([Config::$slug . '-shared-scripts'], $scriptAsset['dependencies']),
            $scriptAsset['version'],
            true
        );

        $context = [
            'adminPage' => function_exists('get_current_screen') && ($screen = get_current_screen())
                ? \esc_attr($screen->id)
                : null,
            'postId' => (int) $this->getCurrentPostId(),
            'postTitle' => \esc_attr(\get_the_title($this->getCurrentPostId())),
            'postType' => \esc_attr(\get_post_type($this->getCurrentPostId())),
            'postUrl' => \esc_url(\get_permalink($this->getCurrentPostId())),
            'isFrontPage' => (bool) \is_front_page(),
            'postStatus' => \esc_attr(\get_post_status((int) $this->getCurrentPostId())),
            'isBlogPage' => (bool) \is_home(),
            'themeSlug' => \esc_attr(\wp_get_theme()->get_stylesheet()),
            'hasThemeVariations' => (bool) $this->hasThemeVariations(),
            'isBlockTheme' => function_exists('wp_is_block_theme') ? (bool) wp_is_block_theme() : false,
            'wordPressVersion' => \esc_attr(\get_bloginfo('version')),
            'usingBlockEditor' => function_exists('use_block_editor_for_post') ?
                (bool) use_block_editor_for_post($this->getCurrentPostId()) :
                false,
            'activePlugins' => array_values(\get_option('active_plugins', [])),
        ];
        $recommendations = ProductsData::get() ?? [];
        $pluginRecommendations = array_filter($recommendations, function ($item) {
            return in_array('ai-agent', $item['slots'] ?? [], true) && $item['ctaType'] === 'plugin';
        });
        $mappedPluginRecommendations = array_values(array_map(function ($item) {
            return [
                'title' => $item['title'] ?? '',
                'slug'  => $item['ctaPluginSlug'] ?? $item['slug'] ?? '',
                'description' => $item['aiDescription'] ?? $item['description'] ?? '',
            ];
        }, $pluginRecommendations));
        $agentContext = [
            'availableAdminPages' => get_option('_transient_extendify_admin_pages_menu', []),
            'pluginRecommendations' => $mappedPluginRecommendations,
        ];
        $abilities = [
            'canEditPost' => (bool) \current_user_can('edit_post', \get_queried_object_id()),
            // TODO: this may be true for a user, while they still can't edit every post
            // So we would need to clarify this in the instructions, and
            // include a step that fetches the page they want to edit
            'canEditPosts' => (bool) \current_user_can('edit_posts'),
            'canEditThemes' => (bool) \current_user_can('edit_theme_options'),
            'canActivatePlugins' => (bool) \current_user_can('activate_plugins'),
            'canInstallPlugins' => (bool) \current_user_can('install_plugins'),
            'canEditUsers' => (bool) \current_user_can('edit_users'),
            'canEditSettings' => (bool) \current_user_can('manage_options'),
            'canUploadMedia' => (bool) \current_user_can('upload_files'),
        ];

        \wp_add_inline_script(
            Config::$slug . '-agent-scripts',
            'window.extAgentData = ' . \wp_json_encode([
                // Add context about where they are
                'context' => $context,
                // Context that the Agent might need when returning a response,
                // but not for handling the workflow.
                'agentContext' => $agentContext,
                // List of abilities the AI can perform for this user.
                // For example, we could check whether their theme has variations.
                'abilities' => $abilities,
                // List of suggestions the AI can make for this user.
                // For example, we could check whether they need to set up a specific plugin.
                'suggestions' => $this->getSuggestions($context, $abilities),
                'chatHistory' => Escaper::recursiveEscAttr(ChatHistoryController::getChatHistory()),
                'workflowHistory' => Escaper::recursiveEscAttr(WorkflowHistoryController::getWorkflowHistory()),
                'userData' => [
                    'tourData' => \wp_json_encode(TourController::get()->get_data()),
                ],
            ]),
            'before'
        );

        \wp_set_script_translations(
            Config::$slug . '-agent-scripts',
            'extendify-local',
            EXTENDIFY_PATH . 'languages/js'
        );

        \wp_enqueue_style(
            Config::$slug . '-agent-styles',
            EXTENDIFY_BASE_URL . 'public/build/' . Config::$assetManifest['extendify-agent.css'],
            [],
            Config::$version,
            'all'
        );
    }
    /**
     * Get the current post ID based on the context.
     *
     * @return int
     */
    private function getCurrentPostId()
    {
        if (is_admin() && function_exists('get_current_screen')) {
            $screen = get_current_screen();
            if ($screen && $screen->base === 'post') {
                global $post;
                if ($post) {
                    return (int) $post->ID;
                }
            }
        }
        if (\is_front_page()) {
            return (\get_option('show_on_front') === 'page') ? (int) \get_option('page_on_front') : 0;
        }
        if (\is_home()) {
            return (int) \get_option('page_for_posts');
        }
        return (int) \get_queried_object_id();
    }

    /**
     * Scan the style dirs to locate if they have variations.
     * Ported from here:
     * https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/class-wp-theme-json-resolver.php#L810
     *
     * @return bool
     */
    private function hasThemeVariations()
    {
        $base_directory = get_stylesheet_directory() . '/styles';
        $template_directory = get_template_directory() . '/styles';

        if (is_dir($base_directory) && glob($base_directory . '/*.json', GLOB_NOSORT)) {
            return true;
        }

        // Only check parent if it's different from child
        if (
            $template_directory !== $base_directory &&
            is_dir($template_directory) &&
            glob($template_directory . '/*.json', GLOB_NOSORT)
        ) {
            return true;
        }

        return false;
    }

    /**
     * Get suggestions for the user.
     *
     * @param array $context - The context of the current page and site.
     * @param array $abilities - The abilities of the user.
     * @return array
     */
    private function getSuggestions($context, $abilities)
    {
        $suggestions = [
            [
                'icon' => 'video',
                'message' => __('What tours are available?', 'extendify-local'),
            ]
        ];

        if ($context['postStatus']) {
            $suggestions [] = [
                'icon' => ($context['postStatus'] === 'draft') ? 'published' : 'drafts',
                'message' => ($context['postStatus'] === 'draft')
                    ? __('Publish this page', 'extendify-local')
                    : __('Unpublish this page', 'extendify-local') ,
            ];
        }

        if ($abilities['canEditSettings']) {
            $suggestions[] = [
                'icon' => 'edit',
                'message' => __('I want to change my site title', 'extendify-local'),
                "feature" => true,
            ];

            $suggestions[] = [
                'icon' => 'typography',
                'message' => __('I want to change my theme fonts', 'extendify-local'),
                "feature" => true,
            ];
        }

        // If they have theme variations, suggest they can change the theme styling.
        if ($context['hasThemeVariations']) {
            $suggestions[] = [
                'icon' => 'styles',
                'message' => __('I want to change my theme styling', 'extendify-local'),
                "feature" => true,
            ];
        }

        if ($context['postId'] && $abilities['canEditPost'] && $context['usingBlockEditor']) {
            $suggestions[] = [
                'icon' => 'edit',
                'message' => __('Edit text on this page', 'extendify-local'),
                "feature" => true,
            ];
        }

        if ($abilities['canEditPost']) {
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I create a post?', 'extendify-local'),
            ];
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I create a page?', 'extendify-local'),
            ];
        }

        if ($abilities['canActivatePlugins']) {
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I install a plugin?', 'extendify-local'),
            ];
        }

        if ($abilities['canEditThemes']) {
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change my theme?', 'extendify-local'),
            ];
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change the site footer?', 'extendify-local'),
            ];
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change the site header?', 'extendify-local'),
            ];
        }

        if ($abilities['canUploadMedia']) {
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I upload an image?', 'extendify-local'),
            ];
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change the site icon?', 'extendify-local'),
            ];
        }

        if ($abilities['canEditSettings']) {
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change my site title?', 'extendify-local'),
            ];
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change my site tagline?', 'extendify-local'),
            ];
            $suggestions[] = [
                'icon' => 'help',
                'message' => __('How can I change my site language?', 'extendify-local'),
            ];
        }

        shuffle($suggestions);
        return $suggestions;
    }
}
