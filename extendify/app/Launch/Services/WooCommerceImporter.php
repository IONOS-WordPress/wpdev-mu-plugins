<?php

/**
 * WooCommerce Importer class.
 */

namespace Extendify\Launch\Services;

defined('ABSPATH') || die('No direct access.');

use Extendify\Config;
use Extendify\PartnerData;
use Extendify\Shared\Services\Sanitizer;

/**
 * WooCommerceImporter class.
 */

class WooCommerceImporter
{
    /**
     * Imports products from the fetched data.
     *
     * @return array|\WP_Error Array of imported product results or WP_Error on failure.
     */
    public static function import()
    {
        $response = wp_remote_get(add_query_arg(
            [
                'wpLanguage' => get_locale(),
                'siteProfile' => wp_json_encode(get_option('extendify_site_profile')),
                'siteId' => get_option('extendify_site_id'),
                'version' => Config::$version,
                'title' => get_bloginfo('name'),
                'wpVersion' => get_bloginfo('version'),
                'partnerId' => PartnerData::$id,
                'devbuild' => constant('EXTENDIFY_DEVMODE'),
            ],
            'https://ai.extendify.com/api/plugins/woo/content'
        ));
        $data = [];

        // Only update the data if the request was successful.
        if (!is_wp_error($response)) {
            $data = json_decode(trim(wp_remote_retrieve_body($response)), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new \WP_Error('invalid_data', 'Invalid JSON response');
            }
        }

        // If the data is empty or invalid, return an error.
        if (!isset($data['products']) || !is_array($data['products']) || empty($data)) {
            return new \WP_Error('invalid_data', 'Invalid product data structure');
        }

        $results = [];
        $instance = new self();

        foreach ($data['products'] as $product) {
            $productId = $instance->createProduct($product);
            if ($productId) {
                $results[] = [
                    'id' => $productId,
                    'sku' => $product['sku'],
                    'status' => 'success',
                ];
            }
        }

        return $results;
    }

    /**
     * Creates a new WooCommerce product.
     *
     * @param array $productData Product data including name, description, status, etc.
     * @return int|false Product ID on success, false on failure.
     */
    public function createProduct(array $productData)
    {
        $post = [
            'post_title'   => wp_strip_all_tags($productData['name']),
            'post_content' => Sanitizer::sanitizePostContent($productData['description']),
            'post_status'  => $productData['status'] ? Sanitizer::sanitizeUnknown($productData['status']) : 'publish',
            'post_type'    => 'product',
            'meta_input' => [
                '_sku' => Sanitizer::sanitizeUnknown($productData['sku']),
                '_regular_price' => Sanitizer::sanitizeUnknown($productData['price']),
                '_price' => Sanitizer::sanitizeUnknown($productData['price']),
                '_manage_stock' => 'yes',
                '_stock' => Sanitizer::sanitizeUnknown($productData['stock']),
                '_stock_status' => (int) Sanitizer::sanitizeUnknown($productData['stock']) > 0
                    ? 'instock'
                    : 'outofstock',
                '_virtual' => 'no',
            ],
        ];
        $productId = wp_insert_post($post);

        if (is_wp_error($productId)) {
            return false;
        }

        wp_set_object_terms($productId, 'simple', 'product_type');

        if (!empty($productData['category'])) {
            wp_set_object_terms($productId, $productData['category'], 'product_cat');
        }

        if (!empty($productData['images']) && is_array($productData['images'])) {
            $this->setProductImages($productId, $productData['images']);
        }

        return $productId;
    }

    /**
     * Sets product images from provided URLs.
     *
     * @param int   $productId Product ID.
     * @param array $images    Array of image URLs.
     * @return void
     */
    public function setProductImages(int $productId, array $images)
    {
        if (!count($images)) {
            return;
        }

        foreach ($images as $index => $imageUrl) {
            $imageId = $this->uploadImage($imageUrl);
            if (!is_wp_error($imageId)) {
                $productGalleryImages[] = $imageId;
            }
        }

        if (!$productGalleryImages) {
            return;
        }

        set_post_thumbnail($productId, $productGalleryImages[0]);
        update_post_meta($productId, '_product_image_gallery', implode(',', array_slice($productGalleryImages, 1)));
    }

    /**
     * Uploads an image from URL to WordPress media library.
     *
     * @param string $url Image URL to upload.
     * @return int|false Attachment ID on success, false on failure.
     */
    public function uploadImage(string $url)
    {
        if (! function_exists('\media_sideload_image')) {
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        return \media_sideload_image($url, 0, null, 'id');
    }
}
