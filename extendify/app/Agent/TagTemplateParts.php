<?php

namespace Extendify\Agent;

defined('ABSPATH') || die('No direct access.');

/**
 * Tag blocks inside template parts (header/footer/etc.) with deterministic IDs.
 * - Only runs inside core/template-part scopes.
 * - Preorder numbering per template-part.
 */
class TagTemplateParts
{
    public static function init()
    {
        // Reset per-request state
        add_action('template_redirect', function () {
            $GLOBALS['extendify_part_frames'] = []; // stack of frames
        });

        // Assign IDs at the block-data layer (pre-order, stable)
        add_filter('render_block_data', [self::class, 'onRenderBlockData'], 10, 2);

        // Turn those IDs into DOM attributes & manage scope lifecycle
        add_filter('render_block', [self::class, 'onRenderBlock'], 10, 2);
    }

    private static function isTemplatePart(array $b): bool
    {
        return (($b['blockName'] ?? '') === 'core/template-part');
    }

    private static function currentFrame()
    {
        $stack = $GLOBALS['extendify_part_frames'] ?? [];
        return $stack ? $stack[count($stack) - 1] : null;
    }

    private static function setCurrentFrame(array $frame)
    {
        $GLOBALS['extendify_part_frames'][count($GLOBALS['extendify_part_frames']) - 1] = $frame;
    }

    private static function labelForPart(array $b): string
    {
        if (!empty($b['attrs']['area'])) {
            return (string) $b['attrs']['area'];
        }
        if (!empty($b['attrs']['slug'])) {
            return (string) $b['attrs']['slug'];
        }
        return 'template-part';
    }

    /** Assign IDs/labels into attrs before render (pre-order) */
    public static function onRenderBlockData(array $block, array $source): array
    {
        $name = $block['blockName'] ?? '';
        if ($name === '') {
            return $block;
        }

        // OPEN a template-part scope (do not number the wrapper itself)
        if (self::isTemplatePart($block)) {
            $label = self::labelForPart($block);
            $GLOBALS['extendify_part_frames'][] = [
                'label' => $label,
                'seq' => 0, // per-part counter
            ];
            // mark so we know to pop when this wrapper finishes rendering
            $block['attrs']['__extendify_scope_open'] = 1;
            return $block;
        }

        // Not inside a template-part? Ignore (prevents tagging post content).
        if (empty($GLOBALS['extendify_part_frames'])) {
            return $block;
        }

        // Inside a template part
        $frame = self::currentFrame();
        // Any other block inside the part → number it
        if ($frame) {
            $frame['seq']++;
            $block['attrs']['extendifyAgentBlockId'] = $frame['seq'];
            $block['attrs']['extendifyAgentPart'] = $frame['label'];
            self::setCurrentFrame($frame);
        }

        return $block;
    }

    /** Inject DOM attributes and close scopes after render */
    public static function onRenderBlock(string $html, array $block): string
    {
        $name = $block['blockName'] ?? '';
        if ($name === '') {
            return $html;
        }

        // When the template-part wrapper finishes rendering, POP the frame
        if (self::isTemplatePart($block) && !empty($block['attrs']['__extendify_scope_open'])) {
            // wrapper itself isn’t tagged; just close the scope
            array_pop($GLOBALS['extendify_part_frames']);
            return $html;
        }

        // If we’re not inside a template part, do nothing
        if (empty($GLOBALS['extendify_part_frames'])) {
            return $html;
        }

        // Inject attributes for blocks we numbered
        $id   = $block['attrs']['extendifyAgentBlockId'] ?? null;
        $part = $block['attrs']['extendifyAgentPart'] ?? null;

        if ($id && $html) {
            $tp = new \WP_HTML_Tag_Processor($html);
            if ($tp->next_tag()) {
                $tp->set_attribute('data-extendify-part-block-id', (string) (int) $id);
                if ($part) {
                    $tp->set_attribute('data-extendify-part', $part);
                }
                $html = $tp->get_updated_html();
            }
        }
        return $html;
    }
}
