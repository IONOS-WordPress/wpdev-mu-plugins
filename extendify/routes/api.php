<?php

/**
 * Api routes
 */

if (!defined('ABSPATH')) {
    die('No direct access.');
}

use Extendify\ApiRouter;
use Extendify\Assist\Controllers\DomainsSuggestionController;
use Extendify\Assist\Controllers\GlobalsController;
use Extendify\Assist\Controllers\RouterController;
use Extendify\Assist\Controllers\TasksController;

use Extendify\HelpCenter\Controllers\TourController;
use Extendify\HelpCenter\Controllers\RouterController as HelpCenterRouterController;
use Extendify\HelpCenter\Controllers\SupportArticlesController;

use Extendify\Draft\Controllers\ImageController;
use Extendify\Draft\Controllers\RouterController as DraftRouterController;

use Extendify\Launch\Controllers\WPController;
use Extendify\Launch\Controllers\WooCommerceController;

use Extendify\Library\Controllers\SiteController;

use Extendify\PageCreator\Controllers\SiteController as PageCreatorSiteController;

use Extendify\Agent\Controllers\WPController as AgentWPController;
use Extendify\Agent\Controllers\ChatHistoryController as AgentChatController;
use Extendify\Agent\Controllers\WorkflowHistoryController as AgentWorkflowController;
use Extendify\Agent\Controllers\SiteNavigationController as AgentSiteNavigationController;

use Extendify\Shared\Controllers\PatternPlaceholderController;
use Extendify\Shared\Controllers\UserSelectionController;
use Extendify\Shared\Controllers\UserSettingsController as SharedUserSettingsController;
use Extendify\Shared\Controllers\ActivityController;
use Extendify\Shared\Controllers\SiteProfileController;
use Extendify\Shared\Controllers\DataController as SharedDataController;
use Extendify\Shared\Controllers\ImageGenerationController;

\add_action(
    'rest_api_init',
    function () {
        // Library.
        ApiRouter::get('/library/settings', [SiteController::class, 'get']);
        ApiRouter::post('/library/settings', [SiteController::class, 'store']);
        ApiRouter::post('/library/settings/single', [SiteController::class, 'single']);

        // Page Creator.
        ApiRouter::get('/page-creator/settings/get-option', [PageCreatorSiteController::class, 'get']);
        ApiRouter::post('/page-creator/settings/single', [PageCreatorSiteController::class, 'single']);

        // Launch.
        ApiRouter::post('/launch/options', [WPController::class, 'updateOption']);
        ApiRouter::get('/launch/options', [WPController::class, 'getOption']);
        ApiRouter::post('/launch/save-pattern', [WPController::class, 'savePattern']);
        ApiRouter::get('/launch/active-plugins', [WPController::class, 'getActivePlugins']);
        ApiRouter::get('/launch/prefetch-assist-data', [WPController::class, 'prefetchAssistData']);
        ApiRouter::post('/launch/create-navigation', [WPController::class, 'createNavigationWithMeta']);
        ApiRouter::post('/launch/post-launch-functions', [WPController::class, 'postLaunch']);
        ApiRouter::get('/launch/import-woocommerce', [WooCommerceController::class, 'importTemporaryProducts']);

        // Assist.
        ApiRouter::get('/assist/task-data', [TasksController::class, 'get']);
        ApiRouter::post('/assist/task-data', [TasksController::class, 'store']);
        ApiRouter::post('/assist/router-data', [RouterController::class, 'store']);
        ApiRouter::get('/assist/global-data', [GlobalsController::class, 'get']);
        ApiRouter::post('/assist/global-data', [GlobalsController::class, 'store']);
        ApiRouter::post('/assist/delete-domains-recommendations', [DomainsSuggestionController::class, 'deleteCache']);
        ApiRouter::post('assists/domains-recommendations-activities', [DomainsSuggestionController::class, 'tracking']);

        // Help Center.
        ApiRouter::get('/help-center/tour-data', [TourController::class, 'get']);
        ApiRouter::post('/help-center/tour-data', [TourController::class, 'store']);
        ApiRouter::post('/help-center/router-data', [HelpCenterRouterController::class, 'store']);
        ApiRouter::get('/help-center/router-data', [HelpCenterRouterController::class, 'get']);
        ApiRouter::get('/help-center/support-article', [SupportArticlesController::class, 'article']);
        ApiRouter::post('/help-center/support-articles-data', [SupportArticlesController::class, 'store']);
        ApiRouter::get('/help-center/get-redirect', [SupportArticlesController::class, 'getRedirect']);

        // Draft.
        ApiRouter::get('/shared/image-generation', [ImageGenerationController::class, 'get']);
        ApiRouter::post('/shared/image-generation', [ImageGenerationController::class, 'store']);
        ApiRouter::post('/draft/upload-image', [ImageController::class, 'uploadMedia']);
        ApiRouter::post('/draft/router-data', [DraftRouterController::class, 'store']);
        ApiRouter::get('/draft/router-data', [DraftRouterController::class, 'get']);

        // Agent.
        ApiRouter::get('/agent/theme-variations', [AgentWPController::class, 'getVariations']);
        ApiRouter::get('/agent/theme-fonts-variations', [AgentWPController::class, 'getFontsVariations']);
        ApiRouter::get('/agent/get-block-code', [AgentWPController::class, 'getBlockCode']);
        ApiRouter::post('/agent/get-block-html', [AgentWPController::class, 'getBlockHtml']);
        ApiRouter::get('/agent/chat-events', [AgentChatController::class, 'get']);
        ApiRouter::post('/agent/chat-events', [AgentChatController::class, 'store']);
        ApiRouter::post('/agent/workflows', [AgentWorkflowController::class, 'add']);
        ApiRouter::post('/agent/site-navigation', [AgentSiteNavigationController::class, 'getSiteNavigation']);
        ApiRouter::post('/agent/render-navigation', [AgentSiteNavigationController::class, 'renderNavigationMenu']);

        // Shared.
        ApiRouter::get('/shared/user-selections-data', [UserSelectionController::class, 'get']);
        ApiRouter::post('/shared/user-selections-data', [UserSelectionController::class, 'store']);
        ApiRouter::post('/shared/update-user-meta', [SharedUserSettingsController::class, 'updateUserMeta']);
        ApiRouter::post('/shared/process-placeholders', [PatternPlaceholderController::class, 'processPlaceholders']);
        ApiRouter::get('/shared/activity', [ActivityController::class, 'get']);
        ApiRouter::post('/shared/activity', [ActivityController::class, 'store']);
        ApiRouter::post('/shared/site-profile', [SiteProfileController::class, 'store']);
        ApiRouter::get('/shared/site-profile', [SiteProfileController::class, 'get']);
        ApiRouter::get('/shared/ping', [SharedDataController::class, 'ping']);
        ApiRouter::get('/shared/partner-plugins', [SharedDataController::class, 'getPartnerPlugins']);
    }
);
